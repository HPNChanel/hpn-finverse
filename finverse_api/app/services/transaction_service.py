"""
Transaction service for FinVerse API
"""

from datetime import date, datetime
from decimal import Decimal
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
        
        # Update wallet balance based on transaction type - convert to Decimal for consistency
        transaction_amount = Decimal(str(amount))
        wallet_balance = Decimal(str(wallet.balance))
        
        if transaction_type == TransactionType.INCOME:
            wallet.balance = float(wallet_balance + transaction_amount)
        elif transaction_type == TransactionType.EXPENSE:
            # Check if wallet has sufficient balance
            if wallet_balance < transaction_amount:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient funds in wallet {wallet.name}"
                )
            wallet.balance = float(wallet_balance - transaction_amount)
        
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
            
        # Restore the wallet's original balance - convert to Decimal for consistency
        original_transaction_amount = Decimal(str(transaction.amount))
        original_wallet_balance = Decimal(str(original_wallet.balance))
        
        if transaction.transaction_type == TransactionType.INCOME:
            original_wallet.balance = float(original_wallet_balance - original_transaction_amount)
        elif transaction.transaction_type == TransactionType.EXPENSE:
            original_wallet.balance = float(original_wallet_balance + original_transaction_amount)
            
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
            
        # Update the new wallet balance - convert to Decimal for consistency
        new_amount = Decimal(str(update_data.get('amount', transaction.amount)))
        new_wallet_balance = Decimal(str(new_wallet.balance))
        new_type = update_data.get('transaction_type', transaction.transaction_type)
        
        if new_type == TransactionType.INCOME:
            new_wallet.balance = float(new_wallet_balance + new_amount)
        elif new_type == TransactionType.EXPENSE:
            # Check if wallet has sufficient funds
            if new_wallet_balance < new_amount:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient funds in wallet {new_wallet.name}"
                )
            new_wallet.balance = float(new_wallet_balance - new_amount)
            
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
            
        # Update wallet balance - convert to Decimal for type consistency
        transaction_amount = Decimal(str(transaction.amount))
        wallet_balance = Decimal(str(wallet.balance))
        
        if transaction.transaction_type == TransactionType.INCOME:
            wallet.balance = float(wallet_balance - transaction_amount)
        elif transaction.transaction_type == TransactionType.EXPENSE:
            wallet.balance = float(wallet_balance + transaction_amount)
            
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


def get_monthly_stats(db: Session, user_id: int, year: Optional[int] = None) -> Dict[str, Any]:
    """Get monthly income and expense statistics for a user"""
    try:
        # Default to current year if not provided
        if year is None:
            year = datetime.now().year
        
        print(f"Getting monthly stats for user {user_id}, year {year}")
        
        # SQLAlchemy query to get monthly totals using created_at for better real-time data
        result = db.query(
            extract('month', Transaction.created_at).label('month'),
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
            Transaction.user_id == user_id,
            extract('year', Transaction.created_at) == year
        ).group_by(
            extract('month', Transaction.created_at)
        ).order_by(
            extract('month', Transaction.created_at)
        ).all()
        
        print(f"Database result: {[(r.month, r.income, r.expense) for r in result]}")
        
        # Initialize monthly data for all 12 months
        monthly_data = []
        
        # Create a dictionary for easy lookup
        result_dict = {int(row.month): row for row in result}
        
        # Build complete monthly data
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
        
        print(f"Final stats result: {stats_result}")
        return stats_result
        
    except Exception as e:
        print(f"Error in get_monthly_stats: {str(e)}")
        # Return empty stats structure on error
        return {
            "year": year or datetime.now().year,
            "monthly_data": [{"month": i, "income": 0, "expense": 0} for i in range(1, 13)],
            "total_income": 0,
            "total_expense": 0,
            "net_income": 0
        }


def get_current_month_stats(db: Session, user_id: int) -> Dict[str, Any]:
    """Get current month income and expense statistics for a user"""
    try:
        # Get current month and year
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        
        print(f"Getting current month stats for user {user_id}, {current_year}-{current_month}")
        
        # Query transactions for current month using created_at for real-time data
        result = db.query(
            func.sum(
                func.case(
                    [(Transaction.transaction_type == TransactionType.INCOME, Transaction.amount)],
                    else_=0
                )
            ).label('total_income'),
            func.sum(
                func.case(
                    [(Transaction.transaction_type == TransactionType.EXPENSE, Transaction.amount)],
                    else_=0
                )
            ).label('total_expense'),
            func.count(Transaction.id).label('transaction_count')
        ).filter(
            Transaction.user_id == user_id,
            extract('year', Transaction.created_at) == current_year,
            extract('month', Transaction.created_at) == current_month
        ).first()
        
        # Handle case where no transactions exist
        total_income = float(result.total_income or 0) if result else 0
        total_expense = float(result.total_expense or 0) if result else 0
        transaction_count = int(result.transaction_count or 0) if result else 0
        
        current_stats = {
            "income": total_income,
            "expenses": total_expense,
            "net": total_income - total_expense,
            "transaction_count": transaction_count,
            "month": current_month,
            "year": current_year
        }
        
        print(f"Current month stats result: {current_stats}")
        return current_stats
        
    except Exception as e:
        print(f"Error in get_current_month_stats: {str(e)}")
        # Return empty stats structure on error
        now = datetime.now()
        return {
            "income": 0,
            "expenses": 0,
            "net": 0,
            "transaction_count": 0,
            "month": now.month,
            "year": now.year
        }