"""
Dashboard schemas for FinVerse API - Dashboard data models
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from decimal import Decimal

class CategoryBreakdownItem(BaseModel):
    """Individual category breakdown item"""
    category_id: int
    category_name: str
    category_icon: Optional[str] = None
    category_color: Optional[str] = None
    amount: float
    percentage: float
    transaction_count: int

class CategoryBreakdownResponse(BaseModel):
    """Category breakdown response"""
    period: str
    transaction_type: str
    total_amount: float
    categories: List[CategoryBreakdownItem]
    period_start: date
    period_end: date

class TrendDataPoint(BaseModel):
    """Single data point in trend analysis"""
    period: str  # "2024-01", "2024-W01", etc.
    period_label: str  # "January 2024", "Week 1 2024", etc.
    income: float
    expenses: float
    net: float
    period_start: date
    period_end: date

class CashflowTrendResponse(BaseModel):
    """Cashflow trends response"""
    period_type: str
    total_periods: int
    data_points: List[TrendDataPoint]
    summary: Dict[str, float] = Field(
        description="Summary statistics (avg_income, avg_expenses, total_net, etc.)"
    )

class AccountSummaryItem(BaseModel):
    """Account summary for dashboard"""
    account_id: int
    account_name: str
    account_type: str
    balance: float
    icon: Optional[str] = None
    color: Optional[str] = None

class BudgetSummaryItem(BaseModel):
    """Budget summary for dashboard"""
    budget_id: int
    budget_name: str
    category_name: str
    limit_amount: float
    spent_amount: float
    remaining_amount: float
    usage_percentage: float
    status: str
    days_remaining: Optional[int] = None

class GoalSummaryItem(BaseModel):
    """Goal summary for dashboard"""
    goal_id: int
    goal_name: str
    target_amount: float
    current_amount: float
    progress_percentage: float
    target_date: Optional[date] = None
    days_remaining: Optional[int] = None
    status: str

class RecentTransactionItem(BaseModel):
    """Recent transaction for dashboard"""
    transaction_id: int
    amount: float
    transaction_type: str
    description: str
    category_name: Optional[str] = None
    account_name: str
    transaction_date: date
    created_at: datetime

class ActiveGoalSummary(BaseModel):
    """Active goal summary for dashboard"""
    id: int
    title: str
    target_amount: float
    current_amount: float
    progress: float  # Progress percentage
    target_date: Optional[date] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = None

class DashboardOverviewResponse(BaseModel):
    """Comprehensive dashboard overview"""
    # Financial summary
    total_balance: float
    total_income_month: float
    total_expenses_month: float
    net_income_month: float
    
    # Account breakdown
    accounts: List[AccountSummaryItem]
    account_types_summary: Dict[str, float]  # {"wallet": 1000, "saving": 5000, ...}
    
    # Budget overview
    active_budgets_count: int
    total_budget_limit: float
    total_budget_spent: float
    budget_health_score: float  # 0-100
    critical_budgets: List[BudgetSummaryItem]
    
    # Goals overview
    active_goals_count: int
    total_goals_target: float
    total_goals_current: float
    goals_completion_rate: float
    urgent_goals: List[GoalSummaryItem]
    active_goal: Optional[ActiveGoalSummary] = None  # Most recent/priority active goal
    
    # Recent activity
    recent_transactions: List[RecentTransactionItem]
    unread_alerts_count: int
    
    # Insights
    spending_trend: str  # "increasing", "decreasing", "stable"
    top_expense_category: Optional[str] = None
    savings_rate: float  # Percentage
    
    # Period info
    current_period: str
    period_start: date
    period_end: date

class FinancialSummaryResponse(BaseModel):
    """Detailed financial summary"""
    # Current period (month)
    current_month: Dict[str, float]
    
    # Previous period comparison
    previous_month: Dict[str, float]
    month_over_month_change: Dict[str, float]
    
    # Year to date
    year_to_date: Dict[str, float]
    
    # Account balances by type
    account_balances: Dict[str, float]
    
    # Top categories
    top_expense_categories: List[CategoryBreakdownItem]
    top_income_categories: List[CategoryBreakdownItem]
    
    # Financial ratios
    savings_rate: float
    expense_to_income_ratio: float
    debt_to_income_ratio: Optional[float] = None

class ActivityItem(BaseModel):
    """Recent activity item"""
    activity_type: str  # "transaction", "budget_alert", "goal_milestone", etc.
    title: str
    description: str
    amount: Optional[float] = None
    timestamp: datetime
    icon: Optional[str] = None
    color: Optional[str] = None
    action_url: Optional[str] = None

class RecentActivityResponse(BaseModel):
    """Recent activity response"""
    activities: List[ActivityItem]
    total_count: int
    has_more: bool

class BudgetHealthIndicator(BaseModel):
    """Budget health indicator"""
    budget_id: int
    budget_name: str
    category_name: str
    health_score: float  # 0-100
    status: str  # "healthy", "warning", "critical"
    usage_percentage: float
    recommended_action: Optional[str] = None

class GoalProgressIndicator(BaseModel):
    """Goal progress indicator"""
    goal_id: int
    goal_name: str
    progress_percentage: float
    on_track: bool
    days_remaining: Optional[int] = None
    required_monthly_savings: Optional[float] = None
    status: str  # "on_track", "behind", "ahead", "completed"

class StakingPositionSummary(BaseModel):
    """Staking position summary"""
    stake_id: int
    stake_name: str
    amount: float
    current_value: Optional[float] = None
    apy: Optional[float] = None
    earned_rewards: float
    days_staked: int
    status: str

class FinancialInsight(BaseModel):
    """AI-powered financial insight"""
    insight_type: str  # "spending_pattern", "saving_opportunity", "budget_recommendation"
    title: str
    description: str
    impact_score: float  # 0-100
    recommended_action: str
    potential_savings: Optional[float] = None
    category: Optional[str] = None

class QuickStatsResponse(BaseModel):
    """Quick statistics for widgets"""
    # Key metrics
    net_worth: float
    monthly_income: float
    monthly_expenses: float
    savings_this_month: float
    
    # Counts
    active_budgets: int
    exceeded_budgets: int
    active_goals: int
    completed_goals: int
    total_transactions_month: int
    
    # Health indicators
    budget_health_score: float
    goal_progress_average: float
    spending_trend: str
    
    # Quick insights
    biggest_expense_category: Optional[str] = None
    biggest_income_source: Optional[str] = None
    savings_rate: float
