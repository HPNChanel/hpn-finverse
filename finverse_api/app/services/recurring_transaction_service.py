"""
Service for managing recurring transactions in FinVerse API
"""

from typing import List, Optional
from datetime import date, datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.recurring_transaction import RecurringTransaction
from app.schemas.recurring_transaction import RecurringTransactionCreate, RecurringTransactionUpdate
from app.schemas.recurring_transaction import FrequencyType


class RecurringTransactionService:
    """Service for managing recurring transactions"""
    
    @staticmethod
    def get_recurring_transactions(db: Session, user_id: int) -> List[RecurringTransaction]:
        """Get all recurring transactions for a user"""
        return db.query(RecurringTransaction).filter(
            RecurringTransaction.user_id == user_id
        ).order_by(RecurringTransaction.next_occurrence).all()
    
    @staticmethod
    def get_recurring_transaction(db: Session, transaction_id: int, user_id: int) -> RecurringTransaction:
        """Get a specific recurring transaction by ID"""
        transaction = db.query(RecurringTransaction).filter(
            RecurringTransaction.id == transaction_id,
            RecurringTransaction.user_id == user_id
        ).first()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurring transaction with ID {transaction_id} not found"
            )
        
        return transaction
    
    @staticmethod
    def create_recurring_transaction(
        db: Session, transaction_data: RecurringTransactionCreate, user_id: int
    ) -> RecurringTransaction:
        """Create a new recurring transaction"""
        try:
            # Calculate next occurrence based on start date and frequency
            next_occurrence = RecurringTransactionService._calculate_next_occurrence(
                transaction_data.start_date,
                transaction_data.frequency_type,
                transaction_data.frequency_value
            )
            
            transaction = RecurringTransaction(
                user_id=user_id,
                category_id=transaction_data.category_id,
                wallet_id=transaction_data.wallet_id,
                amount=transaction_data.amount,
                transaction_type=transaction_data.transaction_type,
                description=transaction_data.description,
                frequency_type=transaction_data.frequency_type,
                frequency_value=transaction_data.frequency_value,
                start_date=transaction_data.start_date,
                end_date=transaction_data.end_date,
                next_occurrence=next_occurrence,
                is_active=transaction_data.is_active
            )
            
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            return transaction
            
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
    
    @staticmethod
    def update_recurring_transaction(
        db: Session, 
        transaction_id: int, 
        transaction_data: RecurringTransactionUpdate, 
        user_id: int
    ) -> RecurringTransaction:
        """Update an existing recurring transaction"""
        transaction = RecurringTransactionService.get_recurring_transaction(db, transaction_id, user_id)
        
        try:
            update_data = transaction_data.dict(exclude_unset=True)
            
            # If frequency or start date is updated, recalculate next occurrence
            recalculate_next = False
            if "frequency_type" in update_data or "frequency_value" in update_data or "start_date" in update_data:
                recalculate_next = True
                
            # Update transaction fields
            for key, value in update_data.items():
                setattr(transaction, key, value)
            
            # Recalculate next occurrence if needed
            if recalculate_next:
                transaction.next_occurrence = RecurringTransactionService._calculate_next_occurrence(
                    transaction.start_date,
                    transaction.frequency_type,
                    transaction.frequency_value,
                    from_date=datetime.now().date()
                )
            
            db.commit()
            db.refresh(transaction)
            return transaction
            
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
    
    @staticmethod
    def delete_recurring_transaction(db: Session, transaction_id: int, user_id: int) -> bool:
        """Delete a recurring transaction"""
        transaction = RecurringTransactionService.get_recurring_transaction(db, transaction_id, user_id)
        
        try:
            db.delete(transaction)
            db.commit()
            return True
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
    
    @staticmethod
    def get_due_recurring_transactions(db: Session, current_date: date = None) -> List[RecurringTransaction]:
        """Get all recurring transactions that are due for processing"""
        if current_date is None:
            current_date = datetime.now().date()
        
        return db.query(RecurringTransaction).filter(
            RecurringTransaction.is_active == True,
            RecurringTransaction.next_occurrence <= current_date,
            (RecurringTransaction.end_date.is_(None) | (RecurringTransaction.end_date >= current_date))
        ).all()
    
    @staticmethod
    def update_next_occurrence(db: Session, transaction_id: int) -> RecurringTransaction:
        """Update the next occurrence date after a transaction is processed"""
        transaction = db.query(RecurringTransaction).filter(
            RecurringTransaction.id == transaction_id
        ).first()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurring transaction with ID {transaction_id} not found"
            )
        
        try:
            current_date = datetime.now().date()
            
            # If end date exists and we've reached it, deactivate the recurring transaction
            if transaction.end_date and transaction.end_date <= current_date:
                transaction.is_active = False
                db.commit()
                return transaction
            
            # Calculate next occurrence date
            next_date = RecurringTransactionService._calculate_next_occurrence(
                transaction.start_date,
                transaction.frequency_type,
                transaction.frequency_value,
                from_date=current_date
            )
            
            transaction.next_occurrence = next_date
            db.commit()
            db.refresh(transaction)
            return transaction
            
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
    
    @staticmethod
    def _calculate_next_occurrence(
        start_date: date,
        frequency_type: int,
        frequency_value: int,
        from_date: date = None
    ) -> date:
        """
        Calculate the next occurrence date based on frequency settings
        
        Args:
            start_date: The start date of the recurring transaction
            frequency_type: The type of frequency (1=daily, 2=weekly, 3=monthly, 4=yearly)
            frequency_value: The value for the frequency
            from_date: The date to calculate from (defaults to start_date)
        
        Returns:
            The next occurrence date
        """
        if from_date is None:
            from_date = start_date
        
        # If from_date is before start_date, use start_date
        if from_date < start_date:
            from_date = start_date
        
        # Daily frequency
        if frequency_type == FrequencyType.DAILY:
            return from_date + timedelta(days=1)
        
        # Weekly frequency
        elif frequency_type == FrequencyType.WEEKLY:
            # frequency_value is day of week (0-6, Monday=0, Sunday=6)
            days_ahead = frequency_value - from_date.weekday()
            if days_ahead <= 0:  # Target day already happened this week
                days_ahead += 7
            return from_date + timedelta(days=days_ahead)
        
        # Monthly frequency
        elif frequency_type == FrequencyType.MONTHLY:
            # frequency_value is day of month (1-31)
            next_month = from_date.replace(day=1)
            if from_date.day >= frequency_value:
                # Move to next month if we're already past the target day
                if from_date.month == 12:
                    next_month = next_month.replace(year=from_date.year + 1, month=1)
                else:
                    next_month = next_month.replace(month=from_date.month + 1)
            
            # Calculate the actual day, adjusting for shorter months
            import calendar
            last_day = calendar.monthrange(next_month.year, next_month.month)[1]
            target_day = min(frequency_value, last_day)
            
            return next_month.replace(day=target_day)
        
        # Yearly frequency
        elif frequency_type == FrequencyType.YEARLY:
            # frequency_value is day of year (1-366)
            from dateutil.relativedelta import relativedelta
            
            current_year_date = RecurringTransactionService._get_day_of_year(from_date.year, frequency_value)
            
            # If we've already passed this date in the current year, move to next year
            if current_year_date < from_date:
                return RecurringTransactionService._get_day_of_year(from_date.year + 1, frequency_value)
            return current_year_date
        
        # Default fallback
        return from_date
    
    @staticmethod
    def _get_day_of_year(year: int, day_of_year: int) -> date:
        """Helper method to get a date from a day of year value"""
        import datetime as dt
        
        # Handle leap years
        if day_of_year > 366:
            day_of_year = 366
        
        try:
            return dt.date(year, 1, 1) + dt.timedelta(days=day_of_year - 1)
        except ValueError:
            # Handle Feb 29 in non-leap years
            return dt.date(year, 12, 31) 