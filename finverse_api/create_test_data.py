#!/usr/bin/env python3
"""
Create test data for FinVerse API
This script creates test users and financial accounts for development and testing.
"""

import sys
sys.path.append('.')

from app.dependencies import get_db
from app.models.user import User
from app.models.financial_account import FinancialAccount
from app.core.security import get_password_hash
from sqlalchemy.orm import Session
from decimal import Decimal

def create_test_data():
    """Create test users and financial accounts"""
    db = next(get_db())
    
    try:
        # Create test user if not exists
        test_email = "test@example.com"
        existing_user = db.query(User).filter(User.email == test_email).first()
        
        if not existing_user:
            print(f"Creating test user: {test_email}")
            test_user = User(
                email=test_email,
                name="Test User",
                hashed_password=get_password_hash("testpassword123"),
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"✅ Created user with ID: {test_user.id}")
        else:
            test_user = existing_user
            print(f"✅ Using existing user with ID: {test_user.id}")
        
        # Create financial accounts if not exist
        existing_accounts = db.query(FinancialAccount).filter(
            FinancialAccount.user_id == test_user.id
        ).count()
        
        if existing_accounts == 0:
            print("Creating test financial accounts...")
            
            accounts_data = [
                {
                    "name": "Main Checking Account",
                    "type": "checking",
                    "balance": Decimal("5000.00"),
                    "currency": "USD"
                },
                {
                    "name": "High-Yield Savings",
                    "type": "savings",
                    "balance": Decimal("15000.00"),
                    "currency": "USD"
                },
                {
                    "name": "Emergency Fund",
                    "type": "savings",
                    "balance": Decimal("10000.00"),
                    "currency": "USD"
                }
            ]
            
            for account_data in accounts_data:
                account = FinancialAccount(
                    user_id=test_user.id,
                    name=account_data["name"],
                    type=account_data["type"],
                    balance=account_data["balance"],
                    currency=account_data["currency"],
                    is_active=True
                )
                db.add(account)
                print(f"   - Created: {account_data['name']} (${account_data['balance']})")
            
            db.commit()
            print("✅ Created test financial accounts")
        else:
            print(f"✅ Found {existing_accounts} existing financial accounts")
        
        # Show summary
        total_accounts = db.query(FinancialAccount).filter(
            FinancialAccount.user_id == test_user.id,
            FinancialAccount.is_active == True
        ).count()
        
        total_balance = db.query(FinancialAccount).filter(
            FinancialAccount.user_id == test_user.id,
            FinancialAccount.is_active == True
        ).with_entities(FinancialAccount.balance).all()
        
        total_balance_sum = sum(float(balance[0]) for balance in total_balance)
        
        print(f"\n📊 Summary:")
        print(f"   - User: {test_user.email} (ID: {test_user.id})")
        print(f"   - Active accounts: {total_accounts}")
        print(f"   - Total balance: ${total_balance_sum:,.2f}")
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data() 