"""
User schemas for FinVerse API
"""

from typing import Optional
from pydantic import BaseModel, Field, validator
import re

class UserBase(BaseModel):
    """Base schema for user"""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Full name")

class UserCreate(UserBase):
    """Schema for creating a user"""
    password: str = Field(..., min_length=8, description="Password")
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must be alphanumeric')
        return v
    
    @validator('password')
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        return v

class UserLogin(BaseModel):
    """Schema for user login"""
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")

class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(..., description="Token type")

class UserOut(UserBase):
    """Schema for user response"""
    id: int = Field(..., description="User ID")
    
    class Config:
        orm_mode = True

class ChangePasswordRequest(BaseModel):
    """Schema for changing password"""
    old_password: str = Field(..., description="Old password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator('new_password')
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        return v