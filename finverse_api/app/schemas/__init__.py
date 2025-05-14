"""
Schema exports for FinVerse API
"""

from app.schemas.user import UserBase, UserCreate, UserLogin, TokenResponse, UserOut, ChangePasswordRequest
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.schemas.transaction import TransactionBase, TransactionCreate, TransactionResponse, TransactionList
from app.schemas.staking import StakeRequest, StakeStatus
from app.schemas.financial_account import (
    FinancialAccountCreate, 
    FinancialAccountResponse, 
    FinancialAccountList,
    AccountType,
    TopUpRequest,
    AccountSummary
)
from app.schemas.internal_transaction import (
    InternalTransactionCreate,
    InternalTransactionResponse,
    InternalTransactionList
)
from app.schemas.budget_plan import (
    BudgetPlanCreate,
    BudgetPlanUpdateSpending,
    BudgetPlanResponse,
    BudgetPlanList
)
from app.schemas.financial_goal import (
    FinancialGoalBase,
    FinancialGoalCreate,
    FinancialGoalUpdate,
    FinancialGoalResponse,
    FinancialGoalList,
    GoalPriority,
    GoalStatus
)
from app.schemas.response import StandardResponse, PaginatedResponse

__all__ = [
    # User schemas
    'UserBase', 'UserCreate', 'UserLogin', 'TokenResponse', 'UserOut', 'ChangePasswordRequest',
    # Profile schemas
    'ProfileOut', 'ProfileUpdate',
    # Transaction schemas
    'TransactionBase', 'TransactionCreate', 'TransactionResponse', 'TransactionList',
    # Staking schemas
    'StakeRequest', 'StakeStatus',
    # Financial account schemas
    'FinancialAccountCreate', 'FinancialAccountResponse', 'FinancialAccountList',
    'AccountType', 'TopUpRequest', 'AccountSummary',
    # Internal transaction schemas
    'InternalTransactionCreate', 'InternalTransactionResponse', 'InternalTransactionList',
    # Budget plan schemas
    'BudgetPlanCreate', 'BudgetPlanUpdateSpending', 'BudgetPlanResponse', 'BudgetPlanList',
    # Financial goal schemas
    'FinancialGoalBase', 'FinancialGoalCreate', 'FinancialGoalUpdate', 'FinancialGoalResponse', 
    'FinancialGoalList', 'GoalPriority', 'GoalStatus',
    # Response schemas
    'StandardResponse', 'PaginatedResponse'
]