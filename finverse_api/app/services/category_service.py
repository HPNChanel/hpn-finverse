"""
Category service for FinVerse API
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from fastapi import HTTPException, status

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryHierarchy


class CategoryService:
    """Service for category operations"""
    
    @staticmethod
    def get_user_categories(
        db: Session, 
        user_id: int, 
        parent_id: Optional[int] = None,
        include_children: bool = True
    ) -> List[CategoryResponse]:
        """Get all categories for a user"""
        query = db.query(Category).filter(
            and_(
                Category.user_id == user_id,
                Category.is_active == True
            )
        )
        
        if parent_id is not None:
            query = query.filter(Category.parent_id == parent_id)
        
        categories = query.all()
        
        category_responses = []
        for category in categories:
            children_count = 0
            if include_children:
                children_count = db.query(Category).filter(
                    and_(
                        Category.parent_id == category.id,
                        Category.is_active == True
                    )
                ).count()
            
            category_dict = category.to_dict()
            category_dict['children_count'] = children_count
            category_responses.append(CategoryResponse(**category_dict))
        
        return category_responses
    
    @staticmethod
    def get_categories_hierarchy(db: Session, user_id: int) -> List[CategoryHierarchy]:
        """Get categories in hierarchical structure"""
        # Get all root categories (no parent)
        root_categories = db.query(Category).filter(
            and_(
                Category.user_id == user_id,
                Category.parent_id.is_(None),
                Category.is_active == True
            )
        ).all()
        
        def build_hierarchy(category):
            children = db.query(Category).filter(
                and_(
                    Category.parent_id == category.id,
                    Category.is_active == True
                )
            ).all()
            
            category_dict = category.to_dict()
            category_dict['children_count'] = len(children)
            category_dict['children'] = [build_hierarchy(child) for child in children]
            
            return CategoryHierarchy(**category_dict)
        
        return [build_hierarchy(category) for category in root_categories]
    
    @staticmethod
    def get_category(db: Session, category_id: int, user_id: int) -> Optional[CategoryResponse]:
        """Get a specific category"""
        category = db.query(Category).filter(
            and_(
                Category.id == category_id,
                Category.user_id == user_id,
                Category.is_active == True
            )
        ).first()
        
        if not category:
            return None
        
        children_count = db.query(Category).filter(
            and_(
                Category.parent_id == category_id,
                Category.is_active == True
            )
        ).count()
        
        category_dict = category.to_dict()
        category_dict['children_count'] = children_count
        return CategoryResponse(**category_dict)
    
    @staticmethod
    def create_category(db: Session, category_data: CategoryCreate, user_id: int) -> CategoryResponse:
        """Create a new category"""
        # Validate parent category if provided
        if category_data.parent_id:
            parent = db.query(Category).filter(
                and_(
                    Category.id == category_data.parent_id,
                    Category.user_id == user_id,
                    Category.is_active == True
                )
            ).first()
            if not parent:
                raise ValueError("Parent category not found")
        
        # Check for duplicate names at the same level
        existing = db.query(Category).filter(
            and_(
                Category.user_id == user_id,
                Category.name == category_data.name,
                Category.parent_id == category_data.parent_id,
                Category.is_active == True
            )
        ).first()
        
        if existing:
            raise ValueError("Category with this name already exists at this level")
        
        # Create category
        db_category = Category(
            user_id=user_id,
            parent_id=category_data.parent_id,
            name=category_data.name,
            description=category_data.description,
            icon=category_data.icon,
            color=category_data.color,
            type=category_data.type
        )
        
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        
        category_dict = db_category.to_dict()
        category_dict['children_count'] = 0
        return CategoryResponse(**category_dict)
    
    @staticmethod
    def update_category(
        db: Session, 
        category_id: int, 
        category_data: CategoryUpdate, 
        user_id: int
    ) -> Optional[CategoryResponse]:
        """Update an existing category"""
        category = db.query(Category).filter(
            and_(
                Category.id == category_id,
                Category.user_id == user_id,
                Category.is_active == True
            )
        ).first()
        
        if not category:
            return None
        
        # Validate parent category if being changed
        if category_data.parent_id is not None and category_data.parent_id != category.parent_id:
            if category_data.parent_id == category_id:
                raise ValueError("Category cannot be its own parent")
                
            # Check for circular reference
            if CategoryService._would_create_cycle(db, category_id, category_data.parent_id):
                raise ValueError("This would create a circular reference")
                
            if category_data.parent_id:
                parent = db.query(Category).filter(
                    and_(
                        Category.id == category_data.parent_id,
                        Category.user_id == user_id,
                        Category.is_active == True
                    )
                ).first()
                if not parent:
                    raise ValueError("Parent category not found")
        
        # Update fields
        update_data = category_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)
        
        db.commit()
        db.refresh(category)
        
        children_count = db.query(Category).filter(
            and_(
                Category.parent_id == category_id,
                Category.is_active == True
            )
        ).count()
        
        category_dict = category.to_dict()
        category_dict['children_count'] = children_count
        return CategoryResponse(**category_dict)
    
    @staticmethod
    def delete_category(db: Session, category_id: int, user_id: int) -> bool:
        """Delete a category (soft delete)"""
        category = db.query(Category).filter(
            and_(
                Category.id == category_id,
                Category.user_id == user_id,
                Category.is_active == True
            )
        ).first()
        
        if not category:
            return False
        
        # Check if category has children
        children_count = db.query(Category).filter(
            and_(
                Category.parent_id == category_id,
                Category.is_active == True
            )
        ).count()
        
        if children_count > 0:
            raise ValueError("Cannot delete category with active children")
        
        # Check if category is used in transactions
        # This would need to be implemented based on your transaction model
        
        # Soft delete
        category.is_active = False
        db.commit()
        
        return True
    
    @staticmethod
    def _would_create_cycle(db: Session, category_id: int, new_parent_id: int) -> bool:
        """Check if setting new_parent_id would create a circular reference"""
        current_id = new_parent_id
        while current_id:
            if current_id == category_id:
                return True
            parent = db.query(Category).filter(Category.id == current_id).first()
            current_id = parent.parent_id if parent else None
        return False
    
    @staticmethod
    def create_default_categories(db: Session, user_id: int) -> List[CategoryResponse]:
        """Create default categories for a new user"""
        default_categories = [
            # Income categories
            {"name": "💰 Income", "icon": "💰", "color": "#10B981", "type": "income", "children": [
                {"name": "Salary", "icon": "💼", "color": "#059669", "type": "income"},
                {"name": "Freelance", "icon": "💻", "color": "#059669", "type": "income"},
                {"name": "Investment", "icon": "📈", "color": "#059669", "type": "income"},
                {"name": "Other Income", "icon": "💵", "color": "#059669", "type": "income"},
            ]},
            # Expense categories
            {"name": "🏠 Housing", "icon": "🏠", "color": "#EF4444", "type": "expense", "children": [
                {"name": "Rent/Mortgage", "icon": "🏘️", "color": "#DC2626", "type": "expense"},
                {"name": "Utilities", "icon": "⚡", "color": "#DC2626", "type": "expense"},
                {"name": "Maintenance", "icon": "🔧", "color": "#DC2626", "type": "expense"},
            ]},
            {"name": "🍽️ Food & Dining", "icon": "🍽️", "color": "#F59E0B", "type": "expense", "children": [
                {"name": "Groceries", "icon": "🛒", "color": "#D97706", "type": "expense"},
                {"name": "Restaurants", "icon": "🍴", "color": "#D97706", "type": "expense"},
                {"name": "Coffee & Snacks", "icon": "☕", "color": "#D97706", "type": "expense"},
            ]},
            {"name": "🚗 Transportation", "icon": "🚗", "color": "#8B5CF6", "type": "expense", "children": [
                {"name": "Gas", "icon": "⛽", "color": "#7C3AED", "type": "expense"},
                {"name": "Public Transit", "icon": "🚌", "color": "#7C3AED", "type": "expense"},
                {"name": "Car Maintenance", "icon": "🔧", "color": "#7C3AED", "type": "expense"},
            ]},
            {"name": "🎯 Entertainment", "icon": "🎯", "color": "#EC4899", "type": "expense", "children": [
                {"name": "Movies & Shows", "icon": "🎬", "color": "#DB2777", "type": "expense"},
                {"name": "Games", "icon": "🎮", "color": "#DB2777", "type": "expense"},
                {"name": "Sports", "icon": "⚽", "color": "#DB2777", "type": "expense"},
            ]},
        ]
        
        created_categories = []
        
        for cat_data in default_categories:
            # Create parent category
            parent_category = Category(
                user_id=user_id,
                name=cat_data["name"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                type=cat_data["type"],
                is_system=True
            )
            db.add(parent_category)
            db.flush()  # Get the ID
            
            parent_dict = parent_category.to_dict()
            parent_dict['children_count'] = len(cat_data.get("children", []))
            created_categories.append(CategoryResponse(**parent_dict))
            
            # Create child categories
            for child_data in cat_data.get("children", []):
                child_category = Category(
                    user_id=user_id,
                    parent_id=parent_category.id,
                    name=child_data["name"],
                    icon=child_data["icon"],
                    color=child_data["color"],
                    type=child_data["type"],
                    is_system=True
                )
                db.add(child_category)
                db.flush()
                
                child_dict = child_category.to_dict()
                child_dict['children_count'] = 0
                created_categories.append(CategoryResponse(**child_dict))
        
        db.commit()
        return created_categories
