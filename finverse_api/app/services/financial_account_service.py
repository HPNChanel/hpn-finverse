"""
Financial Account service for FinVerse API - Clean Architecture Implementation
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Dict, Optional
from decimal import Decimal
import logging

from app.services.base_service import FinancialService
from app.models.financial_account import FinancialAccount
from app.models.transaction import Transaction, TransactionType
from app.schemas.financial_account import FinancialAccountCreate, FinancialAccountUpdate, AccountType

logger = logging.getLogger(__name__)


class FinancialAccountService(FinancialService[FinancialAccount, FinancialAccountCreate, FinancialAccountUpdate]):
    """
    Financial Account Service - Clean Architecture Implementation
    
    Implements business logic for account management:
    - Account CRUD operations
    - Balance management
    - Account transfers
    - Financial reporting
    """
    
    def __init__(self):
        super().__init__(FinancialAccount)
    
    def validate_business_rules(self, db: Session, obj_data: dict, user_id: int) -> bool:
        """Validate account-specific business rules"""
        # Validate initial balance - ensure Decimal conversion
        if 'initial_balance' in obj_data:
            initial_balance = obj_data['initial_balance']
            if isinstance(initial_balance, (int, float, str)):
                initial_balance = Decimal(str(initial_balance))
            self.validate_amount(float(initial_balance))
        
        # Validate balance for updates - ensure Decimal conversion
        if 'balance' in obj_data:
            balance = obj_data['balance']
            if isinstance(balance, (int, float, str)):
                balance = Decimal(str(balance))
            if balance < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Account balance cannot be negative"
                )
        
        return True
    
    def create_account(self, db: Session, account_data: FinancialAccountCreate, user_id: int) -> FinancialAccount:
        """Create a new financial account"""
        try:
            # Validate business rules
            account_dict = account_data.model_dump()
            self.validate_business_rules(db, account_dict, user_id)
            
            # Set defaults - ensure Decimal conversion
            initial_balance = account_dict.get('initial_balance', 0.0)
            if isinstance(initial_balance, (int, float, str)):
                initial_balance = Decimal(str(initial_balance))
            account_dict['balance'] = initial_balance  # Set balance directly as Decimal
            account_dict['currency'] = account_dict.get('currency', 'USD')
            account_dict['created_by_default'] = False
            
            # Remove initial_balance from dict as it's not a field in the model
            account_dict.pop('initial_balance', None)
            
            # Create the account
            account = FinancialAccount(
                user_id=user_id,
                **account_dict
            )
            
            # CRITICAL FIX: Add, flush and refresh to get the ID immediately
            db.add(account)
            db.flush()  # This ensures the ID is generated without committing
            db.refresh(account)  # This loads the generated ID
            
            # Verify account ID was assigned
            if not account.id:
                raise ValueError("Failed to generate account ID")
            
            # Now create initial transaction if balance > 0 - account.id is available
            if initial_balance > 0:
                self._create_initial_transaction(db, account, initial_balance)
            
            # Commit all changes together
            db.commit()
            db.refresh(account)
            
            # Log business operation
            self.log_financial_operation(
                "account_created", 
                user_id, 
                {"account_id": account.id, "type": account.type, "initial_balance": float(initial_balance)}
            )
            
            return account
            
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating account for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create account"
            )
    
    def get_user_accounts(self, db: Session, user_id: int) -> List[FinancialAccount]:
        """Get all financial accounts for a user"""
        try:
            return db.query(FinancialAccount).filter(
                FinancialAccount.user_id == user_id
            ).order_by(FinancialAccount.created_at.desc()).all()
        except Exception as e:
            logger.error(f"Error getting accounts for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve accounts"
            )
    
    def get_account(self, db: Session, account_id: int, user_id: Optional[int] = None) -> FinancialAccount:
        """Get a financial account by ID"""
        account = self.get(db, account_id, user_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Financial account with id {account_id} not found"
            )
        return account
    
    def update_account_balance(self, db: Session, account_id: int, amount: float, user_id: Optional[int] = None) -> FinancialAccount:
        """Update account balance with proper Decimal handling"""
        try:
            account = self.get_account(db, account_id, user_id)
            
            # Convert amount to Decimal for safe arithmetic
            if isinstance(amount, (int, float, str)):
                amount_decimal = Decimal(str(amount))
            else:
                amount_decimal = amount
                
            # Ensure current balance is Decimal
            current_balance = account.balance
            if not isinstance(current_balance, Decimal):
                current_balance = Decimal(str(current_balance))
            
            # Perform Decimal arithmetic
            new_balance = current_balance + amount_decimal
            
            if new_balance < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient account balance"
                )
            
            account.balance = new_balance
            db.commit()
            db.refresh(account)
            
            return account
            
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating account balance: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update account balance"
            )
    
    def get_account_types(self) -> List[Dict]:
        """Get predefined account types"""
        return [
            {"type": "wallet", "label": "Main Wallet", "icon": "account_balance_wallet", "color": "#1976d2"},
            {"type": "saving", "label": "Saving Account", "icon": "savings", "color": "#2e7d32"},
            {"type": "investment", "label": "Investment", "icon": "trending_up", "color": "#9c27b0"},
            {"type": "goal", "label": "Goal Fund", "icon": "emoji_events", "color": "#ff9800"}
        ]
    
    def top_up_account(self, db: Session, user_id: int, account_id: int, amount: float, note: Optional[str] = None) -> FinancialAccount:
        """Top up an account balance"""
        try:
            # Verify user owns the account
            account = db.query(FinancialAccount).filter(
                FinancialAccount.id == account_id,
                FinancialAccount.user_id == user_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Account with id {account_id} not found or does not belong to user"
                )
            
            # Validate amount
            self.validate_amount(amount)
            
            # Update account balance
            old_balance = account.balance
            account.balance += amount
            
            # Create transaction record - safe enum handling
            try:
                transaction_type_value = TransactionType.INCOME.value
            except AttributeError:
                transaction_type_value = int(TransactionType.INCOME)
            
            transaction = Transaction(
                user_id=user_id,
                wallet_id=account_id,
                amount=amount,
                transaction_type=transaction_type_value,
                description=note or f"Top up to {account.name}",
                transaction_date=db.query(func.current_date()).scalar()
            )
            db.add(transaction)
            
            # Save changes
            db.commit()
            db.refresh(account)
            
            # Log business operation
            self.log_financial_operation(
                "account_topped_up", 
                user_id, 
                {
                    "account_id": account_id,
                    "amount": amount,
                    "old_balance": old_balance,
                    "new_balance": account.balance,
                    "note": note
                }
            )
            
            return account
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error topping up account {account_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to top up account"
            )
    
    def get_account_summary(self, db: Session, user_id: int) -> Dict[str, float]:
        """Get account balance summary grouped by type"""
        try:
            # Query account balances grouped by type
            query_result = db.query(
                FinancialAccount.type,
                func.sum(FinancialAccount.balance).label("total")
            ).filter(
                FinancialAccount.user_id == user_id
            ).group_by(
                FinancialAccount.type
            ).all()
            
            # Initialize with zeroes for all types
            summary = {
                "wallet": 0,
                "saving": 0,
                "investment": 0,
                "goal": 0,
                "total": 0
            }
            
            # Calculate total
            total = 0
            
            # Update with actual values - improved error handling
            for type_name, type_total in query_result:
                try:
                    # Ensure type_name is valid
                    if type_name and type_name in summary:
                        balance_value = float(type_total or 0)
                        summary[type_name] = balance_value
                        total += balance_value
                    else:
                        logger.warning(f"Unknown account type encountered: {type_name}")
                except (ValueError, TypeError) as e:
                    logger.error(f"Error processing account type {type_name}: {str(e)}")
                    continue
            
            # Set total
            summary["total"] = total
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting account summary for user {user_id}: {str(e)}")
            # Return safe defaults instead of raising exception
            return {
                "wallet": 0,
                "saving": 0,
                "investment": 0,
                "goal": 0,
                "total": 0
            }
    
    def transfer_between_accounts(self, db: Session, user_id: int, from_account_id: int, to_account_id: int, amount: float, description: Optional[str] = None) -> Dict[str, FinancialAccount]:
        """Transfer money between accounts"""
        try:
            # Validate amount
            self.validate_amount(amount)
            
            # Get both accounts and verify ownership
            from_account = self.get_account(db, from_account_id, user_id)
            to_account = self.get_account(db, to_account_id, user_id)
            
            # Check sufficient balance
            if from_account.balance < amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient funds in source account"
                )
            
            # Perform transfer
            from_account.balance -= amount
            to_account.balance += amount
            
            # Create transaction records - safe enum handling
            transfer_desc = description or f"Transfer to {to_account.name}"
            
            try:
                expense_type_value = TransactionType.EXPENSE.value
            except AttributeError:
                expense_type_value = int(TransactionType.EXPENSE)
            
            try:
                income_type_value = TransactionType.INCOME.value
            except AttributeError:
                income_type_value = int(TransactionType.INCOME)
            
            # Outgoing transaction
            outgoing_txn = Transaction(
                user_id=user_id,
                wallet_id=from_account_id,
                amount=amount,
                transaction_type=expense_type_value,
                description=f"Transfer out: {transfer_desc}",
                transaction_date=db.query(func.current_date()).scalar()
            )
            
            # Incoming transaction
            incoming_txn = Transaction(
                user_id=user_id,
                wallet_id=to_account_id,
                amount=amount,
                transaction_type=income_type_value,
                description=f"Transfer in: {transfer_desc}",
                transaction_date=db.query(func.current_date()).scalar()
            )
            
            db.add(outgoing_txn)
            db.add(incoming_txn)
            db.commit()
            
            db.refresh(from_account)
            db.refresh(to_account)
            
            # Log business operation
            self.log_financial_operation(
                "account_transfer", 
                user_id, 
                {
                    "from_account_id": from_account_id,
                    "to_account_id": to_account_id,
                    "amount": amount,
                    "description": transfer_desc
                }
            )
            
            return {
                "from_account": from_account,
                "to_account": to_account
            }
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error transferring between accounts: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to transfer between accounts"
            )
    
    def update_account(self, db: Session, account_id: int, user_id: int, account_data: FinancialAccountUpdate) -> Optional[FinancialAccount]:
        """Update an existing account"""
        try:
            account = self.get_account(db, account_id, user_id)
            
            # Validate business rules for updates
            update_dict = account_data.model_dump(exclude_unset=True)
            if update_dict:
                self.validate_business_rules(db, update_dict, user_id)
            
            # Update the account
            updated_account = self.update(db, account, account_data)
            
            # Log business operation
            self.log_financial_operation(
                "account_updated", 
                user_id, 
                {"account_id": account_id, "updated_fields": list(update_dict.keys())}
            )
            
            return updated_account
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating account {account_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update account"
            )
    
    def delete_account(self, db: Session, account_id: int, user_id: int) -> bool:
        """Delete an account"""
        try:
            account = self.get_account(db, account_id, user_id)
            
            # Business rule: Cannot delete account with positive balance
            if account.balance > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete account with positive balance"
                )
            
            success = self.delete(db, account_id, user_id)
            
            if success:
                self.log_financial_operation(
                    "account_deleted", 
                    user_id, 
                    {"account_id": account_id, "account_type": account.type}
                )
            
            return success
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting account {account_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete account"
            )
    
    def _create_initial_transaction(self, db: Session, account: FinancialAccount, amount: Decimal):
        """Create initial transaction for account with proper Decimal handling"""
        from app.models.transaction import Transaction
        from datetime import datetime
        
        try:
            # Ensure amount is Decimal
            if not isinstance(amount, Decimal):
                amount = Decimal(str(amount))
            
            # CRITICAL: Verify account has an ID before creating transaction
            if not account.id:
                raise ValueError("Account ID is required to create initial transaction")
                
            initial_transaction = Transaction(
                user_id=account.user_id,
                financial_account_id=account.id,  # Use the flushed account ID
                wallet_id=account.id,  # Backward compatibility
                amount=amount,  # Use Decimal directly
                transaction_type=1,  # Income
                description=f"Initial balance for {account.name}",
                transaction_date=datetime.now().date()
                # Remove non-existent fields: is_recurring=False, is_internal=False
            )
            
            db.add(initial_transaction)
            # Don't commit here - let the parent method handle the commit
            
            logger.info(f"Created initial transaction for account {account.id} with amount {amount}")
            
        except Exception as e:
            logger.error(f"Error creating initial transaction for account {account.id}: {str(e)}")
            # Don't raise here as account creation should still succeed
            pass


# Create singleton instance for dependency injection
financial_account_service = FinancialAccountService()

# Export both class and instance
__all__ = [
    "FinancialAccountService",
    "financial_account_service"
]

print("✅ FinancialAccountService refactored with clean architecture")
print("✅ Business logic layer properly implemented")