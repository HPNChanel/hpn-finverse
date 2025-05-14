"""
Internal Transaction service for FinVerse API
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.internal_transaction import InternalTransaction
from app.models.financial_account import FinancialAccount
from app.schemas.internal_transaction import InternalTransactionCreate


class InternalTransactionService:
    """Service for internal transaction operations"""
    
    @staticmethod
    def create_transaction(db: Session, transaction_data: InternalTransactionCreate, user_id: int) -> InternalTransaction:
        """Create a new internal transaction (transfer between accounts)"""
        
        # Verify accounts exist and belong to the user
        from_account = db.query(FinancialAccount).filter(
            FinancialAccount.id == transaction_data.from_account_id,
            FinancialAccount.user_id == user_id
        ).first()
        
        to_account = db.query(FinancialAccount).filter(
            FinancialAccount.id == transaction_data.to_account_id,
            FinancialAccount.user_id == user_id
        ).first()
        
        if not from_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source account with id {transaction_data.from_account_id} not found"
            )
        
        if not to_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Destination account with id {transaction_data.to_account_id} not found"
            )
        
        # Verify sufficient funds
        if from_account.balance < transaction_data.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient funds in account {from_account.name}"
            )
        
        # Create transaction record
        transaction = InternalTransaction(
            from_account_id=transaction_data.from_account_id,
            to_account_id=transaction_data.to_account_id,
            amount=transaction_data.amount,
            note=transaction_data.note
        )
        
        # Update account balances
        from_account.balance -= transaction_data.amount
        to_account.balance += transaction_data.amount
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        return transaction
    
    @staticmethod
    def get_user_transactions(db: Session, user_id: int) -> list[InternalTransaction]:
        """Get all internal transactions for a user"""
        
        # Find all account IDs belonging to the user
        account_ids = [account.id for account in db.query(FinancialAccount).filter(
            FinancialAccount.user_id == user_id
        ).all()]
        
        # Find all transactions where either the source or destination is one of these accounts
        transactions = db.query(InternalTransaction).filter(
            (InternalTransaction.from_account_id.in_(account_ids)) | 
            (InternalTransaction.to_account_id.in_(account_ids))
        ).order_by(InternalTransaction.timestamp.desc()).all()
        
        return transactions