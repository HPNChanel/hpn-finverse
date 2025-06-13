"""
Common dependencies for FinVerse API endpoints
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.core.auth import get_current_user as auth_get_current_user
from app.db.session import get_db as session_get_db
from app.models.user import User

# Configure logging
logger = logging.getLogger(__name__)

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def get_db():
    """
    Database dependency - yields database session
    """
    yield from session_get_db()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user dependency
    """
    return await auth_get_current_user(db=db, token=token)


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get current active user dependency
    """
    if not current_user.is_active:
        logger.warning(f"Inactive user attempted access: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return current_user


def get_current_user_id(current_user: User = Depends(get_current_user)) -> int:
    """
    Extract user ID from current user dependency
    """
    return current_user.id


# Pagination dependencies
def get_pagination_params(
    page: int = 1,
    size: int = 20,
    max_size: int = 100
) -> dict:
    """
    Get pagination parameters with validation
    """
    if page < 1:
        page = 1
    if size < 1:
        size = 20
    if size > max_size:
        size = max_size
    
    offset = (page - 1) * size
    
    return {
        "page": page,
        "size": size,
        "offset": offset,
        "limit": size
    }


# Optional query parameters
def get_optional_filters(
    category_id: Optional[int] = None,
    account_id: Optional[int] = None,
    transaction_type: Optional[int] = None,
    is_active: Optional[bool] = None
) -> dict:
    """
    Get optional filter parameters
    """
    filters = {}
    if category_id is not None:
        filters["category_id"] = category_id
    if account_id is not None:
        filters["account_id"] = account_id
    if transaction_type is not None:
        filters["transaction_type"] = transaction_type
    if is_active is not None:
        filters["is_active"] = is_active
    
    return filters


# Common validation dependencies
def validate_positive_amount(amount: float) -> float:
    """
    Validate that amount is positive
    """
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    return amount


def validate_user_ownership(
    resource_user_id: int,
    current_user: User = Depends(get_current_user)
) -> bool:
    """
    Validate that the current user owns the resource
    """
    if resource_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this resource"
        )
    return True
