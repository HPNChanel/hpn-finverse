"""
Budget service for FinVerse API - Clean Architecture Implementation

This service implements the business logic layer for budget operations:
- Budget CRUD operations with business validation
- Automatic spending tracking and calculations  
- Alert generation and management
- Budget period calculations
- Financial integrity validation
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, extract
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any
import logging

from app.services.base_service import FinancialService
from app.models.budget import Budget, BudgetAlert
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.schemas.budget import (
    BudgetCreate, BudgetUpdate, BudgetResponse, BudgetList, 
    BudgetSummary, BudgetPeriod, BudgetStatus, AlertThreshold
)

logger = logging.getLogger(__name__)  # Logger for this module


class BudgetService(FinancialService[Budget, BudgetCreate, BudgetUpdate]):
    """
    Budget Service - Clean Architecture Implementation
    
    Implements business logic for budget management:
    - Encapsulates budget business rules
    - Manages budget-transaction relationships
    - Handles alert generation
    - Provides budget analytics
    """
    
    def __init__(self):
        super().__init__(Budget)
    
    def validate_business_rules(self, db: Session, obj_data: dict, user_id: int) -> bool:
        """Validate budget-specific business rules"""
        # Validate category exists and belongs to user
        if 'category_id' in obj_data:
            category = db.query(Category).filter(
                Category.id == obj_data['category_id'],
                Category.user_id == user_id,
                Category.is_active == True
            ).first()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found or doesn't belong to user"
                )
        
        # Validate budget amount
        if 'limit_amount' in obj_data:
            self.validate_amount(float(obj_data['limit_amount']))
        
        return True
    
    def calculate_period_end_date(self, start_date: date, period_type: BudgetPeriod) -> Optional[date]:
        """Calculate end date based on period type - Pure business logic"""
        if period_type == BudgetPeriod.WEEKLY:
            return start_date + timedelta(weeks=1)
        elif period_type == BudgetPeriod.MONTHLY:
            if start_date.month == 12:
                return start_date.replace(year=start_date.year + 1, month=1)
            else:
                return start_date.replace(month=start_date.month + 1)
        elif period_type == BudgetPeriod.QUARTERLY:
            month = start_date.month + 3
            year = start_date.year
            if month > 12:
                month -= 12
                year += 1
            return start_date.replace(year=year, month=month)
        elif period_type == BudgetPeriod.YEARLY:
            return start_date.replace(year=start_date.year + 1)
        else:  # CUSTOM
            return None
    
    def create_budget(self, db: Session, budget_data: BudgetCreate, user_id: int) -> Budget:
        """Create a new budget with business logic validation"""
        try:
            # Validate business rules
            self.validate_business_rules(db, budget_data.model_dump(), user_id)
            
            # Calculate end date for non-custom periods
            end_date = budget_data.end_date
            if budget_data.period_type != BudgetPeriod.CUSTOM:
                end_date = self.calculate_period_end_date(
                    budget_data.start_date, 
                    budget_data.period_type
                )
            
            # Check for existing active budget for same category and overlapping period
            self._validate_no_overlapping_budget(db, user_id, budget_data.category_id, 
                                                budget_data.start_date, end_date)
            
            # Create budget with calculated values
            budget_dict = budget_data.model_dump()
            budget_dict['end_date'] = end_date
            budget_dict['spent_amount'] = Decimal('0.00000000')
            
            budget = self.create(db, budget_data, user_id)
            
            # Calculate initial spent amount from existing transactions
            self.update_budget_usage(db, budget.id)
            
            # Log business operation
            self.log_financial_operation(
                "budget_created", 
                user_id, 
                {"budget_id": budget.id, "category_id": budget.category_id, "limit": float(budget.limit_amount)}
            )
            
            return budget
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating budget for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create budget"
            )
    
    def _validate_no_overlapping_budget(self, db: Session, user_id: int, category_id: int, 
                                      start_date: date, end_date: Optional[date]):
        """Validate no overlapping active budgets exist"""
        query = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.category_id == category_id,
            Budget.is_active == True,
            Budget.start_date <= end_date if end_date else True
        )
        
        if end_date:
            query = query.filter(Budget.end_date >= start_date)
        
        existing_budget = query.first()
        if existing_budget:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An active budget already exists for this category in the specified period"
            )
    
    def get_user_budgets(
        self, 
        db: Session, 
        user_id: int, 
        category_id: Optional[int] = None,
        status: Optional[BudgetStatus] = None,
        is_active: Optional[bool] = None
    ) -> List[Budget]:
        """Get budgets with business logic filtering"""
        try:
            query = db.query(Budget).options(joinedload(Budget.category)).filter(
                Budget.user_id == user_id
            )
            
            # Apply business filters
            if category_id:
                query = query.filter(Budget.category_id == category_id)
            if status:
                query = query.filter(Budget.status == status)
            if is_active is not None:
                query = query.filter(Budget.is_active == is_active)
            
            budgets = query.order_by(Budget.created_at.desc()).all()
            
            # Update status for all budgets
            for budget in budgets:
                self._update_budget_status(budget)
            
            db.commit()
            return budgets
            
        except Exception as e:
            logger.error(f"Error getting budgets for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve budgets"
            )
    
    def update_budget_usage(self, db: Session, budget_id: int) -> Budget:
        """Update budget spending from related transactions - Core business logic"""
        try:
            budget = db.query(Budget).filter(Budget.id == budget_id).first()
            if not budget:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Budget not found"
                )
            
            # Calculate spent amount from transactions in budget period
            spent_amount = self._calculate_budget_spent_amount(db, budget)
            
            # Update budget
            old_spent = budget.spent_amount
            budget.spent_amount = spent_amount
            self._update_budget_status(budget)
            
            # Check if alert should be triggered
            if self._should_trigger_alert(budget, old_spent):
                self._create_budget_alert(db, budget)
            
            db.commit()
            db.refresh(budget)
            
            # Log business operation
            self.log_financial_operation(
                "budget_usage_updated", 
                budget.user_id, 
                {"budget_id": budget_id, "old_spent": float(old_spent), "new_spent": float(spent_amount)}
            )
            
            return budget
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating budget usage for budget {budget_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update budget usage"
            )
    
    def update_all_user_budgets_usage(self, db: Session, user_id: int) -> List[Budget]:
        """Update usage for all active budgets for a user - called after transaction creation"""
        try:
            # Get all active budgets for the user
            active_budgets = db.query(Budget).filter(
                Budget.user_id == user_id,
                Budget.is_active == True
            ).all()
            
            updated_budgets = []
            for budget in active_budgets:
                try:
                    # Calculate spent amount for this budget
                    spent_amount = self._calculate_budget_spent_amount(db, budget)
                    
                    # Update if changed
                    if budget.spent_amount != spent_amount:
                        old_spent = budget.spent_amount
                        budget.spent_amount = spent_amount
                        self._update_budget_status(budget)
                        
                        # Check if alert should be triggered
                        if self._should_trigger_alert(budget, old_spent):
                            self._create_budget_alert(db, budget)
                        
                        updated_budgets.append(budget)
                        
                        logger.info(f"Updated budget {budget.id}: {float(old_spent)} -> {float(spent_amount)}")
                
                except Exception as e:
                    logger.error(f"Error updating budget {budget.id}: {str(e)}")
                    continue
            
            if updated_budgets:
                db.commit()
                
                # Log business operation
                self.log_financial_operation(
                    "multiple_budgets_updated", 
                    user_id, 
                    {"updated_budget_count": len(updated_budgets)}
                )
            
            return updated_budgets
            
        except Exception as e:
            logger.error(f"Error updating all budgets for user {user_id}: {str(e)}")
            return []
    
    def _calculate_budget_spent_amount(self, db: Session, budget: Budget) -> Decimal:
        """Calculate spent amount for a budget based on transactions"""
        try:
            # Get expense type value safely
            try:
                expense_type_value = TransactionType.EXPENSE.value
            except AttributeError:
                expense_type_value = 1  # Fallback to integer value
            
            # Build query with proper date filtering
            query = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == budget.user_id,
                Transaction.category_id == budget.category_id,
                Transaction.transaction_type == expense_type_value,
                Transaction.transaction_date >= budget.start_date
            )
            
            # Add end date filter if budget has an end date
            if budget.end_date:
                query = query.filter(Transaction.transaction_date <= budget.end_date)
            
            spent_amount = query.scalar() or Decimal('0.00000000')
            
            logger.info(f"Budget {budget.id} spent calculation: category_id={budget.category_id}, "
                       f"date_range={budget.start_date} to {budget.end_date}, spent={float(spent_amount)}")
            
            return spent_amount
            
        except Exception as e:
            logger.error(f"Error calculating spent amount for budget {budget.id}: {str(e)}")
            return Decimal('0.00000000')
    
    def update_budgets_by_category(self, db: Session, user_id: int, category_id: int) -> List[Budget]:
        """Update budgets for a specific category - optimized for transaction creation"""
        try:
            # Get active budgets for the specific category
            budgets = db.query(Budget).filter(
                Budget.user_id == user_id,
                Budget.category_id == category_id,
                Budget.is_active == True
            ).all()
            
            updated_budgets = []
            for budget in budgets:
                try:
                    spent_amount = self._calculate_budget_spent_amount(db, budget)
                    
                    if budget.spent_amount != spent_amount:
                        old_spent = budget.spent_amount
                        budget.spent_amount = spent_amount
                        self._update_budget_status(budget)
                        
                        # Check if alert should be triggered
                        if self._should_trigger_alert(budget, old_spent):
                            self._create_budget_alert(db, budget)
                        
                        updated_budgets.append(budget)
                        
                        logger.info(f"Updated budget {budget.id} for category {category_id}: "
                                   f"{float(old_spent)} -> {float(spent_amount)}")
                
                except Exception as e:
                    logger.error(f"Error updating budget {budget.id} for category {category_id}: {str(e)}")
                    continue
            
            if updated_budgets:
                db.commit()
            
            return updated_budgets
            
        except Exception as e:
            logger.error(f"Error updating budgets for category {category_id}, user {user_id}: {str(e)}")
            return []
    
    def _update_budget_status(self, budget: Budget):
        """Update budget status based on business rules"""
        if not budget.is_active:
            budget.status = BudgetStatus.PAUSED
        elif budget.end_date and date.today() > budget.end_date:
            budget.status = BudgetStatus.COMPLETED
        elif budget.spent_amount >= budget.limit_amount:
            budget.status = BudgetStatus.EXCEEDED
        else:
            budget.status = BudgetStatus.ACTIVE
    
    def _should_trigger_alert(self, budget: Budget, old_spent: Decimal) -> bool:
        """Determine if alert should be triggered based on business rules"""
        threshold_map = {
            AlertThreshold.PERCENT_50: 50.0,
            AlertThreshold.PERCENT_75: 75.0,
            AlertThreshold.PERCENT_90: 90.0,
            AlertThreshold.PERCENT_100: 100.0
        }
        
        threshold_value = threshold_map.get(budget.alert_threshold, 75.0)
        old_percentage = (float(old_spent) / float(budget.limit_amount)) * 100 if budget.limit_amount > 0 else 0
        new_percentage = budget.usage_percentage
        
        # Trigger alert if we crossed the threshold
        return old_percentage < threshold_value <= new_percentage
    
    def _create_budget_alert(self, db: Session, budget: Budget):
        """Create budget alert - Business logic for alert generation"""
        try:
            alert = BudgetAlert(
                budget_id=budget.id,
                user_id=budget.user_id,
                threshold_type=budget.alert_threshold,
                current_percentage=budget.usage_percentage,
                amount_spent=budget.spent_amount,
                budget_limit=budget.limit_amount,
                is_read=False
            )
            
            db.add(alert)
            
            logger.info(f"Budget alert created for budget {budget.id}, threshold: {budget.alert_threshold}")
            
        except Exception as e:
            logger.error(f"Error creating budget alert: {str(e)}")
    
    def get_budget_summary(self, db: Session, user_id: int) -> BudgetSummary:
        """Get budget summary statistics - Business analytics"""
        try:
            budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
            
            total_budgets = len(budgets)
            active_budgets = len([b for b in budgets if b.is_active and b.status == BudgetStatus.ACTIVE])
            exceeded_budgets = len([b for b in budgets if b.status == BudgetStatus.EXCEEDED])
            
            total_budget_amount = sum(float(b.limit_amount) for b in budgets if b.is_active)
            total_spent_amount = sum(float(b.spent_amount) for b in budgets if b.is_active)
            
            overall_usage = (total_spent_amount / total_budget_amount * 100) if total_budget_amount > 0 else 0
            
            return BudgetSummary(
                total_budgets=total_budgets,
                active_budgets=active_budgets,
                exceeded_budgets=exceeded_budgets,
                total_budget_amount=total_budget_amount,
                total_spent_amount=total_spent_amount,
                overall_usage_percentage=overall_usage
            )
            
        except Exception as e:
            logger.error(f"Error getting budget summary for user {user_id}: {str(e)}")
            # Return safe defaults instead of raising exception
            return BudgetSummary(
                total_budgets=0,
                active_budgets=0,
                exceeded_budgets=0,
                total_budget_amount=0.0,
                total_spent_amount=0.0,
                overall_usage_percentage=0.0
            )
    
    def get_user_alerts(self, db: Session, user_id: int, is_read: Optional[bool] = None) -> List[BudgetAlert]:
        """Get budget alerts with business filtering"""
        try:
            query = db.query(BudgetAlert).options(
                joinedload(BudgetAlert.budget).joinedload(Budget.category)
            ).filter(BudgetAlert.user_id == user_id)
            
            if is_read is not None:
                query = query.filter(BudgetAlert.is_read == is_read)
            
            return query.order_by(BudgetAlert.created_at.desc()).all()
            
        except Exception as e:
            logger.error(f"Error getting alerts for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get budget alerts"
            )
    
    def mark_alert_as_read(self, db: Session, alert_id: int, user_id: int) -> bool:
        """Mark alert as read - Business operation"""
        try:
            alert = db.query(BudgetAlert).filter(
                BudgetAlert.id == alert_id,
                BudgetAlert.user_id == user_id
            ).first()
            
            if not alert:
                return False
            
            alert.is_read = True
            db.commit()
            
            self.log_financial_operation(
                "alert_marked_read", 
                user_id, 
                {"alert_id": alert_id}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error marking alert as read: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to mark alert as read"
            )
    
    def get_budget(self, db: Session, budget_id: int, user_id: int) -> Optional[Budget]:
        """Get a single budget by ID for a user"""
        try:
            budget = db.query(Budget).options(joinedload(Budget.category)).filter(
                Budget.id == budget_id,
                Budget.user_id == user_id
            ).first()
            
            if budget:
                self._update_budget_status(budget)
                db.commit()
            
            return budget
            
        except Exception as e:
            logger.error(f"Error getting budget {budget_id} for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve budget"
            )
    
    def update_budget(self, db: Session, budget_id: int, user_id: int, budget_data: BudgetUpdate) -> Optional[Budget]:
        """Update an existing budget"""
        try:
            budget = db.query(Budget).filter(
                Budget.id == budget_id,
                Budget.user_id == user_id
            ).first()
            
            if not budget:
                return None
            
            # Validate business rules for updates
            update_dict = budget_data.model_dump(exclude_unset=True)
            if update_dict:
                self.validate_business_rules(db, update_dict, user_id)
            
            # Update budget fields
            updated_budget = self.update(db, budget, budget_data)
            
            # Recalculate usage if needed
            self.update_budget_usage(db, budget_id)
            
            # Log business operation
            self.log_financial_operation(
                "budget_updated", 
                user_id, 
                {"budget_id": budget_id, "updated_fields": list(update_dict.keys())}
            )
            
            return updated_budget
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating budget {budget_id} for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update budget"
            )
    
    def delete_budget(self, db: Session, budget_id: int, user_id: int) -> bool:
        """Delete a budget"""
        try:
            success = self.delete(db, budget_id, user_id)
            
            if success:
                self.log_financial_operation(
                    "budget_deleted", 
                    user_id, 
                    {"budget_id": budget_id}
                )
            
            return success
            
        except Exception as e:
            logger.error(f"Error deleting budget {budget_id} for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete budget"
            )
    
    def get_budget_overview(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get budget overview for dashboard"""
        try:
            summary = self.get_budget_summary(db, user_id)
            
            # Get recent alerts
            recent_alerts = self.get_user_alerts(db, user_id, is_read=False)[:5]
            
            # Get top spending categories
            active_budgets = db.query(Budget).filter(
                Budget.user_id == user_id,
                Budget.is_active == True
            ).all()
            
            top_spending = []
            for budget in active_budgets[:5]:
                if budget.spent_amount > 0:
                    category_name = "Unknown"
                    if budget.category:
                        category_name = budget.category.name
                    
                    usage_percentage = float(budget.spent_amount) / float(budget.limit_amount) * 100 if float(budget.limit_amount) > 0 else 0
                    
                    top_spending.append({
                        "category_name": category_name,
                        "spent_amount": float(budget.spent_amount),
                        "limit_amount": float(budget.limit_amount),
                        "usage_percentage": round(usage_percentage, 2)
                    })
            
            top_spending.sort(key=lambda x: x["usage_percentage"], reverse=True)
            
            return {
                "summary": summary.__dict__ if hasattr(summary, '__dict__') else summary,
                "recent_alerts": len(recent_alerts),
                "top_spending_categories": top_spending[:3]
            }
            
        except Exception as e:
            logger.error(f"Error getting budget overview for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get budget overview"
            )
    
    def get_budget_summary_stats(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get detailed budget statistics"""
        try:
            summary = self.get_budget_summary(db, user_id)
            
            # Additional statistics
            budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
            
            # Categories with budgets
            categories_with_budgets = len(set(b.category_id for b in budgets if b.is_active))
            
            # Average usage
            active_budgets = [b for b in budgets if b.is_active]
            avg_usage = sum(b.usage_percentage for b in active_budgets) / len(active_budgets) if active_budgets else 0
            
            # Budget distribution by status
            status_distribution = {}
            for status in BudgetStatus:
                status_distribution[status.value] = len([b for b in budgets if b.status == status])
            
            return {
                **summary.__dict__,
                "categories_with_budgets": categories_with_budgets,
                "average_usage_percentage": round(avg_usage, 2),
                "status_distribution": status_distribution
            }
            
        except Exception as e:
            logger.error(f"Error getting budget summary stats for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get budget summary statistics"
            )


# Create singleton instance for dependency injection
budget_service = BudgetService()

# Export both class and instance
__all__ = [
    "BudgetService",
    "budget_service"
]

print("✅ Budget service refactored with clean architecture")
print("✅ Business logic layer properly implemented")
