"""
Financial Goal service for FinVerse API
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.models.financial_goal import FinancialGoal
from app.schemas.financial_goal import FinancialGoalCreate, FinancialGoalUpdate


class FinancialGoalService:
    """Service for managing financial goals"""
    
    def create_goal(self, db: Session, goal_data: FinancialGoalCreate, user_id: int) -> FinancialGoal:
        """Create a new financial goal for a user"""
        db_goal = FinancialGoal(
            user_id=user_id,
            name=goal_data.name,
            target_amount=goal_data.target_amount,
            current_amount=goal_data.current_amount,
            start_date=goal_data.start_date,
            target_date=goal_data.target_date,
            description=goal_data.description,
            priority=goal_data.priority,
            status=goal_data.status,
            icon=goal_data.icon,
            color=goal_data.color
        )
        
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        return db_goal
    
    def get_goals(self, db: Session, user_id: int) -> List[FinancialGoal]:
        """Get all financial goals for a user"""
        return db.query(FinancialGoal).filter(FinancialGoal.user_id == user_id).all()
    
    def get_goal_by_id(self, db: Session, goal_id: int, user_id: int) -> Optional[FinancialGoal]:
        """Get a specific financial goal by ID for a user"""
        return db.query(FinancialGoal).filter(
            FinancialGoal.id == goal_id,
            FinancialGoal.user_id == user_id
        ).first()
    
    def update_goal(self, db: Session, goal_id: int, goal_data: FinancialGoalUpdate, user_id: int) -> Optional[FinancialGoal]:
        """Update a financial goal for a user"""
        db_goal = self.get_goal_by_id(db, goal_id, user_id)
        
        if db_goal is None:
            return None
        
        # Update only the fields that were provided
        update_data = goal_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_goal, key, value)
        
        db.commit()
        db.refresh(db_goal)
        return db_goal
    
    def delete_goal(self, db: Session, goal_id: int, user_id: int) -> bool:
        """Delete a financial goal for a user"""
        db_goal = self.get_goal_by_id(db, goal_id, user_id)
        
        if db_goal is None:
            return False
        
        db.delete(db_goal)
        db.commit()
        return True
    
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