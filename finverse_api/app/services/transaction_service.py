"""
Transaction service for FinVerse API - Clean Architecture Implementation
"""

from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from sqlalchemy import text, extract, func, case
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
import logging
from sqlalchemy.orm import joinedload

from app.services.base_service import FinancialService
from app.models.transaction import Transaction, TransactionType
from app.models.financial_account import FinancialAccount
from app.models.category import Category
from app.schemas.transaction import CreateTransactionSchema, UpdateTransactionSchema, TransactionResponse

logger = logging.getLogger(__name__)


class TransactionService(FinancialService[Transaction, CreateTransactionSchema, UpdateTransactionSchema]):
    """
    Transaction Service - Clean Architecture Implementation
    
    Implements business logic for transaction management:
    - Transaction CRUD operations with business validation
    - Account balance management
    - Transaction categorization and budgeting
    - Financial analytics and reporting
    """
    
    def __init__(self):
        super().__init__(Transaction)
    
    def validate_business_rules(self, db: Session, obj_data: dict, user_id: int) -> bool:
        """Validate transaction-specific business rules"""
        # Validate wallet ownership
        if 'wallet_id' in obj_data:
            self.validate_account_ownership(db, obj_data['wallet_id'], user_id)
        
        # Validate transaction amount
        if 'amount' in obj_data:
            self.validate_amount(float(obj_data['amount']))
        
        # Validate category ownership if provided
        if 'category_id' in obj_data and obj_data['category_id']:
            category = db.query(Category).filter(
                Category.id == obj_data['category_id'],
                Category.user_id == user_id,
                Category.is_active == True
            ).first()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found or doesn't belong to user"
                )
        
        return True

    def get_user_transactions(
        self, 
        db: Session, 
        user_id: int, 
        transaction_type: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Transaction]:
        """Get transactions for a user with optional filtering and wallet names"""
        try:
            # Base query with wallet join for wallet names
            query = db.query(Transaction).options(
                joinedload(Transaction.wallet),
                joinedload(Transaction.category)
            ).filter(Transaction.user_id == user_id)
            
            # Apply filters if provided
            if transaction_type is not None:
                query = query.filter(Transaction.transaction_type == transaction_type)
            
            if start_date:
                query = query.filter(Transaction.transaction_date >= start_date)
            
            if end_date:
                query = query.filter(Transaction.transaction_date <= end_date)
            
            # Order by transaction date descending, then created_at descending, then ID for consistency
            transactions = query.order_by(
                Transaction.transaction_date.desc(), 
                Transaction.created_at.desc(),
                Transaction.id.desc()
            ).all()
            
            # Additional deduplication safeguard - remove any potential duplicates by ID
            seen_ids = set()
            unique_transactions = []
            for transaction in transactions:
                if transaction.id not in seen_ids:
                    seen_ids.add(transaction.id)
                    unique_transactions.append(transaction)
                else:
                    logger.warning(f"Duplicate transaction ID {transaction.id} found for user {user_id}")
            
            return unique_transactions
            
        except Exception as e:
            logger.error(f"Error getting transactions for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve transactions"
            )

    def get_transaction_by_id(self, db: Session, transaction_id: int, user_id: Optional[int] = None) -> Optional[Transaction]:
        """Get transaction by ID with wallet information"""
        try:
            query = db.query(Transaction).options(
                joinedload(Transaction.wallet),
                joinedload(Transaction.category)
            ).filter(Transaction.id == transaction_id)
            
            if user_id:
                query = query.filter(Transaction.user_id == user_id)
            
            return query.first()
            
        except Exception as e:
            logger.error(f"Error getting transaction {transaction_id}: {str(e)}")
            return None

    def update_account_balance(self, db: Session, account_id: int, amount: float, transaction_type: int):
        """Update account balance with proper Decimal arithmetic"""
        from app.models.financial_account import FinancialAccount
        
        account = db.query(FinancialAccount).filter(FinancialAccount.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Convert amount to Decimal for safe arithmetic
        amount_decimal = Decimal(str(amount))
        
        # Ensure current balance is Decimal
        current_balance = account.balance
        if not isinstance(current_balance, Decimal):
            current_balance = Decimal(str(current_balance))
        
        # Apply transaction based on type with Decimal arithmetic
        if transaction_type == 1:  # Income - add to balance
            new_balance = current_balance + amount_decimal
        else:  # Expense - subtract from balance
            new_balance = current_balance - amount_decimal
            
        # Validate balance
        if new_balance < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient account balance"
            )
        
        account.balance = new_balance
        db.commit()
        db.refresh(account)
        
        return account

    def create_transaction(
        self,
        db: Session, 
        user_id: int, 
        transaction_type: int, 
        amount: float, 
        wallet_id: int,
        transaction_date: date,
        description: Optional[str] = None,
        category_id: Optional[int] = None,
        budget_id: Optional[int] = None
    ) -> Transaction:
        """Create a new transaction and update wallet balance"""
        try:
            # Start a nested transaction to ensure atomicity
            db.begin_nested()
            
            # CRITICAL FIX: Add logging for transaction_type before any processing
            logger.info(f"Creating transaction: type={transaction_type} (raw), amount={amount}, wallet_id={wallet_id}, category_id={category_id}, date={transaction_date}")
            
            # CRITICAL FIX: Proper validation of transaction_type - don't use falsy check
            if transaction_type is None:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="transaction_type is required and cannot be None"
                )
            
            # CRITICAL FIX: Validate transaction_type is valid enum value
            if transaction_type not in [0, 1]:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="transaction_type must be 0 (INCOME) or 1 (EXPENSE)"
                )
            
            # Log the validated transaction type
            transaction_type_name = "INCOME" if transaction_type == 0 else "EXPENSE"
            logger.info(f"Validated transaction_type: {transaction_type} ({transaction_type_name})")
            
            # CRITICAL FIX: Validate wallet_id is not None or 0 FIRST
            if not wallet_id or wallet_id == 0:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Valid wallet_id is required for transaction creation"
                )
            
            # Validate business rules
            transaction_data = {
                'user_id': user_id,
                'wallet_id': wallet_id,
                'financial_account_id': wallet_id,  # Use same ID for both fields
                'category_id': category_id,
                'amount': amount,
                'transaction_type': transaction_type  # Use the validated value
            }
            self.validate_business_rules(db, transaction_data, user_id)
            
            # Get the wallet and verify ownership - CRITICAL: Ensure wallet exists
            wallet = db.query(FinancialAccount).filter(
                FinancialAccount.id == wallet_id,
                FinancialAccount.user_id == user_id
            ).first()
            
            if not wallet:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Wallet with ID {wallet_id} not found or doesn't belong to user"
                )
            
            # CRITICAL FIX: Create transaction with EXACT transaction_type value - no modifications
            transaction = Transaction(
                user_id=user_id,
                financial_account_id=wallet_id,  # PRIMARY field - this is the main one
                wallet_id=wallet_id,             # Backward compatibility field
                category_id=category_id,
                budget_id=budget_id,
                transaction_type=transaction_type,  # Use EXACT value passed in
                amount=amount,
                description=description,
                transaction_date=transaction_date
            )
            
            # Log the transaction object before saving
            logger.info(f"Transaction object created: type={transaction.transaction_type}, amount={transaction.amount}")
            
            db.add(transaction)
            
            # Update wallet balance based on transaction type - convert to Decimal for consistency
            transaction_amount = Decimal(str(amount))
            wallet_balance = Decimal(str(wallet.balance))
            
            # CRITICAL FIX: Use exact enum values for comparison
            if transaction_type == 0:  # INCOME
                wallet.balance = float(wallet_balance + transaction_amount)
                logger.info(f"INCOME transaction: Added {transaction_amount} to wallet balance")
            elif transaction_type == 1:  # EXPENSE
                wallet.balance = float(wallet_balance - transaction_amount)
                logger.info(f"EXPENSE transaction: Subtracted {transaction_amount} from wallet balance")
            
            # Commit the transaction
            db.commit()
            db.refresh(transaction)
            
            # CRITICAL ADDITION: Update budget usage if this is an expense with a category
            if transaction.transaction_type == 1 and transaction.category_id:  # EXPENSE
                try:
                    from app.services.budget_service import budget_service
                    
                    logger.info(f"Updating budgets for expense transaction: category_id={transaction.category_id}")
                    
                    # Update budgets for this specific category
                    updated_budgets = budget_service.update_budgets_by_category(
                        db, user_id, transaction.category_id
                    )
                    
                    logger.info(f"Updated {len(updated_budgets)} budgets for category {transaction.category_id}")
                    
                except Exception as budget_error:
                    # Don't fail transaction creation if budget update fails
                    logger.error(f"Failed to update budgets after transaction creation: {str(budget_error)}")
            
            # Final verification log
            logger.info(f"Transaction saved successfully: ID={transaction.id}, type={transaction.transaction_type}, amount={transaction.amount}")
            
            # Log business operation
            self.log_financial_operation(
                "transaction_created", 
                user_id, 
                {"transaction_id": transaction.id, "amount": amount, "type": transaction_type}
            )
            
            return transaction

        except HTTPException:
            db.rollback()
            raise
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error creating transaction: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error creating transaction: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error: {str(e)}"
            )

    def update_transaction(
        self,
        db: Session, 
        transaction_id: int, 
        user_id: int, 
        update_data: Dict[str, Any]
    ) -> Transaction:
        """Update an existing transaction"""
        try:
            # Get the transaction and verify ownership
            transaction = db.query(Transaction).filter(
                Transaction.id == transaction_id,
                Transaction.user_id == user_id
            ).first()
            
            if not transaction:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Transaction not found"
                )
            
            # Validate business rules for updates
            if update_data:
                self.validate_business_rules(db, update_data, user_id)
            
            # Store original values for balance adjustment
            original_amount = transaction.amount
            original_type = transaction.transaction_type
            
            # Update transaction fields
            for field, value in update_data.items():
                if hasattr(transaction, field):
                    setattr(transaction, field, value)
            
            # If amount or type changed, adjust wallet balance
            if 'amount' in update_data or 'transaction_type' in update_data:
                wallet = db.query(FinancialAccount).filter(
                    FinancialAccount.id == transaction.wallet_id
                ).first()
                
                if wallet:
                    # Convert wallet balance to Decimal for safe arithmetic
                    wallet_balance = Decimal(str(wallet.balance))
                    original_amount_decimal = Decimal(str(original_amount))
                    
                    # Reverse original transaction effect
                    if original_type == TransactionType.INCOME.value:  # Compare with .value
                        wallet_balance -= original_amount_decimal
                    else:
                        wallet_balance += original_amount_decimal
                    
                    # Apply new transaction effect
                    new_amount_decimal = Decimal(str(transaction.amount))
                    if transaction.transaction_type == TransactionType.INCOME.value:  # Compare with .value
                        wallet_balance += new_amount_decimal
                    else:
                        wallet_balance -= new_amount_decimal
                    
                    # Update wallet balance as float for database storage
                    wallet.balance = float(wallet_balance)
            
            db.commit()
            db.refresh(transaction)
            
            # CRITICAL ADDITION: Update budget usage if category or amount changed
            if ('amount' in update_data or 'category_id' in update_data or 'transaction_type' in update_data):
                try:
                    from app.services.budget_service import budget_service
                    
                    # Update budgets for affected categories
                    categories_to_update = set()
                    
                    # Add current category
                    if transaction.category_id:
                        categories_to_update.add(transaction.category_id)
                    
                    # Add original category if it changed
                    if 'category_id' in update_data and transaction.category_id != update_data['category_id']:
                        original_category = update_data.get('_original_category_id')
                        if original_category:
                            categories_to_update.add(original_category)
                    
                    # Update budgets for all affected categories
                    for category_id in categories_to_update:
                        budget_service.update_budgets_by_category(db, user_id, category_id)
                    
                    logger.info(f"Updated budgets for categories: {categories_to_update}")
                    
                except Exception as budget_error:
                    logger.error(f"Failed to update budgets after transaction update: {str(budget_error)}")
            
            # Log business operation
            self.log_financial_operation(
                "transaction_updated", 
                user_id, 
                {"transaction_id": transaction_id, "updated_fields": list(update_data.keys())}
            )
            
            return transaction
            
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error updating transaction: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error updating transaction: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error: {str(e)}"
            )

    def delete_transaction(self, db: Session, transaction_id: int, user_id: int) -> bool:
        """Delete a transaction and adjust wallet balance"""
        try:
            # Get the transaction and verify ownership
            transaction = db.query(Transaction).filter(
                Transaction.id == transaction_id,
                Transaction.user_id == user_id
            ).first()
            
            if not transaction:
                return False
            
            # Store category for budget update
            category_id = transaction.category_id
            
            # Get the wallet to adjust balance
            wallet = db.query(FinancialAccount).filter(
                FinancialAccount.id == transaction.wallet_id
            ).first()
            
            if wallet:
                # Reverse the transaction effect on wallet balance
                transaction_amount = Decimal(str(transaction.amount))
                wallet_balance = Decimal(str(wallet.balance))
                
                if transaction.transaction_type == TransactionType.INCOME.value:  # Compare with .value
                    # Remove the income from balance
                    wallet.balance = float(wallet_balance - transaction_amount)
                elif transaction.transaction_type == TransactionType.EXPENSE.value:  # Compare with .value
                    # Add back the expense to balance
                    wallet.balance = float(wallet_balance + transaction_amount)
            
            # Delete the transaction
            db.delete(transaction)
            db.commit()
            
            # CRITICAL ADDITION: Update budget usage after deletion
            if category_id:
                try:
                    from app.services.budget_service import budget_service
                    
                    budget_service.update_budgets_by_category(db, user_id, category_id)
                    logger.info(f"Updated budgets after transaction deletion: category_id={category_id}")
                    
                except Exception as budget_error:
                    logger.error(f"Failed to update budgets after transaction deletion: {str(budget_error)}")
            
            # Log business operation
            self.log_financial_operation(
                "transaction_deleted", 
                user_id, 
                {"transaction_id": transaction_id}
            )
            
            return True
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error deleting transaction: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )

    def get_monthly_stats(self, db: Session, user_id: int, year: Optional[int] = None) -> Dict[str, Any]:
        """Get monthly income and expense statistics for a user"""
        try:
            # Default to current year if not provided
            if year is None:
                year = datetime.now().year
            
            logger.info(f"Getting monthly stats for user {user_id}, year {year}")
            
            # Optimized SQLAlchemy query with better error handling
            result = db.query(
                extract('month', Transaction.created_at).label('month'),
                func.sum(
                    case((Transaction.transaction_type == TransactionType.INCOME.value, Transaction.amount),
                        else_=0)
                ).label('income'),
                func.sum(
                    case((Transaction.transaction_type == TransactionType.EXPENSE.value, Transaction.amount),
                        else_=0)
                ).label('expense')
            ).filter(
                Transaction.user_id == user_id,
                extract('year', Transaction.created_at) == year
            ).group_by(
                extract('month', Transaction.created_at)
            ).order_by(
                extract('month', Transaction.created_at)
            ).all()
            
            logger.info(f"Database query returned {len(result)} months with data")
            
            # Initialize monthly data for all 12 months
            monthly_data = []
            
            # Create a dictionary for easy lookup
            result_dict = {int(row.month): row for row in result}
            
            # Build complete monthly data with validation
            total_income = 0
            total_expense = 0
            
            for month_num in range(1, 13):
                if month_num in result_dict:
                    row = result_dict[month_num]
                    income = float(row.income or 0)
                    expense = float(row.expense or 0)
                else:
                    income = 0
                    expense = 0
                
                # Validate values are not negative due to data corruption
                income = max(0, income)
                expense = max(0, expense)
                
                monthly_data.append({
                    "month": month_num,
                    "income": income,
                    "expense": expense
                })
                
                total_income += income
                total_expense += expense
            
            stats_result = {
                "year": year,
                "monthly_data": monthly_data,
                "total_income": total_income,
                "total_expense": total_expense,
                "net_income": total_income - total_expense
            }
            
            logger.info(f"Monthly stats completed successfully for user {user_id}")
            return stats_result
            
        except Exception as e:
            logger.error(f"Error in get_monthly_stats for user {user_id}: {str(e)}")
            # Return safe empty stats structure on error
            return {
                "year": year or datetime.now().year,
                "monthly_data": [{"month": i, "income": 0, "expense": 0} for i in range(1, 13)],
                "total_income": 0,
                "total_expense": 0,
                "net_income": 0
            }

    def get_current_month_stats(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get current month income and expense statistics for a user"""
        try:
            current_date = datetime.now()
            current_month = current_date.month
            current_year = current_date.year
            
            logger.info(f"Getting current month stats for user {user_id}, month {current_month}/{current_year}")
            
            # Query transactions for current month
            income = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == TransactionType.INCOME.value,  # Use .value
                extract('month', Transaction.created_at) == current_month,
                extract('year', Transaction.created_at) == current_year
            ).scalar() or 0
            
            expenses = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == TransactionType.EXPENSE.value,  # Use .value
                extract('month', Transaction.created_at) == current_month,
                extract('year', Transaction.created_at) == current_year
            ).scalar() or 0
            
            transaction_count = db.query(func.count(Transaction.id)).filter(
                Transaction.user_id == user_id,
                extract('month', Transaction.created_at) == current_month,
                extract('year', Transaction.created_at) == current_year
            ).scalar() or 0
            
            result = {
                "income": float(income),
                "expenses": float(expenses),
                "net": float(income) - float(expenses),
                "transaction_count": transaction_count,
                "month": current_month,
                "year": current_year
            }
            
            logger.info(f"Current month stats result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error in get_current_month_stats: {str(e)}")
            current_date = datetime.now()
            return {
                "income": 0,
                "expenses": 0,
                "net": 0,
                "transaction_count": 0,
                "month": current_date.month,
                "year": current_date.year
            }


# Create singleton instance for dependency injection
transaction_service_instance = TransactionService()

# Legacy function exports for backward compatibility
def get_user_transactions(db: Session, user_id: int, transaction_type: Optional[int] = None,
                         start_date: Optional[date] = None, end_date: Optional[date] = None):
    return transaction_service_instance.get_user_transactions(db, user_id, transaction_type, start_date, end_date)

def get_transaction_by_id(db: Session, transaction_id: int, user_id: Optional[int] = None):
    return transaction_service_instance.get_transaction_by_id(db, transaction_id, user_id)

def create_transaction(db: Session, user_id: int, transaction_type: int, amount: float, 
                      wallet_id: int, transaction_date: date, description: Optional[str] = None,
                      category_id: Optional[int] = None):
    return transaction_service_instance.create_transaction(
        db, user_id, transaction_type, amount, wallet_id, transaction_date, description, category_id
    )

def update_transaction(db: Session, transaction_id: int, user_id: int, update_data: Dict[str, Any]):
    return transaction_service_instance.update_transaction(db, transaction_id, user_id, update_data)

def delete_transaction(db: Session, transaction_id: int, user_id: int):
    return transaction_service_instance.delete_transaction(db, transaction_id, user_id)

def get_monthly_stats(db: Session, user_id: int, year: Optional[int] = None):
    return transaction_service_instance.get_monthly_stats(db, user_id, year)

def get_current_month_stats(db: Session, user_id: int):
    return transaction_service_instance.get_current_month_stats(db, user_id)

# Export both class and functions
__all__ = [
    "TransactionService",
    "transaction_service_instance",
    "get_user_transactions",
    "get_transaction_by_id", 
    "create_transaction",
    "update_transaction",
    "delete_transaction",
    "get_monthly_stats",
    "get_current_month_stats"
]

print("✅ TransactionService class created with clean architecture")
print("✅ Legacy function compatibility maintained")