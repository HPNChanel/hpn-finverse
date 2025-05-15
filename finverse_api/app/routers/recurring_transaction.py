"""
Router for recurring transactions in FinVerse API
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.logger import logger

from app.core.auth import get_current_user
from app.db.session import get_db
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    RecurringTransactionResponse,
    RecurringTransactionList
)
from app.schemas.response import SuccessResponse
from app.services.recurring_transaction_service import RecurringTransactionService
from app.models.user import User

router = APIRouter(
    prefix="/recurring",
    tags=["recurring-transactions"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=RecurringTransactionList)
async def get_recurring_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all recurring transactions for the current user
    """
    transactions = RecurringTransactionService.get_recurring_transactions(db, current_user.id)
    return {"recurring_transactions": transactions}


@router.get("/{transaction_id}", response_model=RecurringTransactionResponse)
async def get_recurring_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific recurring transaction by ID
    """
    return RecurringTransactionService.get_recurring_transaction(db, transaction_id, current_user.id)


@router.post("/", response_model=RecurringTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring_transaction(
    transaction_data: RecurringTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new recurring transaction
    """
    try:
        return RecurringTransactionService.create_recurring_transaction(db, transaction_data, current_user.id)
    except Exception as e:
        logger.error(f"[RecurringTransaction] Error creating transaction: {str(e)}")
        logger.error(f"[RecurringTransaction] Payload: {transaction_data.dict()}")
        logger.error(f"[RecurringTransaction] User ID: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create recurring transaction"
        )


@router.put("/{transaction_id}", response_model=RecurringTransactionResponse)
async def update_recurring_transaction(
    transaction_id: int,
    transaction_data: RecurringTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing recurring transaction
    """
    return RecurringTransactionService.update_recurring_transaction(
        db, transaction_id, transaction_data, current_user.id
    )


@router.delete("/{transaction_id}", response_model=SuccessResponse)
async def delete_recurring_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a recurring transaction
    """
    success = RecurringTransactionService.delete_recurring_transaction(db, transaction_id, current_user.id)
    return {"success": success, "message": "Recurring transaction deleted successfully"}


@router.post("/{transaction_id}/process", response_model=RecurringTransactionResponse)
async def process_recurring_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a recurring transaction and update its next occurrence
    """
    # First verify ownership
    transaction = RecurringTransactionService.get_recurring_transaction(db, transaction_id, current_user.id)
    
    # Update the next occurrence date
    return RecurringTransactionService.update_next_occurrence(db, transaction_id) 