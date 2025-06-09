from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional
import logging

from app.db.session import get_db
from app.models.internal_transfer import InternalTransfer
from app.schemas.wallet import (
    TransferLogRequest,
    TransferLogResponse,
    TransferHistoryRequest,
    TransferHistoryResponse,
    TransferStatsResponse,
    AddressStatsResponse
)
from app.schemas.eth_transfer import (
    ETHTransferLogRequest,
    ETHTransferLogResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/wallet", tags=["wallet"])

@router.post("/transfer-log", response_model=TransferLogResponse)
async def log_transfer(
    transfer_data: TransferLogRequest,
    db: Session = Depends(get_db)
):
    """
    Log an internal ETH transfer between accounts.
    
    This endpoint is used to record transfers for analytics and dashboard purposes.
    It does not perform the actual blockchain transaction.
    """
    try:
        # Create new transfer record
        db_transfer = InternalTransfer(
            from_address=transfer_data.from_address,
            to_address=transfer_data.to_address,
            amount_eth=transfer_data.amount_eth,
            tx_hash=transfer_data.tx_hash,
            gas_used=transfer_data.gas_used,
            gas_price=transfer_data.gas_price,
            status=transfer_data.status,
            notes=transfer_data.notes
        )
        
        db.add(db_transfer)
        db.commit()
        db.refresh(db_transfer)
        
        logger.info(f"Transfer logged: {transfer_data.amount_eth} ETH from {transfer_data.from_address} to {transfer_data.to_address}")
        
        return db_transfer
    
    except Exception as e:
        logger.error(f"Failed to log transfer: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to log transfer")

@router.post("/eth-transfer", response_model=ETHTransferLogResponse)
async def log_eth_transfer(
    transfer_data: ETHTransferLogRequest,
    db: Session = Depends(get_db)
):
    """
    Log an ETH transfer transaction to the database.
    
    This endpoint matches the requirements for POST /api/v1/wallet/eth-transfer
    and saves data to the eth_transfers (internal_transfers) table.
    """
    try:
        # Check for duplicate transaction hash
        existing_transfer = db.query(InternalTransfer).filter(
            InternalTransfer.tx_hash == transfer_data.tx_hash
        ).first()
        
        if existing_transfer:
            logger.warning(f"Duplicate transaction hash: {transfer_data.tx_hash}")
            raise HTTPException(
                status_code=409,
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
            status_code=500,
            detail="Failed to log ETH transfer"
        )

@router.get("/eth-history")
async def get_eth_transfer_history(
    address: Optional[str] = Query(None, description="Filter by wallet address"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    status: Optional[str] = Query(None, description="Filter by status (success/failed)"),
    direction: Optional[str] = Query(None, description="Filter by direction (sent/received)"),
    from_date: Optional[str] = Query(None, description="Filter from date (ISO format)"),
    to_date: Optional[str] = Query(None, description="Filter to date (ISO format)"),
    db: Session = Depends(get_db)
):
    """
    Get ETH transfer history for a specific wallet.
    
    This endpoint matches the requirements for GET /api/v1/wallet/eth-history
    to fetch recent transfers for a wallet.
    """
    try:
        query = db.query(InternalTransfer)
        
        if address:
            address = address.lower()
            # Apply direction filter if specified
            if direction == "sent":
                query = query.filter(InternalTransfer.from_address == address)
            elif direction == "received":
                query = query.filter(InternalTransfer.to_address == address)
            else:
                # Default: show both sent and received
                query = query.filter(
                    or_(
                        InternalTransfer.from_address == address,
                        InternalTransfer.to_address == address
                    )
                )
        
        # Filter by status if specified
        if status:
            query = query.filter(InternalTransfer.status == status)
        
        # Filter by date range if specified
        if from_date:
            try:
                from datetime import datetime
                from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                query = query.filter(InternalTransfer.created_at >= from_dt)
            except ValueError:
                pass  # Ignore invalid date format
        
        if to_date:
            try:
                from datetime import datetime
                to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                query = query.filter(InternalTransfer.created_at <= to_dt)
            except ValueError:
                pass  # Ignore invalid date format
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering (newest first)
        transfers = query.order_by(
            desc(InternalTransfer.created_at)
        ).offset(offset).limit(limit).all()
        
        # Convert to response format
        transfer_list = []
        for transfer in transfers:
            transfer_list.append({
                "id": transfer.id,
                "from_address": transfer.from_address,
                "to_address": transfer.to_address,
                "amount_eth": float(transfer.amount_eth),
                "tx_hash": transfer.tx_hash,
                "gas_used": transfer.gas_used,
                "gas_price": transfer.gas_price,
                "status": transfer.status,
                "notes": transfer.notes,
                "created_at": transfer.created_at.isoformat(),
            })
        
        return {
            "transfers": transfer_list,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + len(transfers) < total
        }
    
    except Exception as e:
        logger.error(f"Failed to fetch ETH transfer history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch transfer history"
        )

@router.get("/transfer-history", response_model=TransferHistoryResponse)
async def get_transfer_history(
    address: Optional[str] = Query(None, description="Filter by address (as sender or recipient)"),
    status: Optional[str] = Query(None, description="Filter by status (success/failed)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db)
):
    """
    Get transfer history with optional filtering.
    
    Returns a paginated list of internal transfers with optional filtering
    by address (as sender or recipient) and status.
    """
    try:
        # Build query with filters
        query = db.query(InternalTransfer)
        
        if address:
            # Filter by address as either sender or recipient
            query = query.filter(
                or_(
                    InternalTransfer.from_address == address.lower(),
                    InternalTransfer.to_address == address.lower()
                )
            )
        
        if status:
            query = query.filter(InternalTransfer.status == status)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        transfers = query.order_by(desc(InternalTransfer.created_at)).offset(offset).limit(limit).all()
        
        return TransferHistoryResponse(
            transfers=transfers,
            total=total,
            limit=limit,
            offset=offset
        )
    
    except Exception as e:
        logger.error(f"Failed to fetch transfer history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch transfer history")

@router.get("/transfer-stats", response_model=TransferStatsResponse)
async def get_transfer_stats(
    address: Optional[str] = Query(None, description="Filter stats by specific address"),
    db: Session = Depends(get_db)
):
    """
    Get overall transfer statistics.
    
    Returns aggregate statistics about internal transfers, optionally filtered
    by a specific address (as sender or recipient).
    """
    try:
        query = db.query(InternalTransfer)
        
        if address:
            query = query.filter(
                or_(
                    InternalTransfer.from_address == address.lower(),
                    InternalTransfer.to_address == address.lower()
                )
            )
        
        # Get basic counts
        total_transfers = query.count()
        successful_transfers = query.filter(InternalTransfer.status == 'success').count()
        failed_transfers = query.filter(InternalTransfer.status == 'failed').count()
        
        # Get volume (only successful transfers)
        volume_result = query.filter(InternalTransfer.status == 'success').with_entities(
            func.sum(InternalTransfer.amount_eth)
        ).scalar()
        total_volume_eth = volume_result or 0
        
        # Get unique addresses count
        unique_addresses_query = db.query(InternalTransfer.from_address).union(
            db.query(InternalTransfer.to_address)
        )
        if address:
            # If filtering by address, count unique counterparties
            unique_addresses_query = query.with_entities(InternalTransfer.from_address).union(
                query.with_entities(InternalTransfer.to_address)
            ).filter(
                and_(
                    InternalTransfer.from_address != address.lower(),
                    InternalTransfer.to_address != address.lower()
                )
            )
        
        unique_addresses = unique_addresses_query.distinct().count()
        
        # Get latest transfer
        latest_transfer = query.order_by(desc(InternalTransfer.created_at)).first()
        latest_transfer_date = latest_transfer.created_at if latest_transfer else None
        
        return TransferStatsResponse(
            total_transfers=total_transfers,
            total_volume_eth=total_volume_eth,
            successful_transfers=successful_transfers,
            failed_transfers=failed_transfers,
            unique_addresses=unique_addresses,
            latest_transfer=latest_transfer_date
        )
    
    except Exception as e:
        logger.error(f"Failed to fetch transfer stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch transfer stats")

@router.get("/address-stats/{address}", response_model=AddressStatsResponse)
async def get_address_stats(
    address: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed statistics for a specific address.
    
    Returns comprehensive stats including sent/received counts, volumes,
    and activity timeline for a specific Ethereum address.
    """
    try:
        address = address.lower()
        
        # Sent transfers
        sent_query = db.query(InternalTransfer).filter(
            and_(
                InternalTransfer.from_address == address,
                InternalTransfer.status == 'success'
            )
        )
        sent_count = sent_query.count()
        sent_volume = sent_query.with_entities(func.sum(InternalTransfer.amount_eth)).scalar() or 0
        
        # Received transfers
        received_query = db.query(InternalTransfer).filter(
            and_(
                InternalTransfer.to_address == address,
                InternalTransfer.status == 'success'
            )
        )
        received_count = received_query.count()
        received_volume = received_query.with_entities(func.sum(InternalTransfer.amount_eth)).scalar() or 0
        
        # Activity timeline
        all_transfers = db.query(InternalTransfer).filter(
            or_(
                InternalTransfer.from_address == address,
                InternalTransfer.to_address == address
            )
        ).order_by(InternalTransfer.created_at)
        
        first_activity = None
        latest_activity = None
        
        if all_transfers.count() > 0:
            first_transfer = all_transfers.first()
            latest_transfer = all_transfers.order_by(desc(InternalTransfer.created_at)).first()
            first_activity = first_transfer.created_at if first_transfer else None
            latest_activity = latest_transfer.created_at if latest_transfer else None
        
        # Calculate net volume
        net_volume_eth = received_volume - sent_volume
        
        return AddressStatsResponse(
            address=address,
            sent_count=sent_count,
            received_count=received_count,
            sent_volume_eth=sent_volume,
            received_volume_eth=received_volume,
            net_volume_eth=net_volume_eth,
            first_activity=first_activity,
            latest_activity=latest_activity
        )
    
    except Exception as e:
        logger.error(f"Failed to fetch address stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch address stats")

@router.delete("/transfer-history", status_code=204)
async def clear_transfer_history(
    address: Optional[str] = Query(None, description="Clear history for specific address only"),
    confirm: bool = Query(False, description="Confirmation flag required"),
    db: Session = Depends(get_db)
):
    """
    Clear transfer history.
    
    WARNING: This will permanently delete transfer logs.
    Use with caution in production environments.
    """
    if not confirm:
        raise HTTPException(
            status_code=400, 
            detail="Confirmation required. Set confirm=true to proceed."
        )
    
    try:
        query = db.query(InternalTransfer)
        
        if address:
            # Clear only for specific address
            query = query.filter(
                or_(
                    InternalTransfer.from_address == address.lower(),
                    InternalTransfer.to_address == address.lower()
                )
            )
            deleted_count = query.delete()
            logger.warning(f"Cleared {deleted_count} transfer records for address: {address}")
        else:
            # Clear all transfers
            deleted_count = query.delete()
            logger.warning(f"Cleared all {deleted_count} transfer records")
        
        db.commit()
        return {"message": f"Cleared {deleted_count} transfer records"}
    
    except Exception as e:
        logger.error(f"Failed to clear transfer history: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to clear transfer history") 