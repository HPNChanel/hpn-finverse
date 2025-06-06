"""
Category schemas for FinVerse API
"""

from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


class CategoryBase(BaseModel):
    """Base schema for category data"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field("📂", max_length=50)
    color: Optional[str] = Field("#6B7280", pattern=r"^#[0-9A-Fa-f]{6}$")
    type: str = Field("both", pattern=r"^(income|expense|both)$")
    parent_id: Optional[int] = None


class CategoryCreate(CategoryBase):
    """Schema for creating a category"""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    type: Optional[str] = Field(None, pattern=r"^(income|expense|both)$")
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    """Schema for category response"""
    id: int
    user_id: int
    is_system: bool
    is_active: bool
    created_at: str  # Changed to string
    updated_at: Optional[str] = None  # Changed to string
    children_count: Optional[int] = 0
    
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


class CategoryHierarchy(CategoryResponse):
    """Schema for hierarchical category response"""
    children: List[CategoryHierarchy] = []
    
    model_config = ConfigDict(from_attributes=True)


class CategoryList(BaseModel):
    """Schema for list of categories"""
    categories: List[CategoryResponse]
    
    model_config = ConfigDict(from_attributes=True)
