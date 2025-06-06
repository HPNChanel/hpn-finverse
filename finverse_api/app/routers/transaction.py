"""
Transactions router for FinVerse API - Unified transaction operations
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date
from pydantic import ValidationError
import logging

from app.schemas.transaction import TransactionResponse, TransactionList, CreateTransactionSchema, UpdateTransactionSchema
from app.services.transaction_service import transaction_service_instance  # Use singleton instance
from app.models.user import User
from app.core.auth import get_current_user
from app.db.session import get_db

logger = logging.getLogger(__name__)

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
    transactions = transaction_service_instance.get_user_transactions(
        db=db, 
        user_id=user_id,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date
    )
    
    # Convert to response format with wallet and category names
    return [TransactionResponse.from_orm_with_names(txn) for txn in transactions]


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
    transactions = transaction_service_instance.get_user_transactions(
        db=db, 
        user_id=user_id,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date
    )
    
    # Convert to response format with wallet and category names
    transaction_responses = [TransactionResponse.from_orm_with_names(txn) for txn in transactions]
    
    return {"transactions": transaction_responses}


@router.get("/{transaction_id}", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific transaction by ID"""
    user_id = current_user.id
    transaction = transaction_service_instance.get_transaction_by_id(db=db, transaction_id=transaction_id, user_id=user_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return TransactionResponse.from_orm_with_names(transaction)


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/create", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: CreateTransactionSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new transaction with automatic budget linking"""
    try:
        # CRITICAL FIX: Log the incoming request data for debugging
        logger.info(f"Received transaction data: {transaction_data.model_dump()}")
        logger.info(f"Raw transaction_type value: {transaction_data.transaction_type} (type: {type(transaction_data.transaction_type)})")
        
        user_id = current_user.id
        
        # CRITICAL VALIDATION: Ensure wallet_id is provided and valid
        if not transaction_data.wallet_id or transaction_data.wallet_id == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Valid wallet_id is required"
            )
        
        # CRITICAL FIX: Validate transaction_type explicitly
        if transaction_data.transaction_type is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="transaction_type is required"
            )
        
        if transaction_data.transaction_type not in [0, 1]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="transaction_type must be 0 (INCOME) or 1 (EXPENSE)"
            )
        
        # Log the validated transaction type
        transaction_type_name = "INCOME" if transaction_data.transaction_type == 0 else "EXPENSE"
        logger.info(f"Creating {transaction_type_name} transaction with type={transaction_data.transaction_type}")
        
        # ADDITIONAL VALIDATION: Verify the account exists and belongs to user
        from app.models.financial_account import FinancialAccount
        account = db.query(FinancialAccount).filter(
            FinancialAccount.id == transaction_data.wallet_id,
            FinancialAccount.user_id == user_id
        ).first()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account with ID {transaction_data.wallet_id} not found or doesn't belong to user"
            )
        
        # CRITICAL VALIDATION: Ensure amount is positive
        if transaction_data.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transaction amount must be greater than 0"
            )
        
        transaction = transaction_service_instance.create_transaction(
            db=db,
            user_id=user_id,
            transaction_type=transaction_data.transaction_type,  # Pass the EXACT value
            amount=transaction_data.amount,
            wallet_id=transaction_data.wallet_id,
            transaction_date=transaction_data.transaction_date,
            description=transaction_data.description,
            category_id=transaction_data.category_id,
            budget_id=transaction_data.budget_id
        )
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create transaction"
            )
        
        # CRITICAL FIX: Verify the saved transaction has correct type
        logger.info(f"Transaction created successfully: ID={transaction.id}, saved_type={transaction.transaction_type}")
        
        # Verify the created transaction has proper account mapping
        if not transaction.financial_account_id:
            logger.warning(f"Transaction {transaction.id} created without financial_account_id")
        
        return transaction
    except HTTPException:
        raise
    except ValidationError as e:
        # Log validation errors for debugging
        logger.error(f"Validation error: {e.json()}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors()
        )
    except Exception as e:
        logger.error(f"Error creating transaction: {str(e)}")
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
    update_dict = update_data.model_dump(exclude_unset=True)
    
    transaction = transaction_service_instance.update_transaction(
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
    
    success = transaction_service_instance.delete_transaction(
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


@router.get("/stats/current-month")
async def get_current_month_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict:
    """
    Get current month income and expense statistics for the current user.
    """
    try:
        logger.info(f"Getting current month stats for user {current_user.id}")
        
        stats = transaction_service_instance.get_current_month_stats(
            db=db, 
            user_id=current_user.id
        )
        
        # Validate response structure
        if not isinstance(stats, dict):
            raise ValueError("Invalid stats response format")
        
        # Ensure required fields exist
        required_fields = ["income", "expenses", "net", "transaction_count", "month", "year"]
        for field in required_fields:
            if field not in stats:
                stats[field] = 0 if field in ["income", "expenses", "net", "transaction_count"] else datetime.now().month if field == "month" else datetime.now().year
        
        logger.info(f"Current month stats completed for user {current_user.id}")
        return stats
        
    except Exception as e:
        logger.error(f"Error in get_current_month_stats endpoint for user {current_user.id}: {str(e)}")
        # Return a safe fallback response
        now = datetime.now()
        fallback_response = {
            "income": 0.0,
            "expenses": 0.0,
            "net": 0.0,
            "transaction_count": 0,
            "month": now.month,
            "year": now.year,
            "error": "Failed to fetch current month statistics"
        }
        return fallback_response


@router.get("/stats/monthly")
async def get_monthly_stats(
    year: Optional[int] = Query(None, description="Year for statistics (default: current year)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get monthly income and expense statistics for the current user.
    """
    try:
        print(f"Getting monthly stats for user {current_user.id}, year {year}")
        
        # Use the transaction service to get monthly stats
        stats = transaction_service_instance.get_monthly_stats(
            db=db, 
            user_id=current_user.id, 
            year=year
        )
        
        print(f"Monthly stats endpoint returning: {stats}")
        return stats
        
    except Exception as e:
        print(f"Error in get_monthly_stats endpoint: {str(e)}")
        # Return a safe fallback response
        current_year = year or datetime.now().year
        fallback_response = {
            "year": current_year,
            "monthly_data": [{"month": i, "income": 0, "expense": 0} for i in range(1, 13)],
            "total_income": 0,
            "total_expense": 0,
            "net_income": 0,
            "error": "Failed to fetch monthly statistics"
        }
        print(f"Returning fallback response: {fallback_response}")
        return fallback_response


@router.get("/stats/categories")
async def get_category_breakdown(
    type: str = Query(..., description="Transaction type: 'income' or 'expense'"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Get category breakdown for income or expenses"""
    try:
        stats = transaction_service_instance.get_category_breakdown(
            db=db,
            user_id=current_user.id,
            transaction_type=1 if type == 'income' else 0,
            start_date=start_date,
            end_date=end_date
        )
        return stats
    except Exception as e:
        print(f"Error in get_category_breakdown: {str(e)}")
        return {"categories": [], "total": 0}


@router.get("/stats/trends")
async def get_spending_trends(
    period: str = Query("monthly", description="Period: 'weekly', 'monthly', 'yearly'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Get spending trends over time"""
    try:
        trends = transaction_service_instance.get_spending_trends(
            db=db,
            user_id=current_user.id,
            period=period
        )
        return trends
    except Exception as e:
        print(f"Error in get_spending_trends: {str(e)}")
        return {"trends": [], "period": period}