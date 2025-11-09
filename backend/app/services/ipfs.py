"""
IPFS service for storing job details and deliverables
Supports Pinata, Infura, and Web3.Storage
"""

import requests
import json
import logging
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)


class IPFSService:
    """Service for interacting with IPFS"""
    
    def __init__(self):
        # Pinata configuration (recommended)
        self.pinata_api_key = getattr(settings, 'PINATA_API_KEY', None)
        self.pinata_secret_key = getattr(settings, 'PINATA_SECRET_KEY', None)
        self.pinata_gateway = getattr(settings, 'PINATA_GATEWAY', 'https://gateway.pinata.cloud/ipfs/')
        
        # Infura configuration
        self.infura_project_id = getattr(settings, 'INFURA_PROJECT_ID', None)
        self.infura_secret = getattr(settings, 'INFURA_SECRET', None)
        self.infura_gateway = getattr(settings, 'INFURA_GATEWAY', 'https://ipfs.infura.io/ipfs/')
        
        # Web3.Storage configuration
        self.web3_storage_token = getattr(settings, 'WEB3_STORAGE_TOKEN', None)
        
        # Determine which service to use
        if self.pinata_api_key and self.pinata_secret_key:
            self.provider = 'pinata'
        elif self.infura_project_id and self.infura_secret:
            self.provider = 'infura'
        elif self.web3_storage_token:
            self.provider = 'web3storage'
        else:
            self.provider = None
            logger.warning("⚠️ No IPFS provider configured. IPFS features will be disabled.")
    
    def upload_to_ipfs(self, data: Dict[str, Any], filename: Optional[str] = None) -> Optional[str]:
        """
        Upload data to IPFS
        
        Args:
            data: Dictionary or string data to upload
            filename: Optional filename for the file
            
        Returns:
            IPFS hash (CID) if successful, None otherwise
        """
        if not self.provider:
            logger.error("IPFS provider not configured")
            return None
        
        try:
            if self.provider == 'pinata':
                return self._upload_pinata(data, filename)
            elif self.provider == 'infura':
                return self._upload_infura(data, filename)
            elif self.provider == 'web3storage':
                return self._upload_web3storage(data, filename)
        except Exception as e:
            logger.error(f"Error uploading to IPFS: {e}")
            return None
    
    def _upload_pinata(self, data: Dict[str, Any], filename: Optional[str] = None) -> Optional[str]:
        """Upload to Pinata IPFS"""
        try:
            # Convert data to JSON string
            json_data = json.dumps(data)
            
            # Prepare files
            files = {
                'file': (filename or 'data.json', json_data, 'application/json')
            }
            
            headers = {
                'pinata_api_key': self.pinata_api_key,
                'pinata_secret_api_key': self.pinata_secret_key,
            }
            
            # Pinata JSON endpoint
            url = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
            
            response = requests.post(url, files=files, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            ipfs_hash = result.get('IpfsHash')
            
            if ipfs_hash:
                logger.info(f"✅ Uploaded to Pinata IPFS: {ipfs_hash}")
                return ipfs_hash
            else:
                logger.error("Pinata response missing IpfsHash")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Pinata upload error: {e}")
            return None
    
    def _upload_infura(self, data: Dict[str, Any], filename: Optional[str] = None) -> Optional[str]:
        """Upload to Infura IPFS"""
        try:
            # Convert data to JSON string
            json_data = json.dumps(data)
            
            # Infura uses basic auth
            auth = (self.infura_project_id, self.infura_secret)
            
            # Prepare multipart form data
            files = {
                'file': (filename or 'data.json', json_data, 'application/json')
            }
            
            url = 'https://ipfs.infura.io:5001/api/v0/add'
            
            response = requests.post(url, files=files, auth=auth, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            ipfs_hash = result.get('Hash')
            
            if ipfs_hash:
                logger.info(f"✅ Uploaded to Infura IPFS: {ipfs_hash}")
                return ipfs_hash
            else:
                logger.error("Infura response missing Hash")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Infura upload error: {e}")
            return None
    
    def _upload_web3storage(self, data: Dict[str, Any], filename: Optional[str] = None) -> Optional[str]:
        """Upload to Web3.Storage IPFS"""
        try:
            # Convert data to JSON string
            json_data = json.dumps(data)
            
            headers = {
                'Authorization': f'Bearer {self.web3_storage_token}',
                'Content-Type': 'application/json'
            }
            
            url = 'https://api.web3.storage/upload'
            
            response = requests.post(url, data=json_data, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            ipfs_hash = result.get('cid')
            
            if ipfs_hash:
                logger.info(f"✅ Uploaded to Web3.Storage IPFS: {ipfs_hash}")
                return ipfs_hash
            else:
                logger.error("Web3.Storage response missing cid")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Web3.Storage upload error: {e}")
            return None
    
    def get_from_ipfs(self, ipfs_hash: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve data from IPFS
        
        Args:
            ipfs_hash: IPFS hash (CID) of the data
            
        Returns:
            Dictionary with the data if successful, None otherwise
        """
        try:
            # Use gateway to fetch data
            gateway = self.pinata_gateway if self.provider == 'pinata' else self.infura_gateway
            
            # Remove /ipfs/ suffix if present
            if ipfs_hash.startswith('/ipfs/'):
                ipfs_hash = ipfs_hash[6:]
            
            url = f"{gateway}{ipfs_hash}"
            
            # Use verify=False for SSL issues (development only)
            response = requests.get(url, timeout=30, verify=False)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"✅ Retrieved from IPFS: {ipfs_hash}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error retrieving from IPFS: {e}")
            return None
    
    def get_gateway_url(self, ipfs_hash: str) -> str:
        """
        Get full gateway URL for IPFS hash
        
        Args:
            ipfs_hash: IPFS hash (CID)
            
        Returns:
            Full URL to access the data
        """
        if not ipfs_hash:
            return ""
        
        # Remove /ipfs/ suffix if present
        if ipfs_hash.startswith('/ipfs/'):
            ipfs_hash = ipfs_hash[6:]
        
        gateway = self.pinata_gateway if self.provider == 'pinata' else self.infura_gateway
        return f"{gateway}{ipfs_hash}"


# Singleton instance
ipfs_service = IPFSService()

