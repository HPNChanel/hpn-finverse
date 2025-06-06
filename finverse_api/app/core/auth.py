"""
Authentication utilities for FastAPI
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from app.core.jwt_utils import verify_access_token, JWTError as JWTUtilsError
from app.db.session import get_db
from app.models.user import User

# Configure logging
logger = logging.getLogger(__name__)

# OAuth2 scheme for token extraction using the correct token endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# Define public endpoints that don't require authentication
PUBLIC_ENDPOINTS = [
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/password-reset",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/"
]

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """
    Validate access token and extract user ID (updated to use jwt_utils)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            logger.warning("Token missing subject claim")
            raise credentials_exception
        return int(user_id)
    except JWTUtilsError as e:
        logger.warning(f"Token validation error: {str(e)}")
        raise credentials_exception
    except ValueError as e:
        logger.warning(f"User ID conversion error: {str(e)}")
        raise credentials_exception

async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.warning(f"User with ID {user_id} not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure user is active
    """
    if not current_user.is_active:
        logger.warning(f"Inactive user attempted access: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user

# Add a function to check if an endpoint is public
def is_public_endpoint(path: str) -> bool:
    """Check if the requested endpoint is in the public endpoints list"""
    return any(path.startswith(endpoint) for endpoint in PUBLIC_ENDPOINTS)

# Custom dependency to conditionally apply authentication
async def conditional_auth_dependency(request: Request, db: Session = Depends(get_db)):
    """
    Apply authentication only for non-public endpoints
    """
    if is_public_endpoint(request.url.path):
        return None
    
    # For protected endpoints, get the current user
    return await get_current_user(db=db)
