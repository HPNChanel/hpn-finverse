"""
Budget router for FinVerse API - Unified budget operations
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import logging

from app.db.session import get_db
from app.models.user import User
from app.schemas.budget import (
    BudgetCreate, BudgetUpdate, BudgetResponse, BudgetList,
    BudgetSummary, BudgetStatus, BudgetAlert, BudgetUsageUpdate
)
from app.schemas.response import StandardResponse
from app.core.auth import get_current_user
from app.services.budget_service import budget_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/budgets",  # Changed from "/budget" to "/budgets" 
    tags=["Budget"]
)

@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new budget"""
    try:
        budget = budget_service.create_budget(db, budget_data, current_user.id)
        
        # Format response with category information
        response_data = {
            **budget.__dict__,
            'category_name': budget.category.name if budget.category else None,
            'category_icon': budget.category.icon if budget.category else None,
            'category_color': budget.category.color if budget.category else None,
            'remaining_amount': budget.remaining_amount,
            'usage_percentage': budget.usage_percentage,
            'days_remaining': budget.days_remaining
        }
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create budget: {str(e)}"
        )

@router.get("/", response_model=BudgetList)
@router.get("/list", response_model=BudgetList)
async def get_budgets(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    status: Optional[BudgetStatus] = Query(None, description="Filter by budget status"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all budgets for the current user"""
    budgets = budget_service.get_user_budgets(
        db, current_user.id, category_id, status, is_active
    )
    summary = budget_service.get_budget_summary(db, current_user.id)
    
    # Format budget responses
    budget_responses = []
    for budget in budgets:
        budget_data = {
            **budget.__dict__,
            'category_name': budget.category.name if budget.category else None,
            'category_icon': budget.category.icon if budget.category else None,
            'category_color': budget.category.color if budget.category else None,
            'remaining_amount': budget.remaining_amount,
            'usage_percentage': budget.usage_percentage,
            'days_remaining': budget.days_remaining
        }
        budget_responses.append(budget_data)
    
    return {
        "budgets": budget_responses,
        "summary": summary
    }

@router.get("/overview", response_model=StandardResponse)
async def get_budget_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budget overview statistics for dashboard"""
    try:
        budget_overview = budget_service.get_budget_overview(db, current_user.id)
        
        return StandardResponse(
            success=True,
            message="Budget overview retrieved successfully",
            data=budget_overview
        )
        
    except Exception as e:
        logger.error(f"Error fetching budget overview for user {current_user.id}: {str(e)}")
        return StandardResponse(
            success=False,
            message="Failed to fetch budget overview",
            errors=[{"detail": str(e)}]
        )

@router.get("/summary/stats", response_model=StandardResponse)
async def get_budget_summary_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed budget statistics for components"""
    try:
        budget_stats = budget_service.get_budget_summary_stats(db, current_user.id)
        
        return StandardResponse(
            success=True,
            message="Budget summary statistics retrieved successfully",
            data=budget_stats
        )
        
    except Exception as e:
        logger.error(f"Error fetching budget summary for user {current_user.id}: {str(e)}")
        return StandardResponse(
            success=False,
            message="Failed to fetch budget summary",
            errors=[{"detail": str(e)}]
        )

@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific budget"""
    budget = budget_service.get_budget(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return {
        **budget.__dict__,
        'category_name': budget.category.name if budget.category else None,
        'category_icon': budget.category.icon if budget.category else None,
        'category_color': budget.category.color if budget.category else None,
        'remaining_amount': budget.remaining_amount,
        'usage_percentage': budget.usage_percentage,
        'days_remaining': budget.days_remaining
    }

@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int,
    budget_data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing budget"""
    budget = budget_service.update_budget(db, budget_id, current_user.id, budget_data)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return {
        **budget.__dict__,
        'category_name': budget.category.name if budget.category else None,
        'category_icon': budget.category.icon if budget.category else None,
        'category_color': budget.category.color if budget.category else None,
        'remaining_amount': budget.remaining_amount,
        'usage_percentage': budget.usage_percentage,
        'days_remaining': budget.days_remaining
    }

@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a budget"""
    success = budget_service.delete_budget(db, budget_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return {"message": "Budget deleted successfully"}

@router.post("/{budget_id}/update-usage", response_model=BudgetResponse)
async def update_budget_usage(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update budget usage based on current transactions - Manual trigger"""
    try:
        budget = budget_service.update_budget_usage(db, budget_id)
        
        if not budget or budget.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        return {
            **budget.__dict__,
            'category_name': budget.category.name if budget.category else None,
            'category_icon': budget.category.icon if budget.category else None,
            'category_color': budget.category.color if budget.category else None,
            'remaining_amount': budget.remaining_amount,
            'usage_percentage': budget.usage_percentage,
            'days_remaining': budget.days_remaining
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error manually updating budget usage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update budget usage: {str(e)}"
        )

@router.post("/update-all-usage", response_model=StandardResponse)
async def update_all_budgets_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update usage for all user budgets - Debugging endpoint"""
    try:
        updated_budgets = budget_service.update_all_user_budgets_usage(db, current_user.id)
        
        return StandardResponse(
            success=True,
            message=f"Updated {len(updated_budgets)} budgets successfully",
            data={"updated_budget_count": len(updated_budgets)}
        )
        
    except Exception as e:
        logger.error(f"Error updating all budgets for user {current_user.id}: {str(e)}")
        return StandardResponse(
            success=False,
            message="Failed to update budget usage",
            errors=[{"detail": str(e)}]
        )

@router.post("/recalculate-category/{category_id}", response_model=StandardResponse)
async def recalculate_category_budgets(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recalculate budgets for a specific category - Debugging endpoint"""
    try:
        updated_budgets = budget_service.update_budgets_by_category(
            db, current_user.id, category_id
        )
        
        return StandardResponse(
            success=True,
            message=f"Updated {len(updated_budgets)} budgets for category {category_id}",
            data={
                "category_id": category_id,
                "updated_budget_count": len(updated_budgets)
            }
        )
        
    except Exception as e:
        logger.error(f"Error recalculating budgets for category {category_id}: {str(e)}")
        return StandardResponse(
            success=False,
            message="Failed to recalculate category budgets",
            errors=[{"detail": str(e)}]
        )

@router.get("/alerts/list", response_model=List[BudgetAlert])
async def get_budget_alerts(
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budget alerts for the current user"""
    alerts = budget_service.get_user_alerts(db, current_user.id, is_read)
    
    # Format alert responses
    alert_responses = []
    for alert in alerts:
        alert_data = {
            **alert.__dict__,
            'budget_name': alert.budget.name if alert.budget else None,
            'category_name': alert.budget.category.name if alert.budget and alert.budget.category else None
        }
        alert_responses.append(alert_data)
    
    return alert_responses

@router.post("/alerts/{alert_id}/mark-read")
async def mark_alert_as_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a budget alert as read"""
    success = budget_service.mark_alert_as_read(db, alert_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    return {"message": "Alert marked as read"}
