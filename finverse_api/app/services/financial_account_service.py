"""
Financial Account service for FinVerse API
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Dict

from app.models.financial_account import FinancialAccount
from app.schemas.financial_account import FinancialAccountCreate, AccountType


class FinancialAccountService:
    """Service for financial account operations"""
    
    @staticmethod
    def create_account(db: Session, account_data: FinancialAccountCreate, user_id: int) -> FinancialAccount:
        """Create a new financial account"""
        
        account = FinancialAccount(
            user_id=user_id,
            name=account_data.name,
            type=account_data.type,
            balance=account_data.initial_balance or 0.0,  # Use the provided initial balance
            icon=account_data.icon,
            color=account_data.color,
            note=account_data.note,
            currency=account_data.currency or "USD",
            created_by_default=False  # User-created accounts are never default
        )
        
        db.add(account)
        db.commit()
        db.refresh(account)
        
        return account
    
    @staticmethod
    def get_user_accounts(db: Session, user_id: int) -> list[FinancialAccount]:
        """Get all financial accounts for a user"""
        
        accounts = db.query(FinancialAccount).filter(FinancialAccount.user_id == user_id).all()
        return accounts
    
    @staticmethod
    def get_account(db: Session, account_id: int) -> FinancialAccount:
        """Get a financial account by ID"""
        
        account = db.query(FinancialAccount).filter(FinancialAccount.id == account_id).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Financial account with id {account_id} not found"
            )
        
        return account
    
    @staticmethod
    def update_account_balance(db: Session, account_id: int, amount: float, is_deposit: bool = True) -> FinancialAccount:
        """Update account balance with deposit or withdrawal"""
        
        account = FinancialAccountService.get_account(db, account_id)
        
        if is_deposit:
            account.balance += amount
        else:
            if account.balance < amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient funds"
                )
            account.balance -= amount
        
        db.commit()
        db.refresh(account)
        
        return account

    @staticmethod
    def get_account_types() -> List[dict]:
        """Get predefined account types"""
        return [
            {"type": "wallet", "label": "Main Wallet", "icon": "account_balance_wallet", "color": "#1976d2"},
            {"type": "saving", "label": "Saving Account", "icon": "savings", "color": "#2e7d32"},
            {"type": "investment", "label": "Investment", "icon": "trending_up", "color": "#9c27b0"},
            {"type": "goal", "label": "Goal Fund", "icon": "emoji_events", "color": "#ff9800"}
        ]
    
    @staticmethod
    def top_up_account(db: Session, user_id: int, account_id: int, amount: float, note: str = None) -> FinancialAccount:
        """Top up an account balance"""
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
        
        # Update account balance
        account.balance += amount
        
        # Save to database
        db.commit()
        db.refresh(account)
        
        # Record internal transaction (handled by calling code)
        
        return account
    
    @staticmethod
    def get_account_summary(db: Session, user_id: int) -> Dict[str, float]:
        """Get account balance summary grouped by type"""
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
        
        # Update with actual values
        for type_name, type_total in query_result:
            if type_name in summary:
                summary[type_name] = type_total
                total += type_total
        
        # Set total
        summary["total"] = total
        
        return summary