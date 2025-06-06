"""
Authentication schemas for FinVerse API
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime
import re


class UserPublic(BaseModel):
    """Public user information for login response"""
    id: int
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: str  # Changed to string for consistent serialization
    
    @field_validator('created_at', mode='before')
    @classmethod
    def validate_created_at(cls, v):
        """Convert datetime to ISO string"""
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )


class Token(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None


class TokenData(BaseModel):
    """Schema for token data"""
    user_id: Optional[int] = None


class RegisterRequest(BaseModel):
    """Schema for user registration"""
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=6, description="Password")
    name: str = Field(..., min_length=1, max_length=100, description="Full name")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


class RegisterResponse(BaseModel):
    """Schema for registration response"""
    message: str


class LoginRequest(BaseModel):
    """Schema for login request"""
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        # More lenient email validation for login
        if '@' not in v or '.' not in v:
            raise ValueError('Invalid email format')
        return v.lower().strip()


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: str  # Changed to string
    updated_at: Optional[str] = None  # Changed to string
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def validate_datetime_fields(cls, v):
        """Convert datetime to ISO string"""
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str = Field(..., description="Refresh token")


class RefreshTokenResponse(BaseModel):
    """Schema for refresh token response"""
    access_token: str
    token_type: str
    expires_in: Optional[int] = None


class LoginResponse(BaseModel):
    """Enhanced login response with user information"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes
    user: UserPublic
    
    model_config = ConfigDict(from_attributes=True)
