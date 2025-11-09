"""
Blockchain service for interacting with FreelanceEscrow smart contract
"""

from web3 import Web3
from web3.exceptions import ContractLogicError, TransactionNotFound
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
from eth_account import Account
from eth_account.signers.local import LocalAccount

from app.config import settings

logger = logging.getLogger(__name__)

# Contract ABI - This should match your deployed contract
ESCROW_CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "_title", "type": "string"},
            {"internalType": "string", "name": "_ipfsHash", "type": "string"},
            {"internalType": "uint256", "name": "_deadline", "type": "uint256"}
        ],
        "name": "createJob",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_jobId", "type": "uint256"}],
        "name": "acceptJob",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_jobId", "type": "uint256"},
            {"internalType": "string", "name": "_deliverableHash", "type": "string"}
        ],
        "name": "submitWork",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_jobId", "type": "uint256"}],
        "name": "approveWork",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_jobId", "type": "uint256"}],
        "name": "cancelJob",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_jobId", "type": "uint256"},
            {"internalType": "string", "name": "_reason", "type": "string"}
        ],
        "name": "raiseDispute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_disputeId", "type": "uint256"},
            {"internalType": "bool", "name": "_favorClient", "type": "bool"}
        ],
        "name": "voteOnDispute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_disputeId", "type": "uint256"}],
        "name": "resolveDispute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_jobId", "type": "uint256"}],
        "name": "emergencyWithdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_jobId", "type": "uint256"}],
        "name": "getJob",
        "outputs": [
            {
                "components": [
                    {"internalType": "uint256", "name": "id", "type": "uint256"},
                    {"internalType": "address", "name": "client", "type": "address"},
                    {"internalType": "address", "name": "freelancer", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"},
                    {"internalType": "uint256", "name": "deadline", "type": "uint256"},
                    {"internalType": "string", "name": "title", "type": "string"},
                    {"internalType": "string", "name": "ipfsHash", "type": "string"},
                    {"internalType": "uint8", "name": "status", "type": "uint8"},
                    {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
                    {"internalType": "uint256", "name": "completedAt", "type": "uint256"},
                    {"internalType": "bool", "name": "fundsReleased", "type": "bool"}
                ],
                "internalType": "struct FreelanceEscrow.Job",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_client", "type": "address"}],
        "name": "getClientJobs",
        "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_freelancer", "type": "address"}],
        "name": "getFreelancerJobs",
        "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "jobId", "type": "uint256"},
            {"indexed": True, "internalType": "address", "name": "client", "type": "address"},
            {"indexed": False, "internalType": "uint256", "name": "amount", "type": "uint256"},
            {"indexed": False, "internalType": "uint256", "name": "deadline", "type": "uint256"}
        ],
        "name": "JobCreated",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "jobId", "type": "uint256"},
            {"indexed": True, "internalType": "address", "name": "freelancer", "type": "address"}
        ],
        "name": "JobAccepted",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "jobId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "deliverableHash", "type": "string"}
        ],
        "name": "WorkSubmitted",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "jobId", "type": "uint256"},
            {"indexed": True, "internalType": "address", "name": "freelancer", "type": "address"},
            {"indexed": False, "internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "JobCompleted",
        "type": "event"
    }
]


class BlockchainService:
    """Service for interacting with the FreelanceEscrow smart contract"""
    
    def __init__(self):
        try:
            self.w3 = Web3(Web3.HTTPProvider(settings.POLYGON_RPC_URL, request_kwargs={'timeout': 5}))
            # Don't fail on init - connection will be checked when needed
            try:
                if not self.w3.is_connected():
                    logger.warning("⚠️ Blockchain RPC not connected (will retry on use)")
            except:
                logger.warning("⚠️ Blockchain RPC connection check failed (will retry on use)")
        except Exception as e:
            logger.warning(f"⚠️ Blockchain RPC initialization failed: {e} (will retry on use)")
            self.w3 = None
        
        self.contract_address = settings.ESCROW_CONTRACT_ADDRESS
        
        if not self.contract_address:
            logger.error("❌ ESCROW_CONTRACT_ADDRESS not set in environment! Please deploy the contract and set the address.")
            logger.error("   To deploy: cd blockchain && npx hardhat run scripts/deploy.js --network amoy")
            logger.error("   Then set: export ESCROW_CONTRACT_ADDRESS=<deployed_address>")
        
        if self.w3 and self.contract_address:
            try:
                self.contract = self.w3.eth.contract(
                    address=self.contract_address,
                    abi=ESCROW_CONTRACT_ABI
                )
            except Exception as e:
                logger.warning(f"⚠️ Failed to load contract: {e}")
                self.contract = None
        else:
            self.contract = None
    
    def wei_to_eth(self, wei: int) -> float:
        """Convert Wei to ETH"""
        return self.w3.from_wei(wei, 'ether')
    
    def eth_to_wei(self, eth: float) -> int:
        """Convert ETH to Wei"""
        return self.w3.to_wei(eth, 'ether')
    
    def get_account(self, private_key: Optional[str] = None) -> LocalAccount:
        """Get account from private key or create new"""
        if private_key:
            return Account.from_key(private_key)
        # In production, use a secure key management system
        raise ValueError("Private key required for transactions")
    
    def estimate_gas(self, transaction: Dict[str, Any]) -> int:
        """Estimate gas for a transaction"""
        try:
            estimated = self.w3.eth.estimate_gas(transaction)
            logger.info(f"Gas estimation successful: {estimated}")
            return estimated
        except Exception as e:
            logger.error(f"Gas estimation failed: {e}")
            # Return higher default for job creation operations
            return 500000  # Higher default gas limit
    
    def send_transaction(
        self,
        function_call,
        from_address: str,
        private_key: str,
        value: int = 0,
        gas_multiplier: float = 1.2
    ) -> Dict[str, Any]:
        """
        Send a transaction to the blockchain
        
        Args:
            function_call: Contract function call
            from_address: Address sending the transaction
            private_key: Private key for signing
            value: ETH value to send (in Wei)
            gas_multiplier: Multiplier for gas estimation (default 1.2)
        
        Returns:
            Transaction receipt dictionary
        """
        try:
            account = self.get_account(private_key)
            
            # Convert address to checksum format (required by Web3.py)
            checksum_address = Web3.to_checksum_address(from_address)
            
            # Build transaction
            transaction = function_call.build_transaction({
                'from': checksum_address,
                'nonce': self.w3.eth.get_transaction_count(checksum_address),
                'value': value,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': self.w3.eth.chain_id,
            })
            
            # Estimate and set gas
            estimated_gas = self.estimate_gas(transaction)
            transaction['gas'] = int(estimated_gas * gas_multiplier)
            
            # Sign transaction
            signed_txn = account.sign_transaction(transaction)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
            
            if receipt.status != 1:
                raise Exception(f"Transaction failed: {tx_hash.hex()}")
            
            return {
                'tx_hash': receipt.transactionHash.hex(),
                'block_number': receipt.blockNumber,
                'gas_used': receipt.gasUsed,
                'status': 'success' if receipt.status == 1 else 'failed'
            }
        
        except ContractLogicError as e:
            logger.error(f"Contract logic error: {e}")
            raise ValueError(f"Contract error: {str(e)}")
        except Exception as e:
            logger.error(f"Transaction error: {e}")
            raise Exception(f"Transaction failed: {str(e)}")
    
    def create_job(
        self,
        title: str,
        ipfs_hash: str,
        deadline: int,
        amount_eth: float,
        client_address: str,
        private_key: str
    ) -> Dict[str, Any]:
        """
        Create a new job on the blockchain
        
        Args:
            title: Job title
            ipfs_hash: IPFS hash of job details
            deadline: Unix timestamp deadline
            amount_eth: Payment amount in ETH
            client_address: Client wallet address
            private_key: Client's private key
        
        Returns:
            Transaction receipt with job ID from event
        """
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        amount_wei = self.eth_to_wei(amount_eth)
        
        function_call = self.contract.functions.createJob(
            title,
            ipfs_hash,
            deadline
        )
        
        receipt = self.send_transaction(
            function_call,
            client_address,
            private_key,
            value=amount_wei
        )
        
        # Get job ID from event
        job_created_event = self.contract.events.JobCreated()
        logs = job_created_event.process_receipt(receipt)
        
        if logs:
            job_id = logs[0]['args']['jobId']
            receipt['job_id'] = job_id
        
        return receipt
    
    def accept_job(
        self,
        job_id: int,
        freelancer_address: str,
        private_key: str
    ) -> Dict[str, Any]:
        """Freelancer accepts a job"""
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        function_call = self.contract.functions.acceptJob(job_id)
        
        return self.send_transaction(
            function_call,
            freelancer_address,
            private_key
        )
    
    def submit_work(
        self,
        job_id: int,
        deliverable_hash: str,
        freelancer_address: str,
        private_key: str
    ) -> Dict[str, Any]:
        """Freelancer submits completed work"""
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        function_call = self.contract.functions.submitWork(job_id, deliverable_hash)
        
        return self.send_transaction(
            function_call,
            freelancer_address,
            private_key
        )
    
    def approve_work(
        self,
        job_id: int,
        client_address: str,
        private_key: str
    ) -> Dict[str, Any]:
        """Client approves work and releases payment"""
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        function_call = self.contract.functions.approveWork(job_id)
        
        return self.send_transaction(
            function_call,
            client_address,
            private_key
        )
    
    def cancel_job(
        self,
        job_id: int,
        client_address: str,
        private_key: str
    ) -> Dict[str, Any]:
        """Client cancels job and gets refund"""
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        function_call = self.contract.functions.cancelJob(job_id)
        
        return self.send_transaction(
            function_call,
            client_address,
            private_key
        )
    
    def raise_dispute(
        self,
        job_id: int,
        reason: str,
        initiator_address: str,
        private_key: str
    ) -> Dict[str, Any]:
        """Raise a dispute for a job"""
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        function_call = self.contract.functions.raiseDispute(job_id, reason)
        
        return self.send_transaction(
            function_call,
            initiator_address,
            private_key
        )
    
    def get_job(self, job_id: int) -> Optional[Dict[str, Any]]:
        """Get job details from blockchain"""
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        try:
            job = self.contract.functions.getJob(job_id).call()
            
            # Map status enum to string
            status_map = {
                0: "open",
                1: "in_progress",
                2: "submitted",
                3: "completed",
                4: "disputed",
                5: "cancelled",
                6: "refunded"
            }
            
            return {
                'id': job[0],
                'client': job[1],
                'freelancer': job[2],
                'amount': self.wei_to_eth(job[3]),
                'deadline': datetime.fromtimestamp(job[4]),
                'title': job[5],
                'ipfs_hash': job[6],
                'status': status_map.get(job[7], 'unknown'),
                'created_at': datetime.fromtimestamp(job[8]),
                'completed_at': datetime.fromtimestamp(job[9]) if job[9] > 0 else None,
                'funds_released': job[10]
            }
        except Exception as e:
            logger.error(f"Error getting job {job_id}: {e}")
            return None
    
    def get_client_jobs(self, client_address: str) -> List[int]:
        """Get all job IDs for a client"""
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        try:
            # Convert address to checksum format
            checksum_address = Web3.to_checksum_address(client_address)
            job_ids = self.contract.functions.getClientJobs(checksum_address).call()
            return [int(job_id) for job_id in job_ids]
        except Exception as e:
            logger.error(f"Error getting client jobs: {e}")
            return []
    
    def get_freelancer_jobs(self, freelancer_address: str) -> List[int]:
        """Get all job IDs for a freelancer"""
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        try:
            # Convert address to checksum format
            checksum_address = Web3.to_checksum_address(freelancer_address)
            job_ids = self.contract.functions.getFreelancerJobs(checksum_address).call()
            return [int(job_id) for job_id in job_ids]
        except Exception as e:
            logger.error(f"Error getting freelancer jobs: {e}")
            return []
    
    def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction status and receipt"""
        try:
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            tx = self.w3.eth.get_transaction(tx_hash)
            
            return {
                'tx_hash': tx_hash,
                'status': 'success' if receipt.status == 1 else 'failed',
                'block_number': receipt.blockNumber,
                'gas_used': receipt.gasUsed,
                'from': tx['from'],
                'to': tx['to'],
                'value': self.wei_to_eth(tx['value']),
                'timestamp': datetime.fromtimestamp(
                    self.w3.eth.get_block(receipt.blockNumber)['timestamp']
                )
            }
        except TransactionNotFound:
            return {'tx_hash': tx_hash, 'status': 'pending'}
        except Exception as e:
            logger.error(f"Error getting transaction status: {e}")
            raise


# Singleton instance
blockchain_service = BlockchainService()

