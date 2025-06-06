"""
Category router for FinVerse API - Clean Architecture (Singular naming)
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate, CategoryUpdate, CategoryResponse, 
    CategoryList, CategoryHierarchy
)
from app.core.auth import get_current_user
from app.services.category_service import CategoryService

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

@router.get("/", response_model=CategoryList)
async def get_categories(
    parent_id: Optional[int] = None,
    include_children: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all categories for the current user"""
    categories = CategoryService.get_user_categories(
        db=db, 
        user_id=current_user.id,
        parent_id=parent_id,
        include_children=include_children
    )
    return {"categories": categories}

@router.get("/hierarchy", response_model=List[CategoryHierarchy])
async def get_categories_hierarchy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get categories in hierarchical structure"""
    hierarchy = CategoryService.get_categories_hierarchy(db=db, user_id=current_user.id)
    return hierarchy

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific category"""
    category = CategoryService.get_category(db=db, category_id=category_id, user_id=current_user.id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new category"""
    try:
        category = CategoryService.create_category(
            db=db,
            category_data=category_data,
            user_id=current_user.id
        )
        return category
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing category"""
    try:
        category = CategoryService.update_category(
            db=db,
            category_id=category_id,
            category_data=category_data,
            user_id=current_user.id
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        return category
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a category"""
    success = CategoryService.delete_category(
        db=db,
        category_id=category_id,
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return {"message": "Category deleted successfully"}

@router.post("/bulk", response_model=CategoryList, status_code=status.HTTP_201_CREATED)
async def create_default_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create default categories for the user"""
    categories = CategoryService.create_default_categories(db=db, user_id=current_user.id)
    return {"categories": categories}
