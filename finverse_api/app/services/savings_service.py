"""
Savings Service for FinVerse API - Business Logic Layer

This service handles:
- Financial calculations for savings projections
- CRUD operations for savings plans
- Business logic for compound and simple interest
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from decimal import Decimal, ROUND_HALF_UP

from app.models.savings_plan import SavingsPlan, SavingsProjection, InterestType
from app.schemas.savings import (
    SavingsPlanCreate, 
    SavingsPlanUpdate, 
    SavingsCalculationRequest,
    SavingsCalculationResponse
)


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
        """Create a new savings plan with projections"""
        
        # Create the savings plan
        db_plan = SavingsPlan(
            user_id=user_id,
            name=plan_data.name,
            initial_amount=Decimal(str(plan_data.initial_amount)),
            monthly_contribution=Decimal(str(plan_data.monthly_contribution)),
            interest_rate=Decimal(str(plan_data.interest_rate)),
            duration_months=plan_data.duration_months,
            interest_type=plan_data.interest_type
        )
        
        db.add(db_plan)
        db.flush()  # To get the ID
        
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
    def get_user_savings_plans(db: Session, user_id: int) -> List[SavingsPlan]:
        """Get all savings plans for a user"""
        return db.query(SavingsPlan).filter(
            SavingsPlan.user_id == user_id
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