"""
Import all models here to ensure they are registered with Base.metadata before Alembic creates migrations
"""

from app.db.session import Base

# Import all core models
from app.models.user import User
from app.models.stake import Stake  # Only unified Stake model
from app.models.transaction import Transaction
from app.models.financial_account import FinancialAccount
from app.models.financial_goal import FinancialGoal
from app.models.category import Category
from app.models.budget import Budget, BudgetAlert

# All models must be imported before initializing migrations
# so that Alembic can detect them
print("✅ Unified Stake model registered for Alembic migrations")
print("✅ StakingPosition model removed - using unified Stake only")
print("✅ RecurringTransaction and InternalTransaction models removed - functionality moved to Transaction")
