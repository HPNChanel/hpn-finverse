"""
Chat service for AI Chat Assistant - Business Logic Layer
"""

import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
import openai
from openai import OpenAI
import json

from app.models.chat import ChatSession, ChatMessage, ChatRole
from app.models.user import User
from app.schemas.chat import (
    ChatSessionCreate, 
    ChatSessionResponse, 
    ChatSessionListResponse,
    SendMessageRequest, 
    SendMessageResponse,
    ChatMessageResponse,
    SuggestedPrompt,
    SuggestedPromptsResponse
)
from app.core.config import Settings, settings

logger = logging.getLogger(__name__)


class ChatService:
    """Service for managing AI chat functionality"""
    
    def __init__(self):
        self.default_model = settings.OPENAI_DEFAULT_MODEL
        self.default_temperature = settings.OPENAI_DEFAULT_TEMPERATURE
        self.default_max_tokens = settings.OPENAI_DEFAULT_MAX_TOKENS
        self._openai_client = None
    
    def _get_openai_client(self, api_key: str = None) -> OpenAI:
        """Get or create OpenAI client with API key"""
        # Use server-side API key if no client key provided
        effective_key = api_key or settings.OPENAI_API_KEY
        
        if not effective_key:
            raise Exception("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.")
        
        if not self._openai_client:
            self._openai_client = OpenAI(api_key=effective_key)
        else:
            # Update API key if different
            self._openai_client.api_key = effective_key
        return self._openai_client
    
    def get_user_sessions(self, db: Session, user_id: int, limit: int = 50) -> List[ChatSessionListResponse]:
        """Get all chat sessions for a user"""
        try:
            # Get sessions with message count
            sessions_query = (
                db.query(
                    ChatSession,
                    func.count(ChatMessage.id).label('message_count')
                )
                .outerjoin(ChatMessage)
                .filter(ChatSession.user_id == user_id)
                .group_by(ChatSession.id)
                .order_by(desc(ChatSession.updated_at))
                .limit(limit)
            )
            
            sessions_data = sessions_query.all()
            
            result = []
            for session, message_count in sessions_data:
                session_dict = ChatSessionListResponse.model_validate(session).model_dump()
                session_dict['message_count'] = message_count
                result.append(ChatSessionListResponse(**session_dict))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting user sessions for user {user_id}: {str(e)}")
            raise Exception(f"Failed to get chat sessions: {str(e)}")
    
    def get_session(self, db: Session, session_id: int, user_id: int) -> Optional[ChatSessionResponse]:
        """Get a specific chat session with messages"""
        try:
            session = (
                db.query(ChatSession)
                .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
                .first()
            )
            
            if not session:
                return None
            
            return ChatSessionResponse.model_validate(session)
            
        except Exception as e:
            logger.error(f"Error getting session {session_id}: {str(e)}")
            raise Exception(f"Failed to get chat session: {str(e)}")
    
    def create_session(self, db: Session, user_id: int, title: str = "New Chat") -> ChatSessionResponse:
        """Create a new chat session"""
        try:
            session = ChatSession(
                title=title,
                user_id=user_id
            )
            
            db.add(session)
            db.commit()
            db.refresh(session)
            
            return ChatSessionResponse.model_validate(session)
            
        except Exception as e:
            logger.error(f"Error creating session for user {user_id}: {str(e)}")
            db.rollback()
            raise Exception(f"Failed to create chat session: {str(e)}")
    
    def update_session(self, db: Session, session_id: int, user_id: int, title: str) -> Optional[ChatSessionResponse]:
        """Update a chat session title"""
        try:
            session = (
                db.query(ChatSession)
                .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
                .first()
            )
            
            if not session:
                return None
            
            session.title = title
            session.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(session)
            
            return ChatSessionResponse.model_validate(session)
            
        except Exception as e:
            logger.error(f"Error updating session {session_id}: {str(e)}")
            db.rollback()
            raise Exception(f"Failed to update chat session: {str(e)}")
    
    def delete_session(self, db: Session, session_id: int, user_id: int) -> bool:
        """Delete a chat session and all its messages"""
        try:
            session = (
                db.query(ChatSession)
                .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
                .first()
            )
            
            if not session:
                return False
            
            db.delete(session)
            db.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {str(e)}")
            db.rollback()
            raise Exception(f"Failed to delete chat session: {str(e)}")
    
    def _get_system_prompt(self, user: User, db: Session) -> str:
        """Generate system prompt with user context"""
        # Get user's recent financial data for context
        try:
            # This could be expanded to include more user context
            system_prompt = f"""You are FinVerse AI, a helpful financial assistant for {user.name}. 

You help users with:
- Personal finance management and budgeting
- DeFi and staking guidance
- Spending analysis and saving tips
- Investment recommendations
- Blockchain and cryptocurrency education

Guidelines:
- Be helpful, accurate, and professional
- Provide actionable financial advice
- Explain complex concepts in simple terms
- Always consider the user's financial safety
- If you need specific account data, suggest they check their dashboard
- For investment advice, always remind users to do their own research

Current user: {user.name} ({user.email})

Respond in a conversational, helpful manner."""
            
            return system_prompt
            
        except Exception as e:
            logger.warning(f"Error generating system prompt: {str(e)}")
            return "You are FinVerse AI, a helpful financial assistant. Help users with personal finance, DeFi, and investment guidance."
    
    def _prepare_messages_for_openai(self, messages: List[ChatMessage], user: User, db: Session) -> List[Dict[str, str]]:
        """Prepare messages for OpenAI API format"""
        openai_messages = []
        
        # Add system message
        system_prompt = self._get_system_prompt(user, db)
        openai_messages.append({
            "role": "system",
            "content": system_prompt
        })
        
        # Add conversation history
        for message in messages:
            openai_messages.append({
                "role": message.role.value,
                "content": message.content
            })
        
        return openai_messages
    
    async def send_message(
        self, 
        db: Session, 
        user: User,
        request: SendMessageRequest,
        openai_api_key: str = None,
        model: str = None,
        temperature: float = None,
        max_tokens: int = None
    ) -> SendMessageResponse:
        """Send a message and get AI response"""
        try:
            # Get or create session
            if request.session_id:
                session = self.get_session(db, request.session_id, user.id)
                if not session:
                    raise Exception("Session not found")
                session_obj = db.query(ChatSession).filter(ChatSession.id == request.session_id).first()
            else:
                # Auto-generate title from first message
                title = request.content[:50] + "..." if len(request.content) > 50 else request.content
                session = self.create_session(db, user.id, title)
                session_obj = db.query(ChatSession).filter(ChatSession.id == session.id).first()
            
            # Save user message
            user_message = ChatMessage(
                session_id=session.id,
                role=ChatRole.USER,
                content=request.content
            )
            db.add(user_message)
            db.commit()
            db.refresh(user_message)
            
            # Get conversation history
            messages = (
                db.query(ChatMessage)
                .filter(ChatMessage.session_id == session.id)
                .order_by(ChatMessage.created_at)
                .limit(20)  # Limit context to last 20 messages
                .all()
            )
            
            # Prepare for OpenAI
            openai_messages = self._prepare_messages_for_openai(messages, user, db)
            
            # Call OpenAI API
            client = self._get_openai_client(openai_api_key)
            
            response = client.chat.completions.create(
                model=model or self.default_model,
                messages=openai_messages,
                temperature=temperature or self.default_temperature,
                max_tokens=max_tokens or self.default_max_tokens,
                stream=False  # For now, we'll use non-streaming
            )
            
            # Extract response
            ai_content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
            
            # Save AI response
            ai_message = ChatMessage(
                session_id=session.id,
                role=ChatRole.ASSISTANT,
                content=ai_content,
                token_count=tokens_used,
                model_used=model or self.default_model
            )
            db.add(ai_message)
            
            # Update session timestamp
            session_obj.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(ai_message)
            
            # Return response
            updated_session = self.get_session(db, session.id, user.id)
            
            return SendMessageResponse(
                user_message=ChatMessageResponse.model_validate(user_message),
                assistant_message=ChatMessageResponse.model_validate(ai_message),
                session=updated_session
            )
            
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            db.rollback()
            raise Exception(f"Failed to send message: {str(e)}")
    
    def get_suggested_prompts(self, user: User) -> SuggestedPromptsResponse:
        """Get suggested prompts for the user"""
        prompts = [
            SuggestedPrompt(
                title="Analyze My Spending",
                prompt="Can you help me analyze my spending patterns this month?",
                category="spending"
            ),
            SuggestedPrompt(
                title="DeFi Staking Guide",
                prompt="Explain how DeFi staking works and what are the risks?",
                category="defi"
            ),
            SuggestedPrompt(
                title="Budget Planning",
                prompt="Help me create a monthly budget plan",
                category="saving"
            ),
            SuggestedPrompt(
                title="Investment Tips",
                prompt="What are some good investment strategies for beginners?",
                category="general"
            ),
            SuggestedPrompt(
                title="ETH Staking",
                prompt="Should I stake my ETH? What are the pros and cons?",
                category="defi"
            ),
            SuggestedPrompt(
                title="Emergency Fund",
                prompt="How much should I save for an emergency fund?",
                category="saving"
            )
        ]
        
        return SuggestedPromptsResponse(prompts=prompts)


# Create singleton instance
chat_service = ChatService() 