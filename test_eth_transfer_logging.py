#!/usr/bin/env python3
"""
Test script to verify ETH transfer logging to the backend
"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
WALLET_ENDPOINT = f"{API_BASE_URL}/wallet/eth-transfer"
ETH_TRANSFER_ENDPOINT = f"{API_BASE_URL}/eth-transfer/log"

def test_payload():
    """Create a test payload that matches frontend format"""
    return {
        "from_address": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e1",
        "to_address": "0x742d35cc6ae75f8e8e2a1b88e7e1b3b6b4f8d8e2", 
        "amount_eth": 0.25,
        "tx_hash": f"0x{'a' * 64}",  # Valid 64-char hex
        "timestamp": datetime.now().isoformat(),
        "gas_used": "21000",
        "gas_price": "20000000000",
        "notes": "Test ETH transfer via script"
    }

def test_wallet_endpoint():
    """Test POST /api/v1/wallet/eth-transfer"""
    print("🔄 Testing Wallet Endpoint...")
    print(f"URL: {WALLET_ENDPOINT}")
    
    payload = test_payload()
    payload["tx_hash"] = f"0x{'b' * 64}"  # Unique hash for wallet test
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            WALLET_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Wallet endpoint SUCCESS")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True
        else:
            print("❌ Wallet endpoint FAILED")
            print(f"Error Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Wallet endpoint CONNECTION ERROR: {e}")
        return False

def test_eth_transfer_endpoint():
    """Test POST /api/v1/eth-transfer/log"""
    print("\n🔄 Testing ETH Transfer Endpoint...")
    print(f"URL: {ETH_TRANSFER_ENDPOINT}")
    
    payload = test_payload()
    payload["tx_hash"] = f"0x{'c' * 64}"  # Unique hash for eth-transfer test
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            ETH_TRANSFER_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ ETH Transfer endpoint SUCCESS")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True
        else:
            print("❌ ETH Transfer endpoint FAILED")
            print(f"Error Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ ETH Transfer endpoint CONNECTION ERROR: {e}")
        return False

def test_backend_health():
    """Test if backend is reachable"""
    print("🔄 Testing Backend Health...")
    
    try:
        # Try basic health check
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        print(f"Health Check Status: {response.status_code}")
        return True
    except requests.exceptions.RequestException:
        try:
            # Try root endpoint
            response = requests.get(API_BASE_URL, timeout=5)
            print(f"Root Endpoint Status: {response.status_code}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"❌ Backend UNREACHABLE: {e}")
            print("💡 Make sure the FastAPI backend is running on http://localhost:8000")
            return False

def test_get_transfer_history():
    """Test GET /api/v1/wallet/eth-history"""
    print("\n🔄 Testing Transfer History Endpoint...")
    
    url = f"{API_BASE_URL}/wallet/eth-history"
    params = {
        "limit": 10,
        "offset": 0
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Transfer History endpoint SUCCESS")
            print(f"Total transfers: {data.get('total', 0)}")
            print(f"Transfers in response: {len(data.get('transfers', []))}")
            
            if data.get('transfers'):
                print("Recent transfers:")
                for transfer in data['transfers'][:3]:  # Show first 3
                    print(f"  - {transfer['amount_eth']} ETH: {transfer['from_address']} → {transfer['to_address']}")
            return True
        else:
            print("❌ Transfer History endpoint FAILED")
            print(f"Error Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Transfer History endpoint CONNECTION ERROR: {e}")
        return False

if __name__ == "__main__":
    print("🧪 ETH Transfer Logging Test Suite")
    print("=" * 50)
    
    # Test backend connectivity first
    if not test_backend_health():
        print("\n❌ Backend is not reachable. Exiting.")
        exit(1)
    
    # Test logging endpoints
    wallet_success = test_wallet_endpoint()
    eth_transfer_success = test_eth_transfer_endpoint()
    
    # Test history retrieval
    history_success = test_get_transfer_history()
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"Wallet Endpoint:      {'✅ PASS' if wallet_success else '❌ FAIL'}")
    print(f"ETH Transfer Endpoint: {'✅ PASS' if eth_transfer_success else '❌ FAIL'}")
    print(f"Transfer History:     {'✅ PASS' if history_success else '❌ FAIL'}")
    
    if wallet_success or eth_transfer_success:
        print("\n💡 At least one logging endpoint works.")
        print("   Check the Transfer History to see if records are being saved.")
    else:
        print("\n❌ Both logging endpoints failed.")
        print("   Check backend logs for detailed error information.")
    
    print("\n🔧 Next steps:")
    print("1. Start the backend: cd finverse_api && uvicorn app.main:app --reload")
    print("2. Check backend logs for any errors")
    print("3. Verify database connection and table structure")
    print("4. Test the frontend ETH transfer functionality") 