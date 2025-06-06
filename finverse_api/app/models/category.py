"""
Category model for FinVerse API
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class Category(Base):
    """Category model for organizing transactions"""
    
    __tablename__ = "categories"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    parent_id = Column(BigInteger, ForeignKey("categories.id"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True, default="📂")
    color = Column(String(7), nullable=True, default="#6B7280")  # Hex color
    type = Column(String(20), nullable=False, default="both")  # 'income', 'expense', 'both'
    is_system = Column(Boolean, default=False, nullable=False)  # System-created categories
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="category", cascade="all, delete-orphan")

    def to_dict(self):
        """Convert category to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "parent_id": self.parent_id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "color": self.color,
            "type": self.type,
            "is_system": self.is_system,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
