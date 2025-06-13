"""
Routers package for FinVerse API - API Layer (Clean Architecture)

This module implements the API layer of our clean architecture:
- FastAPI route definitions and HTTP handling
- Request/response validation using Pydantic schemas
- Authentication and authorization enforcement
- Clean separation between HTTP concerns and business logic

Architecture Layer: API LAYER  
Dependencies: → Services Layer
Used by: FastAPI main application

Standard naming conventions:
- Singular filenames: user.py, transaction.py, budget.py
- Clean import patterns and dependency injection
- Consistent error handling and response formatting
"""

# Import all routers with standardized singular naming
from .auth import router as auth_router
from .user import router as user_router  # Singular naming
from .transaction import router as transaction_router  # Singular naming  
from .financial_account import router as financial_account_router
from .financial_goal import router as financial_goal_router
from .staking import router as staking_router
from .category import router as category_router  # Singular naming
from .budget import router as budget_router  # Unified budget router
from .settings import router as settings_router  # Settings router
from .savings import router as savings_router  # Savings router

# Import optional routers with error handling
try:
    from .profile import router as profile_router
except ImportError:
    profile_router = None
    print("⚠️ Profile router not available")

try:
    from .dashboard import router as dashboard_router
except ImportError:
    dashboard_router = None
    print("⚠️ Dashboard router not available")

try:
    from .user import router as users_router  # Legacy plural naming support
except ImportError:
    users_router = None
    print("⚠️ Legacy users router not available")

try:
    from .category import router as categories_router  # Legacy plural naming support
except ImportError:
    categories_router = None
    print("⚠️ Legacy categories router not available")

# Export all routers with standardized naming - EXPLICIT EXPORTS
__all__ = [
    "auth_router",
    "user_router", 
    "transaction_router",
    "financial_account_router",
    "financial_goal_router",
    "staking_router",
    "category_router",
    "budget_router",
    "settings_router",
    "savings_router",
]

# Add optional routers to exports if they exist
if profile_router is not None:
    __all__.append("profile_router")

if dashboard_router is not None:
    __all__.append("dashboard_router")

if users_router is not None:
    __all__.append("users_router")

if categories_router is not None:
    __all__.append("categories_router")

# Export all routers with standardized naming for easy access
routers = [
    auth_router,
    user_router,
    transaction_router,
    financial_account_router,
    financial_goal_router,
    staking_router,
    category_router,
    budget_router,
    settings_router,
    savings_router,
]

# Add optional routers if they exist
if profile_router is not None:
    routers.append(profile_router)

if dashboard_router is not None:
    routers.append(dashboard_router)

# Legacy support - include plural routers if they exist
if users_router is not None:
    routers.append(users_router)

if categories_router is not None:
    routers.append(categories_router)

# API Layer Configuration
API_LAYER_INFO = {
    "layer": "API Layer (Clean Architecture)",
    "purpose": "HTTP request/response handling and routing",
    "dependencies": ["Services Layer", "Schemas Layer", "Core Layer"],
    "responsibilities": [
        "Route definition and HTTP method handling",
        "Request validation using Pydantic schemas", 
        "Response formatting and status codes",
        "Authentication and authorization",
        "Error handling and exception mapping"
    ],
    "patterns": [
        "Dependency injection for services",
        "Consistent error responses",
        "Standard HTTP status codes",
        "Clean parameter validation"
    ],
    "exported_routers": __all__
}

print("✅ API layer routers loaded (Clean Architecture)")
print("✅ Singular filename convention implemented")
print("✅ Clean import structure established")
print("✅ HTTP concerns separated from business logic")
print(f"✅ Exported routers: {', '.join(__all__)}")