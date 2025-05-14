"""
Profile schemas for FinVerse API
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProfileUpdate(BaseModel):
    """Schema for profile update"""
    name: Optional[str] = Field(None, max_length=255)


class ProfileOut(BaseModel):
    """Schema for profile response"""
    id: int
    username: str
    name: Optional[str] = None
    created_at: datetime

    class Config:
        """Pydantic configuration"""
        orm_mode = True
