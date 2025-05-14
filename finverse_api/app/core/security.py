"""
Security utilities for authentication and authorization
"""

from datetime import datetime, timedelta
from typing import Any, Optional, Union
import jwt  # PyJWT package is imported as 'jwt'
from passlib.context import CryptContext
from app.config import AUTH_TOKEN_EXPIRY
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = "31e76f89deb80fbbc6d6c365bf183e895b8a4bb7ecbfdeacae66da21d805b319"  # In production use environment variable
ALGORITHM = "HS256"

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
    Create a JWT access token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=AUTH_TOKEN_EXPIRY)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating access token: {str(e)}")
        raise RuntimeError(f"Could not create access token: {str(e)}")

def decode_access_token(token: str) -> dict:
    """
    Decode a JWT access token
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise jwt.ExpiredSignatureError("Token has expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {str(e)}")
        raise jwt.InvalidTokenError(f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error decoding token: {str(e)}")
        raise RuntimeError(f"Could not decode token: {str(e)}")
