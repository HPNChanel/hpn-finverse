"""
Internal Transaction router for FinVerse API
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.schemas.internal_transaction import (
    InternalTransactionCreate,
    InternalTransactionResponse,
    InternalTransactionList
)
from app.services.internal_transaction_service import InternalTransactionService
from app.core.auth import get_current_user


router = APIRouter(
    prefix="/accounts",
    tags=["Transactions"]
)


@router.post("/transfer", response_model=InternalTransactionResponse)
def transfer_funds(
    transfer_data: InternalTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Transfer funds between two accounts owned by the current user
    """
    transaction = InternalTransactionService.create_transaction(db, transfer_data, current_user.id)
    return {
        "id": transaction.id,
        "from_account_id": transaction.from_account_id,
        "to_account_id": transaction.to_account_id,
        "amount": transaction.amount,
        "timestamp": transaction.timestamp,
        "note": transaction.note
    }


@router.get("/transactions", response_model=InternalTransactionList)
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all internal transactions for the current user
    """
    transactions_list = InternalTransactionService.get_user_transactions(db, current_user.id)
    return {
        "transactions": [
            {
                "id": t.id,
                "from_account_id": t.from_account_id,
                "to_account_id": t.to_account_id,
                "amount": t.amount,
                "timestamp": t.timestamp,
                "note": t.note
            } for t in transactions_list
        ]
    }
