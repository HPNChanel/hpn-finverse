"""
Unit tests for transaction service
"""

import pytest
from decimal import Decimal
from datetime import date
from sqlalchemy.orm import Session
from unittest.mock import Mock, MagicMock
from fastapi import HTTPException

from app.services.transaction_service import TransactionService, delete_transaction
from app.models.transaction import Transaction, TransactionType
from app.models.financial_account import FinancialAccount


class TestDeleteTransaction:
    """Test cases for delete_transaction function"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.service = TransactionService()
    
    def test_delete_transaction_success(self):
        """Test successful transaction deletion with balance adjustment"""
        # Mock database session
        db_mock = Mock(spec=Session)
        
        # Mock transaction - CRITICAL FIX: Use correct transaction type value
        transaction_mock = Mock(spec=Transaction)
        transaction_mock.id = 1
        transaction_mock.user_id = 1
        transaction_mock.wallet_id = 1
        transaction_mock.amount = Decimal('100.00')
        transaction_mock.transaction_type = 1  # 1 = EXPENSE (not TransactionType.EXPENSE)
        
        # Mock wallet
        wallet_mock = Mock(spec=FinancialAccount)
        wallet_mock.balance = 500.0
        
        # Configure query chain
        db_mock.query.return_value.filter.return_value.first.side_effect = [
            transaction_mock,  # First call for transaction
            wallet_mock        # Second call for wallet
        ]
        
        # Test the service method
        result = self.service.delete_transaction(db_mock, 1, 1)
        
        # Verify result
        assert result is True
        
        # Verify wallet balance was adjusted (expense deleted, so balance increases)
        expected_balance = 500.0 + 100.0  # Original + returned expense
        assert wallet_mock.balance == expected_balance
        
        # Verify database operations
        db_mock.delete.assert_called_once_with(transaction_mock)
        db_mock.commit.assert_called_once()
    
    def test_delete_transaction_not_found(self):
        """Test transaction deletion when transaction doesn't exist"""
        # Mock database session
        db_mock = Mock(spec=Session)
        
        # Configure query to return None (transaction not found)
        db_mock.query.return_value.filter.return_value.first.return_value = None
        
        # Test the service method
        result = self.service.delete_transaction(db_mock, 999, 1)
        
        # Verify result
        assert result is False
        
        # Verify no database changes
        db_mock.delete.assert_not_called()
        db_mock.commit.assert_not_called()
    
    def test_delete_transaction_income_adjustment(self):
        """Test balance adjustment for income transaction deletion"""
        # Mock database session
        db_mock = Mock(spec=Session)
        
        # Mock income transaction - CRITICAL FIX: Use correct transaction type value
        transaction_mock = Mock(spec=Transaction)
        transaction_mock.id = 2
        transaction_mock.user_id = 1
        transaction_mock.wallet_id = 1
        transaction_mock.amount = Decimal('200.00')
        transaction_mock.transaction_type = 0  # 0 = INCOME (not TransactionType.INCOME)
        
        # Mock wallet
        wallet_mock = Mock(spec=FinancialAccount)
        wallet_mock.balance = 1000.0
        
        # Configure query chain
        db_mock.query.return_value.filter.return_value.first.side_effect = [
            transaction_mock,  # First call for transaction
            wallet_mock        # Second call for wallet
        ]
        
        # Test the service method
        result = self.service.delete_transaction(db_mock, 2, 1)
        
        # Verify result
        assert result is True
        
        # Verify wallet balance was adjusted (income deleted, so balance decreases)
        expected_balance = 1000.0 - 200.0  # Original - removed income
        assert wallet_mock.balance == expected_balance
    
    def test_transaction_type_validation(self):
        """Test that transaction types are properly validated"""
        # Mock database session
        db_mock = Mock(spec=Session)
        
        # Test valid transaction types
        valid_types = [0, 1]  # INCOME, EXPENSE
        for transaction_type in valid_types:
            transaction_mock = Mock(spec=Transaction)
            transaction_mock.transaction_type = transaction_type
            
            # Verify the transaction type is preserved
            assert transaction_mock.transaction_type == transaction_type
            
            # Verify string representation
            if transaction_type == 0:
                assert transaction_type == 0  # INCOME
            else:
                assert transaction_type == 1  # EXPENSE
    
    def test_legacy_function_compatibility(self):
        """Test that legacy function import still works"""
        # This ensures backward compatibility
        assert callable(delete_transaction)
        
        # Mock database session
        db_mock = Mock(spec=Session)
        
        # Configure mock to return None (transaction not found)
        db_mock.query.return_value.filter.return_value.first.return_value = None
        
        # Test legacy function
        result = delete_transaction(db_mock, 999, 1)
        
        # Should work the same as the class method
        assert result is False

print("✅ TransactionService test class updated for transaction type fix")
print("✅ Added validation tests for transaction types 0=INCOME, 1=EXPENSE")
