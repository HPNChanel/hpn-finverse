"""
Sync router for blockchain synchronization management
"""

from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from typing import Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime  # Add missing import

from app.services.sync_scheduler import sync_scheduler
from app.services.blockchain_sync_service import blockchain_sync_service
from app.core.auth import get_current_user
from app.db.session import get_db

router = APIRouter(
    prefix="/sync",
    tags=["Blockchain Sync"]
)

class SyncUserRequest(BaseModel):
    user_address: str

class SyncResponse(BaseModel):
    success: bool
    message: str
    data: dict = {}

@router.get("/status", response_model=dict)
async def get_sync_status():
    """Get current sync status and statistics"""
    try:
        status = sync_scheduler.get_sync_status()
        return {
            "success": True,
            "status": status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sync status: {str(e)}"
        )

@router.post("/start", response_model=SyncResponse)
async def start_sync_services(
    background_tasks: BackgroundTasks,
    interval_seconds: int = 10
):
    """Start blockchain sync services"""
    try:
        if sync_scheduler.is_running:
            return SyncResponse(
                success=False,
                message="Sync services are already running",
                data=sync_scheduler.get_sync_status()
            )
        
        # Start sync services in background
        background_tasks.add_task(
            sync_scheduler.start_all_sync_services,
            interval_seconds
        )
        
        return SyncResponse(
            success=True,
            message=f"Sync services starting with {interval_seconds}s interval",
            data={"interval_seconds": interval_seconds}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start sync services: {str(e)}"
        )

@router.post("/stop", response_model=SyncResponse)
async def stop_sync_services():
    """Stop blockchain sync services"""
    try:
        await sync_scheduler.stop_all_sync_services()
        
        return SyncResponse(
            success=True,
            message="Sync services stopped successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop sync services: {str(e)}"
        )

@router.post("/user", response_model=SyncResponse)
async def sync_user_stakes(
    sync_request: SyncUserRequest,
    db: Session = Depends(get_db)
):
    """Force sync for a specific user"""
    try:
        result = await blockchain_sync_service.sync_user_stakes(
            sync_request.user_address, 
            db
        )
        
        if result.get('success'):
            return SyncResponse(
                success=True,
                message=f"User {sync_request.user_address} synced successfully",
                data=result
            )
        else:
            return SyncResponse(
                success=False,
                message=f"Failed to sync user: {result.get('error', 'Unknown error')}",
                data=result
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync user stakes: {str(e)}"
        )

@router.post("/run-cycle", response_model=SyncResponse)
async def run_sync_cycle():
    """Manually trigger a complete sync cycle"""
    try:
        result = await blockchain_sync_service.run_sync_cycle()
        
        if result.get('success'):
            return SyncResponse(
                success=True,
                message="Sync cycle completed successfully",
                data=result
            )
        else:
            return SyncResponse(
                success=False,
                message=f"Sync cycle failed: {result.get('error', 'Unknown error')}",
                data=result
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run sync cycle: {str(e)}"
        )

@router.get("/health", response_model=dict)
async def sync_health_check():
    """Health check for sync services"""
    try:
        from app.services.websocket_sync_service import websocket_sync_service
        
        blockchain_health = blockchain_sync_service.is_initialized
        websocket_health = getattr(websocket_sync_service, 'is_listening', False)
        
        overall_health = blockchain_health and (websocket_health or True)  # WebSocket is optional
        
        return {
            "healthy": overall_health,
            "services": {
                "blockchain_sync": {
                    "status": "healthy" if blockchain_health else "unhealthy",
                    "initialized": blockchain_health
                },
                "websocket_sync": {
                    "status": "healthy" if websocket_health else "not_running",
                    "listening": websocket_health
                }
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}"
        )
