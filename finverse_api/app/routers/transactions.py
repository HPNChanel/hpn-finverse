"""
Transactions router for FinVerse API
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import date
from pydantic import ValidationError

from app.schemas.transaction import TransactionResponse, TransactionList, CreateTransactionSchema, UpdateTransactionSchema
from app.services import transaction_service
from app.models.user import User
from app.core.auth import get_current_user
from app.db.session import get_db

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


@router.get("/", response_model=List[TransactionResponse], status_code=status.HTTP_200_OK)
async def get_all_transactions(
    transaction_type: Optional[int] = Query(None, description="Filter by transaction type (0=expense, 1=income)"),
    start_date: Optional[date] = Query(None, description="Filter transactions from this date"),
    end_date: Optional[date] = Query(None, description="Filter transactions until this date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all transactions for the authenticated user with optional filters"""
    user_id = current_user.id
    transactions = transaction_service.get_user_transactions(
        db=db, 
        user_id=user_id,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date
    )
    return transactions


@router.get("/history", response_model=TransactionList, status_code=status.HTTP_200_OK)
async def get_transaction_history(
    transaction_type: Optional[int] = Query(None, description="Filter by transaction type (0=expense, 1=income)"),
    start_date: Optional[date] = Query(None, description="Filter transactions from this date"),
    end_date: Optional[date] = Query(None, description="Filter transactions until this date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transaction history for the authenticated user with optional filters"""
    user_id = current_user.id
    transactions = transaction_service.get_user_transactions(
        db=db, 
        user_id=user_id,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date
    )
    
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


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/create", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: CreateTransactionSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new transaction"""
    try:
        # Log the incoming request data for debugging
        print(f"Received transaction data: {transaction_data.dict()}")
        
        user_id = current_user.id
        
        transaction = transaction_service.create_transaction(
            db=db,
            user_id=user_id,
            transaction_type=transaction_data.transaction_type,
            amount=transaction_data.amount,
            wallet_id=transaction_data.wallet_id,
            transaction_date=transaction_data.transaction_date,
            description=transaction_data.description
        )
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create transaction"
            )
        
        return transaction
    except HTTPException:
        raise
    except ValidationError as e:
        # Log validation errors for debugging
        print(f"Validation error: {e.json()}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors()
        )
    except Exception as e:
        print(f"Error creating transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.put("/{transaction_id}", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
async def update_transaction(
    transaction_id: int,
    update_data: UpdateTransactionSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing transaction"""
    user_id = current_user.id
    
    # Convert Pydantic model to dict, excluding unset values
    update_dict = update_data.dict(exclude_unset=True)
    
    transaction = transaction_service.update_transaction(
        db=db,
        transaction_id=transaction_id,
        user_id=user_id,
        update_data=update_dict
    )
    
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transaction"""
    user_id = current_user.id
    
    success = transaction_service.delete_transaction(
        db=db,
        transaction_id=transaction_id,
        user_id=user_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return None