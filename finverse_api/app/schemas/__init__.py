"""
Schema exports for FinVerse API - Validation Layer (Clean Architecture)

This module exports all Pydantic schemas for easy importing.
Clean unified imports with explicit exports for import error prevention.

Architecture Layer: VALIDATION LAYER
Dependencies: → None (pure validation)
Used by: API Layer (Routers) and Services Layer
"""

from app.schemas.user import UserBase, UserCreate, UserLogin, TokenResponse, UserOut, ChangePasswordRequest
from app.schemas.auth import RegisterRequest, LoginRequest, UserResponse, Token
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.schemas.transaction import (
    TransactionBase, CreateTransactionSchema, UpdateTransactionSchema, 
    TransactionResponse, TransactionList, MonthlyStats, MonthlyStatsResponse
)
from app.schemas.staking import (
    StakeBase, StakeCreate, StakeResponse, StakeStatus,
    StakingAccountCreate, StakingAccountResponse, StakingAccountList,
    StakingProfileResponse, StakingProfileList,
    StakingPoolsResponse, RewardsResponse, StakingPositionCreateResponse
)
from app.schemas.financial_account import (
    FinancialAccountCreate, 
    FinancialAccountUpdate,  # Added missing import
    FinancialAccountResponse, 
    FinancialAccountList,
    AccountType,
    TopUpRequest,
    AccountSummary,
    ToggleVisibilityRequest
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
from app.schemas.budget import (
    BudgetCreate, BudgetUpdate, BudgetResponse, BudgetList,
    BudgetSummary, BudgetAlert, BudgetPeriod, BudgetStatus,
    AlertThreshold, BudgetUsageUpdate
)
from app.schemas.category import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    CategoryList, CategoryHierarchy
)
from app.schemas.dashboard import (
    DashboardOverviewResponse, CategoryBreakdownResponse, CashflowTrendResponse,
    FinancialSummaryResponse, RecentActivityResponse, QuickStatsResponse
)

# Explicit exports to prevent import errors
__all__ = [
    # User schemas
    "UserBase", "UserCreate", "UserLogin", "TokenResponse", "UserOut", "ChangePasswordRequest",
    # Auth schemas
    "RegisterRequest", "LoginRequest", "UserResponse", "Token",
    # Profile schemas
    "ProfileOut", "ProfileUpdate",
    # Transaction schemas
    "TransactionBase", "CreateTransactionSchema", "UpdateTransactionSchema", 
    "TransactionResponse", "TransactionList", "MonthlyStats", "MonthlyStatsResponse",
    # Staking schemas
    "StakeBase", "StakeCreate", "StakeResponse", "StakeStatus",
    "StakingAccountCreate", "StakingAccountResponse", "StakingAccountList",
    "StakingProfileResponse", "StakingProfileList",
    "StakingPoolsResponse", "RewardsResponse", "StakingPositionCreateResponse",
    # Financial account schemas
    "FinancialAccountCreate", "FinancialAccountUpdate", "FinancialAccountResponse", "FinancialAccountList",  # Added FinancialAccountUpdate
    "AccountType", "TopUpRequest", "AccountSummary", "ToggleVisibilityRequest",
    # Financial goal schemas
    "FinancialGoalBase", "FinancialGoalCreate", "FinancialGoalUpdate", "FinancialGoalResponse", 
    "FinancialGoalList", "GoalPriority", "GoalStatus",
    # Response schemas
    "StandardResponse", "PaginatedResponse",
    # Budget schemas (unified module)
    "BudgetCreate", "BudgetUpdate", "BudgetResponse", "BudgetList",
    "BudgetSummary", "BudgetAlert", "BudgetPeriod", "BudgetStatus",
    "AlertThreshold", "BudgetUsageUpdate",
    # Category schemas
    "CategoryCreate", "CategoryUpdate", "CategoryResponse",
    "CategoryList", "CategoryHierarchy",
    # Dashboard schemas
    "DashboardOverviewResponse", "CategoryBreakdownResponse", "CashflowTrendResponse",
    "FinancialSummaryResponse", "RecentActivityResponse", "QuickStatsResponse",
]

# Schema registry for validation patterns
SCHEMA_REGISTRY = {
    # Request schemas
    "user_create": UserCreate,
    "user_login": UserLogin,
    "register": RegisterRequest,
    "login": LoginRequest,
    "profile_update": ProfileUpdate,
    "transaction_create": CreateTransactionSchema,
    "transaction_update": UpdateTransactionSchema,
    "financial_account_create": FinancialAccountCreate,
    "financial_account_update": FinancialAccountUpdate,  # Added missing registry entry
    "financial_goal_create": FinancialGoalCreate,
    "budget_create": BudgetCreate,
    "category_create": CategoryCreate,
    "stake_create": StakeCreate,
    
    # Response schemas
    "user_response": UserResponse,
    "transaction_response": TransactionResponse,
    "financial_account_response": FinancialAccountResponse,
    "financial_goal_response": FinancialGoalResponse,
    "budget_response": BudgetResponse,
    "category_response": CategoryResponse,
    "stake_response": StakeResponse,
}

# Validation Layer Configuration
VALIDATION_LAYER_INFO = {
    "layer": "Validation Layer (Clean Architecture)",
    "purpose": "Input/output validation and serialization",
    "dependencies": [],  # No dependencies - pure validation
    "responsibilities": [
        "Request payload validation",
        "Response data serialization",
        "Type checking and conversion",
        "Business rule enforcement at schema level",
        "API documentation generation"
    ],
    "patterns": [
        "Pydantic v2 with ConfigDict",
        "Field validators with @classmethod",
        "Forward reference handling",
        "Generic response patterns",
        "Enum-based constants"
    ],
    "exported_schemas": __all__
}

print("✅ Validation layer schemas loaded (Clean Architecture)")
print("✅ Deprecated budget_plan schemas excluded")
print("✅ Unified import structure with explicit exports")
print(f"✅ Exported schemas: {len(__all__)} total")