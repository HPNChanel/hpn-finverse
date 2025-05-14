"""
Authentication utilities for FinVerse API
"""

from fastapi import Depends, HTTPException, Header, status
from typing import Optional
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import user_service

def get_user_id_from_token(token: str) -> int:
    """Extract user_id from token (simplified)"""
    try:
        # In a real app, this would verify the token
        # Here we just extract the user_id part
        user_id = int(token.split("_")[0])
        return user_id
    except:
        return None

async def get_current_user_id(
    authorization: Optional[str] = Header(None)
) -> int:
    """Get current user ID from authorization header"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Extract token from authorization header
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return user_id

async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get current user from database"""
    user = user_service.get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user"
        )
    return user
