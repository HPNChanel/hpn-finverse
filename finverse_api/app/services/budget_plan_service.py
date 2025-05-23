"""
Budget Plan service for FinVerse API
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.budget_plan import BudgetPlan
from app.models.financial_account import FinancialAccount
from app.schemas.budget_plan import BudgetPlanCreate, BudgetPlanUpdateSpending
from app.services.financial_account_service import FinancialAccountService


class BudgetPlanService:
    """Service for budget plan operations"""
    
    @staticmethod
    def create_budget_plan(db: Session, budget_data: BudgetPlanCreate) -> BudgetPlan:
        """Create a new budget plan"""
        
        # Verify account exists
        account = FinancialAccountService.get_account(db, budget_data.account_id)
        
        # Create budget plan with the correct fields from the schema
        budget_plan = BudgetPlan(
            account_id=budget_data.account_id,
            user_id=account.user_id,  # Get user_id from the account
            name=budget_data.name, 
            category=budget_data.category,
            limit_amount=budget_data.limit_amount,
            spent_amount=0.0,  # Start with zero spent
            status="active"
        )
        
        db.add(budget_plan)
        db.commit()
        db.refresh(budget_plan)
        
        return budget_plan
    
    @staticmethod
    def get_budget_plan(db: Session, budget_id: int) -> BudgetPlan:
        """Get a budget plan by ID"""
        
        budget_plan = db.query(BudgetPlan).filter(BudgetPlan.id == budget_id).first()
        if not budget_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Budget plan with id {budget_id} not found"
            )
        
        return budget_plan
    
    @staticmethod
    def get_account_budget_plans(db: Session, account_id: int) -> list[BudgetPlan]:
        """Get all budget plans for an account"""
        
        budget_plans = db.query(BudgetPlan).filter(BudgetPlan.account_id == account_id).all()
        return budget_plans
    
    @staticmethod
    def update_spending(db: Session, budget_id: int, update_data: BudgetPlanUpdateSpending) -> BudgetPlan:
        """Update spending amount for a budget plan"""
        
        budget_plan = BudgetPlanService.get_budget_plan(db, budget_id)
        
        # Update spent amount
        budget_plan.spent_amount = update_data.spent_amount
        
        # Update status based on spending
        if budget_plan.spent_amount >= budget_plan.limit_amount:
            budget_plan.status = "exceeded"
        else:
            budget_plan.status = "active"
        
        db.commit()
        db.refresh(budget_plan)
        
        return budget_plan