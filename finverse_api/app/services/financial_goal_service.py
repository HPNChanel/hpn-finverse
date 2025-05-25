"""
Financial Goal service for FinVerse API
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from datetime import date
import logging

from app.models.financial_goal import FinancialGoal
from app.schemas.financial_goal import FinancialGoalCreate, FinancialGoalUpdate

logger = logging.getLogger(__name__)


class FinancialGoalService:
    """Service for managing financial goals"""
    
    def create_goal(self, db: Session, goal_data: FinancialGoalCreate, user_id: int) -> FinancialGoal:
        """Create a new financial goal for a user"""
        try:
            # Ensure current_amount defaults to 0 if not provided
            current_amount = goal_data.current_amount if goal_data.current_amount is not None else 0.0
            
            # Ensure status defaults to 1 (ongoing) if not provided
            status = goal_data.status if goal_data.status is not None else 1
            
            # Create the goal with validated data
            db_goal = FinancialGoal(
                user_id=user_id,
                name=goal_data.name.strip(),
                target_amount=goal_data.target_amount,
                current_amount=current_amount,
                start_date=goal_data.start_date,
                target_date=goal_data.target_date,
                description=goal_data.description.strip() if goal_data.description else None,
                priority=goal_data.priority,
                status=status,
                icon=goal_data.icon or '🎯',
                color=goal_data.color or '#1976d2'
            )
            
            db.add(db_goal)
            db.commit()
            db.refresh(db_goal)
            
            logger.info(f"Created financial goal {db_goal.id} for user {user_id}")
            return db_goal
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error creating goal for user {user_id}: {str(e)}")
            raise Exception(f"Failed to create goal: Database error")
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating goal for user {user_id}: {str(e)}")
            raise Exception(f"Failed to create goal: {str(e)}")
    
    def get_goals(self, db: Session, user_id: int) -> List[FinancialGoal]:
        """Get all financial goals for a user"""
        try:
            return db.query(FinancialGoal).filter(FinancialGoal.user_id == user_id).order_by(FinancialGoal.created_at.desc()).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching goals for user {user_id}: {str(e)}")
            raise Exception("Failed to fetch goals: Database error")
    
    def get_goal_by_id(self, db: Session, goal_id: int, user_id: int) -> Optional[FinancialGoal]:
        """Get a specific financial goal by ID for a user"""
        try:
            return db.query(FinancialGoal).filter(
                FinancialGoal.id == goal_id,
                FinancialGoal.user_id == user_id
            ).first()
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching goal {goal_id} for user {user_id}: {str(e)}")
            raise Exception("Failed to fetch goal: Database error")
    
    def update_goal(self, db: Session, goal_id: int, goal_data: FinancialGoalUpdate, user_id: int) -> Optional[FinancialGoal]:
        """Update a financial goal for a user"""
        try:
            db_goal = self.get_goal_by_id(db, goal_id, user_id)
            
            if db_goal is None:
                return None
            
            # Update only the fields that were provided
            update_data = goal_data.dict(exclude_unset=True)
            for key, value in update_data.items():
                if key == 'name' and value:
                    setattr(db_goal, key, value.strip())
                elif key == 'description' and value:
                    setattr(db_goal, key, value.strip())
                else:
                    setattr(db_goal, key, value)
            
            db.commit()
            db.refresh(db_goal)
            
            logger.info(f"Updated financial goal {goal_id} for user {user_id}")
            return db_goal
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error updating goal {goal_id} for user {user_id}: {str(e)}")
            raise Exception("Failed to update goal: Database error")
    
    def delete_goal(self, db: Session, goal_id: int, user_id: int) -> bool:
        """Delete a financial goal for a user"""
        try:
            db_goal = self.get_goal_by_id(db, goal_id, user_id)
            
            if db_goal is None:
                return False
            
            db.delete(db_goal)
            db.commit()
            
            logger.info(f"Deleted financial goal {goal_id} for user {user_id}")
            return True
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error deleting goal {goal_id} for user {user_id}: {str(e)}")
            raise Exception("Failed to delete goal: Database error")

    def get_goals_by_status(self, db: Session, user_id: int, status: int) -> List[FinancialGoal]:
        """Get all financial goals with a specific status for a user"""
        return db.query(FinancialGoal).filter(
            FinancialGoal.user_id == user_id,
            FinancialGoal.status == status
        ).all()
    
    def get_goals_by_priority(self, db: Session, user_id: int, priority: int) -> List[FinancialGoal]:
        """Get all financial goals with a specific priority for a user"""
        return db.query(FinancialGoal).filter(
            FinancialGoal.user_id == user_id,
            FinancialGoal.priority == priority
        ).all()
    
    def update_goal_progress(self, db: Session, goal_id: int, new_amount: float, user_id: int) -> Optional[FinancialGoal]:
        """Update the current amount for a goal"""
        db_goal = self.get_goal_by_id(db, goal_id, user_id)
        
        if db_goal is None:
            return None
        
        db_goal.current_amount = new_amount
        
        # Check if goal is completed
        if float(db_goal.current_amount) >= float(db_goal.target_amount):
            db_goal.status = 2  # Completed
        
        db.commit()
        db.refresh(db_goal)
        return db_goal