"""
Import all models here to ensure they are registered with Base.metadata before Alembic creates migrations
"""

from app.db.session import Base

# Import all models here
from app.models.user import User
from app.models.staking import Stake, StakingAccount
from app.models.transaction import Transaction
from app.models.financial_account import FinancialAccount
from app.models.internal_transaction import InternalTransaction
from app.models.budget_plan import BudgetPlan
from app.models.financial_goal import FinancialGoal
from app.models.recurring_transaction import RecurringTransaction
from app.models.category import Category

# All models must be imported before initializing migrations
# so that Alembic can detect them
