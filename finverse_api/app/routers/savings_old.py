"""
Savings Router for FinVerse API

This module provides RESTful endpoints for savings plan management:
- Create, read, update, delete savings plans
- Get projections and calculations
- Preview calculations without persisting
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.savings_plan import SavingsPlan, SavingsProjection
from app.schemas.savings import (
    SavingsPlanCreate,
    SavingsPlanUpdate,
    SavingsPlanResponse,
    SavingsPlanDetailResponse,
    SavingsPlanListResponse,
    SavingsCalculationRequest,
    SavingsCalculationResponse,
    SavingsPlanSummary,
    SavingsProjectionResponse,
    UserBalanceResponse,
    EarlyWithdrawalCalculationResponse,
    EarlyWithdrawalRequest,
    MonthlyContributionResponse,
    SavingsTransactionResponse,
    FinancialAccountResponse
)
from app.services.savings_service import SavingsService
from app.services.balance_service import BalanceService
from app.models.financial_account import FinancialAccount
from app.schemas.response import SuccessResponse
import logging

router = APIRouter(prefix="/savings", tags=["savings"])

logger = logging.getLogger(__name__)


@router.post("/", response_model=SavingsPlanDetailResponse, status_code=status.HTTP_201_CREATED)
def create_savings_plan(
    plan_data: SavingsPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new savings plan with projections"""
    try:
        db_plan = SavingsService.create_savings_plan(
            db=db, 
            plan_data=plan_data, 
            user_id=current_user.id
        )
        
        # Load projections for response
        projections = db.query(SavingsProjection).filter(
            SavingsProjection.plan_id == db_plan.id
        ).order_by(SavingsProjection.month_index).all()
        
        # Calculate summary stats
        final_projection = projections[-1] if projections else None
        total_contributions = float(db_plan.initial_amount) + (float(db_plan.monthly_contribution) * db_plan.duration_months)
        final_value = float(final_projection.balance) if final_projection else 0.0
        total_interest = max(0.0, final_value - total_contributions)
        
        # Convert to response format
        plan_dict = db_plan.to_dict()
        plan_dict.update({
            "projections": [
                SavingsProjectionResponse(
                    id=p.id,
                    plan_id=p.plan_id,
                    month_index=p.month_index,
                    balance=float(p.balance),
                    interest_earned=float(p.interest_earned)
                ) for p in projections
            ],
            "total_interest": total_interest,
            "final_value": final_value
        })
        
        return SavingsPlanDetailResponse(**plan_dict)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create savings plan: {str(e)}"
        )


@router.get("/financial-accounts", response_model=List[FinancialAccountResponse])
def get_financial_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active financial accounts for the current user"""
    try:
        logger.info(f"Fetching financial accounts for user {current_user.id}")
        
        accounts = db.query(FinancialAccount).filter(
            FinancialAccount.user_id == current_user.id,
            FinancialAccount.is_active == True
        ).all()
        
        logger.info(f"Found {len(accounts)} active financial accounts for user {current_user.id}")
        
        account_responses = []
        for account in accounts:
            account_responses.append(FinancialAccountResponse(
                id=account.id,
                name=account.name,
                type=account.type,
                balance=float(account.balance),
                currency=account.currency,
                is_active=account.is_active
            ))
        
        return account_responses
        
    except HTTPException:
        # Re-raise HTTP exceptions (like auth errors) as-is
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve financial accounts for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve financial accounts: {str(e)}"
        )


@router.get("/summary/stats", response_model=SavingsPlanSummary)
def get_savings_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get savings summary statistics for the current user"""
    try:
        summary = SavingsService.get_savings_summary(db=db, user_id=current_user.id)
        return SavingsPlanSummary(**summary)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve savings summary: {str(e)}"
        )


@router.post("/calculate", response_model=SavingsCalculationResponse)
def calculate_savings_preview(
    calculation_request: SavingsCalculationRequest,
    current_user: User = Depends(get_current_user)
):
    """Calculate savings projections without creating a plan"""
    try:
        result = SavingsService.calculate_savings_projections(calculation_request)
        return SavingsCalculationResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to calculate savings: {str(e)}"
        )


@router.get("/balance/current", response_model=UserBalanceResponse)
def get_user_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's current available balance"""
    try:
        balance_record = BalanceService.get_or_create_user_balance(db, current_user.id)
        return UserBalanceResponse(**balance_record.to_dict())
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user balance: {str(e)}"
        )


@router.post("/balance/sync", response_model=UserBalanceResponse)
async def sync_user_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sync user balance from financial accounts"""
    try:
        balance_record = BalanceService.update_balance_from_financial_accounts(db, current_user.id)
        return UserBalanceResponse(**balance_record.to_dict())
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync user balance: {str(e)}"
        )


@router.get("/", response_model=SavingsPlanListResponse)
def get_savings_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all savings plans for the current user"""
    try:
        plans = SavingsService.get_user_savings_plans(db=db, user_id=current_user.id)
        
        plan_responses = []
        for plan in plans:
            plan_dict = plan.to_dict()
            
            # Add source account information
            if plan.source_account:
                plan_dict["source_account_name"] = plan.source_account.name
                plan_dict["source_account_balance"] = float(plan.source_account.balance)
                
            plan_responses.append(SavingsPlanResponse(**plan_dict))
        
        return SavingsPlanListResponse(data=plan_responses)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve savings plans: {str(e)}"
        )


@router.get("/{plan_id}", response_model=SavingsPlanDetailResponse)
def get_savings_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific savings plan with projections"""
    try:
        db_plan = SavingsService.get_savings_plan_by_id(
            db=db, 
            plan_id=plan_id, 
            user_id=current_user.id
        )
        
        if not db_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings plan not found"
            )
        
        # Load projections
        projections = db.query(SavingsProjection).filter(
            SavingsProjection.plan_id == plan_id
        ).order_by(SavingsProjection.month_index).all()
        
        # Calculate summary stats
        final_projection = projections[-1] if projections else None
        total_contributions = float(db_plan.initial_amount) + (float(db_plan.monthly_contribution) * db_plan.duration_months)
        final_value = float(final_projection.balance) if final_projection else 0.0
        total_interest = max(0.0, final_value - total_contributions)
        
        # Convert to response format
        plan_dict = db_plan.to_dict()
        plan_dict.update({
            "projections": [
                SavingsProjectionResponse(
                    id=p.id,
                    plan_id=p.plan_id,
                    month_index=p.month_index,
                    balance=float(p.balance),
                    interest_earned=float(p.interest_earned)
                ) for p in projections
            ],
            "total_interest": total_interest,
            "final_value": final_value
        })
        
        return SavingsPlanDetailResponse(**plan_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve savings plan: {str(e)}"
        )


@router.get("/{plan_id}/projections", response_model=List[SavingsProjectionResponse])
def get_savings_plan_projections(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get projections for a specific savings plan"""
    try:
        # Verify plan exists and belongs to user
        db_plan = SavingsService.get_savings_plan_by_id(
            db=db, 
            plan_id=plan_id, 
            user_id=current_user.id
        )
        
        if not db_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings plan not found"
            )
        
        # Load projections
        projections = db.query(SavingsProjection).filter(
            SavingsProjection.plan_id == plan_id
        ).order_by(SavingsProjection.month_index).all()
        
        # Convert to response format
        projection_responses = [
            SavingsProjectionResponse(
                id=p.id,
                plan_id=p.plan_id,
                month_index=p.month_index,
                balance=float(p.balance),
                interest_earned=float(p.interest_earned)
            ) for p in projections
        ]
        
        return projection_responses
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve savings plan projections: {str(e)}"
        )


@router.put("/{plan_id}", response_model=SavingsPlanDetailResponse)
def update_savings_plan(
    plan_id: int,
    plan_update: SavingsPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a savings plan and recalculate projections"""
    try:
        db_plan = SavingsService.update_savings_plan(
            db=db,
            plan_id=plan_id,
            user_id=current_user.id,
            plan_update=plan_update
        )
        
        if not db_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings plan not found"
            )
        
        # Load updated projections
        projections = db.query(SavingsProjection).filter(
            SavingsProjection.plan_id == plan_id
        ).order_by(SavingsProjection.month_index).all()
        
        # Calculate summary stats
        final_projection = projections[-1] if projections else None
        total_contributions = float(db_plan.initial_amount) + (float(db_plan.monthly_contribution) * db_plan.duration_months)
        final_value = float(final_projection.balance) if final_projection else 0.0
        total_interest = max(0.0, final_value - total_contributions)
        
        # Convert to response format
        plan_dict = db_plan.to_dict()
        plan_dict.update({
            "projections": [
                SavingsProjectionResponse(
                    id=p.id,
                    plan_id=p.plan_id,
                    month_index=p.month_index,
                    balance=float(p.balance),
                    interest_earned=float(p.interest_earned)
                ) for p in projections
            ],
            "total_interest": total_interest,
            "final_value": final_value
        })
        
        return SavingsPlanDetailResponse(**plan_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update savings plan: {str(e)}"
        )


@router.delete("/{plan_id}", response_model=SuccessResponse)
def delete_savings_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a savings plan"""
    try:
        success = SavingsService.delete_savings_plan(
            db=db,
            plan_id=plan_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings plan not found"
            )
        
        return SuccessResponse(
            success=True,
            message="Savings plan deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete savings plan: {str(e)}"
        )


@router.post("/calculate", response_model=SavingsCalculationResponse)
def calculate_savings_preview(
    calculation_request: SavingsCalculationRequest,
    current_user: User = Depends(get_current_user)
):
    """Calculate savings projections without persisting (for preview)"""
    try:
        result = SavingsService.calculate_savings_preview(calculation_request)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to calculate savings: {str(e)}"
        )


@router.get("/summary/stats", response_model=SavingsPlanSummary)
def get_savings_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get summary statistics for user's savings plans"""
    try:
        summary = SavingsService.get_user_savings_summary(
            db=db, 
            user_id=current_user.id
        )
        return SavingsPlanSummary(**summary)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve savings summary: {str(e)}"
        )


# New endpoints for real balance-based savings

@router.get("/balance/current", response_model=UserBalanceResponse)
def get_user_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's current available balance"""
    try:
        balance_record = BalanceService.get_or_create_user_balance(db, current_user.id)
        return UserBalanceResponse(**balance_record.to_dict())
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user balance: {str(e)}"
        )


@router.post("/balance/sync", response_model=UserBalanceResponse)
async def sync_user_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sync user balance from financial accounts"""
    try:
        balance_record = BalanceService.update_balance_from_financial_accounts(db, current_user.id)
        return UserBalanceResponse(**balance_record.to_dict())
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync user balance: {str(e)}"
        )


@router.get("/financial-accounts", response_model=List[FinancialAccountResponse])
def get_financial_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active financial accounts for the current user"""
    try:
        logger.info(f"Fetching financial accounts for user {current_user.id}")
        
        accounts = db.query(FinancialAccount).filter(
            FinancialAccount.user_id == current_user.id,
            FinancialAccount.is_active == True
        ).all()
        
        logger.info(f"Found {len(accounts)} active financial accounts for user {current_user.id}")
        
        account_responses = []
        for account in accounts:
            account_responses.append(FinancialAccountResponse(
                id=account.id,
                name=account.name,
                type=account.type,
                balance=float(account.balance),
                currency=account.currency,
                is_active=account.is_active
            ))
        
        return account_responses
        
    except HTTPException:
        # Re-raise HTTP exceptions (like auth errors) as-is
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve financial accounts for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve financial accounts: {str(e)}"
        )


@router.get("/{plan_id}/withdrawal/calculate", response_model=EarlyWithdrawalCalculationResponse)
async def calculate_early_withdrawal(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate early withdrawal amount with penalty breakdown"""
    try:
        db_plan = SavingsService.get_savings_plan_by_id(db, plan_id, current_user.id)
        if not db_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings plan not found"
            )
        
        if db_plan.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only calculate withdrawal for active plans"
            )
        
        withdrawal_info = BalanceService.calculate_early_withdrawal_amount(db_plan)
        return EarlyWithdrawalCalculationResponse(**withdrawal_info)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate early withdrawal: {str(e)}"
        )


@router.post("/{plan_id}/withdrawal", response_model=EarlyWithdrawalCalculationResponse)
async def process_early_withdrawal(
    plan_id: int,
    withdrawal_request: EarlyWithdrawalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process early withdrawal from savings plan"""
    try:
        if not withdrawal_request.confirm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Withdrawal confirmation required"
            )
        
        result = SavingsService.process_early_withdrawal(db, plan_id, current_user.id)
        return EarlyWithdrawalCalculationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process early withdrawal: {str(e)}"
        )


@router.post("/{plan_id}/contribution", response_model=MonthlyContributionResponse)
async def process_monthly_contribution(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger monthly contribution for a savings plan"""
    try:
        # Verify plan belongs to user
        db_plan = SavingsService.get_savings_plan_by_id(db, plan_id, current_user.id)
        if not db_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings plan not found"
            )
        
        result = SavingsService.process_monthly_contribution(db, plan_id)
        return MonthlyContributionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process monthly contribution: {str(e)}"
        )


@router.get("/{plan_id}/transactions", response_model=List[SavingsTransactionResponse])
async def get_savings_plan_transactions(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all transactions related to a savings plan"""
    try:
        # Verify plan belongs to user
        db_plan = SavingsService.get_savings_plan_by_id(db, plan_id, current_user.id)
        if not db_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings plan not found"
            )
        
        from app.models.transaction import Transaction
        transactions = db.query(Transaction).filter(
            Transaction.related_savings_plan_id == plan_id,
            Transaction.user_id == current_user.id
        ).order_by(Transaction.created_at.desc()).all()
        
        transaction_responses = [
            SavingsTransactionResponse(**transaction.to_dict())
            for transaction in transactions
        ]
        
        return transaction_responses
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve savings plan transactions: {str(e)}"
        ) 