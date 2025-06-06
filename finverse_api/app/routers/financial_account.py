"""
Financial Account router for FinVerse API
"""

from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
import logging  # Added missing import

from app.db.session import get_db
from app.models.user import User
from app.models.financial_account import FinancialAccount
from app.schemas.financial_account import (
    FinancialAccountCreate, FinancialAccountUpdate, FinancialAccountResponse, TopUpRequest, 
    AccountType, AccountSummary, FinancialAccountList, ToggleVisibilityRequest
)
from app.core.auth import get_current_user
from app.services.financial_account_service import FinancialAccountService


router = APIRouter(
    prefix="/accounts",
    tags=["Financial Accounts"]
)

# Create a separate router for wallet endpoints
wallet_router = APIRouter(
    prefix="/wallets",
    tags=["Wallets"]
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

logger = logging.getLogger(__name__)  # Added logger

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
        
        # Log received data for debugging
        print(f"Creating account with data: {account.dict()}")
        
        # Use service to create account
        account_service = FinancialAccountService()
        db_account = account_service.create_account(db, account, current_user.id)
        
        # Convert SQLAlchemy model to dictionary with proper Decimal handling
        account_dict = {
            "id": db_account.id,
            "user_id": db_account.user_id,
            "name": db_account.name,
            "type": db_account.type,
            "balance": float(db_account.balance) if isinstance(db_account.balance, Decimal) else db_account.balance,
            "created_at": db_account.created_at.isoformat() if isinstance(db_account.created_at, datetime) else str(db_account.created_at),
            "icon": db_account.icon,
            "color": db_account.color,
            "created_by_default": db_account.created_by_default,
            "note": db_account.note,
            "currency": db_account.currency,
            "is_hidden": getattr(db_account, 'is_hidden', False),
            "is_active": getattr(db_account, 'is_active', True)
        }
        
        return account_dict
    except HTTPException:
        # Re-raise HTTP exceptions directly
        raise
    except ValueError as ve:
        # Handle value errors (often from validation)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
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
            "currency": account.currency,
            "is_hidden": account.is_hidden
        })
    
    return {"accounts": accounts}

@router.get("/summary", response_model=AccountSummary)
async def get_account_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get summary statistics for all accounts (excluding hidden accounts) with optimized queries
    """
    try:
        # Get all accounts in one query
        all_accounts = db.query(FinancialAccount).filter(
            FinancialAccount.user_id == current_user.id
        ).all()
        
        visible_accounts = [acc for acc in all_accounts if not getattr(acc, 'is_hidden', False)]
        hidden_count = len(all_accounts) - len(visible_accounts)
        
        # Get budget information from Budget model with error handling
        try:
            from app.models.budget import Budget
            
            budget_stats = db.query(
                func.count(Budget.id).label('active_count'),
                func.sum(Budget.limit_amount).label('total_limit'),
                func.sum(Budget.spent_amount).label('total_spent')
            ).filter(
                Budget.user_id == current_user.id,
                Budget.is_active == True
            ).first()
            
            active_budgets_count = budget_stats.active_count or 0
            total_budget_limit = float(budget_stats.total_limit or 0.0)
            total_budget_spent = float(budget_stats.total_spent or 0.0)
        except Exception as e:
            logger.warning(f"Error fetching budget stats: {str(e)}")
            active_budgets_count = 0
            total_budget_limit = 0.0
            total_budget_spent = 0.0
        
        # Calculate balances by type with validation and better error handling
        total_balance = 0
        type_balances = {"wallet": 0, "saving": 0, "investment": 0, "goal": 0}
        
        for account in visible_accounts:
            try:
                balance = float(getattr(account, 'balance', 0))
                total_balance += balance
                
                account_type = getattr(account, 'type', 'wallet')
                if account_type in type_balances:
                    type_balances[account_type] += balance
                else:
                    logger.warning(f"Unknown account type: {account_type}, defaulting to wallet")
                    type_balances["wallet"] += balance
            except (ValueError, TypeError) as e:
                logger.error(f"Error processing account {getattr(account, 'id', 'unknown')}: {str(e)}")
                continue
        
        return {
            "total_balance": total_balance,
            "wallet": type_balances["wallet"],
            "saving": type_balances["saving"],
            "investment": type_balances["investment"],
            "goal": type_balances["goal"],
            "account_count": len(visible_accounts),
            "hidden_account_count": hidden_count,
            "active_budgets": active_budgets_count,
            "total_budget_limit": total_budget_limit,
            "total_budget_spent": total_budget_spent
        }
    except Exception as e:
        logger.error(f"Error in get_account_summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get account summary: {str(e)}"
        )

@router.post("/top-up", response_model=FinancialAccountResponse)
async def top_up_account(
    top_up: TopUpRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add funds to an account with proper Decimal handling
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
    
    # Update balance with Decimal arithmetic
    current_balance = account.balance
    if not isinstance(current_balance, Decimal):
        current_balance = Decimal(str(current_balance))
    
    amount_decimal = Decimal(str(top_up.amount))
    account.balance = current_balance + amount_decimal
    
    db.commit()
    db.refresh(account)
    
    # Convert SQLAlchemy model to dictionary with proper Decimal handling
    account_dict = {
        "id": account.id,
        "user_id": account.user_id,
        "name": account.name,
        "type": account.type,
        "balance": float(account.balance) if isinstance(account.balance, Decimal) else account.balance,
        "created_at": account.created_at,
        "icon": account.icon,
        "color": account.color,
        "created_by_default": account.created_by_default,
        "note": account.note,
        "currency": account.currency,
        "is_hidden": account.is_hidden
    }
    
    return account_dict

@router.put("/{account_id}", response_model=FinancialAccountResponse)
async def update_account(
    account_id: int,
    update_data: FinancialAccountUpdate,  # Changed from dict to proper schema
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing financial account
    """
    # Use the service to update account
    account_service = FinancialAccountService()
    updated_account = account_service.update_account(db, account_id, current_user.id, update_data)
    
    if not updated_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Convert SQLAlchemy model to dictionary
    account_dict = {
        "id": updated_account.id,
        "user_id": updated_account.user_id,
        "name": updated_account.name,
        "type": updated_account.type,
        "balance": updated_account.balance,
        "created_at": updated_account.created_at,
        "icon": updated_account.icon,
        "color": updated_account.color,
        "created_by_default": updated_account.created_by_default,
        "note": updated_account.note,
        "currency": updated_account.currency,
        "is_hidden": updated_account.is_hidden
    }
    
    return account_dict

@router.patch("/{account_id}/visibility", response_model=FinancialAccountResponse)
async def toggle_account_visibility(
    account_id: int,
    visibility_data: ToggleVisibilityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle account visibility (hide/unhide account)
    """
    # Get account and verify ownership
    account = db.query(FinancialAccount).filter(
        FinancialAccount.id == account_id,
        FinancialAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Update visibility
    account.is_hidden = visibility_data.is_hidden
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
        "currency": account.currency,
        "is_hidden": account.is_hidden
    }
    
    return account_dict

@router.delete("/{account_id}")
async def delete_account(
    account_id: int,
    force: bool = False,  # Add force parameter
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a financial account
    """
    # Get account and verify ownership
    account = db.query(FinancialAccount).filter(
        FinancialAccount.id == account_id,
        FinancialAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Check if account has a balance
    if account.balance > 0 and not force:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot delete account with a positive balance. Please transfer or withdraw funds first."
        )
    
    # If force delete, handle cascading deletions
    if force:
        try:
            # Delete associated transactions
            from app.models.transaction import Transaction
            db.query(Transaction).filter(Transaction.wallet_id == account_id).delete()
            
            # Delete associated goals
            from app.models.financial_goal import FinancialGoal
            db.query(FinancialGoal).filter(FinancialGoal.account_id == account_id).delete()
            
            # Delete associated stakes
            from app.models.stake import Stake
            db.query(Stake).filter(Stake.account_id == account_id).delete()
            
            # Delete the account
            db.delete(account)
            db.commit()
            
            return {
                "message": "Account and all associated data deleted successfully",
                "deleted_account": {
                    "id": account.id,
                    "name": account.name,
                    "type": account.type
                }
            }
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete account: {str(e)}"
            )
    
    # Check for foreign key constraints - transactions using this account
    from app.models.transaction import Transaction
    transactions_count = db.query(Transaction).filter(
        Transaction.wallet_id == account_id
    ).count()
    
    if transactions_count > 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": f"Cannot delete account. It has {transactions_count} associated transactions.",
                "suggestion": "Please remove transactions first or use force delete.",
                "dependencies": {
                    "transactions": transactions_count
                }
            }
        )
    
    # Check for goals using this account
    from app.models.financial_goal import FinancialGoal
    goals_count = db.query(FinancialGoal).filter(
        FinancialGoal.account_id == account_id
    ).count()
    
    if goals_count > 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": f"Cannot delete account. It has {goals_count} associated goals.",
                "suggestion": "Please remove goals first or use force delete.",
                "dependencies": {
                    "goals": goals_count
                }
            }
        )
    
    # Check for stakes using this account
    from app.models.stake import Stake
    stakes_count = db.query(Stake).filter(
        Stake.account_id == account_id
    ).count()
    
    if stakes_count > 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": f"Cannot delete account. It has {stakes_count} associated stakes.",
                "suggestion": "Please remove stakes first or use force delete.",
                "dependencies": {
                    "stakes": stakes_count
                }
            }
        )
    
    try:
        db.delete(account)
        db.commit()
        
        return {
            "message": "Account deleted successfully",
            "deleted_account": {
                "id": account.id,
                "name": account.name,
                "type": account.type
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )

@wallet_router.delete("/{wallet_id}")
async def delete_wallet(
    wallet_id: int = Path(..., description="The ID of the wallet to delete"),
    force: bool = Query(False, description="Force delete wallet and all associated data"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a wallet/financial account with proper validation
    """
    # Get account and verify ownership
    account = db.query(FinancialAccount).filter(
        FinancialAccount.id == wallet_id,
        FinancialAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found or you don't have permission to delete it"
        )
    
    # Check if account has a balance
    if account.balance > 0 and not force:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Cannot delete wallet with a positive balance.",
                "suggestion": "Please transfer or withdraw funds first, or use force delete.",
                "current_balance": float(account.balance),
                "force_delete_url": f"/api/v1/wallets/{wallet_id}?force=true"
            }
        )
    
    # If force delete, handle cascading deletions
    if force:
        try:
            # Delete associated transactions
            from app.models.transaction import Transaction
            transactions_deleted = db.query(Transaction).filter(Transaction.wallet_id == wallet_id).count()
            db.query(Transaction).filter(Transaction.wallet_id == wallet_id).delete()
            
            # Delete associated goals
            from app.models.financial_goal import FinancialGoal
            goals_deleted = db.query(FinancialGoal).filter(FinancialGoal.account_id == wallet_id).count()
            db.query(FinancialGoal).filter(FinancialGoal.account_id == wallet_id).delete()
            
            # Delete associated stakes
            from app.models.stake import Stake
            stakes_deleted = db.query(Stake).filter(Stake.account_id == wallet_id).count()
            db.query(Stake).filter(Stake.account_id == wallet_id).delete()
            
            # Delete the account
            db.delete(account)
            db.commit()
            
            return {
                "success": True,
                "message": "Wallet and all associated data deleted successfully",
                "deleted_wallet": {
                    "id": account.id,
                    "name": account.name,
                    "type": account.type
                },
                "cleanup_summary": {
                    "transactions_deleted": transactions_deleted,
                    "goals_deleted": goals_deleted,
                    "stakes_deleted": stakes_deleted
                }
            }
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete wallet: {str(e)}"
            )
    
    # Check for foreign key constraints - transactions using this account
    from app.models.transaction import Transaction
    transactions_count = db.query(Transaction).filter(
        Transaction.wallet_id == wallet_id
    ).count()
    
    if transactions_count > 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": f"Cannot delete wallet. It has {transactions_count} associated transactions.",
                "suggestion": "Please remove transactions first or use force delete (add ?force=true to the URL).",
                "dependencies": {
                    "transactions": transactions_count
                },
                "force_delete_url": f"/api/v1/wallets/{wallet_id}?force=true"
            }
        )
    
    # Check for goals using this account
    from app.models.financial_goal import FinancialGoal
    goals_count = db.query(FinancialGoal).filter(
        FinancialGoal.account_id == wallet_id
    ).count()
    
    if goals_count > 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": f"Cannot delete wallet. It has {goals_count} associated goals.",
                "suggestion": "Please remove goals first or use force delete (add ?force=true to the URL).",
                "dependencies": {
                    "goals": goals_count
                },
                "force_delete_url": f"/api/v1/wallets/{wallet_id}?force=true"
            }
        )
    
    # Check for stakes using this account
    from app.models.stake import Stake
    stakes_count = db.query(Stake).filter(
        Stake.account_id == wallet_id
    ).count()
    
    if stakes_count > 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": f"Cannot delete wallet. It has {stakes_count} associated stakes.",
                "suggestion": "Please remove stakes first or use force delete (add ?force=true to the URL).",
                "dependencies": {
                    "stakes": stakes_count
                },
                "force_delete_url": f"/api/v1/wallets/{wallet_id}?force=true"
            }
        )
    
    try:
        db.delete(account)
        db.commit()
        
        return {
            "success": True,
            "message": "Wallet deleted successfully",
            "deleted_wallet": {
                "id": account.id,
                "name": account.name,
                "type": account.type
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete wallet: {str(e)}"
        )

# Add a new endpoint to check dependencies before deletion
@wallet_router.get("/{wallet_id}/dependencies")
async def check_wallet_dependencies(
    wallet_id: int = Path(..., description="The ID of the wallet to check"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check what dependencies exist for a wallet before deletion
    """
    # Get account and verify ownership
    account = db.query(FinancialAccount).filter(
        FinancialAccount.id == wallet_id,
        FinancialAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found or you don't have permission to access it"
        )
    
    # Check dependencies
    from app.models.transaction import Transaction
    from app.models.financial_goal import FinancialGoal
    from app.models.stake import Stake
    
    transactions_count = db.query(Transaction).filter(Transaction.wallet_id == wallet_id).count()
    goals_count = db.query(FinancialGoal).filter(FinancialGoal.account_id == wallet_id).count()
    stakes_count = db.query(Stake).filter(Stake.account_id == wallet_id).count()
    
    can_delete = (
        account.balance == 0 and 
        transactions_count == 0 and 
        goals_count == 0 and 
        stakes_count == 0
    )
    
    return {
        "wallet_id": wallet_id,
        "wallet_name": account.name,
        "can_delete": can_delete,
        "balance": float(account.balance),
        "dependencies": {
            "transactions": transactions_count,
            "goals": goals_count,
            "stakes": stakes_count
        },
        "blocking_factors": [
            f"Positive balance: {account.balance}" if account.balance > 0 else None,
            f"{transactions_count} transactions" if transactions_count > 0 else None,
            f"{goals_count} goals" if goals_count > 0 else None,
            f"{stakes_count} stakes" if stakes_count > 0 else None
        ],
        "suggestions": [
            "Transfer or withdraw funds" if account.balance > 0 else None,
            "Delete associated transactions" if transactions_count > 0 else None,
            "Delete associated goals" if goals_count > 0 else None,
            "Delete associated stakes" if stakes_count > 0 else None,
            "Use force delete to remove all dependencies at once"
        ]
    }

@router.get("/{account_id}/balance")
async def get_account_balance(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get balance for a specific account
    """
    # Get account and verify ownership
    account = db.query(FinancialAccount).filter(
        FinancialAccount.id == account_id,
        FinancialAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    return {"balance": float(account.balance)}

@router.patch("/{account_id}/balance")
async def update_account_balance(
    account_id: int,
    balance_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update account balance directly
    """
    # Get account and verify ownership
    account = db.query(FinancialAccount).filter(
        FinancialAccount.id == account_id,
        FinancialAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Validate balance
    new_balance = balance_data.get('balance')
    if new_balance is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Balance field is required"
        )
    
    if new_balance < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Balance cannot be negative"
        )
    
    # Update balance
    account.balance = new_balance
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
        "currency": account.currency,
        "is_hidden": account.is_hidden
    }
    
    return account_dict
