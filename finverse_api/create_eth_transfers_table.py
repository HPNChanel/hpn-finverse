#!/usr/bin/env python3
"""
Database migration script for eth_transfers table (internal_transfers)
This ensures the table exists for the new ETH transfer logging feature.
"""

import os
import sys
from sqlalchemy import create_engine, inspect, MetaData, Table, Column, Integer, String, DateTime, Numeric, Text
from sqlalchemy.sql import func

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def create_eth_transfers_table():
    """Create the internal_transfers table if it doesn't exist"""
    
    # Database URL (adjust as needed for your environment)
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/finverse_db')
    
    if not database_url:
        print("❌ DATABASE_URL not found. Please set the environment variable.")
        return False
    
    try:
        # Create engine
        engine = create_engine(database_url)
        metadata = MetaData()
        
        # Check if table already exists
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if 'internal_transfers' in existing_tables:
            print("✅ Table 'internal_transfers' already exists.")
            return True
        
        print("📋 Creating 'internal_transfers' table...")
        
        # Define the table structure
        internal_transfers_table = Table(
            'internal_transfers',
            metadata,
            Column('id', Integer, primary_key=True, index=True),
            Column('from_address', String(42), nullable=False, index=True),
            Column('to_address', String(42), nullable=False, index=True),
            Column('amount_eth', Numeric(precision=20, scale=8), nullable=False),
            Column('tx_hash', String(66), nullable=True, index=True),
            Column('gas_used', String(20), nullable=True),
            Column('gas_price', String(30), nullable=True),
            Column('status', String(20), nullable=False, default="success"),
            Column('notes', Text, nullable=True),
            Column('created_at', DateTime(timezone=True), server_default=func.now(), nullable=False),
            Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
        )
        
        # Create the table
        metadata.create_all(engine)
        
        print("✅ Table 'internal_transfers' created successfully!")
        print("""
📊 Table structure:
- id: Primary key (integer)
- from_address: Sender Ethereum address (string, 42 chars)
- to_address: Recipient Ethereum address (string, 42 chars)
- amount_eth: Transfer amount (decimal, high precision)
- tx_hash: Transaction hash (string, 66 chars, optional)
- gas_used: Gas used (string, optional)
- gas_price: Gas price (string, optional)
- status: Transfer status (string, default: 'success')
- notes: Optional notes (text)
- created_at: Creation timestamp
- updated_at: Last update timestamp

🔗 Indexes created on:
- from_address
- to_address  
- tx_hash
        """)
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to create table: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 ETH Transfers Table Migration")
    print("=" * 50)
    
    success = create_eth_transfers_table()
    
    if success:
        print("\n✅ Migration completed successfully!")
        print("🎯 You can now use the ETH transfer logging API at:")
        print("   POST /api/v1/eth-transfer/log")
        print("   GET  /api/v1/eth-transfer/history")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 