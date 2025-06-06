"""
Staking Event Logs model for FinVerse API
"""

from datetime import datetime
from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Integer, DECIMAL, Index
from sqlalchemy.orm import relationship

from app.db.session import Base


class StakingLog(Base):
    """Model for storing blockchain staking events"""
    
    __tablename__ = "staking_logs"
    
    # Core identification
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    stake_id = Column(BigInteger, nullable=False, index=True, comment="Blockchain stake ID")
    
    # Event data
    amount = Column(DECIMAL(18, 8), nullable=False, comment="Staked amount")
    duration = Column(Integer, nullable=False, default=0, comment="Stake duration in days")
    tx_hash = Column(String(100), nullable=False, unique=True, index=True, comment="Transaction hash")
    pool_id = Column(String(50), nullable=False, default='default-pool', comment="Pool identifier")
    
    # Timestamps
    event_timestamp = Column(DateTime, nullable=False, comment="Blockchain event timestamp")
    synced_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="When synced to backend")
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="staking_logs")
    
    # Database indexes for performance
    __table_args__ = (
        Index('idx_staking_logs_user_stake', 'user_id', 'stake_id'),
        Index('idx_staking_logs_tx_hash', 'tx_hash'),
        Index('idx_staking_logs_event_time', 'event_timestamp'),
    )
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "stake_id": self.stake_id,
            "amount": float(self.amount),
            "duration": self.duration,
            "tx_hash": self.tx_hash,
            "pool_id": self.pool_id,
            "event_timestamp": self.event_timestamp.isoformat() if self.event_timestamp else None,
            "synced_at": self.synced_at.isoformat() if self.synced_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
