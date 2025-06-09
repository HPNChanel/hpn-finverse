#!/usr/bin/env python3
"""
Verification script for ETH transfer logging endpoints
Tests both primary and fallback API endpoints to ensure they're working correctly.
"""

import requests
import json
from datetime import datetime
import uuid

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
PRIMARY_ENDPOINT = f"{API_BASE_URL}/wallet/eth-transfer"
FALLBACK_ENDPOINT = f"{API_BASE_URL}/eth-transfer/log"

def create_test_payload():
    """Create a test payload that matches the optimized frontend format"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "from_address": f"0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d{unique_id[:3]}",
        "to_address": f"0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d{unique_id[3:6]}", 
        "amount_eth": 0.01,
        "tx_hash": f"0x{'a' * 56}{unique_id}",  # Valid 64-char hex with unique suffix
        "gas_used": "21000",
        "gas_price": "20000000000",
        "status": "success",
        "notes": "ETH transfer via SendETH UI - Test",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

def test_endpoint(endpoint_url, endpoint_name):
    """Test a specific API endpoint"""
    print(f"\n🔄 Testing {endpoint_name}...")
    print(f"URL: {endpoint_url}")
    
    payload = create_test_payload()
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            endpoint_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print(f"✅ {endpoint_name} SUCCESS")
            response_data = response.json()
            print(f"Response: {json.dumps(response_data, indent=2)}")
            
            # Verify response contains expected fields
            required_fields = ['id', 'from_address', 'to_address', 'amount_eth', 'tx_hash', 'status']
            missing_fields = [field for field in required_fields if field not in response_data]
            
            if missing_fields:
                print(f"⚠️ Missing fields in response: {missing_fields}")
                return False
            else:
                print(f"✅ All required fields present in response")
                return True
                
        else:
            print(f"❌ {endpoint_name} FAILED")
            print(f"Error Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ {endpoint_name} CONNECTION ERROR: {e}")
        return False

def main():
    """Run verification tests"""
    print("🚀 ETH Transfer Logging Endpoints Verification")
    print("=" * 50)
    
    # Test primary endpoint
    primary_success = test_endpoint(PRIMARY_ENDPOINT, "Primary Endpoint (/wallet/eth-transfer)")
    
    # Test fallback endpoint  
    fallback_success = test_endpoint(FALLBACK_ENDPOINT, "Fallback Endpoint (/eth-transfer/log)")
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 VERIFICATION SUMMARY")
    print("=" * 50)
    
    if primary_success:
        print("✅ Primary endpoint (/wallet/eth-transfer) - WORKING")
    else:
        print("❌ Primary endpoint (/wallet/eth-transfer) - FAILED")
    
    if fallback_success:
        print("✅ Fallback endpoint (/eth-transfer/log) - WORKING")
    else:
        print("❌ Fallback endpoint (/eth-transfer/log) - FAILED")
    
    if primary_success and fallback_success:
        print("\n🎉 ALL ENDPOINTS WORKING - ETH transfer logging is ready!")
        print("\n📝 Next Steps:")
        print("1. Start the frontend development server")
        print("2. Connect MetaMask wallet")
        print("3. Test ETH transfers via /send-eth")
        print("4. Verify database entries in internal_transfers table")
        return True
    else:
        print("\n⚠️ SOME ENDPOINTS FAILED - Check backend server status")
        print("\n🔧 Troubleshooting:")
        print("1. Ensure backend server is running on http://localhost:8000")
        print("2. Check database connection and internal_transfers table exists") 
        print("3. Verify API routes are properly registered")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 