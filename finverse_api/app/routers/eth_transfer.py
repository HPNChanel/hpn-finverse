from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import logging
from datetime import datetime

from app.db.session import get_db
from app.models.internal_transfer import InternalTransfer
from app.schemas.eth_transfer import (
    ETHTransferLogRequest,
    ETHTransferLogResponse,
    ETHTransferHistoryResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/eth-transfer", tags=["eth-transfer"])

@router.post("/log", response_model=ETHTransferLogResponse)
async def log_eth_transfer(
    transfer_data: ETHTransferLogRequest,
    db: Session = Depends(get_db)
):
    """
    Log an ETH transfer transaction to the database.
    
    This endpoint is called after a successful ETH transfer to record
    the transaction for historical tracking and analytics.
    
    Required payload format:
    {
        "from_address": "0x...",
        "to_address": "0x...", 
        "amount_eth": 0.25,
        "tx_hash": "0x...",
        "timestamp": "ISO8601"
    }
    """
    try:
        # Check for duplicate transaction hash
        existing_transfer = db.query(InternalTransfer).filter(
            InternalTransfer.tx_hash == transfer_data.tx_hash
        ).first()
        
        if existing_transfer:
            logger.warning(f"Duplicate transaction hash: {transfer_data.tx_hash}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Transaction hash already exists"
            )

        # Create new ETH transfer record
        db_transfer = InternalTransfer(
            from_address=transfer_data.from_address.lower(),
            to_address=transfer_data.to_address.lower(),
            amount_eth=transfer_data.amount_eth,
            tx_hash=transfer_data.tx_hash.lower(),
            gas_used=transfer_data.gas_used,
            gas_price=transfer_data.gas_price,
            status="success",  # Only log successful transfers via this endpoint
            notes=transfer_data.notes or "ETH transfer via FinVerse",
            created_at=transfer_data.timestamp
        )
        
        db.add(db_transfer)
        db.commit()
        db.refresh(db_transfer)
        
        logger.info(
            f"ETH transfer logged: {transfer_data.amount_eth} ETH from "
            f"{transfer_data.from_address} to {transfer_data.to_address} "
            f"(tx: {transfer_data.tx_hash})"
        )
        
        return ETHTransferLogResponse(
            id=db_transfer.id,
            from_address=db_transfer.from_address,
            to_address=db_transfer.to_address,
            amount_eth=db_transfer.amount_eth,
            tx_hash=db_transfer.tx_hash,
            gas_used=db_transfer.gas_used,
            gas_price=db_transfer.gas_price,
            status=db_transfer.status,
            notes=db_transfer.notes,
            created_at=db_transfer.created_at,
            message="ETH transfer logged successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to log ETH transfer: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log ETH transfer"
        )

@router.get("/history", response_model=ETHTransferHistoryResponse)
async def get_eth_transfer_history(
    address: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get ETH transfer history with optional filtering by address.
    
    Returns transfers where the address is either sender or recipient.
    """
    try:
        query = db.query(InternalTransfer)
        
        if address:
            address = address.lower()
            query = query.filter(
                (InternalTransfer.from_address == address) |
                (InternalTransfer.to_address == address)
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering (newest first)
        transfers = query.order_by(
            desc(InternalTransfer.created_at)
        ).offset(offset).limit(limit).all()
        
        # Convert to response format
        transfer_list = []
        for transfer in transfers:
            transfer_list.append(ETHTransferLogResponse(
                id=transfer.id,
                from_address=transfer.from_address,
                to_address=transfer.to_address,
                amount_eth=transfer.amount_eth,
                tx_hash=transfer.tx_hash,
                gas_used=transfer.gas_used,
                gas_price=transfer.gas_price,
                status=transfer.status,
                notes=transfer.notes,
                created_at=transfer.created_at,
                message=""
            ))
        
        return ETHTransferHistoryResponse(
            transfers=transfer_list,
            total=total,
            limit=limit,
            offset=offset,
            has_more=offset + len(transfers) < total
        )
    
    except Exception as e:
        logger.error(f"Failed to fetch ETH transfer history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch transfer history"
        ) 