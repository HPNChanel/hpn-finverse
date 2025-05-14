"""
Authentication schemas for FinVerse API
"""

from pydantic import BaseModel, Field, validator
import re
from typing import Optional


class Token(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for token data"""
    user_id: Optional[int] = None


class RegisterRequest(BaseModel):
    """Schema for user registration"""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)  # Reduced from 8 to match frontend validation
    name: str = Field(..., min_length=1, max_length=100)
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must be alphanumeric')
        return v
    
    @validator('password')
    def password_strength(cls, v):
        # Simple validation to match frontend
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


class RegisterResponse(BaseModel):
    """Schema for registration response"""
    message: str


class LoginRequest(BaseModel):
    """Schema for login request"""
    username: str
    password: str


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    username: str
    name: Optional[str] = None
    is_active: bool = True
    
    class Config:
        orm_mode = True
