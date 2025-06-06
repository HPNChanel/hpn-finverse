"""
Financial Goal service for FinVerse API - Clean Architecture Implementation
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional, Dict, Any
from datetime import date
from fastapi import HTTPException, status
import logging

from app.services.base_service import FinancialService
from app.models.financial_goal import FinancialGoal
from app.schemas.financial_goal import FinancialGoalCreate, FinancialGoalUpdate

logger = logging.getLogger(__name__)


class FinancialGoalService(FinancialService[FinancialGoal, FinancialGoalCreate, FinancialGoalUpdate]):
    """
    Financial Goal Service - Clean Architecture Implementation
    
    Implements business logic for financial goal management:
    - Goal creation and tracking
    - Progress monitoring
    - Goal prioritization
    - Achievement analytics
    """
    
    def __init__(self):
        super().__init__(FinancialGoal)
    
    def validate_business_rules(self, db: Session, obj_data: dict, user_id: int) -> bool:
        """Validate goal-specific business rules"""
        # Validate target amount
        if 'target_amount' in obj_data:
            self.validate_amount(float(obj_data['target_amount']))
        
        # Validate current amount doesn't exceed target
        if 'current_amount' in obj_data and 'target_amount' in obj_data:
            if float(obj_data['current_amount']) > float(obj_data['target_amount']):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current amount cannot exceed target amount"
                )
        
        # Validate date constraints
        if 'start_date' in obj_data and 'target_date' in obj_data:
            if obj_data['start_date'] >= obj_data['target_date']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Target date must be after start date"
                )
        
        return True
    
    def create_goal(self, db: Session, goal_data: FinancialGoalCreate, user_id: int) -> FinancialGoal:
        """Create a new financial goal for a user"""
        try:
            # Validate business rules
            self.validate_business_rules(db, goal_data.model_dump(), user_id)
            
            # Ensure current_amount defaults to 0 if not provided
            goal_dict = goal_data.model_dump()
            goal_dict['current_amount'] = goal_dict.get('current_amount', 0.0)
            goal_dict['status'] = goal_dict.get('status', 1)  # Default to ongoing
            goal_dict['icon'] = goal_dict.get('icon', '🎯')
            goal_dict['color'] = goal_dict.get('color', '#1976d2')
            
            # Create the goal
            goal = self.create(db, FinancialGoalCreate(**goal_dict), user_id)
            
            # Log business operation
            self.log_financial_operation(
                "goal_created", 
                user_id, 
                {"goal_id": goal.id, "target_amount": float(goal.target_amount)}
            )
            
            return goal
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating goal for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create goal"
            )
    
    def get_goals(self, db: Session, user_id: int) -> List[FinancialGoal]:
        """Get all financial goals for a user"""
        try:
            return db.query(FinancialGoal).filter(
                FinancialGoal.user_id == user_id
            ).order_by(FinancialGoal.created_at.desc()).all()
        except Exception as e:
            logger.error(f"Error fetching goals for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch goals"
            )
    
    def get_goal_by_id(self, db: Session, goal_id: int, user_id: int) -> Optional[FinancialGoal]:
        """Get a specific financial goal by ID for a user"""
        return self.get(db, goal_id, user_id)
    
    def update_goal(self, db: Session, goal_id: int, goal_data: FinancialGoalUpdate, user_id: int) -> Optional[FinancialGoal]:
        """Update a financial goal for a user"""
        try:
            goal = self.get_goal_by_id(db, goal_id, user_id)
            if not goal:
                return None
            
            # Validate business rules for updates
            update_dict = goal_data.model_dump(exclude_unset=True)
            if update_dict:
                # Merge with existing data for validation
                current_data = {
                    'target_amount': goal.target_amount,
                    'current_amount': goal.current_amount,
                    'start_date': goal.start_date,
                    'target_date': goal.target_date
                }
                current_data.update(update_dict)
                self.validate_business_rules(db, current_data, user_id)
            
            # Update the goal
            updated_goal = self.update(db, goal, goal_data)
            
            # Log business operation
            self.log_financial_operation(
                "goal_updated", 
                user_id, 
                {"goal_id": goal_id, "updated_fields": list(update_dict.keys())}
            )
            
            return updated_goal
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating goal {goal_id} for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update goal"
            )
    
    def delete_goal(self, db: Session, goal_id: int, user_id: int) -> bool:
        """Delete a financial goal for a user"""
        try:
            success = self.delete(db, goal_id, user_id)
            
            if success:
                self.log_financial_operation(
                    "goal_deleted", 
                    user_id, 
                    {"goal_id": goal_id}
                )
            
            return success
            
        except Exception as e:
            logger.error(f"Error deleting goal {goal_id} for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete goal"
            )
    
    def get_goals_by_status(self, db: Session, user_id: int, status: int) -> List[FinancialGoal]:
        """Get all financial goals with a specific status for a user"""
        try:
            return db.query(FinancialGoal).filter(
                FinancialGoal.user_id == user_id,
                FinancialGoal.status == status
            ).all()
        except Exception as e:
            logger.error(f"Error getting goals by status for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get goals by status"
            )
    
    def get_goals_by_priority(self, db: Session, user_id: int, priority: int) -> List[FinancialGoal]:
        """Get all financial goals with a specific priority for a user"""
        try:
            return db.query(FinancialGoal).filter(
                FinancialGoal.user_id == user_id,
                FinancialGoal.priority == priority
            ).all()
        except Exception as e:
            logger.error(f"Error getting goals by priority for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get goals by priority"
            )
    
    def update_goal_progress(self, db: Session, goal_id: int, new_amount: float, user_id: int) -> Optional[FinancialGoal]:
        """Update the current amount for a goal"""
        try:
            goal = self.get_goal_by_id(db, goal_id, user_id)
            if not goal:
                return None
            
            # Validate new amount
            self.validate_amount(new_amount)
            if new_amount > float(goal.target_amount):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Progress amount cannot exceed target amount"
                )
            
            goal.current_amount = new_amount
            
            # Check if goal is completed
            if float(goal.current_amount) >= float(goal.target_amount):
                goal.status = 2  # Completed
            
            db.commit()
            db.refresh(goal)
            
            # Log business operation
            self.log_financial_operation(
                "goal_progress_updated", 
                user_id, 
                {"goal_id": goal_id, "new_amount": new_amount, "completed": goal.status == 2}
            )
            
            return goal
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating goal progress for goal {goal_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update goal progress"
            )
    
    def get_goal_analytics(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get goal analytics and insights"""
        try:
            goals = self.get_goals(db, user_id)
            
            total_goals = len(goals)
            completed_goals = len([g for g in goals if g.status == 2])
            active_goals = len([g for g in goals if g.status == 1])
            
            total_target = sum(float(g.target_amount) for g in goals)
            total_current = sum(float(g.current_amount) for g in goals)
            
            completion_rate = (completed_goals / total_goals * 100) if total_goals > 0 else 0
            overall_progress = (total_current / total_target * 100) if total_target > 0 else 0
            
            # Upcoming goals (target date within 30 days)
            from datetime import datetime, timedelta
            upcoming_deadline = date.today() + timedelta(days=30)
            upcoming_goals = [
                g for g in goals 
                if g.target_date and g.target_date <= upcoming_deadline and g.status == 1
            ]
            
            return {
                "total_goals": total_goals,
                "completed_goals": completed_goals,
                "active_goals": active_goals,
                "completion_rate": round(completion_rate, 2),
                "total_target_amount": total_target,
                "total_current_amount": total_current,
                "overall_progress": round(overall_progress, 2),
                "upcoming_goals_count": len(upcoming_goals),
                "upcoming_goals": [
                    {
                        "id": g.id,
                        "name": g.name,
                        "target_date": g.target_date,
                        "progress_percentage": g.progress_percentage
                    } for g in upcoming_goals[:5]
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting goal analytics for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get goal analytics"
            )


# Create singleton instance for dependency injection
financial_goal_service = FinancialGoalService()

# Export both class and instance
__all__ = [
    "FinancialGoalService", 
    "financial_goal_service"
]

print("✅ FinancialGoalService refactored with clean architecture")
print("✅ Business logic layer properly implemented")