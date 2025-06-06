"""
Financial Goal router for FinVerse API
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.models.financial_goal import FinancialGoal
from app.schemas.financial_goal import (
    FinancialGoalCreate, FinancialGoalUpdate, FinancialGoalResponse, FinancialGoalList
)
from app.core.auth import get_current_user
from app.services.financial_goal_service import FinancialGoalService
from app.schemas.response import StandardResponse


router = APIRouter(
    prefix="/goals",
    tags=["Financial Goals"]
)


@router.get("", response_model=StandardResponse)
async def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all financial goals for the current user
    """
    try:
        goal_service = FinancialGoalService()
        goals = goal_service.get_goals(db, current_user.id)
        
        # Convert goals to response format
        goal_responses = []
        for goal in goals:
            goal_responses.append(
                FinancialGoalResponse.from_orm(goal)
            )
        
        # Return goals array directly in data field
        return StandardResponse(
            success=True,
            message="Goals retrieved successfully",
            data=goal_responses  # Return array directly, not wrapped in object
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            message="Failed to retrieve goals",
            errors=[{"detail": str(e)}]
        )


@router.get("/{goal_id}", response_model=StandardResponse)
async def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific financial goal by ID
    """
    try:
        goal_service = FinancialGoalService()
        goal = goal_service.get_goal_by_id(db, goal_id, current_user.id)
        
        if goal is None:
            return StandardResponse(
                success=False,
                message="Goal not found",
                errors=[{"detail": "Goal not found or you don't have permission to access it"}]
            )
        
        return StandardResponse(
            success=True,
            message="Goal retrieved successfully",
            data=FinancialGoalResponse.from_orm(goal)
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            message="Failed to retrieve goal",
            errors=[{"detail": str(e)}]
        )


@router.post("", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal: FinancialGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new financial goal for the current user
    """
    try:
        print(f"Creating goal for user {current_user.id} (email: {current_user.email}) with data: {goal.model_dump()}")
        
        goal_service = FinancialGoalService()
        db_goal = goal_service.create_goal(db, goal, current_user.id)
        
        # Build response with proper field mapping
        goal_response = FinancialGoalResponse(
            id=db_goal.id,
            user_id=db_goal.user_id,
            name=db_goal.name,
            target_amount=db_goal.target_amount,
            current_amount=db_goal.current_amount,
            start_date=db_goal.start_date,
            target_date=db_goal.target_date,
            description=db_goal.description,
            priority=db_goal.priority,
            status=db_goal.status,
            icon=db_goal.icon,
            color=db_goal.color,
            progress_percentage=db_goal.progress_percentage,
            created_at=db_goal.created_at,
            updated_at=db_goal.updated_at
        )
        
        return StandardResponse(
            success=True,
            message="Goal created successfully",
            data=goal_response
        )
    except ValueError as e:
        print(f"Validation error creating goal: {str(e)}")
        return StandardResponse(
            success=False,
            message="Validation error",
            errors=[{"detail": str(e)}]
        )
    except Exception as e:
        print(f"Error creating goal: {str(e)}")
        return StandardResponse(
            success=False,
            message="Failed to create goal",
            errors=[{"detail": str(e)}]
        )


@router.put("/{goal_id}", response_model=StandardResponse)
async def update_goal(
    goal_id: int,
    goal_update: FinancialGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a specific financial goal
    """
    try:
        goal_service = FinancialGoalService()
        updated_goal = goal_service.update_goal(db, goal_id, goal_update, current_user.id)
        
        if updated_goal is None:
            return StandardResponse(
                success=False,
                message="Goal not found",
                errors=[{"detail": "Goal not found or you don't have permission to update it"}]
            )
        
        return StandardResponse(
            success=True,
            message="Goal updated successfully",
            data=FinancialGoalResponse.from_orm(updated_goal)
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            message="Failed to update goal",
            errors=[{"detail": str(e)}]
        )


@router.delete("/{goal_id}", response_model=StandardResponse)
async def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a specific financial goal
    """
    try:
        goal_service = FinancialGoalService()
        success = goal_service.delete_goal(db, goal_id, current_user.id)
        
        if not success:
            return StandardResponse(
                success=False,
                message="Goal not found",
                errors=[{"detail": "Goal not found or you don't have permission to delete it"}]
            )
        
        return StandardResponse(
            success=True,
            message="Goal deleted successfully",
            data=None
        )
    except Exception as e:
        return StandardResponse(
            success=False,
            message="Failed to delete goal",
            errors=[{"detail": str(e)}]
        )