"""
User service for FinVerse API - Clean Architecture Implementation
"""

import uuid
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
import logging

from app.models.user import User
from app.core.security import get_password_hash, verify_password
from app.services.base_service import BaseService
from app.schemas.user import UserCreate, UserOut

logger = logging.getLogger(__name__)


class UserService(BaseService[User, UserCreate, UserOut]):
    """
    User Service - Clean Architecture Implementation
    
    Implements business logic for user management:
    - User registration and authentication
    - Password management
    - Profile updates
    - Account management
    """
    
    def __init__(self):
        super().__init__(User)
    
    def validate_business_rules(self, db: Session, obj_data: dict, user_id: int) -> bool:
        """Validate user-specific business rules"""
        # Validate email uniqueness if email is being updated
        if 'email' in obj_data:
            existing_user = db.query(User).filter(
                User.email == obj_data['email'],
                User.id != user_id  # Exclude current user
            ).first()
            if existing_user:
                raise ValueError("Email already exists")
        
        return True
    
    def register_user(self, db: Session, email: str, password: str, name: Optional[str] = None) -> Optional[User]:
        """Register a new user with proper password hashing"""
        try:
            # Check if email already exists
            existing_user = db.query(User).filter(User.email == email.lower()).first()
            if existing_user:
                return None
            
            # Hash the password properly
            hashed_password = get_password_hash(password)
            
            # Create new user with hashed password
            new_user = User(
                email=email.lower(),
                hashed_password=hashed_password,
                name=name,
                is_active=True
            )
            
            # Save to database
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            logger.info(f"User registered successfully: {email}")
            return new_user
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error during user registration: {str(e)}")
            raise Exception("Failed to register user")
        except Exception as e:
            db.rollback()
            logger.error(f"Error registering user: {str(e)}")
            raise Exception("Registration failed")
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user and return user if valid"""
        try:
            user = db.query(User).filter(User.email == email.lower()).first()
            if not user:
                logger.warning(f"Authentication failed: user not found for email {email}")
                return None
            
            # Use proper password verification
            if not verify_password(password, user.hashed_password):
                logger.warning(f"Authentication failed: invalid password for email {email}")
                return None
            
            if not user.is_active:
                logger.warning(f"Authentication failed: inactive user {email}")
                return None
            
            logger.info(f"User authenticated successfully: {email}")
            return user
            
        except SQLAlchemyError as e:
            logger.error(f"Database error during authentication: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error during authentication: {str(e)}")
            return None
    
    def create_access_token(self, user_id: int) -> str:
        """Create a dummy access token"""
        # In a real app, this would create a JWT with proper payload and signing
        return f"{user_id}_{uuid.uuid4()}"
    
    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        try:
            return db.query(User).filter(User.id == user_id).first()
        except SQLAlchemyError as e:
            logger.error(f"Database error getting user by ID {user_id}: {str(e)}")
            return None
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        try:
            return db.query(User).filter(User.email == email.lower()).first()
        except SQLAlchemyError as e:
            logger.error(f"Database error getting user by email {email}: {str(e)}")
            return None
    
    def update_user(
        self, 
        db: Session, 
        user_id: int, 
        name: Optional[str] = None, 
        avatar_url: Optional[str] = None
    ) -> Optional[User]:
        """Update user information"""
        try:
            user = self.get_user_by_id(db, user_id)
            if not user:
                return None
            
            # Update fields if provided
            if name is not None:
                user.name = name.strip() if name.strip() else user.name
                
            if avatar_url is not None:
                user.avatar_url = avatar_url
            
            db.commit()
            db.refresh(user)
            
            logger.info(f"User updated successfully: {user_id}")
            return user
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error updating user {user_id}: {str(e)}")
            raise Exception("Failed to update user")
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating user {user_id}: {str(e)}")
            raise Exception("Update failed")
    
    def change_password(
        self, 
        db: Session, 
        user_id: int, 
        old_password: str, 
        new_password: str
    ) -> Optional[bool]:
        """Change user password with verification and proper hashing"""
        try:
            # Get user by ID
            user = self.get_user_by_id(db, user_id)
            if not user:
                return None
            
            # Verify old password matches using proper verification
            if not verify_password(old_password, user.hashed_password):
                logger.warning(f"Password change failed: incorrect old password for user {user_id}")
                return False
            
            # Update with new hashed password
            user.hashed_password = get_password_hash(new_password)
            db.commit()
            db.refresh(user)
            
            logger.info(f"Password changed successfully for user {user_id}")
            return True
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error changing password for user {user_id}: {str(e)}")
            raise Exception("Failed to change password")
        except Exception as e:
            db.rollback()
            logger.error(f"Error changing password for user {user_id}: {str(e)}")
            raise Exception("Password change failed")
    
    def deactivate_user(self, db: Session, user_id: int) -> bool:
        """Deactivate a user account"""
        try:
            user = self.get_user_by_id(db, user_id)
            if not user:
                return False
            
            user.is_active = False
            db.commit()
            
            logger.info(f"User deactivated: {user_id}")
            return True
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error deactivating user {user_id}: {str(e)}")
            raise Exception("Failed to deactivate user")
    
    def activate_user(self, db: Session, user_id: int) -> bool:
        """Activate a user account"""
        try:
            user = self.get_user_by_id(db, user_id)
            if not user:
                return False
            
            user.is_active = True
            db.commit()
            
            logger.info(f"User activated: {user_id}")
            return True
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error activating user {user_id}: {str(e)}")
            raise Exception("Failed to activate user")


# Create singleton instance for dependency injection
user_service_instance = UserService()

# Legacy function exports for backward compatibility
def register_user(db: Session, email: str, password: str, name: Optional[str] = None):
    return user_service_instance.register_user(db, email, password, name)

def authenticate_user(db: Session, email: str, password: str):
    return user_service_instance.authenticate_user(db, email, password)

def create_access_token(user_id: int):
    return user_service_instance.create_access_token(user_id)

def get_user_by_id(db: Session, user_id: int):
    return user_service_instance.get_user_by_id(db, user_id)

def get_user_by_email(db: Session, email: str):
    return user_service_instance.get_user_by_email(db, email)

def update_user(db: Session, user_id: int, name: Optional[str] = None, avatar_url: Optional[str] = None):
    return user_service_instance.update_user(db, user_id, name, avatar_url)

def change_password(db: Session, user_id: int, old_password: str, new_password: str):
    return user_service_instance.change_password(db, user_id, old_password, new_password)

def deactivate_user(db: Session, user_id: int):
    return user_service_instance.deactivate_user(db, user_id)

def activate_user(db: Session, user_id: int):
    return user_service_instance.activate_user(db, user_id)

# Export all functions for backward compatibility
__all__ = [
    "UserService",
    "user_service_instance",
    "register_user",
    "authenticate_user",
    "create_access_token",
    "get_user_by_id",
    "get_user_by_email",
    "update_user",
    "change_password",
    "deactivate_user",
    "activate_user"
]

print("✅ UserService class created with clean architecture")
print("✅ Legacy function compatibility maintained")