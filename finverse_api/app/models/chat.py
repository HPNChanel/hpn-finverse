"""
Chat models for AI Chat Assistant
"""

from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime, ForeignKey, Enum as SqlEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from app.db.session import Base


class ChatRole(str, Enum):
    """Roles for chat messages"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatSession(Base):
    """Chat session model for organizing conversations"""
    __tablename__ = "chat_sessions"

    id = Column(BigInteger, primary_key=True, index=True)
    title = Column(String(255), nullable=False, default="New Chat")
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_chat_sessions_user_id', 'user_id'),
        Index('idx_chat_sessions_created_at', 'created_at'),
    )

    def __repr__(self):
        return f"<ChatSession(id={self.id}, title='{self.title}', user_id={self.user_id})>"


class ChatMessage(Base):
    """Chat message model for storing conversation history"""
    __tablename__ = "chat_messages"

    id = Column(BigInteger, primary_key=True, index=True)
    session_id = Column(BigInteger, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(SqlEnum(ChatRole), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Optional metadata for AI responses
    token_count = Column(Integer, nullable=True)
    model_used = Column(String(100), nullable=True, default="gpt-3.5-turbo")
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_chat_messages_session_id', 'session_id'),
        Index('idx_chat_messages_created_at', 'created_at'),
        Index('idx_chat_messages_role', 'role'),
    )

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, session_id={self.session_id}, role='{self.role}')>" 