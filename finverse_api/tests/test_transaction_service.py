"""
Unit tests for transaction service
"""

import pytest
from decimal import Decimal
from datetime import date
from sqlalchemy.orm import Session
from unittest.mock import Mock, MagicMock

from app.services.transaction_service import delete_transaction
from app.models.transaction import Transaction, TransactionType
from app.models.financial_account import FinancialAccount


class TestDeleteTransaction:
    """Test cases for delete_transaction function"""
    
    def test_delete_expense_transaction_updates_wallet_balance_correctly(self):
        """Test that deleting an expense transaction correctly adds back the amount to wallet balance"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_transaction = Mock(spec=Transaction)
        mock_transaction.id = 1
        mock_transaction.amount = Decimal('50.00')  # Transaction amount as Decimal
        mock_transaction.transaction_type = TransactionType.EXPENSE
        mock_transaction.wallet_id = 1
        
        mock_wallet = Mock(spec=FinancialAccount)
        mock_wallet.id = 1
        mock_wallet.balance = 100.0  # Wallet balance as float
        
        # Setup mock query chain for transaction
        mock_transaction_query = Mock()
        mock_transaction_query.filter.return_value.first.return_value = mock_transaction
        
        # Setup mock query chain for wallet
        mock_wallet_query = Mock()
        mock_wallet_query.filter.return_value.first.return_value = mock_wallet
        
        # Configure db.query to return appropriate mocks
        def mock_query_side_effect(model):
            if model == Transaction:
                return mock_transaction_query
            elif model == FinancialAccount:
                return mock_wallet_query
            return Mock()
        
        mock_db.query.side_effect = mock_query_side_effect
        mock_db.begin_nested.return_value = None
        mock_db.commit.return_value = None
        mock_db.delete.return_value = None
        
        # Act
        result = delete_transaction(mock_db, transaction_id=1, user_id=1)
        
        # Assert
        assert result is True
        # Verify wallet balance was updated correctly: 100.0 + 50.00 = 150.0
        assert mock_wallet.balance == 150.0
        # Verify transaction was deleted
        mock_db.delete.assert_called_once_with(mock_transaction)
        mock_db.commit.assert_called_once()
    
    def test_delete_income_transaction_updates_wallet_balance_correctly(self):
        """Test that deleting an income transaction correctly subtracts the amount from wallet balance"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_transaction = Mock(spec=Transaction)
        mock_transaction.id = 1
        mock_transaction.amount = Decimal('30.00')  # Transaction amount as Decimal
        mock_transaction.transaction_type = TransactionType.INCOME
        mock_transaction.wallet_id = 1
        
        mock_wallet = Mock(spec=FinancialAccount)
        mock_wallet.id = 1
        mock_wallet.balance = 100.0  # Wallet balance as float
        
        # Setup mock query chain for transaction
        mock_transaction_query = Mock()
        mock_transaction_query.filter.return_value.first.return_value = mock_transaction
        
        # Setup mock query chain for wallet
        mock_wallet_query = Mock()
        mock_wallet_query.filter.return_value.first.return_value = mock_wallet
        
        # Configure db.query to return appropriate mocks
        def mock_query_side_effect(model):
            if model == Transaction:
                return mock_transaction_query
            elif model == FinancialAccount:
                return mock_wallet_query
            return Mock()
        
        mock_db.query.side_effect = mock_query_side_effect
        mock_db.begin_nested.return_value = None
        mock_db.commit.return_value = None
        mock_db.delete.return_value = None
        
        # Act
        result = delete_transaction(mock_db, transaction_id=1, user_id=1)
        
        # Assert
        assert result is True
        # Verify wallet balance was updated correctly: 100.0 - 30.00 = 70.0
        assert mock_wallet.balance == 70.0
        # Verify transaction was deleted
        mock_db.delete.assert_called_once_with(mock_transaction)
        mock_db.commit.assert_called_once()
    
    def test_delete_transaction_with_decimal_precision(self):
        """Test that decimal precision is maintained when updating wallet balance"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_transaction = Mock(spec=Transaction)
        mock_transaction.id = 1
        mock_transaction.amount = Decimal('25.99')  # Transaction with decimal places
        mock_transaction.transaction_type = TransactionType.EXPENSE
        mock_transaction.wallet_id = 1
        
        mock_wallet = Mock(spec=FinancialAccount)
        mock_wallet.id = 1
        mock_wallet.balance = 74.01  # Wallet balance as float
        
        # Setup mock query chain for transaction
        mock_transaction_query = Mock()
        mock_transaction_query.filter.return_value.first.return_value = mock_transaction
        
        # Setup mock query chain for wallet
        mock_wallet_query = Mock()
        mock_wallet_query.filter.return_value.first.return_value = mock_wallet
        
        # Configure db.query to return appropriate mocks
        def mock_query_side_effect(model):
            if model == Transaction:
                return mock_transaction_query
            elif model == FinancialAccount:
                return mock_wallet_query
            return Mock()
        
        mock_db.query.side_effect = mock_query_side_effect
        mock_db.begin_nested.return_value = None
        mock_db.commit.return_value = None
        mock_db.delete.return_value = None
        
        # Act
        result = delete_transaction(mock_db, transaction_id=1, user_id=1)
        
        # Assert
        assert result is True
        # Verify wallet balance was updated correctly: 74.01 + 25.99 = 100.0
        assert mock_wallet.balance == 100.0
        # Verify transaction was deleted
        mock_db.delete.assert_called_once_with(mock_transaction)
        mock_db.commit.assert_called_once()
