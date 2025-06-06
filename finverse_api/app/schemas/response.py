"""
Standard response schemas for FinVerse API
"""

from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field, ConfigDict

T = TypeVar('T')


class StandardResponse(BaseModel):
    """Standard API response format"""
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Any] = None
    errors: Optional[List[Dict[str, Any]]] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated API response format"""
    count: int
    page: int = 1
    pages: int = 1
    size: int = 10
    items: List[T]
    next_page: Optional[int] = None
    previous_page: Optional[int] = None


class SuccessResponse(BaseModel):
    success: bool
    message: str
