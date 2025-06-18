"""
Scheduler Service for FinVerse API

This service handles scheduled tasks:
- Monthly savings plan contributions
- Plan completion processing
- Background financial operations
"""

import logging
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.db.session import SessionLocal
from app.services.savings_service import SavingsService
from app.models.savings_plan import SavingsPlan

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SchedulerService:
    """Service for managing scheduled tasks"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self._setup_jobs()
    
    def _setup_jobs(self):
        """Setup scheduled jobs"""
        # Run monthly contributions check daily at 9 AM
        self.scheduler.add_job(
            func=self.process_monthly_contributions,
            trigger=CronTrigger(hour=9, minute=0),
            id='monthly_contributions',
            name='Process Monthly Savings Contributions',
            replace_existing=True
        )
        
        # Run balance sync weekly on Sundays at 2 AM
        self.scheduler.add_job(
            func=self.sync_user_balances,
            trigger=CronTrigger(day_of_week=6, hour=2, minute=0),
            id='balance_sync',
            name='Sync User Account Balances',
            replace_existing=True
        )
    
    def start(self):
        """Start the scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("✅ Scheduler started successfully")
    
    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("🛑 Scheduler stopped")
    
    def process_monthly_contributions(self):
        """Process monthly contributions for all due savings plans"""
        logger.info("🔄 Starting monthly contributions processing...")
        
        db = SessionLocal()
        try:
            # Get all plans due for contribution
            due_plans = SavingsService.get_active_plans_for_contributions(db)
            
            processed_count = 0
            failed_count = 0
            
            for plan in due_plans:
                try:
                    result = SavingsService.process_monthly_contribution(db, plan.id)
                    
                    if result["success"]:
                        processed_count += 1
                        logger.info(f"✅ Processed contribution for plan {plan.id}: {plan.name}")
                        
                        if result.get("plan_completed"):
                            logger.info(f"🎉 Plan {plan.id} completed: {plan.name}")
                    else:
                        failed_count += 1
                        logger.warning(f"⚠️ Failed contribution for plan {plan.id}: {result['message']}")
                        
                except Exception as e:
                    failed_count += 1
                    logger.error(f"❌ Error processing plan {plan.id}: {str(e)}")
            
            logger.info(f"📊 Monthly contributions summary: {processed_count} processed, {failed_count} failed")
            
        except Exception as e:
            logger.error(f"❌ Error in monthly contributions processing: {str(e)}")
        finally:
            db.close()
    
    def sync_user_balances(self):
        """Sync user account balances from financial accounts"""
        logger.info("🔄 Starting user balance synchronization...")
        
        db = SessionLocal()
        try:
            from app.services.balance_service import BalanceService
            from app.models.user import User
            
            # Get all active users
            users = db.query(User).filter(User.is_active == True).all()
            
            synced_count = 0
            
            for user in users:
                try:
                    BalanceService.update_balance_from_financial_accounts(db, user.id)
                    synced_count += 1
                    logger.info(f"✅ Synced balance for user {user.id}: {user.email}")
                    
                except Exception as e:
                    logger.error(f"❌ Error syncing balance for user {user.id}: {str(e)}")
            
            logger.info(f"📊 Balance sync summary: {synced_count} users synced")
            
        except Exception as e:
            logger.error(f"❌ Error in balance synchronization: {str(e)}")
        finally:
            db.close()
    
    def process_single_plan_contribution(self, plan_id: int) -> dict:
        """Process contribution for a single plan (for manual triggers)"""
        db = SessionLocal()
        try:
            result = SavingsService.process_monthly_contribution(db, plan_id)
            logger.info(f"Manual contribution processing for plan {plan_id}: {result}")
            return result
        except Exception as e:
            logger.error(f"Error in manual contribution processing for plan {plan_id}: {str(e)}")
            return {"success": False, "message": str(e)}
        finally:
            db.close()
    
    def get_scheduler_status(self) -> dict:
        """Get current scheduler status and job information"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        
        return {
            "running": self.scheduler.running,
            "jobs": jobs,
            "current_time": datetime.utcnow().isoformat()
        }


# Global scheduler instance
scheduler_service = SchedulerService()


def start_scheduler():
    """Start the global scheduler"""
    scheduler_service.start()


def stop_scheduler():
    """Stop the global scheduler"""
    scheduler_service.stop()


def get_scheduler() -> SchedulerService:
    """Get the global scheduler instance"""
    return scheduler_service 