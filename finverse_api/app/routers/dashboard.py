"""
Dashboard router for FinVerse API - Unified dashboard data aggregation
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import logging

from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    CategoryBreakdownResponse,
    CashflowTrendResponse,
    FinancialSummaryResponse,
    RecentActivityResponse
)
from app.schemas.response import StandardResponse
from app.core.auth import get_current_user
from app.services.dashboard_service import dashboard_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

# Use the singleton instance instead of creating new one

@router.get("/overview", response_model=DashboardOverviewResponse)
async def dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive dashboard overview with all key metrics"""
    try:
        overview_data = dashboard_service.get_dashboard_overview(db, current_user.id)
        return overview_data
    except Exception as e:
        logger.error(f"Error getting dashboard overview for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard overview: {str(e)}"
        )

@router.get("/category-breakdown", response_model=CategoryBreakdownResponse)
async def category_breakdown(
    period: Optional[str] = Query("month", description="Period: week, month, quarter, year"),
    transaction_type: Optional[str] = Query("expense", description="Type: income, expense, all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get spending/income breakdown by categories with improved validation"""
    try:
        # Validate parameters
        valid_periods = ["week", "month", "quarter", "year"]
        valid_types = ["income", "expense", "all"]
        
        if period not in valid_periods:
            period = "month"
        if transaction_type not in valid_types:
            transaction_type = "expense"
        
        breakdown_data = dashboard_service.get_category_breakdown(
            db, current_user.id, period, transaction_type
        )
        
        # Validate response structure
        if not isinstance(breakdown_data, dict):
            raise ValueError("Invalid breakdown response format")
        
        return breakdown_data
    except Exception as e:
        logger.error(f"Error getting category breakdown for user {current_user.id}: {str(e)}")
        # Return empty structure with proper typing
        from datetime import date, timedelta
        today = date.today()
        return CategoryBreakdownResponse(
            period=period,
            transaction_type=transaction_type,
            total_amount=0.0,
            categories=[],
            period_start=today.replace(day=1),
            period_end=today
        )

@router.get("/trends", response_model=CashflowTrendResponse)
async def cashflow_trends(
    period: str = Query("month", description="Period: week, month, quarter, year"),
    months: int = Query(12, ge=1, le=36, description="Number of periods to include (1-36)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get cashflow trends over time with parameter validation"""
    try:
        # Validate parameters
        valid_periods = ["week", "month", "quarter", "year"]
        if period not in valid_periods:
            period = "month"
        
        # Clamp months to reasonable range
        months = max(1, min(36, months))
        
        trends_data = dashboard_service.get_cashflow_trends(
            db, current_user.id, period, months
        )
        
        return trends_data
    except Exception as e:
        logger.error(f"Error getting cashflow trends for user {current_user.id}: {str(e)}")
        # Return empty trends structure
        return CashflowTrendResponse(
            period_type=period,
            total_periods=0,
            data_points=[],
            summary={
                "total_income": 0.0,
                "total_expenses": 0.0,
                "total_net": 0.0,
                "avg_income": 0.0,
                "avg_expenses": 0.0,
                "avg_net": 0.0
            }
        )

@router.get("/financial-summary", response_model=FinancialSummaryResponse)
async def financial_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive financial summary with error resilience"""
    try:
        summary_data = dashboard_service.get_financial_summary(db, current_user.id)
        return summary_data
    except Exception as e:
        logger.error(f"Error getting financial summary for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get financial summary: {str(e)}"
        )

@router.get("/recent-activity", response_model=RecentActivityResponse)
async def recent_activity(
    limit: int = Query(10, description="Number of recent items to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent financial activity (transactions, budget alerts, etc.)"""
    try:
        activity_data = dashboard_service.get_recent_activity(db, current_user.id, limit)
        return activity_data
    except Exception as e:
        logger.error(f"Error getting recent activity for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recent activity: {str(e)}"
        )

@router.get("/budget-health", response_model=StandardResponse)
async def budget_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budget health indicators and warnings"""
    try:
        health_data = dashboard_service.get_budget_health(db, current_user.id)
        
        return StandardResponse(
            success=True,
            message="Budget health data retrieved successfully",
            data=health_data
        )
    except Exception as e:
        logger.error(f"Error getting budget health for user {current_user.id}: {str(e)}")
        return StandardResponse(
            success=False,
            message="Failed to get budget health data",
            errors=[{"detail": str(e)}]
        )

@router.get("/goal-progress", response_model=StandardResponse)
async def goal_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get financial goals progress summary"""
    try:
        progress_data = dashboard_service.get_goal_progress(db, current_user.id)
        
        return StandardResponse(
            success=True,
            message="Goal progress data retrieved successfully",
            data=progress_data
        )
    except Exception as e:
        logger.error(f"Error getting goal progress for user {current_user.id}: {str(e)}")
        return StandardResponse(
            success=False,
            message="Failed to get goal progress data",
            errors=[{"detail": str(e)}]
        )

@router.get("/staking-overview", response_model=StandardResponse)
async def staking_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get staking portfolio overview"""
    try:
        staking_data = dashboard_service.get_staking_overview(db, current_user.id)
        
        return StandardResponse(
            success=True,
            message="Staking overview retrieved successfully",
            data=staking_data
        )
    except Exception as e:
        logger.error(f"Error getting staking overview for user {current_user.id}: {str(e)}")
        return StandardResponse(
            success=False,
            message="Failed to get staking overview",
            errors=[{"detail": str(e)}]
        )

@router.get("/insights", response_model=StandardResponse)
async def financial_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered financial insights and recommendations"""
    try:
        insights_data = dashboard_service.get_financial_insights(db, current_user.id)
        
        return StandardResponse(
            success=True,
            message="Financial insights retrieved successfully",
            data=insights_data
        )
    except Exception as e:
        logger.error(f"Error getting financial insights for user {current_user.id}: {str(e)}")
        return StandardResponse(
            success=False,
            message="Failed to get financial insights",
            errors=[{"detail": str(e)}]
        )

@router.get("/quick-stats", response_model=StandardResponse)
async def quick_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get quick statistics for dashboard widgets"""
    try:
        stats_data = dashboard_service.get_quick_stats(db, current_user.id)
        
        return StandardResponse(
            success=True,
            message="Quick stats retrieved successfully",
            data=stats_data
        )
    except Exception as e:
        logger.error(f"Error getting quick stats for user {current_user.id}: {str(e)}")
        return StandardResponse(
            success=False,
            message="Failed to get quick stats",
            errors=[{"detail": str(e)}]
        )
