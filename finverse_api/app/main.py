"""
Main entry point for the FinVerse API
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Import models first to ensure proper registration
from app.models.user import User
from app.models.staking import Stake
from app.models.transaction import Transaction
from app.models.financial_account import FinancialAccount
from app.models.internal_transaction import InternalTransaction
from app.models.budget_plan import BudgetPlan
from app.models.financial_goal import FinancialGoal
from app.models.recurring_transaction import RecurringTransaction
from app.models.category import Category

from app.routers import auth, staking, transactions, financial_account, budget_plan, profile, internal_transaction, financial_goal, recurring_transaction, category
from app.config import API_TITLE, API_DESCRIPTION, API_VERSION
from app.db.session import Base, engine, get_db

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI application
app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    expose_headers=["Content-Length"],
    max_age=600, # Cache preflight requests for 10 minutes
)

# Create API v1 router with prefix
api_v1_router = FastAPI(title=f"{API_TITLE} - V1")

# Include routers under the API v1 router
api_v1_router.include_router(auth.router)
api_v1_router.include_router(staking.router)
api_v1_router.include_router(transactions.router)
api_v1_router.include_router(financial_account.router)
api_v1_router.include_router(internal_transaction.router)
api_v1_router.include_router(budget_plan.router)
api_v1_router.include_router(profile.router)
api_v1_router.include_router(financial_goal.router)
api_v1_router.include_router(recurring_transaction.router)
api_v1_router.include_router(category.router)

# Mount the API v1 router at /api/v1
app.mount("/api/v1", api_v1_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to the FinVerse API",
        "docs": "/docs",
        "api": "/api/v1",
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)