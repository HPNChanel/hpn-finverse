"""
User router for FinVerse API - Clean Architecture (Singular naming)
"""

from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile
from sqlalchemy.orm import Session
from typing import Any, Optional
import os
import uuid
from pathlib import Path

from app.schemas.auth import UserResponse
from app.schemas.profile import ProfileUpdate
from app.schemas.user import ChangePasswordRequest
from app.services.user_service import user_service_instance  # Use singleton instance
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User

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
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        "avatar_url": getattr(current_user, 'avatar_url', None)
    }


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update user profile information.
    """
    updated_user = user_service_instance.update_user(
        db=db,
        user_id=current_user.id,
        name=profile_data.name
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": updated_user.id,
        "email": updated_user.email,
        "name": updated_user.name,
        "is_active": updated_user.is_active,
        "created_at": updated_user.created_at,
        "updated_at": updated_user.updated_at,
        "avatar_url": getattr(updated_user, 'avatar_url', None)
    }


@router.put("/me/password")
async def change_user_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Change user password.
    """
    result = user_service_instance.change_password(
        db=db,
        user_id=current_user.id,
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
            detail="Incorrect current password"
        )
    
    return {"message": "Password updated successfully"}


@router.put("/me/avatar", response_model=UserResponse)
async def update_user_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    avatar: UploadFile = File(...)
) -> Any:
    """
    Update user avatar.
    """
    # Validate file type
    if not avatar.content_type or not avatar.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Validate file size (max 5MB)
    if avatar.size and avatar.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )
    
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/avatars")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = Path(avatar.filename or "").suffix
        filename = f"{current_user.id}_{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await avatar.read()
            buffer.write(content)
        
        # Update user avatar URL in database
        avatar_url = f"/uploads/avatars/{filename}"
        
        # Note: You'll need to add avatar_url field to User model
        # For now, we'll just return the current user data
        
        return {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at,
            "updated_at": current_user.updated_at,
            "avatar_url": avatar_url
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )
