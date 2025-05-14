"""
Profile router for FinVerse API
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from sqlalchemy.orm import Session

from app.schemas.profile import ProfileOut, ProfileUpdate
from app.schemas.user import ChangePasswordRequest
from app.services import user_service
from app.db.session import get_db
from app.core.auth import get_current_user, get_current_user_id

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


@router.get("", response_model=ProfileOut)
async def get_profile_root(
    current_user = Depends(get_current_user),
):
    """Get current user profile (root endpoint)"""
    return current_user


@router.get("/me", response_model=ProfileOut)
async def get_profile(
    current_user = Depends(get_current_user),
):
    """Get current user profile"""
    return current_user


@router.patch("/update", response_model=ProfileOut)
async def update_profile(
    profile_data: ProfileUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    # Update user
    user = user_service.update_user(
        db=db, 
        user_id=user_id, 
        name=profile_data.name
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.patch("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: ChangePasswordRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Change password
    result = user_service.change_password(
        db=db,
        user_id=user_id,
        old_password=password_data.old_password,
        new_password=password_data.new_password
    )
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if result is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    return {"message": "Password changed successfully"}
