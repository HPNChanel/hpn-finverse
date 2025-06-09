from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
import re

class ETHTransferLogRequest(BaseModel):
    """Request schema for logging ETH transfers as specified in 2025 requirements"""
    from_address: str = Field(..., description="Sender's Ethereum address")
    to_address: str = Field(..., description="Recipient's Ethereum address")
    amount_eth: Decimal = Field(..., description="Amount in ETH", gt=0)
    tx_hash: str = Field(..., description="Transaction hash")
    timestamp: datetime = Field(..., description="Transaction timestamp (ISO8601)")
    gas_used: Optional[str] = Field(None, description="Gas used for the transaction")
    gas_price: Optional[str] = Field(None, description="Gas price for the transaction")
    notes: Optional[str] = Field(None, description="Optional notes")

    @field_validator('from_address', 'to_address')
    @classmethod
    def validate_ethereum_address(cls, v):
        if not re.match(r'^0x[a-fA-F0-9]{40}$', v):
            raise ValueError('Invalid Ethereum address format')
        return v.lower()

    @field_validator('tx_hash')
    @classmethod
    def validate_tx_hash(cls, v):
        if not re.match(r'^0x[a-fA-F0-9]{64}$', v):
            raise ValueError('Invalid transaction hash format')
        return v.lower()

    @field_validator('to_address')
    @classmethod
    def validate_different_addresses(cls, v, info):
        if 'from_address' in info.data and info.data['from_address'].lower() == v.lower():
            raise ValueError('From and to addresses cannot be the same')
        return v

    @field_validator('amount_eth')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        if v < Decimal('0.0001'):
            raise ValueError('Minimum transfer amount is 0.0001 ETH')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "from_address": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e1",
                "to_address": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e2",
                "amount_eth": 0.25,
                "tx_hash": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e1742d35cc6ae75f8e8e2a1b88e7",
                "timestamp": "2025-01-08T12:00:00Z",
                "gas_used": "21000",
                "gas_price": "20000000000",
                "notes": "ETH transfer via FinVerse"
            }
        }

class ETHTransferLogResponse(BaseModel):
    """Response schema for ETH transfer logging"""
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
    message: str = Field(default="", description="Response message")

    class Config:
        from_attributes = True

class ETHTransferHistoryResponse(BaseModel):
    """Response schema for ETH transfer history"""
    transfers: List[ETHTransferLogResponse]
    total: int = Field(..., description="Total number of transfers")
    limit: int = Field(..., description="Number of transfers returned")
    offset: int = Field(..., description="Number of transfers skipped")
    has_more: bool = Field(..., description="Whether there are more transfers available")

    class Config:
        json_schema_extra = {
            "example": {
                "transfers": [
                    {
                        "id": 1,
                        "from_address": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e1",
                        "to_address": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e2",
                        "amount_eth": 0.25,
                        "tx_hash": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e1742d35cc6ae75f8e8e2a1b88e7",
                        "gas_used": "21000",
                        "gas_price": "20000000000",
                        "status": "success",
                        "notes": "ETH transfer via FinVerse",
                        "created_at": "2025-01-08T12:00:00Z",
                        "message": ""
                    }
                ],
                "total": 1,
                "limit": 50,
                "offset": 0,
                "has_more": False
            }
        } 