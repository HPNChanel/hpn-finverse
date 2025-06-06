"""
Base service class for FinVerse API

Provides common patterns and utilities for all service classes.
Implements clean architecture principles for the business logic layer.
"""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Optional, List, Type
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
import logging
from decimal import Decimal

from app.db.session import Base

logger = logging.getLogger(__name__)

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType], ABC):
    """
    Base service class that provides common CRUD operations and error handling.
    
    This class implements the business logic layer of our clean architecture:
    - Encapsulates business rules and validation
    - Handles database transactions 
    - Provides consistent error handling
    - Ensures data integrity
    """
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    def get(self, db: Session, id: int, user_id: Optional[int] = None) -> Optional[ModelType]:
        """Get a single record by ID with optional user filtering"""
        try:
            query = db.query(self.model).filter(self.model.id == id)
            if user_id and hasattr(self.model, 'user_id'):
                query = query.filter(self.model.user_id == user_id)
            return query.first()
        except SQLAlchemyError as e:
            logger.error(f"Database error in get: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error occurred"
            )
    
    def get_multi(
        self, 
        db: Session, 
        user_id: Optional[int] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[ModelType]:
        """Get multiple records with optional user filtering and pagination"""
        try:
            query = db.query(self.model)
            if user_id and hasattr(self.model, 'user_id'):
                query = query.filter(self.model.user_id == user_id)
            return query.offset(skip).limit(limit).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_multi: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error occurred"
            )
    
    def create(self, db: Session, obj_in: CreateSchemaType, user_id: Optional[int] = None) -> ModelType:
        """Create a new record"""
        try:
            obj_data = obj_in.model_dump() if hasattr(obj_in, 'model_dump') else obj_in.dict()
            if user_id and hasattr(self.model, 'user_id'):
                obj_data['user_id'] = user_id
            
            db_obj = self.model(**obj_data)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error in create: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create record"
            )
    
    def update(
        self, 
        db: Session, 
        db_obj: ModelType, 
        obj_in: UpdateSchemaType
    ) -> ModelType:
        """Update an existing record"""
        try:
            obj_data = obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, 'model_dump') else obj_in.dict(exclude_unset=True)
            
            for field, value in obj_data.items():
                setattr(db_obj, field, value)
            
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error in update: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update record"
            )
    
    def delete(self, db: Session, id: int, user_id: Optional[int] = None) -> bool:
        """Delete a record by ID"""
        try:
            query = db.query(self.model).filter(self.model.id == id)
            if user_id and hasattr(self.model, 'user_id'):
                query = query.filter(self.model.user_id == user_id)
            
            obj = query.first()
            if not obj:
                return False
            
            db.delete(obj)
            db.commit()
            return True
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error in delete: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete record"
            )
    
    @abstractmethod
    def validate_business_rules(self, db: Session, obj_data: dict, user_id: int) -> bool:
        """Validate business-specific rules. Must be implemented by subclasses."""
        pass
    
    def safe_execute(self, db: Session, operation: callable, *args, **kwargs):
        """Execute database operations with proper error handling and transaction management"""
        try:
            result = operation(*args, **kwargs)
            db.commit()
            return result
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error in safe_execute: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed"
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error in safe_execute: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred"
            )


class FinancialService(BaseService[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Extended base service for financial operations with additional safeguards.
    
    Provides financial-specific business logic:
    - Amount validation
    - Transaction integrity
    - Account balance management with Decimal precision
    - Audit logging
    """
    
    def validate_amount(self, amount: float) -> bool:
        """Validate financial amount with Decimal precision support"""
        try:
            # Convert to Decimal for validation
            decimal_amount = Decimal(str(amount))
            
            if decimal_amount < 0:
                raise ValueError("Amount cannot be negative")
            if decimal_amount > Decimal('999999999.99999999'):  # Max supported value
                raise ValueError("Amount exceeds maximum allowed value")
                
            return True
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid amount: {str(e)}")
    
    def validate_account_ownership(self, db: Session, account_id: int, user_id: int) -> bool:
        """Validate that the account belongs to the user"""
        from app.models.financial_account import FinancialAccount
        account = db.query(FinancialAccount).filter(
            FinancialAccount.id == account_id,
            FinancialAccount.user_id == user_id
        ).first()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found or access denied"
            )
        return True
    
    def log_financial_operation(self, operation: str, user_id: int, details: dict):
        """Log financial operations for audit purposes"""
        logger.info(f"Financial operation: {operation}, User: {user_id}, Details: {details}")
    
    def safe_decimal_conversion(self, value, default=None) -> Decimal:
        """Safely convert value to Decimal"""
        if value is None:
            return Decimal(str(default)) if default is not None else Decimal('0')
        
        if isinstance(value, Decimal):
            return value
        
        try:
            return Decimal(str(value))
        except (ValueError, TypeError):
            if default is not None:
                return Decimal(str(default))
            raise ValueError(f"Cannot convert {value} to Decimal")


print("✅ Base service classes created for clean architecture")
print("✅ Business logic layer patterns established")
