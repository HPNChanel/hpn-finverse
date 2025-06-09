"""
Test for staking service to verify contract address fix
"""

import pytest
from unittest.mock import Mock, patch
from app.services.staking_service import StakingService

def test_mock_pools_have_contract_addresses():
    """Test that mock pools include required contract address fields"""
    staking_service = StakingService()
    
    # Get mock pools directly
    mock_pools = staking_service._get_mock_pools()
    
    # Verify we have pools
    assert len(mock_pools) > 0
    
    # Verify each pool has required fields
    for pool in mock_pools:
        assert 'id' in pool
        assert 'name' in pool
        assert 'tokenAddress' in pool
        assert 'contractAddress' in pool
        assert 'tokenSymbol' in pool
        
        # Verify contract addresses are valid
        token_address = pool['tokenAddress']
        contract_address = pool['contractAddress']
        
        assert token_address is not None
        assert contract_address is not None
        assert isinstance(token_address, str)
        assert isinstance(contract_address, str)
        assert len(token_address) == 42  # 0x + 40 hex chars
        assert len(contract_address) == 42
        assert token_address.startswith('0x')
        assert contract_address.startswith('0x')
        
        # Contract address should match token address for compatibility
        assert token_address == contract_address

def test_ethereum_address_validation():
    """Test the Ethereum address validation utility"""
    staking_service = StakingService()
    
    # Valid addresses
    assert staking_service._is_valid_ethereum_address('0x0000000000000000000000000000000000000000')
    assert staking_service._is_valid_ethereum_address('0x5FbDB2315678afecb367f032d93F642f64180aa3')
    
    # Invalid addresses
    assert not staking_service._is_valid_ethereum_address(None)
    assert not staking_service._is_valid_ethereum_address('')
    assert not staking_service._is_valid_ethereum_address('invalid')
    assert not staking_service._is_valid_ethereum_address('0x123')  # Too short
    assert not staking_service._is_valid_ethereum_address('5FbDB2315678afecb367f032d93F642f64180aa3')  # No 0x
    assert not staking_service._is_valid_ethereum_address('0xZZZDB2315678afecb367f032d93F642f64180aa3')  # Invalid hex

def test_get_staking_pools_response_has_contract_addresses():
    """Test that the main API response includes contract addresses"""
    staking_service = StakingService()
    
    # Mock the database session
    mock_db = Mock()
    
    # Call the main method
    result = staking_service.get_staking_pools(mock_db)
    
    # Should return pools even if blockchain is unavailable
    assert result.total_pools > 0
    assert len(result.pools) > 0
    
    # Check that each pool has the required tokenAddress field
    for pool in result.pools:
        assert hasattr(pool, 'token_address')
        assert pool.token_address is not None
        assert isinstance(pool.token_address, str)
        assert len(pool.token_address) == 42
        assert pool.token_address.startswith('0x')

if __name__ == "__main__":
    # Run basic test
    test_mock_pools_have_contract_addresses()
    test_ethereum_address_validation()
    print("✅ All tests passed!") 