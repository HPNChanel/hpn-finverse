#!/usr/bin/env python3
"""
Test script to check what contract addresses the staking service is using
"""

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.staking_service import StakingService
from sqlalchemy.orm import Session

def test_staking_addresses():
    print("🔍 Testing StakingService contract addresses...")
    
    # Create staking service instance
    staking_service = StakingService()
    
    print(f"📋 contracts_config available: {staking_service.contracts_config is not None}")
    if staking_service.contracts_config:
        print(f"📄 contracts_config: {staking_service.contracts_config}")
    
    print(f"⚡ w3 connected: {staking_service.w3 is not None and staking_service.w3.is_connected() if staking_service.w3 else False}")
    print(f"📝 stake_vault_contract loaded: {staking_service.stake_vault_contract is not None}")
    
    # Test mock pools
    print("\n🔍 Testing mock pools...")
    try:
        mock_pools = staking_service._get_mock_pools()
        print(f"📊 Generated {len(mock_pools)} mock pools:")
        
        for pool in mock_pools:
            print(f"  Pool {pool['id']}: {pool['name']}")
            print(f"    Token Address: {pool['tokenAddress']}")
            print(f"    Token Symbol: {pool['tokenSymbol']}")
            print(f"    Is Valid Address: {staking_service._is_valid_ethereum_address(pool['tokenAddress'])}")
            print()
            
    except Exception as e:
        print(f"❌ Error getting mock pools: {e}")
    
    # Test active pools (with mock DB session)
    print("🔍 Testing active pools...")
    try:
        # We can't easily create a real DB session, so let's just test the mock pools logic
        print("✅ Mock pools test completed")
        
    except Exception as e:
        print(f"❌ Error testing active pools: {e}")

if __name__ == "__main__":
    test_staking_addresses() 