"""
Balance Service for FinVerse API

This service handles user account balance operations for savings plans:
- Balance validation and management
- Transaction logging for balance changes
- Financial-safe arithmetic operations
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status

from app.models.user_account_balance import UserAccountBalance
from app.models.transaction import Transaction, SavingsTransactionType
from app.models.user import User
from app.models.savings_plan import SavingsPlan
from datetime import datetime, date


class BalanceService:
    """Service for managing user account balance operations"""
    
    @staticmethod
    def get_or_create_user_balance(db: Session, user_id: int) -> UserAccountBalance:
        """Get or create user account balance record"""
        try:
            balance_record = db.query(UserAccountBalance).filter(
                UserAccountBalance.user_id == user_id
            ).first()
            
            if not balance_record:
                # Create new balance record with 0 balance
                balance_record = UserAccountBalance(
                    user_id=user_id,
                    total_balance=Decimal('0.00'),
                    currency="USD"
                )
                db.add(balance_record)
                db.commit()
                db.refresh(balance_record)
            
            return balance_record
            
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user balance: {str(e)}"
            )
    
    @staticmethod
    def get_user_balance(db: Session, user_id: int) -> Decimal:
        """Get user's current available balance"""
        balance_record = BalanceService.get_or_create_user_balance(db, user_id)
        return Decimal(str(balance_record.total_balance))
    
    @staticmethod
    def validate_sufficient_balance(db: Session, user_id: int, required_amount: float) -> bool:
        """Check if user has sufficient balance for the operation"""
        current_balance = BalanceService.get_user_balance(db, user_id)
        required_decimal = Decimal(str(required_amount))
        return current_balance >= required_decimal
    
    @staticmethod
    def deduct_balance(
        db: Session, 
        user_id: int, 
        amount: float, 
        savings_plan_id: Optional[int] = None,
        transaction_type: str = SavingsTransactionType.SAVING_DEPOSIT.value,
        description: str = "Savings plan deposit"
    ) -> Transaction:
        """
        Deduct amount from user balance and log transaction
        Returns the created transaction record
        """
        try:
            # Validate sufficient balance
            if not BalanceService.validate_sufficient_balance(db, user_id, amount):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient balance for this operation"
                )
            
            # Get balance record
            balance_record = BalanceService.get_or_create_user_balance(db, user_id)
            
            # Convert to Decimal for safe arithmetic
            amount_decimal = Decimal(str(amount))
            current_balance = Decimal(str(balance_record.total_balance))
            
            # Deduct amount
            new_balance = current_balance - amount_decimal
            balance_record.total_balance = new_balance
            balance_record.last_updated = datetime.utcnow()
            
            # Create transaction record
            transaction = Transaction(
                user_id=user_id,
                financial_account_id=1,  # Default account - you may want to make this configurable
                amount=amount_decimal,
                transaction_type=1,  # Expense (money going out)
                description=description,
                transaction_date=date.today(),
                related_savings_plan_id=savings_plan_id,
                savings_transaction_type=transaction_type,
                note=f"Balance deduction for savings plan operation"
            )
            
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            
            return transaction
            
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to deduct balance: {str(e)}"
            )
    
    @staticmethod
    def add_balance(
        db: Session, 
        user_id: int, 
        amount: float, 
        savings_plan_id: Optional[int] = None,
        transaction_type: str = SavingsTransactionType.EARLY_WITHDRAWAL.value,
        description: str = "Savings plan withdrawal"
    ) -> Transaction:
        """
        Add amount to user balance and log transaction
        Returns the created transaction record
        """
        try:
            # Get balance record
            balance_record = BalanceService.get_or_create_user_balance(db, user_id)
            
            # Convert to Decimal for safe arithmetic
            amount_decimal = Decimal(str(amount))
            current_balance = Decimal(str(balance_record.total_balance))
            
            # Add amount
            new_balance = current_balance + amount_decimal
            balance_record.total_balance = new_balance
            balance_record.last_updated = datetime.utcnow()
            
            # Create transaction record
            transaction = Transaction(
                user_id=user_id,
                financial_account_id=1,  # Default account - you may want to make this configurable
                amount=amount_decimal,
                transaction_type=0,  # Income (money coming in)
                description=description,
                transaction_date=date.today(),
                related_savings_plan_id=savings_plan_id,
                savings_transaction_type=transaction_type,
                note=f"Balance addition from savings plan operation"
            )
            
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            
            return transaction
            
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add balance: {str(e)}"
            )
    
    @staticmethod
    def calculate_early_withdrawal_amount(
        plan: SavingsPlan, 
        current_date: Optional[datetime] = None
    ) -> dict:
        """
        Calculate early withdrawal amount with penalty
        Returns dict with breakdown of amounts
        """
        if current_date is None:
            current_date = datetime.utcnow()
        
        # Calculate months elapsed since plan creation
        months_elapsed = max(0, (
            (current_date.year - plan.created_at.year) * 12 + 
            (current_date.month - plan.created_at.month)
        ))
        
        # Current balance in the plan
        current_balance = Decimal(str(plan.current_balance))
        total_contributed = Decimal(str(plan.total_contributed))
        interest_earned = Decimal(str(plan.total_interest_earned))
        
        # Calculate penalty on interest earned
        penalty_rate = Decimal(str(plan.early_withdrawal_penalty_rate))
        penalty_amount = interest_earned * penalty_rate
        
        # Net withdrawal amount (contributions + interest - penalty)
        net_withdrawal = current_balance - penalty_amount
        
        return {
            "current_balance": float(current_balance),
            "total_contributed": float(total_contributed),
            "interest_earned": float(interest_earned),
            "penalty_rate": float(penalty_rate),
            "penalty_amount": float(penalty_amount),
            "net_withdrawal_amount": float(net_withdrawal),
            "months_elapsed": months_elapsed,
            "months_remaining": max(0, plan.duration_months - months_elapsed)
        }
    
    @staticmethod
    def update_balance_from_financial_accounts(db: Session, user_id: int) -> UserAccountBalance:
        """
        Update user balance based on sum of all active financial accounts
        This can be used to sync balance from existing financial accounts
        """
        try:
            from app.models.financial_account import FinancialAccount
            
            # Calculate total from all active, non-hidden financial accounts
            total_balance = db.query(
                db.func.sum(FinancialAccount.balance)
            ).filter(
                FinancialAccount.user_id == user_id,
                FinancialAccount.is_active == True,
                FinancialAccount.is_hidden == False
            ).scalar() or Decimal('0.00')
            
            # Get or create balance record
            balance_record = BalanceService.get_or_create_user_balance(db, user_id)
            balance_record.total_balance = Decimal(str(total_balance))
            balance_record.last_updated = datetime.utcnow()
            
            db.commit()
            db.refresh(balance_record)
            
            return balance_record
            
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update balance from financial accounts: {str(e)}"
            ) 