"""
Financial Account router for FinVerse API
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User
from app.models.financial_account import FinancialAccount
from app.schemas.financial_account import (
    FinancialAccountCreate, FinancialAccountResponse, TopUpRequest, 
    InternalTransferCreate, InternalTransactionResponse,
    AccountType, AccountSummary, FinancialAccountList
)
from app.core.auth import get_current_user
from app.services.financial_account_service import FinancialAccountService
from app.schemas.internal_transaction import (
    InternalTransactionCreate,
    InternalTransactionResponse,
    InternalTransactionList
)
from app.services.internal_transaction_service import InternalTransactionService


router = APIRouter(
    prefix="/accounts",
    tags=["Financial Accounts"]
)

# List of available account types
ACCOUNT_TYPES = [
    AccountType(
        type="wallet",
        label="Wallet",
        icon="account_balance_wallet",
        color="#1976d2",
        description="Everyday spending account"
    ),
    AccountType(
        type="saving",
        label="Savings",
        icon="savings",
        color="#2e7d32",
        description="Long-term savings account"
    ),
    AccountType(
        type="investment",
        label="Investment",
        icon="trending_up",
        color="#9c27b0",
        description="Investment portfolio account"
    ),
    AccountType(
        type="goal",
        label="Goal Fund",
        icon="emoji_events",
        color="#ff9800",
        description="Saving for a specific goal"
    )
]

@router.get("/types", response_model=List[AccountType])
async def get_account_types(current_user: User = Depends(get_current_user)):
    """
    Get all available account types
    """
    return ACCOUNT_TYPES

@router.post("/create", response_model=FinancialAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account: FinancialAccountCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new financial account for the current user
    """
    try:
        # Validate account type
        valid_types = [t.type for t in ACCOUNT_TYPES]
        if account.type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid account type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Set defaults for icon and color if not provided
        if not account.icon or not account.color:
            default_type = next((t for t in ACCOUNT_TYPES if t.type == account.type), None)
            if default_type:
                account.icon = account.icon or default_type.icon
                account.color = account.color or default_type.color
        
        # Use service to create account
        account_service = FinancialAccountService()
        db_account = account_service.create_account(db, account, current_user.id)
        
        # Convert SQLAlchemy model to dictionary
        account_dict = {
            "id": db_account.id,
            "user_id": db_account.user_id,
            "name": db_account.name,
            "type": db_account.type,
            "balance": db_account.balance,
            "created_at": db_account.created_at,
            "icon": db_account.icon,
            "color": db_account.color,
            "created_by_default": db_account.created_by_default,
            "note": db_account.note,
            "currency": db_account.currency
        }
        
        return account_dict
    except Exception as e:
        # Log the error
        print(f"Error creating account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create account: {str(e)}"
        )

@router.get("/list", response_model=FinancialAccountList)
async def list_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all financial accounts for the current user
    """
    db_accounts = db.query(FinancialAccount).filter(FinancialAccount.user_id == current_user.id).all()
    
    # Convert SQLAlchemy models to dictionaries
    accounts = []
    for account in db_accounts:
        accounts.append({
            "id": account.id,
            "user_id": account.user_id,
            "name": account.name,
            "type": account.type,
            "balance": account.balance,
            "created_at": account.created_at,
            "icon": account.icon,
            "color": account.color,
            "created_by_default": account.created_by_default,
            "note": account.note,
            "currency": account.currency
        })
    
    return {"accounts": accounts}

@router.get("/summary", response_model=AccountSummary)
async def get_account_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get summary statistics for all accounts
    """
    accounts = db.query(FinancialAccount).filter(FinancialAccount.user_id == current_user.id).all()
    
    total_balance = sum(account.balance for account in accounts)
    
    wallet_balance = sum(account.balance for account in accounts if account.type == "wallet")
    saving_balance = sum(account.balance for account in accounts if account.type == "saving")
    investment_balance = sum(account.balance for account in accounts if account.type == "investment")
    goal_balance = sum(account.balance for account in accounts if account.type == "goal")
    
    return {
        "total": total_balance,
        "wallet": wallet_balance,
        "saving": saving_balance,
        "investment": investment_balance,
        "goal": goal_balance,
        "account_count": len(accounts)
    }

@router.post("/top-up", response_model=FinancialAccountResponse)
async def top_up_account(
    top_up: TopUpRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add funds to an account
    """
    # Get account and verify ownership
    account = db.query(FinancialAccount).filter(
        FinancialAccount.id == top_up.account_id,
        FinancialAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Validate amount
    if top_up.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    
    # Update balance
    account.balance += top_up.amount
    db.commit()
    db.refresh(account)
    
    # Convert SQLAlchemy model to dictionary
    account_dict = {
        "id": account.id,
        "user_id": account.user_id,
        "name": account.name,
        "type": account.type,
        "balance": account.balance,
        "created_at": account.created_at,
        "icon": account.icon,
        "color": account.color,
        "created_by_default": account.created_by_default,
        "note": account.note,
        "currency": account.currency
    }
    
    return account_dict