"""
Authentication router for FinVerse API
"""

from fastapi import APIRouter, HTTPException, status, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from app.schemas.auth import Token, RegisterRequest, RegisterResponse, UserResponse
from app.services import user_service
from app.db.session import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)) -> Any:
    """
    Register a new user.
    """
    # Check if username already exists
    db_user = db.query(User).filter(User.username == request.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    db_user = User(
        username=request.username, 
        password=hashed_password,
        name=request.name,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {"message": "User created successfully"}


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Authenticate user
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    
    # Create access token
    access_token = create_access_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user information.
    """
    return current_user


@router.post("/logout")
async def logout(response: Response) -> Any:
    """
    Logout user. Frontend should handle token removal.
    """
    return {"message": "Successfully logged out"}


@router.get("/validate")
async def validate_token(current_user: User = Depends(get_current_user)) -> Any:
    """
    Validate JWT token. 
    If this endpoint returns successfully, the token is valid.
    If the token is invalid, the get_current_user dependency will raise an exception.
    """
    return {"message": "Token is valid", "validated": True}