"""
Users router for FinVerse API
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any

from app.db.session import get_db
from app.models.user import User
from app.core.auth import get_current_user
from app.schemas.auth import UserResponse

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user profile information.
    """
    return current_user
