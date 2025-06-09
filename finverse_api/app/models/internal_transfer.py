from sqlalchemy import Column, Integer, String, DateTime, Numeric, Text
from sqlalchemy.sql import func
from app.db.session import Base

class InternalTransfer(Base):
    __tablename__ = "internal_transfers"

    id = Column(Integer, primary_key=True, index=True)
    from_address = Column(String(42), nullable=False, index=True)  # Ethereum address
    to_address = Column(String(42), nullable=False, index=True)    # Ethereum address
    amount_eth = Column(Numeric(precision=20, scale=8), nullable=False)  # ETH amount with high precision
    tx_hash = Column(String(66), nullable=True, index=True)  # Transaction hash (66 chars for 0x + 64)
    gas_used = Column(String(20), nullable=True)  # Gas used as string
    gas_price = Column(String(30), nullable=True)  # Gas price as string
    status = Column(String(20), nullable=False, default="success")  # success, failed
    notes = Column(Text, nullable=True)  # Optional notes
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<InternalTransfer(id={self.id}, from={self.from_address[:8]}..., to={self.to_address[:8]}..., amount={self.amount_eth} ETH)>" 