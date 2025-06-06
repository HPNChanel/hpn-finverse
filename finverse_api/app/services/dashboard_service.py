"""
Dashboard service for FinVerse API - Business logic for dashboard data aggregation
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract, and_, desc, case  # Added case import
from typing import Dict, List, Any, Optional
import calendar
import logging

from app.services.base_service import FinancialService
from app.models.user import User
from app.models.transaction import Transaction, TransactionType
from app.models.financial_account import FinancialAccount
from app.models.budget import Budget, BudgetAlert
from app.models.financial_goal import FinancialGoal
from app.models.category import Category
from app.models.stake import Stake
from app.schemas.dashboard import (
    DashboardOverviewResponse, CategoryBreakdownResponse, CashflowTrendResponse,
    FinancialSummaryResponse, RecentActivityResponse, CategoryBreakdownItem,
    TrendDataPoint, AccountSummaryItem, BudgetSummaryItem, GoalSummaryItem,
    RecentTransactionItem, ActivityItem, BudgetHealthIndicator,
    GoalProgressIndicator, StakingPositionSummary, FinancialInsight,
    QuickStatsResponse
)

logger = logging.getLogger(__name__)

class DashboardService(FinancialService):
    """Dashboard Service - Aggregates data from multiple services for dashboard views"""
    
    def __init__(self):
        # Initialize without calling super() since this is an aggregation service
        # that doesn't manage a specific model
        self.logger = logging.getLogger(__name__)
    
    def validate_business_rules(self, db: Session, obj_data: dict, user_id: int) -> bool:
        """
        Validate business rules for dashboard operations.
        Dashboard service doesn't typically create/update records, so this is a no-op.
        """
        # Dashboard service is read-only and aggregates data from other services
        # No specific business rules validation needed
        return True
    
    def get_dashboard_overview(self, db: Session, user_id: int) -> DashboardOverviewResponse:
        """Get comprehensive dashboard overview"""
        try:
            # Get current period dates
            now = datetime.now()
            period_start = date(now.year, now.month, 1)
            if now.month == 12:
                period_end = date(now.year + 1, 1, 1) - timedelta(days=1)
            else:
                period_end = date(now.year, now.month + 1, 1) - timedelta(days=1)
            
            # Financial summary
            accounts = self._get_account_summary(db, user_id)
            total_balance = sum(acc.balance for acc in accounts)
            
            monthly_stats = self._get_monthly_financial_stats(db, user_id, period_start, period_end)
            
            # Budget overview
            budget_overview = self._get_budget_overview(db, user_id)
            
            # Goals overview
            goals_overview = self._get_goals_overview(db, user_id)
            
            # Recent activity
            recent_transactions = self._get_recent_transactions(db, user_id, 5)
            unread_alerts = self._get_unread_alerts_count(db, user_id)
            
            # Insights
            insights = self._get_basic_insights(db, user_id, monthly_stats)
            
            return DashboardOverviewResponse(
                # Financial summary
                total_balance=total_balance,
                total_income_month=monthly_stats["income"],
                total_expenses_month=monthly_stats["expenses"],
                net_income_month=monthly_stats["net"],
                
                # Account breakdown
                accounts=accounts,
                account_types_summary=self._get_account_types_summary(accounts),
                
                # Budget overview
                active_budgets_count=budget_overview["active_count"],
                total_budget_limit=budget_overview["total_limit"],
                total_budget_spent=budget_overview["total_spent"],
                budget_health_score=budget_overview["health_score"],
                critical_budgets=budget_overview["critical_budgets"],
                
                # Goals overview
                active_goals_count=goals_overview["active_count"],
                total_goals_target=goals_overview["total_target"],
                total_goals_current=goals_overview["total_current"],
                goals_completion_rate=goals_overview["completion_rate"],
                urgent_goals=goals_overview["urgent_goals"],
                active_goal=goals_overview["active_goal"],  # Include active goal
                
                # Recent activity
                recent_transactions=recent_transactions,
                unread_alerts_count=unread_alerts,
                
                # Insights
                spending_trend=insights["spending_trend"],
                top_expense_category=insights["top_expense_category"],
                savings_rate=insights["savings_rate"],
                
                # Period info
                current_period=f"{period_start.strftime('%B %Y')}",
                period_start=period_start,
                period_end=period_end
            )
            
        except Exception as e:
            logger.error(f"Error getting dashboard overview for user {user_id}: {str(e)}")
            raise
    
    def get_category_breakdown(self, db: Session, user_id: int, 
                             period: str = "month", 
                             transaction_type: str = "expense") -> CategoryBreakdownResponse:
        """Get spending/income breakdown by categories"""
        try:
            # Calculate period dates
            period_start, period_end = self._get_period_dates(period)
            
            # Determine transaction type filter - safe enum handling
            type_filter = None
            if transaction_type == "expense":
                type_filter = TransactionType.EXPENSE.value
            elif transaction_type == "income":
                type_filter = TransactionType.INCOME.value
            
            # Query transactions with category info
            query = db.query(
                Transaction.category_id,
                Category.name.label('category_name'),
                Category.icon.label('category_icon'), 
                Category.color.label('category_color'),
                func.sum(Transaction.amount).label('total_amount'),
                func.count(Transaction.id).label('transaction_count')
            ).join(Category, Transaction.category_id == Category.id, isouter=True)\
             .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= period_start,
                Transaction.transaction_date <= period_end
            )
            
            if type_filter is not None:
                query = query.filter(Transaction.transaction_type == type_filter)
            
            results = query.group_by(
                Transaction.category_id, Category.name, Category.icon, Category.color
            ).order_by(desc('total_amount')).all()
            
            # Calculate total and percentages
            total_amount = sum(float(result.total_amount or 0) for result in results)
            
            categories = []
            for result in results:
                amount = float(result.total_amount or 0)
                percentage = (amount / total_amount * 100) if total_amount > 0 else 0
                
                categories.append(CategoryBreakdownItem(
                    category_id=result.category_id or 0,
                    category_name=result.category_name or "Unknown",
                    category_icon=result.category_icon,
                    category_color=result.category_color,
                    amount=amount,
                    percentage=round(percentage, 2),
                    transaction_count=int(result.transaction_count or 0)
                ))
            
            return CategoryBreakdownResponse(
                period=period,
                transaction_type=transaction_type,
                total_amount=total_amount,
                categories=categories,
                period_start=period_start,
                period_end=period_end
            )
            
        except Exception as e:
            logger.error(f"Error getting category breakdown for user {user_id}: {str(e)}")
            raise

    def get_cashflow_trends(self, db: Session, user_id: int, 
                          period: str = "month", months: int = 12) -> CashflowTrendResponse:
        """Get cashflow trends over time"""
        try:
            data_points = []
            
            # Generate data points for the specified number of periods
            for i in range(months):
                if period == "month":
                    current_date = date.today().replace(day=1) - timedelta(days=32 * i)
                    period_start = current_date.replace(day=1)
                    if period_start.month == 12:
                        period_end = period_start.replace(year=period_start.year + 1, month=1) - timedelta(days=1)
                    else:
                        period_end = period_start.replace(month=period_start.month + 1) - timedelta(days=1)
                    
                    period_label = period_start.strftime('%B %Y')
                    period_key = period_start.strftime('%Y-%m')
                else:
                    # Default to monthly if period not supported
                    current_date = date.today().replace(day=1) - timedelta(days=32 * i)
                    period_start = current_date.replace(day=1)
                    period_end = period_start.replace(month=period_start.month + 1) - timedelta(days=1) if period_start.month < 12 else period_start.replace(year=period_start.year + 1, month=1) - timedelta(days=1)
                    period_label = period_start.strftime('%B %Y')
                    period_key = period_start.strftime('%Y-%m')
                
                # Get financial stats for this period
                stats = self._get_monthly_financial_stats(db, user_id, period_start, period_end)
                
                data_points.append(TrendDataPoint(
                    period=period_key,
                    period_label=period_label,
                    income=stats["income"],
                    expenses=stats["expenses"],
                    net=stats["net"],
                    period_start=period_start,
                    period_end=period_end
                ))
            
            # Reverse to show oldest to newest
            data_points.reverse()
            
            # Calculate summary statistics
            total_income = sum(dp.income for dp in data_points)
            total_expenses = sum(dp.expenses for dp in data_points)
            avg_income = total_income / len(data_points) if data_points else 0
            avg_expenses = total_expenses / len(data_points) if data_points else 0
            
            summary = {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "total_net": total_income - total_expenses,
                "avg_income": avg_income,
                "avg_expenses": avg_expenses,
                "avg_net": avg_income - avg_expenses
            }
            
            return CashflowTrendResponse(
                period_type=period,
                total_periods=len(data_points),
                data_points=data_points,
                summary=summary
            )
            
        except Exception as e:
            logger.error(f"Error getting cashflow trends for user {user_id}: {str(e)}")
            raise
    
    def get_financial_summary(self, db: Session, user_id: int) -> FinancialSummaryResponse:
        """Get comprehensive financial summary"""
        try:
            # Current month
            now = datetime.now()
            current_start = date(now.year, now.month, 1)
            if now.month == 12:
                current_end = date(now.year + 1, 1, 1) - timedelta(days=1)
            else:
                current_end = date(now.year, now.month + 1, 1) - timedelta(days=1)
            
            current_month = self._get_monthly_financial_stats(db, user_id, current_start, current_end)
            
            # Previous month
            if now.month == 1:
                prev_start = date(now.year - 1, 12, 1)
                prev_end = date(now.year, 1, 1) - timedelta(days=1)
            else:
                prev_start = date(now.year, now.month - 1, 1)
                prev_end = date(now.year, now.month, 1) - timedelta(days=1)
            
            previous_month = self._get_monthly_financial_stats(db, user_id, prev_start, prev_end)
            
            # Calculate month-over-month changes
            mom_change = {}
            for key in current_month:
                if previous_month[key] != 0:
                    mom_change[key] = ((current_month[key] - previous_month[key]) / previous_month[key]) * 100
                else:
                    mom_change[key] = 0
            
            # Year to date
            ytd_start = date(now.year, 1, 1)
            ytd_end = date.today()
            year_to_date = self._get_monthly_financial_stats(db, user_id, ytd_start, ytd_end)
            
            # Account balances
            accounts = self._get_account_summary(db, user_id)
            account_balances = self._get_account_types_summary(accounts)
            
            # Top categories
            top_expenses = self.get_category_breakdown(db, user_id, "month", "expense")
            top_income = self.get_category_breakdown(db, user_id, "month", "income")
            
            # Financial ratios
            savings_rate = 0
            if current_month["income"] > 0:
                savings_rate = (current_month["net"] / current_month["income"]) * 100
            
            expense_ratio = 0
            if current_month["income"] > 0:
                expense_ratio = (current_month["expenses"] / current_month["income"]) * 100
            
            return FinancialSummaryResponse(
                current_month=current_month,
                previous_month=previous_month,
                month_over_month_change=mom_change,
                year_to_date=year_to_date,
                account_balances=account_balances,
                top_expense_categories=top_expenses.categories[:5],
                top_income_categories=top_income.categories[:5],
                savings_rate=round(savings_rate, 2),
                expense_to_income_ratio=round(expense_ratio, 2)
            )
            
        except Exception as e:
            logger.error(f"Error getting financial summary for user {user_id}: {str(e)}")
            raise
    
    def get_recent_activity(self, db: Session, user_id: int, limit: int = 10) -> RecentActivityResponse:
        """Get recent financial activity"""
        try:
            activities = []
            
            # Recent transactions
            recent_transactions = db.query(Transaction).options(
                joinedload(Transaction.category),
                joinedload(Transaction.wallet)
            ).filter(Transaction.user_id == user_id).order_by(
                desc(Transaction.created_at)
            ).limit(limit // 2).all()
            
            for txn in recent_transactions:
                # Safe enum handling for transaction type
                txn_type_value = txn.transaction_type
                
                # Convert to int safely
                if hasattr(txn_type_value, 'value'):
                    txn_type_int = txn_type_value.value
                elif isinstance(txn_type_value, int):
                    txn_type_int = txn_type_value
                else:
                    txn_type_int = int(txn_type_value)
                
                # Determine transaction type for display - safe enum value comparison
                try:
                    income_value = TransactionType.INCOME.value
                except AttributeError:
                    income_value = int(TransactionType.INCOME)
                
                try:
                    expense_value = TransactionType.EXPENSE.value
                except AttributeError:
                    expense_value = int(TransactionType.EXPENSE)
                
                is_income = txn_type_int == income_value
                
                activities.append(ActivityItem(
                    activity_type="transaction",
                    title=f"{'Income' if is_income else 'Expense'}: ${txn.amount}",
                    description=txn.description or f"Transaction in {txn.wallet.name if txn.wallet else 'Unknown Account'}",
                    amount=float(txn.amount),
                    timestamp=txn.created_at,
                    icon="account_balance" if is_income else "payment",
                    color="#4caf50" if is_income else "#f44336"
                ))
            
            # Recent budget alerts
            recent_alerts = db.query(BudgetAlert).options(
                joinedload(BudgetAlert.budget)
            ).filter(
                BudgetAlert.user_id == user_id,
                BudgetAlert.is_read == False
            ).order_by(desc(BudgetAlert.created_at)).limit(limit // 2).all()
            
            for alert in recent_alerts:
                activities.append(ActivityItem(
                    activity_type="budget_alert",
                    title=f"Budget Alert: {alert.budget.name if alert.budget else 'Unknown Budget'}",
                    description=f"Reached {alert.current_percentage:.1f}% of budget limit",
                    timestamp=alert.created_at,
                    icon="warning",
                    color="#ff9800",
                    action_url=f"/budget/{alert.budget_id}" if alert.budget_id else None
                ))
            
            # Sort all activities by timestamp
            activities.sort(key=lambda x: x.timestamp, reverse=True)
            activities = activities[:limit]
            
            return RecentActivityResponse(
                activities=activities,
                total_count=len(activities),
                has_more=len(activities) == limit
            )
            
        except Exception as e:
            logger.error(f"Error getting recent activity for user {user_id}: {str(e)}")
            raise
    
    # ...existing code for other methods...
    
    def _get_account_summary(self, db: Session, user_id: int) -> List[AccountSummaryItem]:
        """Get account summary data"""
        accounts = db.query(FinancialAccount).filter(
            FinancialAccount.user_id == user_id
        ).all()
        
        return [
            AccountSummaryItem(
                account_id=acc.id,
                account_name=acc.name,
                account_type=acc.type,
                balance=float(acc.balance),
                icon=acc.icon,
                color=acc.color
            ) for acc in accounts
        ]
    
    def _get_account_types_summary(self, accounts: List[AccountSummaryItem]) -> Dict[str, float]:
        """Aggregate account balances by type with proper Decimal handling"""
        summary = {}
        
        for account in accounts:
            # Safe type access with fallback
            if hasattr(account, 'account_type'):
                account_type = account.account_type
            elif hasattr(account, 'type'):
                account_type = account.type
            else:
                # Fallback for dictionary-like objects
                account_type = getattr(account, 'account_type', 'wallet')
                logger.warning(f"Account object missing type attribute, using fallback: {account_type}")
            
            # Safe balance access
            if hasattr(account, 'balance'):
                balance = account.balance
            else:
                balance = getattr(account, 'balance', 0)
                logger.warning(f"Account object missing balance attribute, using fallback: {balance}")
            
            # Convert Decimal to float for JSON serialization
            if isinstance(balance, Decimal):
                balance = float(balance)
            elif isinstance(balance, (int, str)):
                balance = float(balance)
            
            if account_type in summary:
                summary[account_type] += balance
            else:
                summary[account_type] = balance
                
        return summary
    
    def _get_monthly_financial_stats(self, db: Session, user_id: int, 
                                   start_date: date, end_date: date) -> Dict[str, float]:
        """Get financial statistics for a date range with improved enum handling"""
        try:
            result = db.query(
                func.sum(
                    case((Transaction.transaction_type == TransactionType.INCOME.value, Transaction.amount),
                        else_=0)
                ).label('income'),
                func.sum(
                    case((Transaction.transaction_type == TransactionType.EXPENSE.value, Transaction.amount),
                        else_=0)
                ).label('expenses')
            ).filter(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date
            ).first()
            
            income = float(result.income or 0) if result else 0
            expenses = float(result.expenses or 0) if result else 0
            
            return {
                "income": income,
                "expenses": expenses,
                "net": income - expenses
            }
            
        except Exception as e:
            logger.error(f"Error getting monthly stats for user {user_id}: {str(e)}")
            return {"income": 0.0, "expenses": 0.0, "net": 0.0}
    
    def _get_budget_overview(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get budget overview data"""
        budgets = db.query(Budget).options(joinedload(Budget.category)).filter(
            Budget.user_id == user_id,
            Budget.is_active == True
        ).all()
        
        active_count = len(budgets)
        total_limit = sum(float(b.limit_amount) for b in budgets)
        total_spent = sum(float(b.spent_amount) for b in budgets)
        
        # Health score (inverse of average usage percentage)
        if budgets:
            avg_usage = sum(float(b.spent_amount) / float(b.limit_amount) * 100 if float(b.limit_amount) > 0 else 0 for b in budgets) / len(budgets)
            health_score = max(0, 100 - avg_usage)
        else:
            health_score = 100
        
        # Critical budgets (>75% usage)
        critical_budgets = []
        for budget in budgets:
            usage_percentage = float(budget.spent_amount) / float(budget.limit_amount) * 100 if float(budget.limit_amount) > 0 else 0
            if usage_percentage > 75:
                critical_budgets.append(BudgetSummaryItem(
                    budget_id=budget.id,
                    budget_name=budget.name,
                    category_name=budget.category.name if budget.category else "Unknown",
                    limit_amount=float(budget.limit_amount),
                    spent_amount=float(budget.spent_amount),
                    remaining_amount=float(budget.limit_amount) - float(budget.spent_amount),
                    usage_percentage=round(usage_percentage, 2),
                    status=budget.status.value if hasattr(budget.status, 'value') else str(budget.status),
                    days_remaining=None
                ))
        
        return {
            "active_count": active_count,
            "total_limit": total_limit,
            "total_spent": total_spent,
            "health_score": round(health_score, 1),
            "critical_budgets": critical_budgets[:3]
        }
    
    def _get_goals_overview(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get goals overview data"""
        goals = db.query(FinancialGoal).filter(
            FinancialGoal.user_id == user_id
        ).all()
        
        # Safe enum handling for goal status
        active_goals = []
        for g in goals:
            goal_status = g.status
            if hasattr(goal_status, 'value'):
                status_str = goal_status.value
            else:
                status_str = str(goal_status)
            
            if status_str in ['active', 'in_progress'] or g.status == 1:  # 1 = ongoing
                active_goals.append(g)
        
        active_count = len(active_goals)
        
        total_target = sum(float(g.target_amount) for g in active_goals)
        total_current = sum(float(g.current_amount) for g in active_goals)
        
        completion_rate = (total_current / total_target * 100) if total_target > 0 else 0
        
        # Get most recent active goal (highest priority, then most recent)
        most_recent_active_goal = None
        if active_goals:
            # Sort by priority (desc) then by created_at (desc)
            sorted_goals = sorted(active_goals, key=lambda x: (x.priority, x.created_at), reverse=True)
            most_recent_active_goal = sorted_goals[0]
        
        # Urgent goals (target date within 30 days)
        urgent_goals = []
        today = date.today()
        for goal in active_goals:
            if goal.target_date and (goal.target_date - today).days <= 30:
                days_remaining = (goal.target_date - today).days
                
                # Safe enum handling for status
                status_value = goal.status
                if hasattr(status_value, 'value'):
                    status_str = status_value.value
                else:
                    status_str = str(status_value)
                
                urgent_goals.append(GoalSummaryItem(
                    goal_id=goal.id,
                    goal_name=goal.name,
                    target_amount=float(goal.target_amount),
                    current_amount=float(goal.current_amount),
                    progress_percentage=goal.progress_percentage,
                    target_date=goal.target_date,
                    days_remaining=days_remaining,
                    status=status_str
                ))
        
        # Build active goal summary for dashboard
        active_goal_summary = None
        if most_recent_active_goal:
            active_goal_summary = {
                "id": most_recent_active_goal.id,
                "title": most_recent_active_goal.name,
                "target_amount": float(most_recent_active_goal.target_amount),
                "current_amount": float(most_recent_active_goal.current_amount),
                "progress": most_recent_active_goal.progress_percentage,
                "target_date": most_recent_active_goal.target_date,
                "icon": most_recent_active_goal.icon,
                "color": most_recent_active_goal.color,
                "priority": most_recent_active_goal.priority
            }
        
        return {
            "active_count": active_count,
            "total_target": total_target,
            "total_current": total_current,
            "completion_rate": round(completion_rate, 1),
            "urgent_goals": urgent_goals[:3],  # Top 3 urgent goals
            "active_goal": active_goal_summary  # Most recent/priority active goal
        }
    
    def _get_recent_transactions(self, db: Session, user_id: int, limit: int) -> List[RecentTransactionItem]:
        """Get recent transactions with enhanced deduplication"""
        transactions = db.query(Transaction).options(
            joinedload(Transaction.category),
            joinedload(Transaction.wallet)
        ).filter(Transaction.user_id == user_id).order_by(
            desc(Transaction.created_at),
            desc(Transaction.id)  # Secondary sort for consistency
        ).limit(limit * 2).all()  # Get more to account for potential duplicates
        
        # Deduplicate by transaction ID
        seen_ids = set()
        unique_transactions = []
        for txn in transactions:
            if txn.id not in seen_ids:
                seen_ids.add(txn.id)
                unique_transactions.append(txn)
        
        # Limit to requested amount after deduplication
        unique_transactions = unique_transactions[:limit]
        
        result_transactions = []
        for txn in unique_transactions:
            # Safe enum handling for transaction type
            txn_type = txn.transaction_type
            
            # Convert to string safely
            if hasattr(txn_type, 'value'):
                txn_type_str = str(txn_type.value)
            elif isinstance(txn_type, int):
                txn_type_str = str(txn_type)
            else:
                txn_type_str = str(int(txn_type))
            
            result_transactions.append(
                RecentTransactionItem(
                    transaction_id=txn.id,
                    amount=float(txn.amount),
                    transaction_type=txn_type_str,
                    description=txn.description or "No description",
                    category_name=txn.category.name if txn.category else None,
                    account_name=txn.wallet.name if txn.wallet else "Unknown Account",
                    transaction_date=txn.transaction_date,
                    created_at=txn.created_at
                )
            )
        
        return result_transactions
    
    def _get_unread_alerts_count(self, db: Session, user_id: int) -> int:
        """Get count of unread alerts"""
        return db.query(BudgetAlert).filter(
            BudgetAlert.user_id == user_id,
            BudgetAlert.is_read == False
        ).count()
    
    def _get_basic_insights(self, db: Session, user_id: int, monthly_stats: Dict[str, float]) -> Dict[str, Any]:
        """Get basic financial insights"""
        # Spending trend (compare with previous month)
        prev_month_start = date.today().replace(day=1) - timedelta(days=1)
        prev_month_start = prev_month_start.replace(day=1)
        prev_month_end = date.today().replace(day=1) - timedelta(days=1)
        
        prev_stats = self._get_monthly_financial_stats(db, user_id, prev_month_start, prev_month_end)
        
        if prev_stats["expenses"] > 0:
            expense_change = ((monthly_stats["expenses"] - prev_stats["expenses"]) / prev_stats["expenses"]) * 100
            if expense_change > 10:
                spending_trend = "increasing"
            elif expense_change < -10:
                spending_trend = "decreasing"
            else:
                spending_trend = "stable"
        else:
            spending_trend = "stable"
        
        # Top expense category
        top_category = None
        breakdown = self.get_category_breakdown(db, user_id, "month", "expense")
        if breakdown.categories:
            top_category = breakdown.categories[0].category_name
        
        # Savings rate
        savings_rate = 0
        if monthly_stats["income"] > 0:
            savings_rate = (monthly_stats["net"] / monthly_stats["income"]) * 100
        
        return {
            "spending_trend": spending_trend,
            "top_expense_category": top_category,
            "savings_rate": round(savings_rate, 1)
        }
    
    def _get_period_dates(self, period: str) -> tuple[date, date]:
        """Get start and end dates for a period"""
        today = date.today()
        
        if period == "week":
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == "month":
            start_date = today.replace(day=1)
            if today.month == 12:
                end_date = today.replace(year=today.year + 1, month=1) - timedelta(days=1)
            else:
                end_date = today.replace(month=today.month + 1) - timedelta(days=1)
        elif period == "quarter":
            quarter = (today.month - 1) // 3 + 1
            start_month = (quarter - 1) * 3 + 1
            start_date = today.replace(month=start_month, day=1)
            end_month = start_month + 2
            if end_month > 12:
                end_date = today.replace(year=today.year + 1, month=end_month - 12, day=1) - timedelta(days=1)
            else:
                end_date = today.replace(month=end_month + 1, day=1) - timedelta(days=1) if end_month < 12 else today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        elif period == "year":
            start_date = today.replace(month=1, day=1)
            end_date = today.replace(month=12, day=31)
        else:
            # Default to current month
            start_date = today.replace(day=1)
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1) if today.month < 12 else today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        
        return start_date, end_date
    
    # Additional methods for other dashboard endpoints...
    def get_budget_health(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get budget health indicators"""
        # Implementation for budget health
        return {"status": "implemented in future iteration"}
    
    def get_goal_progress(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get goals progress summary"""
        # Implementation for goal progress
        return {"status": "implemented in future iteration"}
    
    def get_staking_overview(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get staking overview"""
        # Implementation for staking overview
        return {"status": "implemented in future iteration"}
    
    def get_financial_insights(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get AI-powered financial insights"""
        # Implementation for financial insights
        return {"status": "implemented in future iteration"}
    
    def get_quick_stats(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get quick statistics"""
        try:
            # Get basic financial data
            accounts = self._get_account_summary(db, user_id)
            net_worth = sum(acc.balance for acc in accounts)
            
            # Current month stats
            now = datetime.now()
            month_start = date(now.year, now.month, 1)
            if now.month == 12:
                month_end = date(now.year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = date(now.year, now.month + 1, 1) - timedelta(days=1)
            
            monthly_stats = self._get_monthly_financial_stats(db, user_id, month_start, month_end)
            
            # Budget counts
            budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
            active_budgets = len([b for b in budgets if b.is_active])
            exceeded_budgets = len([b for b in budgets if b.usage_percentage >= 100])
            
            # Goal counts - safe enum handling
            goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user_id).all()
            active_goals = 0
            completed_goals = 0
            
            for g in goals:
                goal_status = g.status
                if hasattr(goal_status, 'value'):
                    status_str = goal_status.value
                else:
                    status_str = str(goal_status)
                
                if status_str in ['active', 'in_progress'] or g.status == 1:
                    active_goals += 1
                elif status_str == 'completed' or g.status == 2:
                    completed_goals += 1
            
            # Transaction count
            total_transactions = db.query(Transaction).filter(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= month_start,
                Transaction.transaction_date <= month_end
            ).count()
            
            # Health scores
            budget_health = self._get_budget_overview(db, user_id)["health_score"]
            goals_overview = self._get_goals_overview(db, user_id)
            goal_progress_avg = goals_overview["completion_rate"]
            
            # Quick insights
            insights = self._get_basic_insights(db, user_id, monthly_stats)
            
            return {
                "net_worth": net_worth,
                "monthly_income": monthly_stats["income"],
                "monthly_expenses": monthly_stats["expenses"],
                "savings_this_month": monthly_stats["net"],
                "active_budgets": active_budgets,
                "exceeded_budgets": exceeded_budgets,
                "active_goals": active_goals,
                "completed_goals": completed_goals,
                "total_transactions_month": total_transactions,
                "budget_health_score": budget_health,
                "goal_progress_average": goal_progress_avg,
                "spending_trend": insights["spending_trend"],
                "biggest_expense_category": insights["top_expense_category"],
                "biggest_income_source": None,  # To be implemented
                "savings_rate": insights["savings_rate"]
            }
            
        except Exception as e:
            logger.error(f"Error getting quick stats for user {user_id}: {str(e)}")
            raise

# Create singleton instance for dependency injection
dashboard_service = DashboardService()

# Export both class and instance  
__all__ = [
    "DashboardService",
    "dashboard_service"
]

print("✅ DashboardService abstract method implemented")
print("✅ Service can now be instantiated without TypeError")
