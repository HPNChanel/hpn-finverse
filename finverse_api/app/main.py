"""
Main entry point for the FinVerse API - Clean Architecture Implementation
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path

# Import models first to ensure proper registration
from app.models.user import User
from app.models.stake import Stake
from app.models.transaction import Transaction
from app.models.financial_account import FinancialAccount
from app.models.budget import Budget, BudgetAlert
from app.models.financial_goal import FinancialGoal
from app.models.category import Category
from app.models.savings_plan import SavingsPlan, SavingsProjection
from app.models.loan import Loan, LoanRepaymentSchedule, LoanPayment

# Import routers with explicit imports (Clean Architecture)
from app.routers import (
    auth_router,
    user_router, 
    transaction_router,
    financial_account_router,
    financial_goal_router,
    category_router,
    budget_router,
    staking_router,
    settings_router,
    savings_router,
    loans_router,
    chat_router
)

# Import wallet router from financial_account
from app.routers.financial_account import wallet_router
# Import ETH transfer wallet router
from app.routers.wallet import router as eth_wallet_router
from app.routers.eth_transfer import router as eth_transfer_router

# Import optional routers with error handling
try:
    from app.routers import profile_router
    profile_available = True
except ImportError:
    profile_router = None
    profile_available = False
    print("⚠️ Profile router not available")

try:
    from app.routers import dashboard_router
    dashboard_available = True
    print("✅ Dashboard router imported successfully")
except ImportError:
    dashboard_router = None
    dashboard_available = False
    print("⚠️ Dashboard router not available")

# Import legacy routers for backward compatibility
try:
    from app.routers import users_router
    users_legacy_available = True
except ImportError:
    users_router = None
    users_legacy_available = False

try:
    from app.routers import categories_router
    categories_legacy_available = True
except ImportError:
    categories_router = None
    categories_legacy_available = False

# Import configuration with fallback
try:
    from app.core.config import settings
    API_TITLE = settings.API_TITLE
    API_DESCRIPTION = settings.API_DESCRIPTION
    API_VERSION = settings.API_VERSION
    print("✅ Using core configuration system")
except ImportError:
    from app.config import API_TITLE, API_DESCRIPTION, API_VERSION
    print("⚠️ Using legacy configuration system")

from app.db.session import Base, engine, get_db

# Import middleware with error handling
try:
    from app.middleware.error_handler import ErrorHandlerMiddleware
    middleware_available = True
except ImportError:
    print("⚠️ Error handler middleware not available")
    middleware_available = False

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI application
app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    debug=True,  # Enable debug mode for better error reporting
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add error handling middleware if available
if middleware_available:
    app.add_middleware(ErrorHandlerMiddleware)

# Configure CORS
cors_origins = ["http://localhost:5173", "http://localhost:3000"]
try:
    from app.core.config import settings
    cors_origins = settings.CORS_ORIGINS
except ImportError:
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    expose_headers=["Content-Length"],
    max_age=600, # Cache preflight requests for 10 minutes
)

# Create API v1 router with prefix
api_v1_router = FastAPI(title=f"{API_TITLE} - V1")

# Include core routers with clean architecture pattern
api_v1_router.include_router(auth_router)
api_v1_router.include_router(user_router)
api_v1_router.include_router(transaction_router)
api_v1_router.include_router(financial_account_router)
api_v1_router.include_router(wallet_router)  # Add wallet router
print("✅ Wallet router included at /api/v1/wallets")
api_v1_router.include_router(eth_wallet_router)  # Add ETH transfer wallet router
print("✅ ETH transfer wallet router included at /api/v1/wallet")
api_v1_router.include_router(eth_transfer_router)  # Add specific ETH transfer router
print("✅ ETH transfer router included at /api/v1/eth-transfer")
api_v1_router.include_router(financial_goal_router)
api_v1_router.include_router(category_router)
api_v1_router.include_router(budget_router)
api_v1_router.include_router(staking_router)
api_v1_router.include_router(settings_router)
print("✅ Settings router included")
api_v1_router.include_router(savings_router)
print("✅ Savings router included")
api_v1_router.include_router(loans_router)
print("✅ Loans router included")
api_v1_router.include_router(chat_router)
print("✅ Chat router included")

# Include optional routers if available
if profile_available and profile_router:
    api_v1_router.include_router(profile_router)
    print("✅ Profile router included")

if dashboard_available and dashboard_router:
    api_v1_router.include_router(dashboard_router)
    print("✅ Dashboard router included")

# Include legacy routers for backward compatibility
if users_legacy_available and users_router:
    api_v1_router.include_router(users_router)
    print("✅ Legacy users router included for backward compatibility")

if categories_legacy_available and categories_router:
    api_v1_router.include_router(categories_router)
    print("✅ Legacy categories router included for backward compatibility")

# Include sync router with correct import
try:
    from app.routers.sync import router as sync_router
    sync_available = True
    print("✅ Sync router imported successfully")
except ImportError:
    sync_router = None
    sync_available = False
    print("⚠️ Sync router not available")

# Include optional services with error handling
try:
    from app.services.sync_scheduler import sync_scheduler
    sync_scheduler_available = True
    print("✅ Sync scheduler imported successfully")
except ImportError:
    sync_scheduler = None
    sync_scheduler_available = False
    print("⚠️ Sync scheduler not available")

# Include savings scheduler service
try:
    from app.services.scheduler_service import start_scheduler, stop_scheduler, get_scheduler
    savings_scheduler_available = True
    print("✅ Savings scheduler imported successfully")
except ImportError:
    start_scheduler = None
    stop_scheduler = None
    get_scheduler = None
    savings_scheduler_available = False
    print("⚠️ Savings scheduler not available")

# Create uploads directory if it doesn't exist
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
(uploads_dir / "avatars").mkdir(exist_ok=True)

# Mount static files for avatar uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount the API v1 router at /api/v1
app.mount("/api/v1", api_v1_router)

# Include sync router if available
if sync_available and sync_router:
    api_v1_router.include_router(sync_router)
    print("✅ Sync router included")


@app.get("/")
async def root():
    """Root endpoint with navigation info"""
    return {
        "message": "Welcome to the FinVerse API",
        "docs": "/docs",
        "redoc": "/redoc",
        "api": "/api/v1",
        "version": API_VERSION,
        "status": "healthy",
        "architecture": "Clean Architecture with explicit router exports",
        "endpoints": {
            "auth": "/api/v1/auth",
            "users": "/api/v1/users", 
            "transactions": "/api/v1/transactions",
            "financial_accounts": "/api/v1/accounts",
            "wallets": "/api/v1/wallets",
            "categories": "/api/v1/categories",
            "budget": "/api/v1/budgets",
            "financial_goals": "/api/v1/goals",
            "staking": "/api/v1/staking",
            "settings": "/api/v1/settings"
        },
        "optional_endpoints": {
            "profile": "/api/v1/profile" if profile_available else "not available",
            "dashboard": "/api/v1/dashboard" if dashboard_available else "not available"
        },
        "legacy_endpoints": {
            "users_legacy": "/api/v1/users" if users_legacy_available else "not available",
            "categories_legacy": "/api/v1/categories" if categories_legacy_available else "not available"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z",
        "version": API_VERSION
    }


@app.get("/db-test")
async def db_test(db: Session = Depends(get_db)):
    """Test database connection"""
    try:
        # Try to execute a simple query
        db.execute("SELECT 1")
        return {"status": "connected", "database": "finverse_db"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# Remove duplicate imports and clean up
import asyncio
import logging

# Configure logger
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Handle application startup"""
    logger = logging.getLogger(__name__)
    logger.info("🚀 Starting FinVerse API...")
    
    # Initialize database
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
    
    # Start savings scheduler
    if savings_scheduler_available and start_scheduler:
        try:
            start_scheduler()
            logger.info("✅ Savings scheduler started successfully")
        except Exception as e:
            logger.error(f"❌ Failed to start savings scheduler: {str(e)}")
    else:
        logger.info("⏸️ Savings scheduler not available")
    
    # Start sync services in background (optional - can be controlled via API)
    if sync_scheduler_available and sync_scheduler:
        try:
            # Only auto-start in production, allow manual control in development
            try:
                from app.core.config import settings
                auto_start_sync = getattr(settings, 'AUTO_START_SYNC', False)
            except ImportError:
                auto_start_sync = False
            
            if auto_start_sync:
                logger.info("🔄 Auto-starting blockchain sync services...")
                asyncio.create_task(sync_scheduler.start_all_sync_services(interval_seconds=10))
            else:
                logger.info("⏸️ Auto-start disabled. Use /api/v1/sync/start to begin synchronization")
                
        except Exception as e:
            logger.warning(f"⚠️ Failed to start sync services: {str(e)}")
    else:
        logger.info("⏸️ Sync services not available")

@app.on_event("shutdown")
async def shutdown_event():
    """Handle application shutdown"""
    logger = logging.getLogger(__name__)
    logger.info("🛑 Shutting down FinVerse API...")
    
    # Stop savings scheduler
    if savings_scheduler_available and stop_scheduler:
        try:
            stop_scheduler()
            logger.info("✅ Savings scheduler stopped")
        except Exception as e:
            logger.error(f"❌ Error stopping savings scheduler: {str(e)}")
    
    # Stop sync services
    if sync_scheduler_available and sync_scheduler:
        try:
            await sync_scheduler.stop_all_sync_services()
            logger.info("✅ Sync services stopped")
        except Exception as e:
            logger.error(f"❌ Error stopping sync services: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)