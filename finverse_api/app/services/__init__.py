"""
Services package for FinVerse API - Business Logic Layer (Clean Architecture)

This module exports all service classes for easy importing.
Clean module structure after deprecation cleanup with explicit exports.

Architecture Layer: BUSINESS LOGIC LAYER
Dependencies: → Data Layer (Models)
Used by: API Layer (Routers)
"""

# Import all active services
from .user_service import UserService, user_service_instance
from .transaction_service import TransactionService, transaction_service_instance
from .financial_account_service import FinancialAccountService
from .financial_goal_service import FinancialGoalService
from .staking_service import StakingService, staking_service
from .category_service import CategoryService
from .budget_service import BudgetService  # Unified budget service
from .dashboard_service import DashboardService
from .chat_service import ChatService, chat_service

# Import optional services with error handling
try:
    from .notification_service import NotificationService
except ImportError:
    NotificationService = None

try:
    from .analytics_service import AnalyticsService
except ImportError:
    AnalyticsService = None

# Import base service classes
try:
    from .base_service import BaseService, FinancialService
except ImportError:
    BaseService = None
    FinancialService = None
    print("⚠️ Base service classes not available")

# Import blockchain sync services
try:
    from .blockchain_sync_service import blockchain_sync_service
    from .websocket_sync_service import websocket_sync_service
    from .sync_scheduler import sync_scheduler
except ImportError:
    blockchain_sync_service = None
    websocket_sync_service = None
    sync_scheduler = None
    print("⚠️ Blockchain sync services not available")

# Export all services with explicit exports
__all__ = [
    "UserService",
    "user_service_instance",  # Export singleton instance
    "TransactionService",
    "transaction_service_instance",  # Export singleton instance
    "FinancialAccountService", 
    "FinancialGoalService",
    "StakingService",
    "CategoryService",
    "BudgetService",
    "DashboardService",
    "ChatService",
    "chat_service",
    "staking_service",
    "user_service",
]

# Add blockchain sync services if available
if blockchain_sync_service is not None:
    __all__.extend(["blockchain_sync_service", "websocket_sync_service", "sync_scheduler"])

# Add optional services if they exist
if NotificationService is not None:
    __all__.append("NotificationService")

if AnalyticsService is not None:
    __all__.append("AnalyticsService")

if BaseService is not None:
    __all__.append("BaseService")

if FinancialService is not None:
    __all__.append("FinancialService")

# Create service registry for dependency injection
SERVICE_REGISTRY = {
    "user": UserService,
    "transaction": TransactionService,
    "financial_account": FinancialAccountService,
    "financial_goal": FinancialGoalService,
    "staking": StakingService,
    "category": CategoryService,
    "budget": BudgetService,
    "dashboard": DashboardService,
    "chat": ChatService,
}

# Add blockchain sync services to registry
if blockchain_sync_service is not None:
    SERVICE_REGISTRY.update({
        "blockchain_sync": blockchain_sync_service,
        "websocket_sync": websocket_sync_service,
        "sync_scheduler": sync_scheduler
    })

# Add optional services to registry
if NotificationService is not None:
    SERVICE_REGISTRY["notification"] = NotificationService

if AnalyticsService is not None:
    SERVICE_REGISTRY["analytics"] = AnalyticsService

# Business Logic Layer Configuration
BUSINESS_LAYER_INFO = {
    "layer": "Business Logic Layer (Clean Architecture)",
    "purpose": "Core business operations and rules",
    "dependencies": ["Data Layer (Models)", "Core Layer"],
    "responsibilities": [
        "Business rule validation",
        "Data processing and transformation",
        "Transaction management",
        "Business workflow coordination",
        "Cross-cutting business concerns"
    ],
    "patterns": [
        "Service layer pattern",
        "Repository pattern integration",
        "Domain-driven design principles",
        "SOLID principles adherence"
    ],
    "exported_services": __all__
}

print("✅ Business logic layer services loaded (Clean Architecture)")
print("✅ Deprecated budget_plan_service excluded")
print("✅ Module naming conventions standardized")
print(f"✅ Exported services: {', '.join(__all__)}")