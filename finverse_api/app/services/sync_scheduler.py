"""
Sync Scheduler Service for FinVerse API
Coordinates blockchain synchronization services
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from sqlalchemy.orm import Session
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

class SyncScheduler:
    """Coordinates all blockchain synchronization services"""
    
    def __init__(self):
        self.is_running = False
        self.blockchain_sync_task = None
        self.websocket_sync_task = None
        self.sync_interval = 10  # seconds
        self.last_sync_time = None
        self.sync_statistics = {
            "total_cycles": 0,
            "successful_cycles": 0,
            "failed_cycles": 0,
            "last_error": None
        }
    
    async def start_all_sync_services(self, interval_seconds: int = 10):
        """Start all synchronization services"""
        if self.is_running:
            logger.warning("Sync services are already running")
            return
        
        self.sync_interval = interval_seconds
        self.is_running = True
        
        logger.info(f"🚀 Starting all sync services with {interval_seconds}s interval")
        
        # Start blockchain sync task
        self.blockchain_sync_task = asyncio.create_task(
            self._run_blockchain_sync_loop()
        )
        
        # Start WebSocket sync task
        self.websocket_sync_task = asyncio.create_task(
            self._run_websocket_sync()
        )
        
        logger.info("✅ All sync services started")
    
    async def stop_all_sync_services(self):
        """Stop all synchronization services"""
        logger.info("🛑 Stopping all sync services...")
        
        self.is_running = False
        
        # Stop blockchain sync task
        if self.blockchain_sync_task:
            self.blockchain_sync_task.cancel()
            try:
                await self.blockchain_sync_task
            except asyncio.CancelledError:
                logger.info("✅ Blockchain sync task cancelled")
        
        # Stop WebSocket sync task
        if self.websocket_sync_task:
            self.websocket_sync_task.cancel()
            try:
                await self.websocket_sync_task
            except asyncio.CancelledError:
                logger.info("✅ WebSocket sync task cancelled")
        
        # Stop WebSocket service
        try:
            from app.services.websocket_sync_service import websocket_sync_service
            await websocket_sync_service.stop_listening()
        except Exception as e:
            logger.error(f"Error stopping WebSocket service: {str(e)}")
        
        logger.info("✅ All sync services stopped")
    
    async def _run_blockchain_sync_loop(self):
        """Run the blockchain sync loop"""
        logger.info("🔄 Starting blockchain sync loop")
        
        while self.is_running:
            try:
                await self._run_sync_cycle()
                await asyncio.sleep(self.sync_interval)
            except asyncio.CancelledError:
                logger.info("Blockchain sync loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in blockchain sync loop: {str(e)}")
                self.sync_statistics["failed_cycles"] += 1
                self.sync_statistics["last_error"] = str(e)
                await asyncio.sleep(self.sync_interval)
    
    async def _run_websocket_sync(self):
        """Run the WebSocket sync service"""
        logger.info("🔄 Starting WebSocket sync service")
        
        try:
            from app.services.websocket_sync_service import websocket_sync_service
            await websocket_sync_service.start_listening()
        except asyncio.CancelledError:
            logger.info("WebSocket sync cancelled")
        except Exception as e:
            logger.error(f"Error in WebSocket sync: {str(e)}")
    
    async def _run_sync_cycle(self):
        """Run a single sync cycle"""
        try:
            self.sync_statistics["total_cycles"] += 1
            
            # Import here to avoid circular imports
            from app.services.blockchain_sync_service import blockchain_sync_service
            
            db = SessionLocal()
            try:
                # Run sync cycle
                result = await blockchain_sync_service.run_sync_cycle(db)
                
                if result.get("success"):
                    self.sync_statistics["successful_cycles"] += 1
                    self.last_sync_time = datetime.utcnow()
                    logger.debug(f"Sync cycle completed: {result}")
                else:
                    self.sync_statistics["failed_cycles"] += 1
                    self.sync_statistics["last_error"] = result.get("error", "Unknown error")
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error in sync cycle: {str(e)}")
            self.sync_statistics["failed_cycles"] += 1
            self.sync_statistics["last_error"] = str(e)
    
    def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status"""
        return {
            "is_running": self.is_running,
            "sync_interval_seconds": self.sync_interval,
            "last_sync_time": self.last_sync_time.isoformat() if self.last_sync_time else None,
            "statistics": self.sync_statistics.copy(),
            "services": {
                "blockchain_sync": {
                    "status": "running" if self.blockchain_sync_task and not self.blockchain_sync_task.done() else "stopped",
                    "task_done": self.blockchain_sync_task.done() if self.blockchain_sync_task else True
                },
                "websocket_sync": {
                    "status": "running" if self.websocket_sync_task and not self.websocket_sync_task.done() else "stopped",
                    "task_done": self.websocket_sync_task.done() if self.websocket_sync_task else True
                }
            }
        }

# Create singleton instance
sync_scheduler = SyncScheduler()
