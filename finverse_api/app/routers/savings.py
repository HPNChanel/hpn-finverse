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

from app.dependencies import get_db, get_current_user
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
    SavingsProjectionResponse
)
from app.services.savings_service import SavingsService
from app.schemas.response import SuccessResponse

router = APIRouter(prefix="/savings", tags=["savings"])


@router.post("/", response_model=SavingsPlanDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_savings_plan(
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


@router.get("/", response_model=SavingsPlanListResponse)
async def get_savings_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all savings plans for the current user"""
    try:
        plans = SavingsService.get_user_savings_plans(db=db, user_id=current_user.id)
        
        plan_responses = []
        for plan in plans:
            plan_dict = plan.to_dict()
            plan_responses.append(SavingsPlanResponse(**plan_dict))
        
        return SavingsPlanListResponse(data=plan_responses)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve savings plans: {str(e)}"
        )


@router.get("/{plan_id}", response_model=SavingsPlanDetailResponse)
async def get_savings_plan(
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


@router.put("/{plan_id}", response_model=SavingsPlanDetailResponse)
async def update_savings_plan(
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
async def delete_savings_plan(
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
async def calculate_savings_preview(
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
async def get_savings_summary(
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