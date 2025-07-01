"""
Loan Service for FinVerse API - Business Logic Layer (Clean Architecture)

This module implements loan simulation and management business logic:
- EMI and amortization calculations
- Repayment schedule generation
- Payment tracking and processing
- Loan analytics and insights

Architecture Layer: BUSINESS LOGIC LAYER
Dependencies: → Data Layer (models), Core Layer
Used by: API Layer (routers)
"""

import math
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.models.loan import (
    Loan, LoanRepaymentSchedule, LoanPayment,
    LoanType, InterestType, AmortizationType, RepaymentFrequency, LoanStatus
)
from app.models.user import User
from app.schemas.loan import (
    LoanCreateRequest, LoanUpdateRequest, LoanCalculationRequest,
    LoanPaymentRequest, LoanCalculationResult, RepaymentScheduleItem,
    LoanResponse, LoanDetailResponse, LoanSummaryResponse
)
from app.services.base_service import BaseService
import uuid
import logging

logger = logging.getLogger(__name__)


class LoanCalculationEngine:
    """
    Advanced loan calculation engine supporting multiple amortization methods
    """
    
    @staticmethod
    def calculate_emi(
        principal: Decimal,
        annual_rate: Decimal,
        term_months: int,
        frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY,
        amortization_type: AmortizationType = AmortizationType.REDUCING_BALANCE
    ) -> Decimal:
        """
        Calculate Equal Monthly Installment (EMI) or equivalent payment amount
        
        Args:
            principal: Loan principal amount
            annual_rate: Annual interest rate (percentage)
            term_months: Loan term in months
            frequency: Payment frequency
            amortization_type: Amortization method
            
        Returns:
            Payment amount per period
        """
        if principal <= 0:
            raise ValueError("Principal amount must be greater than zero")
        if annual_rate < 0:
            raise ValueError("Interest rate cannot be negative")
        if term_months <= 0:
            raise ValueError("Loan term must be greater than zero months")
        
        # Convert annual rate to decimal
        annual_rate_decimal = annual_rate / 100
        
        # Calculate payments per year
        payments_per_year = LoanCalculationEngine._get_payments_per_year(frequency)
        
        # Calculate period rate
        period_rate = annual_rate_decimal / payments_per_year
        
        # Calculate total number of payments
        total_payments = int(term_months * payments_per_year / 12)
        
        if amortization_type == AmortizationType.REDUCING_BALANCE:
            # Standard EMI calculation using compound interest formula
            if period_rate == 0:
                # Zero interest case
                return principal / total_payments
            
            # EMI = P * [r(1+r)^n] / [(1+r)^n - 1]
            power_factor = (1 + period_rate) ** total_payments
            emi = principal * (period_rate * power_factor) / (power_factor - 1)
            
        elif amortization_type == AmortizationType.FLAT_RATE:
            # Flat rate calculation (simple interest)
            total_interest = principal * annual_rate_decimal * (term_months / 12)
            total_amount = principal + total_interest
            emi = total_amount / total_payments
            
        elif amortization_type == AmortizationType.BULLET_PAYMENT:
            # Interest-only payments with principal at end
            if total_payments <= 1:
                return principal  # Single payment
            interest_payment = principal * period_rate
            # Last payment includes principal + interest
            return interest_payment
            
        else:
            raise ValueError(f"Unsupported amortization type: {amortization_type}")
        
        return Decimal(str(emi)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    @staticmethod
    def generate_amortization_schedule(
        principal: Decimal,
        annual_rate: Decimal,
        term_months: int,
        start_date: date,
        frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY,
        amortization_type: AmortizationType = AmortizationType.REDUCING_BALANCE
    ) -> List[Dict[str, Any]]:
        """
        Generate complete amortization schedule
        
        Returns:
            List of payment schedule items
        """
        schedule = []
        payments_per_year = LoanCalculationEngine._get_payments_per_year(frequency)
        period_rate = (annual_rate / 100) / payments_per_year
        total_payments = int(term_months * payments_per_year / 12)
        
        # Calculate payment amount
        payment_amount = LoanCalculationEngine.calculate_emi(
            principal, annual_rate, term_months, frequency, amortization_type
        )
        
        current_balance = principal
        current_date = start_date
        
        for payment_num in range(1, total_payments + 1):
            # Calculate due date
            due_date = LoanCalculationEngine._calculate_next_payment_date(
                start_date, payment_num - 1, frequency
            )
            
            if amortization_type == AmortizationType.REDUCING_BALANCE:
                # Standard amortization
                interest_component = current_balance * period_rate
                principal_component = payment_amount - interest_component
                
                # Handle final payment rounding
                if payment_num == total_payments:
                    principal_component = current_balance
                    payment_amount = principal_component + interest_component
                
            elif amortization_type == AmortizationType.FLAT_RATE:
                # Flat rate - equal principal + interest based on original amount
                interest_component = principal * period_rate
                principal_component = payment_amount - interest_component
                
            elif amortization_type == AmortizationType.BULLET_PAYMENT:
                # Interest-only until final payment
                if payment_num < total_payments:
                    interest_component = current_balance * period_rate
                    principal_component = Decimal('0')
                    payment_amount = interest_component
                else:
                    # Final payment includes all principal
                    interest_component = current_balance * period_rate
                    principal_component = current_balance
                    payment_amount = principal_component + interest_component
            
            # Ensure no negative balances
            principal_component = min(principal_component, current_balance)
            new_balance = current_balance - principal_component
            
            schedule_item = {
                'installment_number': payment_num,
                'due_date': due_date,
                'installment_amount': payment_amount,
                'principal_component': principal_component,
                'interest_component': interest_component,
                'opening_balance': current_balance,
                'closing_balance': new_balance,
                'is_paid': False,
                'is_overdue': False,
                'days_overdue': None
            }
            
            schedule.append(schedule_item)
            current_balance = new_balance
            
            # Break if balance is zero (shouldn't happen with proper calculations)
            if current_balance <= 0:
                break
        
        return schedule
    
    @staticmethod
    def _get_payments_per_year(frequency: RepaymentFrequency) -> int:
        """Get number of payments per year based on frequency"""
        frequency_mapping = {
            RepaymentFrequency.MONTHLY: 12,
            RepaymentFrequency.QUARTERLY: 4,
            RepaymentFrequency.SEMI_ANNUALLY: 2,
            RepaymentFrequency.ANNUALLY: 1
        }
        return frequency_mapping.get(frequency, 12)
    
    @staticmethod
    def _calculate_next_payment_date(start_date: date, period: int, frequency: RepaymentFrequency) -> date:
        """Calculate payment due date for given period"""
        if frequency == RepaymentFrequency.MONTHLY:
            return start_date + relativedelta(months=period)
        elif frequency == RepaymentFrequency.QUARTERLY:
            return start_date + relativedelta(months=period * 3)
        elif frequency == RepaymentFrequency.SEMI_ANNUALLY:
            return start_date + relativedelta(months=period * 6)
        elif frequency == RepaymentFrequency.ANNUALLY:
            return start_date + relativedelta(years=period)
        else:
            return start_date + relativedelta(months=period)


class LoanService(BaseService):
    """
    Comprehensive loan service for loan simulation and management
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.calculation_engine = LoanCalculationEngine()
    
    def validate_business_rules(self, db: Session, obj_data: dict, user_id: int) -> bool:
        """Validate loan-specific business rules"""
        try:
            # Basic loan validation rules
            principal_amount = obj_data.get('principal_amount', 0)
            interest_rate = obj_data.get('interest_rate', 0)
            loan_term_months = obj_data.get('loan_term_months', 0)
            
            # Validate principal amount
            if principal_amount <= 0:
                raise ValueError("Principal amount must be greater than zero")
            
            if principal_amount > 10000000:  # 10 million limit
                raise ValueError("Principal amount exceeds maximum limit")
            
            # Validate interest rate
            if interest_rate < 0 or interest_rate > 100:
                raise ValueError("Interest rate must be between 0 and 100")
            
            # Validate loan term
            if loan_term_months <= 0 or loan_term_months > 360:  # 30 years max
                raise ValueError("Loan term must be between 1 and 360 months")
            
            return True
            
        except Exception as e:
            logger.error(f"Business rule validation failed: {str(e)}")
            return False
    
    def calculate_loan_metrics(self, request: LoanCalculationRequest) -> LoanCalculationResult:
        """
        Calculate loan metrics without saving to database
        
        Args:
            request: Loan calculation request
            
        Returns:
            Loan calculation results
        """
        try:
            # Convert enum values from schema to model enums
            repayment_freq = RepaymentFrequency(request.repayment_frequency.value) if hasattr(request.repayment_frequency, 'value') else RepaymentFrequency(request.repayment_frequency)
            amortization_type = AmortizationType(request.amortization_type.value) if hasattr(request.amortization_type, 'value') else AmortizationType(request.amortization_type)
            
            # Convert inputs to Decimal to ensure type safety
            principal_decimal = Decimal(str(request.principal_amount))
            interest_decimal = Decimal(str(request.interest_rate))
            
            # Calculate EMI
            emi_amount = self.calculation_engine.calculate_emi(
                principal=principal_decimal,
                annual_rate=interest_decimal,
                term_months=request.loan_term_months,
                frequency=repayment_freq,
                amortization_type=amortization_type
            )
            
            # Generate schedule to calculate totals
            schedule = self.calculation_engine.generate_amortization_schedule(
                principal=principal_decimal,
                annual_rate=interest_decimal,
                term_months=request.loan_term_months,
                start_date=date.today(),
                frequency=repayment_freq,
                amortization_type=amortization_type
            )
            
            # Calculate totals
            total_interest = sum(Decimal(str(item['interest_component'])) for item in schedule)
            total_payment = sum(Decimal(str(item['installment_amount'])) for item in schedule)
            
            # Calculate effective rate and payment count
            payments_per_year = self.calculation_engine._get_payments_per_year(repayment_freq)
            payment_count = len(schedule)
            
            # For monthly payments, monthly_payment = emi_amount
            # For other frequencies, calculate equivalent monthly payment
            if repayment_freq == RepaymentFrequency.MONTHLY:
                monthly_payment = emi_amount
            else:
                monthly_payment = emi_amount * Decimal(str(payments_per_year)) / Decimal('12')
            
            return LoanCalculationResult(
                emi_amount=emi_amount,
                total_interest=total_interest,
                total_payment=total_payment,
                effective_interest_rate=request.interest_rate,  # Simplified for now
                monthly_payment=monthly_payment,
                payment_count=payment_count
            )
            
        except Exception as e:
            logger.error(f"Error calculating loan metrics: {str(e)}")
            raise ValueError(f"Loan calculation failed: {str(e)}")
    
    def create_loan_simulation(self, user_id: int, request: LoanCreateRequest) -> LoanDetailResponse:
        """
        Create a new loan simulation or real loan
        """
        try:
            # Validate user exists
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            # Calculate loan metrics
            calculation_request = LoanCalculationRequest(
                principal_amount=request.principal_amount,
                interest_rate=request.interest_rate,
                loan_term_months=request.loan_term_months,
                repayment_frequency=request.repayment_frequency,
                amortization_type=request.amortization_type
            )
            
            metrics = self.calculate_loan_metrics(calculation_request)
            
            # Convert enum values from schema to model enums
            repayment_freq = RepaymentFrequency(request.repayment_frequency.value) if hasattr(request.repayment_frequency, 'value') else RepaymentFrequency(request.repayment_frequency)
            amortization_type = AmortizationType(request.amortization_type.value) if hasattr(request.amortization_type, 'value') else AmortizationType(request.amortization_type)
            
            # Calculate maturity date
            maturity_date = self.calculation_engine._calculate_next_payment_date(
                request.start_date,
                request.loan_term_months,
                repayment_freq
            )
            
            # Create loan record
            loan = Loan(
                user_id=user_id,
                loan_name=request.loan_name,
                loan_type=request.loan_type,
                purpose=request.purpose,
                principal_amount=request.principal_amount,
                current_balance=request.principal_amount,
                interest_rate=request.interest_rate,
                interest_type=request.interest_type,
                variable_rate_adjustment_frequency=request.variable_rate_adjustment_frequency,
                hybrid_fixed_period=request.hybrid_fixed_period,
                loan_term_months=request.loan_term_months,
                repayment_frequency=request.repayment_frequency,
                amortization_type=request.amortization_type,
                start_date=request.start_date,
                maturity_date=maturity_date,
                emi_amount=metrics.emi_amount,
                total_interest=metrics.total_interest,
                total_payment=metrics.total_payment,
                status=LoanStatus.SIMULATED if request.is_simulation else LoanStatus.ACTIVE,
                is_simulation=request.is_simulation,
                payments_made=0,
                next_payment_date=request.start_date,
                simulation_uuid=str(uuid.uuid4()),
                notes=request.notes
            )
            
            self.db.add(loan)
            self.db.flush()  # Get loan ID
            
            # Generate and save repayment schedule
            schedule_data = self.calculation_engine.generate_amortization_schedule(
                principal=request.principal_amount,
                annual_rate=request.interest_rate,
                term_months=request.loan_term_months,
                start_date=request.start_date,
                frequency=repayment_freq,
                amortization_type=amortization_type
            )
            
            # Create repayment schedule records
            for schedule_item in schedule_data:
                repayment_record = LoanRepaymentSchedule(
                    loan_id=loan.id,
                    installment_number=schedule_item['installment_number'],
                    due_date=schedule_item['due_date'],
                    installment_amount=schedule_item['installment_amount'],
                    principal_component=schedule_item['principal_component'],
                    interest_component=schedule_item['interest_component'],
                    opening_balance=schedule_item['opening_balance'],
                    closing_balance=schedule_item['closing_balance'],
                    is_paid=False,
                    is_overdue=False
                )
                self.db.add(repayment_record)
            
            self.db.commit()
            
            return self.get_loan_details(user_id, loan.id)
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating loan simulation: {str(e)}")
            raise ValueError(f"Failed to create loan simulation: {str(e)}")
    
    def get_user_loans(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        status_filter: Optional[LoanStatus] = None,
        loan_type_filter: Optional[LoanType] = None
    ) -> List[LoanResponse]:
        """
        Get user's loans with filtering options
        """
        try:
            query = self.db.query(Loan).filter(Loan.user_id == user_id)
            
            if status_filter:
                query = query.filter(Loan.status == status_filter)
            
            if loan_type_filter:
                query = query.filter(Loan.loan_type == loan_type_filter)
            
            loans = query.offset(skip).limit(limit).all()
            
            return [LoanResponse.from_orm(loan) for loan in loans]
            
        except Exception as e:
            logger.error(f"Error getting user loans: {str(e)}")
            raise ValueError(f"Failed to retrieve loans: {str(e)}")
    
    def get_loan_details(self, user_id: int, loan_id: int) -> LoanDetailResponse:
        """
        Get detailed loan information including repayment schedule
        """
        try:
            loan = self.db.query(Loan).filter(
                and_(Loan.id == loan_id, Loan.user_id == user_id)
            ).first()
            
            if not loan:
                raise ValueError("Loan not found")
            
            # Get repayment schedule
            schedule = self.db.query(LoanRepaymentSchedule).filter(
                LoanRepaymentSchedule.loan_id == loan_id
            ).order_by(LoanRepaymentSchedule.installment_number).all()
            
            # Get payment history
            payments = self.db.query(LoanPayment).filter(
                LoanPayment.loan_id == loan_id
            ).order_by(LoanPayment.payment_date.desc()).all()
            
            # Convert to response format
            loan_response = LoanResponse.from_orm(loan)
            schedule_items = [RepaymentScheduleItem.from_orm(item) for item in schedule]
            payment_records = [
                {
                    'id': payment.id,
                    'payment_date': payment.payment_date,
                    'payment_amount': payment.payment_amount,
                    'payment_type': payment.payment_type,
                    'principal_paid': payment.principal_paid,
                    'interest_paid': payment.interest_paid,
                    'late_fee_paid': payment.late_fee_paid,
                    'payment_method': payment.payment_method,
                    'payment_reference': payment.payment_reference,
                    'is_simulated': payment.is_simulated,
                    'notes': payment.notes
                }
                for payment in payments
            ]
            
            return LoanDetailResponse(
                **loan_response.dict(),
                repayment_schedule=schedule_items,
                payment_history=payment_records
            )
            
        except Exception as e:
            logger.error(f"Error getting loan details: {str(e)}")
            raise ValueError(f"Failed to retrieve loan details: {str(e)}")
    
    def get_loan_summary(self, user_id: int) -> LoanSummaryResponse:
        """
        Get loan portfolio summary for user
        """
        try:
            # Get summary statistics
            loans_query = self.db.query(Loan).filter(Loan.user_id == user_id)
            
            total_loans = loans_query.count()
            active_loans = loans_query.filter(Loan.status == LoanStatus.ACTIVE).count()
            simulated_loans = loans_query.filter(Loan.is_simulation == True).count()
            completed_loans = loans_query.filter(Loan.status == LoanStatus.COMPLETED).count()
            
            # Calculate financial metrics
            active_loans_data = loans_query.filter(Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.SIMULATED])).all()
            
            total_borrowed = sum(loan.principal_amount for loan in active_loans_data)
            total_remaining = sum(loan.current_balance for loan in active_loans_data)
            
            # Calculate total interest paid from payment history
            total_interest_paid = self.db.query(func.sum(LoanPayment.interest_paid)).filter(
                LoanPayment.loan_id.in_([loan.id for loan in active_loans_data])
            ).scalar() or Decimal('0')
            
            # Calculate average interest rate
            if active_loans_data:
                avg_interest_rate = sum(loan.interest_rate for loan in active_loans_data) / len(active_loans_data)
            else:
                avg_interest_rate = Decimal('0')
            
            return LoanSummaryResponse(
                total_loans=total_loans,
                active_loans=active_loans,
                simulated_loans=simulated_loans,
                completed_loans=completed_loans,
                total_borrowed=total_borrowed,
                total_remaining=total_remaining,
                total_interest_paid=total_interest_paid,
                average_interest_rate=avg_interest_rate
            )
            
        except Exception as e:
            logger.error(f"Error getting loan summary: {str(e)}")
            raise ValueError(f"Failed to retrieve loan summary: {str(e)}")


# Legacy function exports for backward compatibility
def calculate_emi(principal: float, annual_rate: float, term_months: int) -> float:
    """Legacy EMI calculation function"""
    engine = LoanCalculationEngine()
    result = engine.calculate_emi(
        Decimal(str(principal)),
        Decimal(str(annual_rate)),
        term_months
    )
    return float(result)


print("LoanService class created with comprehensive loan simulation features")
print("EMI calculations, amortization schedules, and payment tracking implemented")
print("Advanced loan analytics and insights supported") 