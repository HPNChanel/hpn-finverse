"""
Authentication router for FinVerse API
"""

from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any, Optional
import logging

from app.schemas.auth import Token, RegisterRequest, RegisterResponse, UserResponse, LoginRequest, RefreshTokenRequest, RefreshTokenResponse, LoginResponse, UserPublic
from app.services.user_service import user_service_instance  # Use singleton instance
from app.db.session import get_db
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.utils.auth import get_current_user
from app.core.jwt_utils import create_user_tokens, verify_refresh_token, JWTError as JWTUtilsError

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)) -> Any:
    """
    Register a new user.
    """
    # Use UserService to register user
    user = user_service_instance.register_user(
        db=db,
        email=request.email,
        password=request.password,
        name=request.name
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    return {"message": "User created successfully"}


@router.post("/login", response_model=LoginResponse)
async def login_json(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
) -> Any:
    """
    Login with JSON payload (email and password).
    Returns user information along with tokens.
    """
    # Authenticate user with UserService
    user = user_service_instance.authenticate_user(
        db=db,
        email=request.email,
        password=request.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens using jwt_utils
    tokens = create_user_tokens(user.id)
    
    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=30 * 24 * 60 * 60  # 30 days
    )
    
    # Create user public data
    user_public = UserPublic(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=getattr(user, 'avatar_url', None),
        is_active=user.is_active,
        created_at=user.created_at
    )
    
    return LoginResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
        expires_in=900,
        user=user_public
    )


@router.post("/token", response_model=LoginResponse)
async def login_oauth2(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login (for swagger UI and form data).
    Note: The 'username' field should contain the user's email address.
    Returns user information along with tokens.
    """
    # Authenticate user (username field contains email)
    user = user_service_instance.authenticate_user(
        db=db,
        email=form_data.username,
        password=form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens using jwt_utils
    tokens = create_user_tokens(user.id)
    
    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=30 * 24 * 60 * 60  # 30 days
    )
    
    # Create user public data
    user_public = UserPublic(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=getattr(user, 'avatar_url', None),
        is_active=user.is_active,
        created_at=user.created_at
    )
    
    return LoginResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
        expires_in=900,
        user=user_public
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_access_token(
    request: Request,
    db: Session = Depends(get_db),
    refresh_request: Optional[RefreshTokenRequest] = None
) -> Any:
    """
    Refresh access token using refresh token.
    Accepts refresh token from cookie or request body.
    """
    # Try to get refresh token from cookie first, then from body
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token and refresh_request:
        refresh_token = refresh_request.refresh_token
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify refresh token using jwt_utils
        payload = verify_refresh_token(refresh_token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user from database
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is still active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled",
            )
        
        # Create new access token
        tokens = create_user_tokens(user.id)
        
        return {
            "access_token": tokens["access_token"],
            "token_type": "bearer",
            "expires_in": 900  # 15 minutes
        }
        
    except JWTUtilsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not refresh token"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user information.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "avatar_url": getattr(current_user, 'avatar_url', None),
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }


@router.post("/logout")
async def logout(response: Response) -> Any:
    """
    Logout user. Clear refresh token cookie and frontend should handle access token removal.
    """
    # Clear refresh token cookie
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax"
    )
    return {"message": "Successfully logged out"}


@router.get("/validate")
async def validate_token(current_user: User = Depends(get_current_user)) -> Any:
    """
    Validate JWT token. 
    If this endpoint returns successfully, the token is valid.
    """
    return {"message": "Token is valid", "validated": True}