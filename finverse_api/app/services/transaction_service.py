"""
Transaction service for FinVerse API
"""

from datetime import date
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from sqlalchemy import text, extract, func
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status

from app.models.transaction import Transaction, TransactionType
from app.models.financial_account import FinancialAccount


def get_user_transactions(
    db: Session, 
    user_id: int, 
    transaction_type: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[Transaction]:
    """Get transactions for a user with optional filtering"""
    # Base query for user's transactions
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    
    # Apply filters if provided
    if transaction_type is not None:
        query = query.filter(Transaction.transaction_type == transaction_type)
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    # Order by transaction date descending, then created_at descending
    return query.order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc()).all()


def get_transaction_by_id(db: Session, transaction_id: int, user_id: Optional[int] = None) -> Optional[Transaction]:
    """Get transaction by ID, optionally filtered by user_id"""
    query = db.query(Transaction).filter(Transaction.id == transaction_id)
    
    if user_id:
        query = query.filter(Transaction.user_id == user_id)
    
    return query.first()


def create_transaction(
    db: Session, 
    user_id: int, 
    transaction_type: int, 
    amount: float, 
    wallet_id: int,
    transaction_date: date,
    description: Optional[str] = None
) -> Transaction:
    """Create a new transaction and update wallet balance"""
    try:
        # Start a nested transaction to ensure atomicity
        db.begin_nested()
        
        # Log the transaction data for debugging
        print(f"Creating transaction: type={transaction_type}, amount={amount}, wallet_id={wallet_id}, date={transaction_date}")
        
        # Get the wallet and verify ownership
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
        
        # Create transaction
        transaction = Transaction(
            user_id=user_id,
            wallet_id=wallet_id,
            transaction_type=transaction_type,
            amount=amount,
            description=description,
            transaction_date=transaction_date
        )
        
        db.add(transaction)
        
        # Update wallet balance based on transaction type
        if transaction_type == TransactionType.INCOME:
            wallet.balance += amount
        elif transaction_type == TransactionType.EXPENSE:
            # Check if wallet has sufficient balance
            if wallet.balance < amount:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient funds in wallet {wallet.name}"
                )
            wallet.balance -= amount
        
        db.commit()
        db.refresh(transaction)
        
        return transaction
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Database error in create_transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        print(f"Unexpected error in create_transaction: {str(e)}")
        raise


def update_transaction(
    db: Session, 
    transaction_id: int, 
    user_id: int, 
    update_data: Dict[str, Any]
) -> Transaction:
    """Update an existing transaction"""
    try:
        # Start a nested transaction to ensure atomicity
        db.begin_nested()
        
        # Get the transaction
        transaction = get_transaction_by_id(db, transaction_id, user_id)
        if not transaction:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
            
        # Get the wallet to restore original balance
        original_wallet = db.query(FinancialAccount).filter(
            FinancialAccount.id == transaction.wallet_id
        ).first()
        
        if not original_wallet:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Original wallet not found"
            )
            
        # Restore the wallet's original balance
        if transaction.transaction_type == TransactionType.INCOME:
            original_wallet.balance -= transaction.amount
        elif transaction.transaction_type == TransactionType.EXPENSE:
            original_wallet.balance += transaction.amount
            
        # Get the new wallet if it's being changed
        new_wallet_id = update_data.get('wallet_id', transaction.wallet_id)
        new_wallet = original_wallet
        
        if new_wallet_id != transaction.wallet_id:
            new_wallet = db.query(FinancialAccount).filter(
                FinancialAccount.id == new_wallet_id,
                FinancialAccount.user_id == user_id
            ).first()
            
            if not new_wallet:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"New wallet with ID {new_wallet_id} not found or doesn't belong to user"
                )
        
        # Update transaction fields
        for key, value in update_data.items():
            setattr(transaction, key, value)
            
        # Update the new wallet balance
        new_amount = update_data.get('amount', transaction.amount)
        new_type = update_data.get('transaction_type', transaction.transaction_type)
        
        if new_type == TransactionType.INCOME:
            new_wallet.balance += new_amount
        elif new_type == TransactionType.EXPENSE:
            # Check if wallet has sufficient funds
            if new_wallet.balance < new_amount:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient funds in wallet {new_wallet.name}"
                )
            new_wallet.balance -= new_amount
            
        db.commit()
        db.refresh(transaction)
        
        return transaction
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Database error: {str(e)}"
        )


def delete_transaction(db: Session, transaction_id: int, user_id: int) -> bool:
    """Delete a transaction and update wallet balance"""
    try:
        # Start a nested transaction to ensure atomicity
        db.begin_nested()
        
        # Get the transaction
        transaction = get_transaction_by_id(db, transaction_id, user_id)
        if not transaction:
            db.rollback()
            return False
            
        # Get the wallet
        wallet = db.query(FinancialAccount).filter(
            FinancialAccount.id == transaction.wallet_id
        ).first()
        
        if not wallet:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wallet not found"
            )
            
        # Update wallet balance
        if transaction.transaction_type == TransactionType.INCOME:
            wallet.balance -= transaction.amount
        elif transaction.transaction_type == TransactionType.EXPENSE:
            wallet.balance += transaction.amount
            
        # Delete the transaction
        db.delete(transaction)
        db.commit()
        
        return True
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Database error: {str(e)}"
        )


def get_monthly_stats(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """Get monthly income and expense statistics for a user"""
    # SQLAlchemy query to get monthly totals
    result = db.query(
        extract('year', Transaction.transaction_date).label('year'),
        extract('month', Transaction.transaction_date).label('month'),
        func.sum(
            func.case(
                [(Transaction.transaction_type == TransactionType.INCOME, Transaction.amount)],
                else_=0
            )
        ).label('income'),
        func.sum(
            func.case(
                [(Transaction.transaction_type == TransactionType.EXPENSE, Transaction.amount)],
                else_=0
            )
        ).label('expense')
    ).filter(
        Transaction.user_id == user_id
    ).group_by(
        extract('year', Transaction.transaction_date),
        extract('month', Transaction.transaction_date)
    ).order_by(
        extract('year', Transaction.transaction_date).desc(),
        extract('month', Transaction.transaction_date).desc()
    ).limit(12).all()
    
    # Convert the result to a list of dictionaries
    stats = []
    for row in result:
        month_str = f"{int(row.year)}-{int(row.month):02d}"
        stats.append({
            "month": month_str,
            "income": float(row.income),
            "expense": float(row.expense)
        })
    
    return stats