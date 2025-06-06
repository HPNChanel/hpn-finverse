"""
Profile schemas for FinVerse API
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
import re


class ProfileUpdate(BaseModel):
    """Schema for profile update"""
    name: Optional[str] = Field(None, max_length=255)


class ProfileOut(BaseModel):
    """Schema for profile response"""
    id: int
    email: str
    name: Optional[str] = None
    created_at: datetime

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        """Validate email format"""
        if not v:
            raise ValueError('Email is required')
        
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        
        return v.lower().strip()

    model_config = ConfigDict(from_attributes=True)
