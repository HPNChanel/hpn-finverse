"""
Transaction service for FinVerse API
"""

from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.transaction import Transaction, TransactionType


def get_user_transactions(db: Session, user_id: int) -> List[Transaction]:
    """Get all transactions for a user"""
    # Query transactions for the user, ordered by created_at descending
    user_transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.created_at.desc()).all()
    
    return user_transactions


def get_transaction_by_id(db: Session, transaction_id: int, user_id: Optional[int] = None) -> Optional[Transaction]:
    """Get transaction by ID, optionally filtered by user_id"""
    query = db.query(Transaction).filter(Transaction.id == transaction_id)
    
    if user_id:
        query = query.filter(Transaction.user_id == user_id)
    
    return query.first()


def create_transaction(
    db: Session, 
    user_id: int, 
    transaction_type: str, 
    amount: float, 
    category: Optional[str] = None,  # Changed from category_id to category
    description: Optional[str] = None
) -> Transaction:
    """Create a new transaction"""
    # Create transaction
    transaction = Transaction(
        user_id=user_id,
        transaction_type=transaction_type,
        amount=amount,
        category=category,  # Using category string directly
        description=description
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction