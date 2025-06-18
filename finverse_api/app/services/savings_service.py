"""
Savings Service for FinVerse API - Business Logic Layer

This service handles:
- Financial calculations for savings projections
- CRUD operations for savings plans
- Business logic for compound and simple interest
- Real balance-based savings operations
- Monthly contribution processing
- Early withdrawal calculations
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from app.models.savings_plan import SavingsPlan, SavingsProjection, InterestType, SavingsPlanStatus
from app.models.transaction import SavingsTransactionType
from app.schemas.savings import (
    SavingsPlanCreate, 
    SavingsPlanUpdate, 
    SavingsCalculationRequest,
    SavingsCalculationResponse
)
from app.services.balance_service import BalanceService
from app.models.financial_account import FinancialAccount


class SavingsService:
    """Service class for savings-related business logic"""
    
    @staticmethod
    def calculate_savings_projections(
        initial_amount: float,
        monthly_contribution: float,
        interest_rate: float,
        duration_months: int,
        interest_type: InterestType = InterestType.COMPOUND
    ) -> List[Dict[str, Any]]:
        """
        Calculate month-by-month savings projections
        
        Args:
            initial_amount: Starting amount
            monthly_contribution: Monthly deposit
            interest_rate: Annual interest rate (as percentage, e.g., 5.0 for 5%)
            duration_months: Number of months
            interest_type: SIMPLE or COMPOUND
            
        Returns:
            List of monthly projection data
        """
        projections = []
        
        # Convert to decimal for precision
        P = Decimal(str(initial_amount))
        PMT = Decimal(str(monthly_contribution))
        annual_rate = Decimal(str(interest_rate)) / Decimal('100')
        monthly_rate = annual_rate / Decimal('12')
        
        current_balance = P
        
        for month in range(duration_months + 1):  # Include month 0
            if month == 0:
                # Initial month - just the initial amount
                interest_earned = Decimal('0')
            else:
                if interest_type == InterestType.COMPOUND:
                    # Compound interest: interest on current balance + new contribution
                    interest_earned = current_balance * monthly_rate
                    current_balance = current_balance + interest_earned + PMT
                else:
                    # Simple interest: interest only on principal and contributions
                    principal_and_contributions = P + (PMT * Decimal(str(month)))
                    interest_earned = principal_and_contributions * monthly_rate
                    current_balance = principal_and_contributions + (interest_earned * Decimal(str(month)))
            
            projections.append({
                "month_index": month,
                "balance": float(current_balance.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                "interest_earned": float(interest_earned.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)) if month > 0 else 0.0
            })
        
        return projections
    
    @staticmethod
    def calculate_savings_summary(projections: List[Dict[str, Any]], initial_amount: float, monthly_contribution: float, duration_months: int) -> Dict[str, float]:
        """Calculate summary statistics for savings plan"""
        total_contributions = initial_amount + (monthly_contribution * duration_months)
        final_value = projections[-1]["balance"] if projections else 0.0
        total_interest = final_value - total_contributions
        
        return {
            "total_contributions": total_contributions,
            "total_interest": max(0.0, total_interest),
            "final_value": final_value
        }
    
    @staticmethod
    def create_savings_plan(db: Session, plan_data: SavingsPlanCreate, user_id: int) -> SavingsPlan:
        """Create a new savings plan with balance deduction from specified financial account"""
        from fastapi import HTTPException, status
        
        # Validate that the source account exists and belongs to the user
        source_account = db.query(FinancialAccount).filter(
            FinancialAccount.id == plan_data.source_account_id,
            FinancialAccount.user_id == user_id,
            FinancialAccount.is_active == True
        ).first()
        
        if not source_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source financial account not found or not accessible"
            )
        
        # Check if source account has sufficient balance for initial amount
        if plan_data.initial_amount > 0:
            if source_account.balance < Decimal(str(plan_data.initial_amount)):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient funds in source account '{source_account.name}'. Available: ${float(source_account.balance):,.2f}, Required: ${plan_data.initial_amount:,.2f}"
                )
        
        # Calculate next contribution date (1 month from now)
        next_contribution_date = datetime.utcnow() + relativedelta(months=1)
        
        # Create the savings plan
        db_plan = SavingsPlan(
            user_id=user_id,
            source_account_id=plan_data.source_account_id,
            name=plan_data.name,
            initial_amount=Decimal(str(plan_data.initial_amount)),
            monthly_contribution=Decimal(str(plan_data.monthly_contribution)),
            interest_rate=Decimal(str(plan_data.interest_rate)),
            duration_months=plan_data.duration_months,
            interest_type=plan_data.interest_type,
            status=SavingsPlanStatus.ACTIVE,
            current_balance=Decimal(str(plan_data.initial_amount)),
            total_contributed=Decimal(str(plan_data.initial_amount)),
            total_interest_earned=Decimal('0.00'),
            next_contribution_date=next_contribution_date
        )
        
        db.add(db_plan)
        db.flush()  # To get the ID
        
        # Deduct initial amount from source account
        if plan_data.initial_amount > 0:
            source_account.balance -= Decimal(str(plan_data.initial_amount))
            
            # Create transaction record
            from app.models.transaction import Transaction, SavingsTransactionType
            transaction = Transaction(
                user_id=user_id,
                financial_account_id=source_account.id,
                wallet_id=source_account.id,  # For backward compatibility
                source_account_id=source_account.id,
                amount=Decimal(str(plan_data.initial_amount)),
                transaction_type=1,  # Expense
                description=f"Initial deposit for savings plan: {plan_data.name}",
                transaction_date=datetime.utcnow().date(),
                related_savings_plan_id=db_plan.id,
                savings_transaction_type=SavingsTransactionType.SAVING_DEPOSIT.value,
                note=f"Deducted from account '{source_account.name}' for savings plan '{plan_data.name}'"
            )
            db.add(transaction)
        
        # Calculate projections
        projections = SavingsService.calculate_savings_projections(
            initial_amount=plan_data.initial_amount,
            monthly_contribution=plan_data.monthly_contribution,
            interest_rate=plan_data.interest_rate,
            duration_months=plan_data.duration_months,
            interest_type=plan_data.interest_type
        )
        
        # Create projection records
        for projection_data in projections:
            db_projection = SavingsProjection(
                plan_id=db_plan.id,
                month_index=projection_data["month_index"],
                balance=Decimal(str(projection_data["balance"])),
                interest_earned=Decimal(str(projection_data["interest_earned"]))
            )
            db.add(db_projection)
        
        db.commit()
        db.refresh(db_plan)
        return db_plan
    
    @staticmethod
    def process_monthly_contribution(db: Session, plan_id: int) -> Dict[str, Any]:
        """Process monthly contribution for a savings plan"""
        from fastapi import HTTPException, status
        
        db_plan = db.query(SavingsPlan).filter(SavingsPlan.id == plan_id).first()
        if not db_plan or db_plan.status != SavingsPlanStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active savings plan not found"
            )
        
        # Check if contribution is due
        if db_plan.next_contribution_date and datetime.utcnow() < db_plan.next_contribution_date:
            return {
                "success": False,
                "message": "Contribution not yet due",
                "next_due_date": db_plan.next_contribution_date.isoformat()
            }
        
        monthly_amount = float(db_plan.monthly_contribution)
        
        # Get the source account for this plan
        source_account = db.query(FinancialAccount).filter(
            FinancialAccount.id == db_plan.source_account_id
        ).first()
        
        if not source_account or not source_account.is_active:
            return {
                "success": False,
                "message": "Source account not found or inactive",
                "plan_id": plan_id
            }
        
        # Check if source account has sufficient balance
        if source_account.balance < Decimal(str(monthly_amount)):
            # Mark as failed contribution
            return {
                "success": False,
                "message": f"Insufficient balance in source account '{source_account.name}' for monthly contribution",
                "required_amount": monthly_amount,
                "available_amount": float(source_account.balance),
                "plan_id": plan_id
            }
        
        # Deduct monthly contribution from source account
        source_account.balance -= Decimal(str(monthly_amount))
        
        # Create transaction record
        from app.models.transaction import Transaction
        transaction = Transaction(
            user_id=db_plan.user_id,
            financial_account_id=source_account.id,
            wallet_id=source_account.id,  # For backward compatibility
            source_account_id=source_account.id,
            amount=Decimal(str(monthly_amount)),
            transaction_type=1,  # Expense
            description=f"Monthly contribution for savings plan: {db_plan.name}",
            transaction_date=datetime.utcnow().date(),
            related_savings_plan_id=plan_id,
            savings_transaction_type=SavingsTransactionType.MONTHLY_CONTRIBUTION.value,
            note=f"Monthly contribution from account '{source_account.name}'"
        )
        db.add(transaction)
        
        # Update plan balances
        db_plan.current_balance += Decimal(str(monthly_amount))
        db_plan.total_contributed += Decimal(str(monthly_amount))
        db_plan.last_contribution_date = datetime.utcnow()
        
        # Calculate next contribution date
        db_plan.next_contribution_date = datetime.utcnow() + relativedelta(months=1)
        
        # Apply interest to current balance
        monthly_rate = Decimal(str(db_plan.interest_rate)) / Decimal('100') / Decimal('12')
        interest_earned = db_plan.current_balance * monthly_rate
        db_plan.current_balance += interest_earned
        db_plan.total_interest_earned += interest_earned
        
        # Check if plan is completed
        months_elapsed = SavingsService._calculate_months_elapsed(db_plan.created_at, datetime.utcnow())
        if months_elapsed >= db_plan.duration_months:
            db_plan.status = SavingsPlanStatus.COMPLETED
            db_plan.completion_date = datetime.utcnow()
            
            # Return final amount to source account
            final_amount = float(db_plan.current_balance)
            source_account = db.query(FinancialAccount).filter(
                FinancialAccount.id == db_plan.source_account_id
            ).first()
            
            if source_account:
                source_account.balance += Decimal(str(final_amount))
                
                # Create transaction record for completion payout
                completion_transaction = Transaction(
                    user_id=db_plan.user_id,
                    financial_account_id=source_account.id,
                    wallet_id=source_account.id,  # For backward compatibility
                    destination_account_id=source_account.id,
                    amount=Decimal(str(final_amount)),
                    transaction_type=0,  # Income
                    description=f"Plan completion payout: {db_plan.name}",
                    transaction_date=datetime.utcnow().date(),
                    related_savings_plan_id=plan_id,
                    savings_transaction_type=SavingsTransactionType.PLAN_COMPLETION.value,
                    note=f"Savings plan completed. Total returned to '{source_account.name}'"
                )
                db.add(completion_transaction)
        
        db.commit()
        db.refresh(db_plan)
        
        return {
            "success": True,
            "message": "Monthly contribution processed successfully",
            "contribution_amount": monthly_amount,
            "new_balance": float(db_plan.current_balance),
            "total_contributed": float(db_plan.total_contributed),
            "interest_earned": float(interest_earned),
            "plan_completed": db_plan.status == SavingsPlanStatus.COMPLETED
        }
    
    @staticmethod
    def process_early_withdrawal(db: Session, plan_id: int, user_id: int) -> Dict[str, Any]:
        """Process early withdrawal from a savings plan"""
        from fastapi import HTTPException, status
        
        db_plan = SavingsService.get_savings_plan_by_id(db, plan_id, user_id)
        if not db_plan or db_plan.status != SavingsPlanStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active savings plan not found"
            )
        
        # Calculate withdrawal amounts
        withdrawal_info = BalanceService.calculate_early_withdrawal_amount(db_plan)
        
        # Update plan status
        db_plan.status = SavingsPlanStatus.WITHDRAWN_EARLY
        db_plan.completion_date = datetime.utcnow()
        db_plan.withdrawal_amount = Decimal(str(withdrawal_info["net_withdrawal_amount"]))
        
        # Return net amount to source account
        if withdrawal_info["net_withdrawal_amount"] > 0:
            source_account = db.query(FinancialAccount).filter(
                FinancialAccount.id == db_plan.source_account_id
            ).first()
            
            if source_account and source_account.is_active:
                source_account.balance += Decimal(str(withdrawal_info["net_withdrawal_amount"]))
                
                # Create transaction record for withdrawal
                from app.models.transaction import Transaction
                transaction = Transaction(
                    user_id=user_id,
                    financial_account_id=source_account.id,
                    wallet_id=source_account.id,  # For backward compatibility
                    destination_account_id=source_account.id,
                    amount=Decimal(str(withdrawal_info["net_withdrawal_amount"])),
                    transaction_type=0,  # Income
                    description=f"Early withdrawal from savings plan: {db_plan.name}",
                    transaction_date=datetime.utcnow().date(),
                    related_savings_plan_id=plan_id,
                    savings_transaction_type=SavingsTransactionType.EARLY_WITHDRAWAL.value,
                    note=f"Returned to account '{source_account.name}' (penalty: ${withdrawal_info['penalty_amount']:.2f})"
                )
                db.add(transaction)
        
        # Log penalty if applicable
        if withdrawal_info["penalty_amount"] > 0:
            BalanceService.deduct_balance(
                db=db,
                user_id=user_id,
                amount=0,  # No additional deduction, just logging
                savings_plan_id=plan_id,
                transaction_type=SavingsTransactionType.PENALTY_DEDUCTION.value,
                description=f"Early withdrawal penalty: {db_plan.name}"
            )
        
        db.commit()
        db.refresh(db_plan)
        
        return {
            "success": True,
            "message": "Early withdrawal processed successfully",
            **withdrawal_info
        }
    
    @staticmethod
    def get_active_plans_for_contributions(db: Session) -> List[SavingsPlan]:
        """Get all active savings plans that are due for monthly contributions"""
        current_time = datetime.utcnow()
        return db.query(SavingsPlan).filter(
            SavingsPlan.status == SavingsPlanStatus.ACTIVE,
            SavingsPlan.next_contribution_date <= current_time
        ).all()
    
    @staticmethod
    def _calculate_months_elapsed(start_date: datetime, current_date: datetime) -> int:
        """Calculate months elapsed between two dates"""
        return max(0, (current_date.year - start_date.year) * 12 + (current_date.month - start_date.month))
    
    @staticmethod
    def get_user_savings_plans(db: Session, user_id: int) -> List[SavingsPlan]:
        """Get all savings plans for a user with source account information"""
        return db.query(SavingsPlan).filter(
            SavingsPlan.user_id == user_id
        ).options(
            joinedload(SavingsPlan.source_account)
        ).order_by(desc(SavingsPlan.created_at)).all()
    
    @staticmethod
    def get_savings_plan_by_id(db: Session, plan_id: int, user_id: int) -> Optional[SavingsPlan]:
        """Get a specific savings plan by ID"""
        return db.query(SavingsPlan).filter(
            SavingsPlan.id == plan_id,
            SavingsPlan.user_id == user_id
        ).first()
    
    @staticmethod
    def update_savings_plan(
        db: Session, 
        plan_id: int, 
        user_id: int, 
        plan_update: SavingsPlanUpdate
    ) -> Optional[SavingsPlan]:
        """Update a savings plan and recalculate projections"""
        
        db_plan = SavingsService.get_savings_plan_by_id(db, plan_id, user_id)
        if not db_plan:
            return None
        
        # Update plan fields
        update_data = plan_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(db_plan, field):
                if field in ['initial_amount', 'monthly_contribution', 'interest_rate']:
                    setattr(db_plan, field, Decimal(str(value)))
                else:
                    setattr(db_plan, field, value)
        
        # If financial parameters changed, recalculate projections
        financial_fields = {'initial_amount', 'monthly_contribution', 'interest_rate', 'duration_months', 'interest_type'}
        if any(field in update_data for field in financial_fields):
            # Delete existing projections
            db.query(SavingsProjection).filter(
                SavingsProjection.plan_id == plan_id
            ).delete()
            
            # Recalculate projections
            projections = SavingsService.calculate_savings_projections(
                initial_amount=float(db_plan.initial_amount),
                monthly_contribution=float(db_plan.monthly_contribution),
                interest_rate=float(db_plan.interest_rate),
                duration_months=db_plan.duration_months,
                interest_type=db_plan.interest_type
            )
            
            # Create new projection records
            for projection_data in projections:
                db_projection = SavingsProjection(
                    plan_id=db_plan.id,
                    month_index=projection_data["month_index"],
                    balance=Decimal(str(projection_data["balance"])),
                    interest_earned=Decimal(str(projection_data["interest_earned"]))
                )
                db.add(db_projection)
        
        db.commit()
        db.refresh(db_plan)
        return db_plan
    
    @staticmethod
    def delete_savings_plan(db: Session, plan_id: int, user_id: int) -> bool:
        """Delete a savings plan and its projections"""
        db_plan = SavingsService.get_savings_plan_by_id(db, plan_id, user_id)
        if not db_plan:
            return False
        
        # Delete projections first (or rely on cascade)
        db.query(SavingsProjection).filter(
            SavingsProjection.plan_id == plan_id
        ).delete()
        
        # Delete the plan
        db.delete(db_plan)
        db.commit()
        return True
    
    @staticmethod
    def get_user_savings_summary(db: Session, user_id: int) -> Dict[str, Any]:
        """Get summary statistics for all user's savings plans"""
        plans = SavingsService.get_user_savings_plans(db, user_id)
        
        total_plans = len(plans)
        total_saved = sum(float(plan.initial_amount) for plan in plans)
        total_projected_value = 0.0
        total_projected_interest = 0.0
        
        for plan in plans:
            # Get final projection for this plan
            final_projection = db.query(SavingsProjection).filter(
                SavingsProjection.plan_id == plan.id,
                SavingsProjection.month_index == plan.duration_months
            ).first()
            
            if final_projection:
                final_value = float(final_projection.balance)
                total_contributions = float(plan.initial_amount) + (float(plan.monthly_contribution) * plan.duration_months)
                plan_interest = final_value - total_contributions
                
                total_projected_value += final_value
                total_projected_interest += max(0.0, plan_interest)
        
        return {
            "total_plans": total_plans,
            "total_saved": total_saved,
            "total_projected_value": total_projected_value,
            "total_projected_interest": total_projected_interest
        }
    
    @staticmethod
    def calculate_savings_preview(calculation_request: SavingsCalculationRequest) -> SavingsCalculationResponse:
        """Calculate savings projections without persisting (for preview)"""
        projections = SavingsService.calculate_savings_projections(
            initial_amount=calculation_request.initial_amount,
            monthly_contribution=calculation_request.monthly_contribution,
            interest_rate=calculation_request.interest_rate,
            duration_months=calculation_request.duration_months,
            interest_type=calculation_request.interest_type
        )
        
        summary = SavingsService.calculate_savings_summary(
            projections=projections,
            initial_amount=calculation_request.initial_amount,
            monthly_contribution=calculation_request.monthly_contribution,
            duration_months=calculation_request.duration_months
        )
        
        return SavingsCalculationResponse(
            monthly_projections=projections,
            total_contributions=summary["total_contributions"],
            total_interest=summary["total_interest"],
            final_value=summary["final_value"]
        ) 