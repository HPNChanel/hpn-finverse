"""
JWT utilities for secure token management
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from jose import jwt, JWTError
import logging

# Configure logging
logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = "DOQTZuoVXFAiSemiHm70Ykl0qWG5FWSxRVk13rMb2ds="
REFRESH_SECRET_KEY = "eSO2y6xPdwGj0HDnec0Twp7UpUq5A40pO-B1KO8bY8M="
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

class JWTError(Exception):
    """Custom JWT exception"""
    pass

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with specified expiration
    
    Args:
        data: Payload data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
        
    Raises:
        JWTError: If token creation fails
    """
    try:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({
            "exp": expire,
            "type": "access",
            "iat": datetime.utcnow()
        })
        
        # Use SECRET_KEY for access tokens, not REFRESH_SECRET_KEY
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logger.debug(f"Access token created with expiry: {expire}")
        return encoded_jwt
        
    except Exception as e:
        logger.error(f"Error creating access token: {str(e)}")
        raise JWTError(f"Could not create access token: {str(e)}")

def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token with longer expiration
    
    Args:
        data: Payload data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT refresh token string
        
    Raises:
        JWTError: If token creation fails
    """
    try:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        to_encode.update({
            "exp": expire,
            "type": "refresh",
            "iat": datetime.utcnow()
        })
        
        encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
        logger.debug(f"Refresh token created with expiry: {expire}")
        return encoded_jwt
        
    except Exception as e:
        logger.error(f"Error creating refresh token: {str(e)}")
        raise JWTError(f"Could not create refresh token: {str(e)}")

def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode an access token
    
    Args:
        token: JWT token string to verify
        
    Returns:
        Decoded token payload
        
    Raises:
        JWTError: If token is invalid, expired, or malformed
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify token type
        if payload.get("type") != "access":
            raise JWTError("Invalid token type")
            
        logger.debug("Access token verified successfully")
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.warning("Access token has expired")
        raise JWTError("Token has expired")
    except jwt.JWTError as e:
        logger.warning(f"Invalid access token: {str(e)}")
        raise JWTError(f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error verifying access token: {str(e)}")
        raise JWTError(f"Could not verify token: {str(e)}")

def verify_refresh_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a refresh token
    
    Args:
        token: JWT refresh token string to verify
        
    Returns:
        Decoded token payload
        
    Raises:
        JWTError: If token is invalid, expired, or malformed
    """
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify token type
        if payload.get("type") != "refresh":
            raise JWTError("Invalid token type")
            
        logger.debug("Refresh token verified successfully")
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.warning("Refresh token has expired")
        raise JWTError("Refresh token has expired")
    except jwt.JWTError as e:
        logger.warning(f"Invalid refresh token: {str(e)}")
        raise JWTError(f"Invalid refresh token: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error verifying refresh token: {str(e)}")
        raise JWTError(f"Could not verify refresh token: {str(e)}")

def extract_user_id(token: str) -> Optional[int]:
    """
    Extract user ID from token without full verification (for middleware)
    
    Args:
        token: JWT token string
        
    Returns:
        User ID if found, None otherwise
    """
    try:
        # Decode without verification for quick extraction
        unverified_payload = jwt.get_unverified_claims(token)
        user_id = unverified_payload.get("sub")
        return int(user_id) if user_id else None
    except Exception:
        return None

def is_token_expired(token: str) -> bool:
    """
    Check if token is expired without raising exceptions
    
    Args:
        token: JWT token string
        
    Returns:
        True if expired, False otherwise
    """
    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return False
    except jwt.ExpiredSignatureError:
        return True
    except Exception:
        return True

# Convenience functions for common use cases
def create_user_tokens(user_id: int) -> Dict[str, str]:
    """
    Create both access and refresh tokens for a user
    
    Args:
        user_id: User ID to encode in tokens
        
    Returns:
        Dictionary with access_token and refresh_token
    """
    # Ensure user_id is properly formatted as string in 'sub' claim
    data = {"sub": str(user_id)}
    
    return {
        "access_token": create_access_token(data),
        "refresh_token": create_refresh_token(data)
    }

def get_token_expiry_info() -> Dict[str, int]:
    """
    Get token expiry configuration
    
    Returns:
        Dictionary with expiry times in seconds
    """
    return {
        "access_token_expire_seconds": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "refresh_token_expire_seconds": REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    }
