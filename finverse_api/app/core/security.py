"""
Security utilities for authentication and authorization
"""

from datetime import datetime, timedelta
from typing import Any, Optional, Union
import jwt  # PyJWT package is imported as 'jwt'
from passlib.context import CryptContext
from app.config import AUTH_TOKEN_EXPIRY
from app.core.jwt_utils import (
    create_access_token as jwt_create_access_token,
    create_refresh_token as jwt_create_refresh_token,
    verify_access_token,
    verify_refresh_token,
    JWTError as JWTUtilsError
)
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """
    Hash a password for storage
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token (updated to use jwt_utils)
    """
    try:
        data = {"sub": str(subject)}
        return jwt_create_access_token(data, expires_delta)
    except JWTUtilsError as e:
        logger.error(f"Error creating access token: {str(e)}")
        raise RuntimeError(f"Could not create access token: {str(e)}")

def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token (updated to use jwt_utils)
    """
    try:
        data = {"sub": str(subject)}
        return jwt_create_refresh_token(data, expires_delta)
    except JWTUtilsError as e:
        logger.error(f"Error creating refresh token: {str(e)}")
        raise RuntimeError(f"Could not create refresh token: {str(e)}")

def decode_access_token(token: str) -> dict:
    """
    Decode a JWT access token (updated to use jwt_utils)
    """
    try:
        return verify_access_token(token)
    except JWTUtilsError as e:
        if "expired" in str(e).lower():
            raise jwt.ExpiredSignatureError(str(e))
        else:
            raise jwt.InvalidTokenError(str(e))

def decode_refresh_token(token: str) -> dict:
    """
    Decode a JWT refresh token (updated to use jwt_utils)
    """
    try:
        return verify_refresh_token(token)
    except JWTUtilsError as e:
        if "expired" in str(e).lower():
            raise jwt.ExpiredSignatureError(str(e))
        else:
            raise jwt.InvalidTokenError(str(e))


def hash_password(password: str) -> str:
    """
    Hash a password for storage (alias for get_password_hash for compatibility)
    """
    return get_password_hash(password)


def verify_user_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash (alias for verify_password for compatibility)
    """
    return verify_password(plain_password, hashed_password)
