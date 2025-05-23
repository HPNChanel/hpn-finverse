"""
Schema exports for FinVerse API
"""

from app.schemas.user import UserBase, UserCreate, UserLogin, TokenResponse, UserOut, ChangePasswordRequest
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.schemas.transaction import (
    TransactionBase, CreateTransactionSchema, UpdateTransactionSchema, 
    TransactionResponse, TransactionList, MonthlyStats, MonthlyStatsResponse
)
from app.schemas.staking import (
    StakeBase, StakeCreate, StakeResponse, StakeStatus,
    StakingAccountCreate, StakingAccountResponse, StakingAccountList,
    StakingProfileResponse, StakingProfileList
)
from app.schemas.financial_account import (
    FinancialAccountCreate, 
    FinancialAccountResponse, 
    FinancialAccountList,
    AccountType,
    TopUpRequest,
    AccountSummary
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
    'TransactionBase', 'CreateTransactionSchema', 'UpdateTransactionSchema', 
    'TransactionResponse', 'TransactionList', 'MonthlyStats', 'MonthlyStatsResponse',
    # Staking schemas
    'StakeBase', 'StakeCreate', 'StakeResponse', 'StakeStatus',
    'StakingAccountCreate', 'StakingAccountResponse', 'StakingAccountList',
    'StakingProfileResponse', 'StakingProfileList',
    # Financial account schemas
    'FinancialAccountCreate', 'FinancialAccountResponse', 'FinancialAccountList',
    'AccountType', 'TopUpRequest', 'AccountSummary',
    # Budget plan schemas
    'BudgetPlanCreate', 'BudgetPlanUpdateSpending', 'BudgetPlanResponse', 'BudgetPlanList',
    # Financial goal schemas
    'FinancialGoalBase', 'FinancialGoalCreate', 'FinancialGoalUpdate', 'FinancialGoalResponse', 
    'FinancialGoalList', 'GoalPriority', 'GoalStatus',
    # Response schemas
    'StandardResponse', 'PaginatedResponse'
]