"""
Budget Plan router for FinVerse API
"""

from fastapi import APIRouter, Depends, status, Path
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.budget_plan import (
    BudgetPlanCreate,
    BudgetPlanUpdateSpending,
    BudgetPlanResponse,
    BudgetPlanList
)
from app.services.budget_plan_service import BudgetPlanService
from app.services.financial_account_service import FinancialAccountService


router = APIRouter(
    prefix="/budget",
    tags=["budget"]
)


@router.post("/create", response_model=BudgetPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_budget_plan(
    budget_data: BudgetPlanCreate,
    db: Session = Depends(get_db)
):
    """Create a new budget plan for an account"""
    # Verify user owns the account (will be done with auth later)
    account = FinancialAccountService.get_account(db, budget_data.account_id)
    
    budget_plan = BudgetPlanService.create_budget_plan(db, budget_data)
    return budget_plan


@router.patch("/update_spending/{budget_id}", response_model=BudgetPlanResponse)
async def update_budget_spending(
    budget_id: int = Path(..., gt=0),
    update_data: BudgetPlanUpdateSpending = None,
    db: Session = Depends(get_db)
):
    """Update spending amount for a budget plan"""
    
    budget_plan = BudgetPlanService.update_spending(db, budget_id, update_data)
    return budget_plan


@router.get("/list/{account_id}", response_model=BudgetPlanList)
async def list_budget_plans(
    account_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """List all budget plans for an account"""
    # Verify user owns the account (will be done with auth later)
    account = FinancialAccountService.get_account(db, account_id)
    
    budget_plans = BudgetPlanService.get_account_budget_plans(db, account_id)
    return {"budget_plans": budget_plans} 