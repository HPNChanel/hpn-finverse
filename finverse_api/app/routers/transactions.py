"""
Transactions router for FinVerse API
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from sqlalchemy.orm import Session

from app.schemas.transaction import TransactionResponse, TransactionList, TransactionCreate
from app.services import transaction_service
from app.models.user import User
from app.core.auth import get_current_user
from app.db.session import get_db

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


@router.get("/history", response_model=TransactionList, status_code=status.HTTP_200_OK)
async def get_transaction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transaction history for the authenticated user"""
    user_id = current_user.id
    transactions = transaction_service.get_user_transactions(db=db, user_id=user_id)
    
    return {"transactions": transactions}


@router.get("/{transaction_id}", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific transaction by ID"""
    user_id = current_user.id
    transaction = transaction_service.get_transaction_by_id(db=db, transaction_id=transaction_id, user_id=user_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return transaction


@router.post("/create", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new transaction"""
    user_id = current_user.id
    
    transaction = transaction_service.create_transaction(
        db=db,
        user_id=user_id,
        transaction_type=transaction_data.transaction_type,
        amount=transaction_data.amount,
        category=transaction_data.category,  # Using category string instead of category_id
        description=transaction_data.description
    )
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create transaction"
        )
    
    return transaction