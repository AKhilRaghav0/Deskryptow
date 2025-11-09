#!/usr/bin/env python3
"""
Test script for IPFS and Blockchain integration
"""

import sys
import os
import json
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def test_ipfs():
    """Test IPFS service"""
    print("🧪 Testing IPFS Service...")
    try:
        from app.services.ipfs import ipfs_service
        
        if not ipfs_service.provider:
            print("❌ IPFS provider not configured")
            return False
        
        print(f"✅ IPFS Provider: {ipfs_service.provider}")
        
        # Test upload
        test_data = {
            "test": "data",
            "timestamp": "2024-01-01T00:00:00Z"
        }
        
        print("📤 Uploading test data to IPFS...")
        ipfs_hash = ipfs_service.upload_to_ipfs(test_data, "test.json")
        
        if ipfs_hash:
            print(f"✅ Upload successful! IPFS Hash: {ipfs_hash}")
            
            # Test retrieval
            print("📥 Retrieving data from IPFS...")
            retrieved = ipfs_service.get_from_ipfs(ipfs_hash)
            
            if retrieved:
                print(f"✅ Retrieval successful! Data: {json.dumps(retrieved, indent=2)}")
                return True
            else:
                print("❌ Failed to retrieve from IPFS")
                return False
        else:
            print("❌ Failed to upload to IPFS")
            return False
            
    except Exception as e:
        print(f"❌ IPFS test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_blockchain():
    """Test blockchain connection"""
    print("\n🧪 Testing Blockchain Service...")
    try:
        from app.services.blockchain import blockchain_service
        from app.config import settings
        
        if not blockchain_service.w3:
            print("❌ Web3 not initialized")
            return False
        
        # Test connection
        print("🔗 Testing RPC connection...")
        is_connected = blockchain_service.w3.is_connected()
        
        if is_connected:
            print(f"✅ Connected to {settings.CHAIN_NAME}")
            print(f"   Chain ID: {blockchain_service.w3.eth.chain_id}")
            
            # Check contract
            if blockchain_service.contract_address:
                print(f"✅ Contract address configured: {blockchain_service.contract_address}")
                
                if blockchain_service.contract:
                    print("✅ Contract loaded successfully")
                    
                    # Try to get platform fee
                    try:
                        platform_fee = blockchain_service.contract.functions.platformFeePercentage().call()
                        print(f"✅ Platform fee: {platform_fee}%")
                        return True
                    except Exception as e:
                        print(f"⚠️  Could not call contract (may not be deployed): {e}")
                        return False
                else:
                    print("⚠️  Contract not loaded (may not be deployed)")
                    return False
            else:
                print("⚠️  Contract address not set")
                return False
        else:
            print("❌ Not connected to blockchain")
            return False
            
    except Exception as e:
        print(f"❌ Blockchain test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=" * 60)
    print("🚀 Integration Test Suite")
    print("=" * 60)
    
    # Change to backend directory
    os.chdir(Path(__file__).parent / "backend")
    
    # Test IPFS
    ipfs_ok = test_ipfs()
    
    # Test Blockchain
    blockchain_ok = test_blockchain()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    print(f"IPFS:       {'✅ PASS' if ipfs_ok else '❌ FAIL'}")
    print(f"Blockchain: {'✅ PASS' if blockchain_ok else '❌ FAIL'}")
    print("=" * 60)
    
    if ipfs_ok and blockchain_ok:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

