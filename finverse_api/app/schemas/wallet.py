from pydantic import BaseModel, Field, validator
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
import re

class TransferLogRequest(BaseModel):
    from_address: str = Field(..., description="Sender's Ethereum address")
    to_address: str = Field(..., description="Recipient's Ethereum address")
    amount_eth: Decimal = Field(..., description="Amount in ETH", gt=0)
    tx_hash: str = Field(..., description="Transaction hash")
    timestamp: datetime = Field(..., description="Transaction timestamp")
    gas_used: Optional[str] = Field(None, description="Gas used for the transaction")
    gas_price: Optional[str] = Field(None, description="Gas price for the transaction")
    status: str = Field(..., description="Transaction status", pattern="^(success|failed)$")
    notes: Optional[str] = Field(None, description="Optional notes")

    @validator('from_address', 'to_address')
    def validate_ethereum_address(cls, v):
        if not re.match(r'^0x[a-fA-F0-9]{40}$', v):
            raise ValueError('Invalid Ethereum address format')
        return v.lower()

    @validator('tx_hash')
    def validate_tx_hash(cls, v):
        if not re.match(r'^0x[a-fA-F0-9]{64}$', v):
            raise ValueError('Invalid transaction hash format')
        return v.lower()

    @validator('from_address', 'to_address')
    def validate_different_addresses(cls, v, values):
        if 'from_address' in values and values['from_address'] == v:
            raise ValueError('From and to addresses cannot be the same')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "from_address": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e1",
                "to_address": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e2",
                "amount_eth": 0.1,
                "tx_hash": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e1742d35cc6ae75f8e8e2a1b88e7",
                "timestamp": "2023-10-01T12:00:00Z",
                "gas_used": "21000",
                "gas_price": "0.000000020",
                "status": "success",
                "notes": "Test transfer"
            }
        }

class TransferLogResponse(BaseModel):
    id: int
    from_address: str
    to_address: str
    amount_eth: Decimal
    tx_hash: Optional[str]
    gas_used: Optional[str]
    gas_price: Optional[str]
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TransferHistoryRequest(BaseModel):
    address: Optional[str] = Field(None, description="Filter by address (as sender or recipient)")
    status: Optional[str] = Field(None, description="Filter by status", pattern="^(success|failed)$")
    limit: int = Field(100, description="Maximum number of records to return", ge=1, le=1000)
    offset: int = Field(0, description="Number of records to skip", ge=0)

    @validator('address')
    def validate_ethereum_address(cls, v):
        if v and not re.match(r'^0x[a-fA-F0-9]{40}$', v):
            raise ValueError('Invalid Ethereum address format')
        return v.lower() if v else v

class TransferHistoryResponse(BaseModel):
    transfers: List[TransferLogResponse]
    total: int
    limit: int
    offset: int

class TransferStatsResponse(BaseModel):
    total_transfers: int
    total_volume_eth: Decimal
    successful_transfers: int
    failed_transfers: int
    unique_addresses: int
    latest_transfer: Optional[datetime]

class AddressStatsResponse(BaseModel):
    address: str
    sent_count: int
    received_count: int
    sent_volume_eth: Decimal
    received_volume_eth: Decimal
    net_volume_eth: Decimal
    first_activity: Optional[datetime]
    latest_activity: Optional[datetime] 