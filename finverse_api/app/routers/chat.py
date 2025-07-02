"""
Chat router for AI Chat Assistant - API Layer
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import json

from app.db.session import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.chat_service import chat_service
from app.schemas.chat import (
    ChatSessionResponse,
    ChatSessionListResponse,
    ChatSessionCreate,
    ChatSessionUpdate,
    SendMessageRequest,
    SendMessageResponse,
    SuggestedPromptsResponse,
    ChatConfigRequest
)
from app.schemas.response import StandardResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["AI Chat Assistant"]
)


@router.get("/sessions", response_model=StandardResponse)
async def get_chat_sessions(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all chat sessions for the current user"""
    try:
        sessions = chat_service.get_user_sessions(db, current_user.id, limit)
        
        return StandardResponse(
            success=True,
            message="Chat sessions retrieved successfully",
            data={"sessions": [session.model_dump() for session in sessions]}
        )
        
    except Exception as e:
        logger.error(f"Error getting chat sessions for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat sessions: {str(e)}"
        )


@router.post("/sessions", response_model=StandardResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new chat session"""
    try:
        session = chat_service.create_session(db, current_user.id, session_data.title)
        
        return StandardResponse(
            success=True,
            message="Chat session created successfully",
            data={"session": session.model_dump()}
        )
        
    except Exception as e:
        logger.error(f"Error creating chat session for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat session: {str(e)}"
        )


@router.get("/sessions/{session_id}", response_model=StandardResponse)
async def get_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific chat session with messages"""
    try:
        session = chat_service.get_session(db, session_id, current_user.id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return StandardResponse(
            success=True,
            message="Chat session retrieved successfully",
            data={"session": session.model_dump()}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat session: {str(e)}"
        )


@router.patch("/sessions/{session_id}", response_model=StandardResponse)
async def update_chat_session(
    session_id: int,
    session_data: ChatSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a chat session title"""
    try:
        if not session_data.title:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title is required"
            )
        
        session = chat_service.update_session(db, session_id, current_user.id, session_data.title)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return StandardResponse(
            success=True,
            message="Chat session updated successfully",
            data={"session": session.model_dump()}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating chat session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update chat session: {str(e)}"
        )


@router.delete("/sessions/{session_id}", response_model=StandardResponse)
async def delete_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a chat session"""
    try:
        success = chat_service.delete_session(db, session_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return StandardResponse(
            success=True,
            message="Chat session deleted successfully",
            data={}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chat session: {str(e)}"
        )


@router.post("/messages", response_model=StandardResponse)
async def send_message(
    message_data: SendMessageRequest,
    openai_api_key: Optional[str] = Header(None, alias="X-OpenAI-API-Key"),
    model: Optional[str] = Header(None, alias="X-Model"),
    temperature: Optional[float] = Header(None, alias="X-Temperature"),
    max_tokens: Optional[int] = Header(None, alias="X-Max-Tokens"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message to AI and get response"""
    try:
        # Validate OpenAI API key (optional, will use server key if not provided)
        if openai_api_key and len(openai_api_key) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OpenAI API key format"
            )
        
        # Validate optional parameters
        if temperature is not None and (temperature < 0 or temperature > 2):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Temperature must be between 0 and 2"
            )
        
        if max_tokens is not None and (max_tokens < 1 or max_tokens > 4000):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Max tokens must be between 1 and 4000"
            )
        
        # Send message and get response
        response = await chat_service.send_message(
            db=db,
            user=current_user,
            request=message_data,
            openai_api_key=openai_api_key,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return StandardResponse(
            success=True,
            message="Message sent successfully",
            data={"chat": response.model_dump()}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message for user {current_user.id}: {str(e)}")
        
        # Check for OpenAI specific errors
        if "api_key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OpenAI API key"
            )
        elif "quota" in str(e).lower() or "billing" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="OpenAI API quota exceeded or billing issue"
            )
        elif "rate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OpenAI API rate limit exceeded"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send message: {str(e)}"
            )


@router.get("/prompts", response_model=StandardResponse)
async def get_suggested_prompts(
    current_user: User = Depends(get_current_user)
):
    """Get suggested prompts for the user"""
    try:
        prompts = chat_service.get_suggested_prompts(current_user)
        
        return StandardResponse(
            success=True,
            message="Suggested prompts retrieved successfully",
            data={"prompts": prompts.model_dump()}
        )
        
    except Exception as e:
        logger.error(f"Error getting suggested prompts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get suggested prompts: {str(e)}"
        )


@router.get("/health", response_model=StandardResponse)
async def chat_health():
    """Health check for chat service"""
    return StandardResponse(
        success=True,
        message="Chat service is healthy",
        data={
            "service": "AI Chat Assistant",
            "status": "healthy",
            "features": [
                "Chat sessions",
                "Message history",
                "OpenAI integration",
                "Suggested prompts"
            ]
        }
    ) 