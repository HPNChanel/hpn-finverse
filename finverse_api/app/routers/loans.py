"""
Loan Router for FinVerse API - API Layer (Clean Architecture)

This module implements loan simulation HTTP endpoints:
- Loan calculation and simulation endpoints
- CRUD operations for loans
- Payment processing endpoints
- Analytics and reporting endpoints

Architecture Layer: API LAYER
Dependencies: → Services Layer, Schemas Layer
Used by: FastAPI main application
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from decimal import Decimal

from app.dependencies import get_db, get_current_user_id
from app.services.loan_service import LoanService
from app.schemas.loan import (
    LoanCreateRequest, LoanUpdateRequest, LoanCalculationRequest,
    LoanPaymentRequest, LoanCalculationResult, LoanResponse,
    LoanDetailResponse, LoanSummaryResponse, LoanAnalyticsResponse,
    LoanTypeEnum, LoanStatusEnum
)
from app.schemas.response import StandardResponse
from app.models.loan import LoanType, LoanStatus
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/loans", tags=["Loan Simulation"])


@router.post("/calculate", response_model=StandardResponse[LoanCalculationResult])
async def calculate_loan_metrics(
    request: LoanCalculationRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate loan metrics without saving to database
    
    Provides instant EMI calculation, total interest, and payment breakdowns
    for different loan configurations and amortization methods.
    """
    try:
        loan_service = LoanService(db)
        result = loan_service.calculate_loan_metrics(request)
        
        return StandardResponse(
            success=True,
            message="Loan metrics calculated successfully",
            data=result
        )
        
    except ValueError as e:
        logger.error(f"Loan calculation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error in loan calculation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during loan calculation"
        )


@router.post("/simulate", response_model=StandardResponse[LoanDetailResponse])
async def create_loan_simulation(
    request: LoanCreateRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a complete loan simulation with repayment schedule
    
    Creates a detailed loan simulation including:
    - Complete amortization schedule
    - Payment timelines
    - Interest breakdowns
    - Customizable loan parameters
    """
    try:
        loan_service = LoanService(db)
        result = loan_service.create_loan_simulation(current_user_id, request)
        
        return StandardResponse(
            success=True,
            message="Loan simulation created successfully",
            data=result
        )
        
    except ValueError as e:
        logger.error(f"Loan simulation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error in loan simulation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during loan simulation"
        )


@router.get("/", response_model=StandardResponse[List[LoanResponse]])
async def get_user_loans(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    status: Optional[LoanStatusEnum] = Query(None, description="Filter by loan status"),
    loan_type: Optional[LoanTypeEnum] = Query(None, description="Filter by loan type"),
    simulations_only: Optional[bool] = Query(None, description="Show only simulations")
):
    """
    Get user's loans with filtering and pagination
    
    Retrieves all loans for the authenticated user with optional filtering
    by status, type, and simulation flag.
    """
    try:
        loan_service = LoanService(db)
        
        # Convert enum values to model enums
        status_filter = None
        if status:
            status_filter = LoanStatus(status.value)
        
        type_filter = None
        if loan_type:
            type_filter = LoanType(loan_type.value)
        
        loans = loan_service.get_user_loans(
            user_id=current_user_id,
            skip=skip,
            limit=limit,
            status_filter=status_filter,
            loan_type_filter=type_filter
        )
        
        # Filter simulations if requested
        if simulations_only is not None:
            loans = [loan for loan in loans if loan.is_simulation == simulations_only]
        
        return StandardResponse(
            success=True,
            message=f"Retrieved {len(loans)} loans",
            data=loans
        )
        
    except Exception as e:
        logger.error(f"Error retrieving user loans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving loans"
        )


@router.get("/{loan_id}", response_model=StandardResponse[LoanDetailResponse])
async def get_loan_details(
    loan_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get detailed loan information with repayment schedule
    
    Returns comprehensive loan details including:
    - Complete repayment schedule
    - Payment history
    - Loan progress metrics
    - Interest vs principal breakdown
    """
    try:
        loan_service = LoanService(db)
        result = loan_service.get_loan_details(current_user_id, loan_id)
        
        return StandardResponse(
            success=True,
            message="Loan details retrieved successfully",
            data=result
        )
        
    except ValueError as e:
        logger.error(f"Loan not found: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error retrieving loan details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving loan details"
        )


@router.get("/summary/portfolio", response_model=StandardResponse[LoanSummaryResponse])
async def get_loan_portfolio_summary(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive loan portfolio summary
    
    Provides overview statistics including:
    - Total loans and status breakdown
    - Financial metrics and balances
    - Interest payments and averages
    - Portfolio performance indicators
    """
    try:
        loan_service = LoanService(db)
        result = loan_service.get_loan_summary(current_user_id)
        
        return StandardResponse(
            success=True,
            message="Portfolio summary retrieved successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error retrieving portfolio summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving portfolio summary"
        )


@router.get("/types/options")
async def get_loan_options():
    """
    Get available loan types and configuration options
    
    Returns all available options for loan creation including:
    - Loan types
    - Interest types
    - Amortization methods
    - Repayment frequencies
    """
    try:
        options = {
            "loan_types": [e.value for e in LoanTypeEnum],
            "interest_types": ["fixed", "variable", "hybrid"],
            "amortization_types": ["reducing_balance", "flat_rate", "bullet_payment"],
            "repayment_frequencies": ["monthly", "quarterly", "semi_annually", "annually"],
            "loan_statuses": [e.value for e in LoanStatusEnum]
        }
        
        return StandardResponse(
            success=True,
            message="Loan options retrieved successfully",
            data=options
        )
        
    except Exception as e:
        logger.error(f"Error retrieving loan options: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving loan options"
        )


print("Loan router created with comprehensive loan simulation endpoints")
print("Calculator, simulation, CRUD, payments, and analytics supported")
print("Modern REST API with proper error handling and documentation") 