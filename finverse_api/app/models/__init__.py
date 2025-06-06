"""
Models package for FinVerse API - Data Layer (Clean Architecture)

This module implements the data layer of our clean architecture:
- SQLAlchemy ORM models for database schema
- Relationship definitions between entities
- Database constraints and validations
- Hybrid properties for calculated fields

Architecture Layer: DATA LAYER
Dependencies: → Database (MySQL)
Used by: Services Layer
"""

# Import Base first
from app.db.session import Base

# Import all models to ensure they are registered with Base.metadata
from .user import User
from .transaction import Transaction
from .financial_account import FinancialAccount
from .financial_goal import FinancialGoal
from .category import Category
from .budget import Budget, BudgetAlert
from .stake import Stake  # Only unified Stake model

# Export all models for easy importing
__all__ = [
    'Base',
    'User',
    'Transaction', 
    'FinancialAccount',
    'FinancialGoal',
    'Category',
    'Budget',
    'BudgetAlert',
    'Stake',  # Only unified Stake model
]

# Model relationship summary for clean architecture
MODEL_RELATIONSHIPS = {
    "User": {
        "has_many": ["Transaction", "FinancialAccount", "Budget", "Category", "FinancialGoal", "Stake"],
        "purpose": "Central user entity with ownership relationships"
    },
    "Budget": {
        "belongs_to": ["User", "Category"],
        "has_many": ["Transaction", "BudgetAlert"],
        "purpose": "Budget tracking with automatic transaction linking"
    },
    "Transaction": {
        "belongs_to": ["User", "FinancialAccount", "Category", "Budget"],
        "purpose": "Financial transaction records with category and budget tracking, including recurring and internal transfers"
    },
    "FinancialAccount": {
        "belongs_to": ["User"],
        "has_many": ["Transaction", "FinancialGoal", "Stake"],
        "purpose": "Virtual account management for different financial purposes"
    },
    "Stake": {
        "belongs_to": ["User"],
        "purpose": "Unified staking model with AI analytics and blockchain tracking"
    }
}

print("✅ Data layer models loaded (Clean Architecture)")
print("✅ All core models registered for Alembic migrations")
print("✅ Unified Stake model loaded - StakingPosition removed")
print("✅ RecurringTransaction and InternalTransaction models removed - functionality moved to Transaction")