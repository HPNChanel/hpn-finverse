"""
Chat schemas for AI Chat Assistant
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from enum import Enum


class ChatRole(str, Enum):
    """Roles for chat messages"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessageBase(BaseModel):
    """Base schema for chat messages"""
    role: ChatRole
    content: str = Field(..., min_length=1, max_length=10000)


class ChatMessageCreate(ChatMessageBase):
    """Schema for creating chat messages"""
    session_id: int


class ChatMessageResponse(ChatMessageBase):
    """Schema for chat message responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    session_id: int
    created_at: datetime
    token_count: Optional[int] = None
    model_used: Optional[str] = None


class ChatSessionBase(BaseModel):
    """Base schema for chat sessions"""
    title: str = Field(default="New Chat", min_length=1, max_length=255)


class ChatSessionCreate(ChatSessionBase):
    """Schema for creating chat sessions"""
    pass


class ChatSessionUpdate(BaseModel):
    """Schema for updating chat sessions"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)


class ChatSessionResponse(ChatSessionBase):
    """Schema for chat session responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []


class ChatSessionListResponse(ChatSessionBase):
    """Schema for chat session list responses (without messages)"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = None


class SendMessageRequest(BaseModel):
    """Schema for sending messages to chat"""
    content: str = Field(..., min_length=1, max_length=10000)
    session_id: Optional[int] = None  # If None, create new session


class SendMessageResponse(BaseModel):
    """Schema for message send responses"""
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse
    session: ChatSessionResponse


class ChatConfigRequest(BaseModel):
    """Schema for chat configuration"""
    openai_api_key: str = Field(..., min_length=10)
    model: str = Field(default="gpt-3.5-turbo")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1000, ge=1, le=4000)


class SuggestedPrompt(BaseModel):
    """Schema for suggested prompts"""
    title: str
    prompt: str
    category: str  # "spending", "saving", "defi", "general"


class SuggestedPromptsResponse(BaseModel):
    """Schema for suggested prompts response"""
    prompts: List[SuggestedPrompt] 