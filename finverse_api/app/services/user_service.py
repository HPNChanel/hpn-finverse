"""
User service for FinVerse API
"""

import uuid
from sqlalchemy.orm import Session
from app.models.user import User
from typing import Optional


def register_user(db: Session, username: str, password: str, name: Optional[str] = None):
    """Register a new user"""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        return None
    
    # Create new user
    new_user = User(username=username, password=password, name=name)
    
    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


def authenticate_user(db: Session, username: str, password: str):
    """Authenticate user and return user if valid"""
    user = db.query(User).filter(User.username == username, User.password == password).first()
    return user


def create_access_token(user_id: int):
    """Create a dummy access token"""
    # In a real app, this would create a JWT with proper payload and signing
    return f"{user_id}_{uuid.uuid4()}"


def get_user_by_id(db: Session, user_id: int):
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def update_user(db: Session, user_id: int, name: Optional[str] = None):
    """Update user information"""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    if name is not None:
        user.name = name
    
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user_id: int, old_password: str, new_password: str):
    """Change user password with verification"""
    # Get user by ID
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    # Verify old password matches
    if user.password != old_password:  # In a real app, use secure password comparison
        return False
    
    # Update with new password
    user.password = new_password  # In a real app, hash this password
    db.commit()
    db.refresh(user)
    return True