#!/usr/bin/env python3
"""
Test script to verify savings functionality
This script tests the key savings API endpoints to ensure they're working correctly.
"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"

def get_auth_headers():
    """Login and get auth headers"""
    login_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    
    try:
        # Use the correct JSON login endpoint
        response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            print(f"✅ Login successful for user: {token_data.get('user', {}).get('email', 'Unknown')}")
            return {"Authorization": f"Bearer {token_data['access_token']}"}
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_savings_endpoints():
    """Test all savings endpoints"""
    print("🧪 Testing Savings API Endpoints\n")
    
    # Get auth headers
    headers = get_auth_headers()
    if not headers:
        print("❌ Cannot proceed without authentication")
        return
    
    print("✅ Authentication successful\n")
    
    # Test 1: Get all savings plans
    print("📊 Test 1: GET /savings/ (Get all savings plans)")
    try:
        response = requests.get(f"{API_BASE_URL}/savings/", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Found {len(data.get('data', []))} savings plans")
            plans = data.get('data', [])
        else:
            print(f"❌ Error: {response.text}")
            plans = []
    except Exception as e:
        print(f"❌ Error: {e}")
        plans = []
    
    print()
    
    # Test 2: Get financial accounts
    print("🏦 Test 2: GET /savings/financial-accounts (Get financial accounts)")
    try:
        response = requests.get(f"{API_BASE_URL}/savings/financial-accounts", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            accounts = response.json()
            print(f"✅ Success: Found {len(accounts)} financial accounts")
            for account in accounts:
                print(f"   - {account.get('name', 'Unknown')} ({account.get('type', 'Unknown')}): ${account.get('balance', 0):,.2f}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    
    # Test 3: Get savings summary
    print("📈 Test 3: GET /savings/summary/stats (Get savings summary)")
    try:
        response = requests.get(f"{API_BASE_URL}/savings/summary/stats", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            summary = response.json()
            print(f"✅ Success: Summary retrieved")
            print(f"   - Total plans: {summary.get('total_plans', 0)}")
            print(f"   - Total saved: ${summary.get('total_saved', 0):,.2f}")
            print(f"   - Projected value: ${summary.get('total_projected_value', 0):,.2f}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    
    # Test 4: Create a test savings plan
    print("📝 Test 4: POST /savings/ (Create savings plan)")
    
    # First, get available financial accounts to use as source
    source_account_id = None
    try:
        accounts_response = requests.get(f"{API_BASE_URL}/savings/financial-accounts", headers=headers)
        if accounts_response.status_code == 200:
            accounts = accounts_response.json()
            if accounts:
                source_account_id = accounts[0]['id']  # Use first available account
                print(f"   Using source account: {accounts[0]['name']} (ID: {source_account_id})")
            else:
                print("   ❌ No financial accounts available for testing")
        else:
            print(f"   ❌ Failed to get financial accounts: {accounts_response.text}")
    except Exception as e:
        print(f"   ❌ Error getting financial accounts: {e}")
    
    if source_account_id:
        test_plan = {
            "name": f"Test Plan {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "source_account_id": source_account_id,
            "initial_amount": 1000.0,
            "monthly_contribution": 500.0,
            "interest_rate": 5.0,
            "duration_months": 24,
            "interest_type": "compound"
        }
        
        try:
            response = requests.post(f"{API_BASE_URL}/savings/", 
                                   headers=headers, 
                                   json=test_plan)
            print(f"Status: {response.status_code}")
            if response.status_code == 201:
                created_plan = response.json()
                plan_id = created_plan.get('id')
                print(f"✅ Success: Created plan with ID {plan_id}")
                print(f"   - Name: {created_plan.get('name')}")
                print(f"   - Final value: ${created_plan.get('final_value', 0):,.2f}")
                print(f"   - Total interest: ${created_plan.get('total_interest', 0):,.2f}")
                print(f"   - Projections: {len(created_plan.get('projections', []))}")
            else:
                print(f"❌ Error: {response.text}")
                plan_id = None
        except Exception as e:
            print(f"❌ Error: {e}")
            plan_id = None
    else:
        print("❌ Skipping plan creation - no source account available")
        plan_id = None
    
    print()
    
    # Test 5: Get plan details (if we created one)
    if plan_id:
        print(f"📊 Test 5: GET /savings/{plan_id} (Get plan details)")
        try:
            response = requests.get(f"{API_BASE_URL}/savings/{plan_id}", headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                plan_detail = response.json()
                print(f"✅ Success: Retrieved plan details")
                print(f"   - Name: {plan_detail.get('name')}")
                print(f"   - Projections: {len(plan_detail.get('projections', []))}")
            else:
                print(f"❌ Error: {response.text}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print()
        
        # Test 6: Get projections separately
        print(f"📈 Test 6: GET /savings/{plan_id}/projections (Get projections)")
        try:
            response = requests.get(f"{API_BASE_URL}/savings/{plan_id}/projections", headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                projections = response.json()
                print(f"✅ Success: Retrieved {len(projections)} projections")
                if projections:
                    first_proj = projections[0]
                    last_proj = projections[-1]
                    print(f"   - Month 1 balance: ${first_proj.get('balance', 0):,.2f}")
                    print(f"   - Final balance: ${last_proj.get('balance', 0):,.2f}")
            else:
                print(f"❌ Error: {response.text}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print()
    
    # Test 7: Calculate savings (preview)
    print("🧮 Test 7: POST /savings/calculate (Calculate preview)")
    calc_data = {
        "initial_amount": 2000.0,
        "monthly_contribution": 750.0,
        "interest_rate": 6.0,
        "duration_months": 36,
        "interest_type": "compound"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/savings/calculate", 
                               headers=headers, 
                               json=calc_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            calc_result = response.json()
            print(f"✅ Success: Calculation completed")
            print(f"   - Final value: ${calc_result.get('final_value', 0):,.2f}")
            print(f"   - Total interest: ${calc_result.get('total_interest', 0):,.2f}")
            print(f"   - Total contributions: ${calc_result.get('total_contributions', 0):,.2f}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n🎉 Savings API tests completed!")

if __name__ == "__main__":
    test_savings_endpoints() 