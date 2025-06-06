"""
User schemas for FinVerse API
"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re

class UserBase(BaseModel):
    """Base schema for user - email-based authentication"""
    email: str = Field(..., description="Email address (unique identifier)")
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Full name")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        # Basic email validation - replaces username validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()

class UserCreate(UserBase):
    """Schema for creating a user"""
    password: str = Field(..., min_length=8, description="Password")
    
    @field_validator('password')
    @classmethod
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
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()

class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(..., description="Token type")

class UserOut(UserBase):
    """Schema for user response"""
    id: int = Field(..., description="User ID")
    
    model_config = ConfigDict(from_attributes=True)

class ChangePasswordRequest(BaseModel):
    """Schema for changing password"""
    old_password: str = Field(..., description="Old password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        return v