"""
Job endpoints with PostgreSQL and blockchain integration
"""

from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
import uuid
import logging
import re
from web3 import Web3

from sqlalchemy.orm import Session
from app.database import get_db, Job, User, SavedJob, Proposal
from app.models import (
    JobCreate, JobResponse, JobUpdate, JobStatus,
    JobCreateBlockchain, BlockchainJobResponse
)
from app.services.blockchain import blockchain_service
from app.services.search import search_service
from app.services.ipfs import ipfs_service
from app.services.notification import notification_service
from sqlalchemy import and_
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=JobResponse)
async def create_job(
    job: JobCreate,
    client_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Create a new job listing in PostgreSQL
    Requires MetaMask wallet connection
    """
    try:
        # Verify user exists (create if not)
        user = db.query(User).filter(User.wallet_address == client_address.lower()).first()
        if not user:
            # Create user with wallet address as primary key
            user = User(
                wallet_address=client_address.lower(),
                username=f"User_{client_address[:8]}",
                role="both"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        job_id = str(uuid.uuid4())
        
        # Upload job details to IPFS if not already provided
        ipfs_hash = job.ipfs_hash
        if not ipfs_hash and ipfs_service.provider:
            job_data = {
                'title': job.title,
                'description': job.description,
                'category': job.category,
                'skills_required': job.skills_required or [],
                'tags': job.tags or [],
                'budget': str(job.budget),
                'deadline': job.deadline.isoformat() if job.deadline else None,
            }
            ipfs_hash = ipfs_service.upload_to_ipfs(job_data, f'job_{job_id}.json')
            if ipfs_hash:
                logger.info(f"✅ Job details uploaded to IPFS: {ipfs_hash}")
            else:
                logger.warning("⚠️ Failed to upload to IPFS, continuing without IPFS hash")
        
        # Create job in PostgreSQL
        db_job = Job(
            id=job_id,
            client_address=client_address.lower(),
            title=job.title,
            description=job.description,
            category=job.category,
            skills_required=job.skills_required,
            tags=job.tags or [],
            budget=job.budget,
            deadline=job.deadline,
            status=JobStatus.OPEN.value,
            ipfs_hash=ipfs_hash,
            escrow_address=job.escrow_address.lower() if job.escrow_address else None,
            allow_escrow_revert=job.allow_escrow_revert,
        )
        
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        
        # Index in Redis for search
        job_data = {
            'id': db_job.id,
            'title': db_job.title,
            'description': db_job.description,
            'category': db_job.category,
            'tags': db_job.tags or [],
            'status': db_job.status,
            'skills_required': db_job.skills_required or [],
        }
        search_service.index_job(db_job.id, job_data)
        
        return JobResponse(
            id=db_job.id,
            client_address=db_job.client_address,
            freelancer_address=db_job.freelancer_address,
            title=db_job.title,
            description=db_job.description,
            category=db_job.category,
            skills_required=db_job.skills_required or [],
            tags=db_job.tags or [],
            budget=db_job.budget,
            deadline=db_job.deadline,
            status=JobStatus(db_job.status),
            ipfs_hash=db_job.ipfs_hash,
            blockchain_job_id=db_job.blockchain_job_id,
            deliverable_url=db_job.deliverable_url,
            client_confirmed_completion=bool(db_job.client_confirmed_completion) if db_job.client_confirmed_completion is not None else False,
            freelancer_confirmed_completion=bool(db_job.freelancer_confirmed_completion) if db_job.freelancer_confirmed_completion is not None else False,
            escrow_address=db_job.escrow_address,
            allow_escrow_revert=bool(db_job.allow_escrow_revert) if db_job.allow_escrow_revert is not None else False,
            created_at=db_job.created_at,
            updated_at=db_job.updated_at,
            proposal_count=db_job.proposal_count or 0,
        )
    
    except Exception as e:
        logger.error(f"Error creating job: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")

@router.post("/blockchain/create", response_model=dict)
async def create_job_on_blockchain(
    job: JobCreateBlockchain,
    client_address: str = Query(...)
):
    """
    Create a job on the blockchain
    Builds transaction for frontend to sign with MetaMask
    """
    try:
        # Check RPC connection
        if not blockchain_service.w3:
            raise HTTPException(
                status_code=503, 
                detail="Blockchain RPC not available. Please check your RPC connection."
            )
        
        # Check if RPC is actually connected
        try:
            if not blockchain_service.w3.is_connected():
                raise HTTPException(
                    status_code=503,
                    detail="Cannot connect to blockchain RPC. Please check your network connection and RPC URL."
                )
        except Exception as e:
            logger.error(f"RPC connection check failed: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Cannot connect to blockchain RPC: {str(e)}"
            )
        
        # Check contract address
        if not blockchain_service.contract_address:
            raise HTTPException(
                status_code=503,
                detail="Contract address not configured. Please deploy the contract and set ESCROW_CONTRACT_ADDRESS environment variable."
            )
        
        # Check contract
        if not blockchain_service.contract:
            raise HTTPException(
                status_code=503, 
                detail="Blockchain contract not available. Please check ESCROW_CONTRACT_ADDRESS is set correctly."
            )
        
        # Validate inputs
        if not job.title or not job.title.strip():
            raise HTTPException(status_code=400, detail="Job title is required")
        
        # Use placeholder IPFS hash if not provided (for testing without IPFS configured)
        ipfs_hash = job.ipfs_hash.strip() if job.ipfs_hash and job.ipfs_hash.strip() else "QmPlaceholderHashForJobDetails"
        
        if not ipfs_hash:
            raise HTTPException(status_code=400, detail="IPFS hash is required")
        
        if job.amount_eth < 0:
            raise HTTPException(status_code=400, detail="Amount cannot be negative")
        
        if job.deadline <= 0:
            raise HTTPException(status_code=400, detail="Invalid deadline timestamp")
        
        # Convert address to checksum format (required by Web3.py)
        try:
            checksum_address = Web3.to_checksum_address(client_address)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid wallet address: {str(e)}")
        
        deadline_timestamp = job.deadline
        
        # Build transaction for frontend to sign
        contract = blockchain_service.contract
        try:
            function_call = contract.functions.createJob(
                job.title,
                ipfs_hash,  # Use the processed IPFS hash
                deadline_timestamp
            )
        except Exception as e:
            logger.error(f"Error creating function call: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create blockchain function call: {str(e)}"
            )
        
        # Build transaction - explicitly set 'to' to contract address
        # Note: 'from' is set for gas estimation, but frontend will use connected wallet
        try:
            contract_address_checksum = Web3.to_checksum_address(blockchain_service.contract_address)
        except ValueError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Invalid contract address: {str(e)}"
            )
        
        try:
            # Get nonce and gas price
            nonce = blockchain_service.w3.eth.get_transaction_count(checksum_address)
            gas_price = blockchain_service.w3.eth.gas_price
            chain_id = blockchain_service.w3.eth.chain_id
            value_wei = blockchain_service.eth_to_wei(job.amount_eth)
            
            transaction = function_call.build_transaction({
                'from': checksum_address,  # Used for gas estimation only
                'nonce': nonce,
                'value': value_wei,
                'gasPrice': gas_price,
                'chainId': chain_id,
            })
            
            # Explicitly set 'to' to contract address (should already be set, but ensure it)
            transaction['to'] = contract_address_checksum
            
        except Exception as e:
            logger.error(f"Error building transaction: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to build transaction: {str(e)}"
            )
        
        # Estimate gas
        try:
            estimated_gas = blockchain_service.estimate_gas(transaction)
            # Use 1.5x multiplier for safety, and ensure minimum 300k
            transaction['gas'] = max(int(estimated_gas * 1.5), 300000)
            logger.info(f"Gas estimated: {estimated_gas}, using: {transaction['gas']}")
        except Exception as e:
            logger.warning(f"Gas estimation failed, using higher default: {e}")
            # Use higher default for createJob (contract deployment-like operation)
            transaction['gas'] = 500000  # Higher default for job creation
        
        # Log for debugging
        logger.info(f"✅ Built transaction: from={checksum_address}, to={contract_address_checksum}, value={transaction['value']}, gas={transaction['gas']}")
        
        return {
            "transaction": transaction,
            "message": "Sign this transaction with your wallet and submit via /blockchain/submit-tx",
            "chain_id": chain_id,
            "contract_address": blockchain_service.contract_address
        }
    
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Value error in blockchain create: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating job on blockchain: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create blockchain job: {str(e)}"
        )

@router.post("/blockchain/submit-tx", response_model=dict)
async def submit_signed_transaction(
    signed_tx_hex: str,
    job_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Submit a signed transaction to the blockchain OR get receipt from tx hash
    Frontend can either send signed transaction hex OR just the tx hash
    """
    try:
        if not blockchain_service.w3:
            raise HTTPException(status_code=503, detail="Blockchain service not available")
        
        # Check if it's a tx hash (0x...) or signed transaction hex
        if signed_tx_hex.startswith('0x') and len(signed_tx_hex) == 66:
            # It's a transaction hash, get the receipt
            tx_hash = signed_tx_hex
            try:
                receipt = blockchain_service.w3.eth.get_transaction_receipt(tx_hash)
            except Exception:
                # Transaction might still be pending, wait for it
                receipt = blockchain_service.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
        else:
            # It's a signed transaction hex, send it
            tx_hash = blockchain_service.w3.eth.send_raw_transaction(signed_tx_hex)
            receipt = blockchain_service.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
        
        if receipt.status != 1:
            raise HTTPException(status_code=400, detail="Transaction failed")
        
        # If job_id provided, update PostgreSQL with blockchain_job_id
        blockchain_job_id = None
        if job_id:
            db_job = db.query(Job).filter(Job.id == job_id).first()
            if db_job and blockchain_service.contract:
                try:
                    # Extract job ID from event
                    job_created_event = blockchain_service.contract.events.JobCreated()
                    logs = job_created_event.process_receipt(receipt)
                    if logs:
                        blockchain_job_id = int(logs[0]['args']['jobId'])
                        db_job.blockchain_job_id = blockchain_job_id
                        db.commit()
                        logger.info(f"✅ Linked job {job_id} with blockchain job {blockchain_job_id}")
                except Exception as e:
                    logger.warning(f"Could not extract job ID from event: {e}")
        
        return {
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber,
            "status": "success",
            "blockchain_job_id": blockchain_job_id,
            "explorer_url": f"{settings.BLOCK_EXPLORER}/tx/{receipt.transactionHash.hex()}"
        }
    
    except Exception as e:
        logger.error(f"Error submitting transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/blockchain/{job_id}", response_model=BlockchainJobResponse)
async def get_blockchain_job(job_id: int):
    """Get job details directly from blockchain"""
    try:
        job = blockchain_service.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found on blockchain")
        return BlockchainJobResponse(**job)
    except Exception as e:
        logger.error(f"Error getting blockchain job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/blockchain/accept")
async def accept_job_on_blockchain(
    job_id: str,
    blockchain_job_id: int,
    freelancer_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Freelancer accepts job on blockchain"""
    try:
        if not blockchain_service.contract:
            raise HTTPException(status_code=500, detail="Blockchain contract not configured")
        
        # Convert address to checksum format
        checksum_address = Web3.to_checksum_address(freelancer_address)
        
        # Build transaction for frontend to sign
        contract = blockchain_service.contract
        function_call = contract.functions.acceptJob(blockchain_job_id)
        
        transaction = function_call.build_transaction({
            'from': checksum_address,
            'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_address),
            'gasPrice': blockchain_service.w3.eth.gas_price,
            'chainId': blockchain_service.w3.eth.chain_id,
        })
        
        estimated_gas = blockchain_service.estimate_gas(transaction)
        transaction['gas'] = int(estimated_gas * 1.2)
        
        return {
            "transaction": transaction,
            "message": "Sign this transaction with your wallet and submit via /blockchain/submit-tx"
        }
    
    except Exception as e:
        logger.error(f"Error accepting job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/blockchain/submit")
async def submit_work_on_blockchain(
    job_id: str,
    request_data: dict,
    freelancer_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Submit work on blockchain"""
    try:
        blockchain_job_id = request_data.get('blockchain_job_id')
        deliverable_hash = request_data.get('deliverable_hash')
        
        if not blockchain_job_id or not deliverable_hash:
            raise HTTPException(status_code=400, detail="blockchain_job_id and deliverable_hash are required")
        
        # Convert address to checksum format
        checksum_address = Web3.to_checksum_address(freelancer_address)
        
        # Build transaction for frontend to sign
        contract = blockchain_service.contract
        function_call = contract.functions.submitWork(blockchain_job_id, deliverable_hash)
        
        transaction = function_call.build_transaction({
            'from': checksum_address,
            'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_address),
            'gasPrice': blockchain_service.w3.eth.gas_price,
            'chainId': blockchain_service.w3.eth.chain_id,
        })
        
        estimated_gas = blockchain_service.estimate_gas(transaction)
        transaction['gas'] = int(estimated_gas * 1.2)
        
        return {
            "transaction": transaction,
            "message": "Sign this transaction with your wallet and submit via /blockchain/submit-tx"
        }
    
    except Exception as e:
        logger.error(f"Error submitting work: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/upload-deliverable", response_model=dict)
async def upload_deliverable(
    job_id: str,
    description: Optional[str] = Form(None),  # Make description optional
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db)
):
    """
    Upload deliverables to IPFS (OPTIONAL)
    Deliverables can also be shared via chat (git links, etc.)
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # If no files and no description, return success (deliverables are optional)
        if not files and not description:
            return {
                "ipfs_hash": None,
                "message": "Deliverables are optional. You can share work via chat (git links, etc.)"
            }
        
        # Prepare deliverable data
        deliverable_data = {
            "description": description or "Work completed (details shared via chat)",
            "job_id": job_id,
            "job_title": job.title,
            "submitted_at": datetime.utcnow().isoformat(),
        }
        
        # Handle file uploads if any
        if files:
            file_info = []
            for file in files:
                content = await file.read()
                file_info.append({
                    "name": file.filename,
                    "size": len(content),
                    "type": file.content_type,
                })
            deliverable_data["files"] = file_info
        
        # Upload to IPFS
        ipfs_hash = None
        if ipfs_service.provider:
            ipfs_hash = ipfs_service.upload_to_ipfs(
                deliverable_data,
                f'deliverable_{job_id}.json'
            )
            if ipfs_hash:
                logger.info(f"✅ Deliverable uploaded to IPFS: {ipfs_hash}")
                # Update job with deliverable URL
                job.deliverable_url = ipfs_service.get_gateway_url(ipfs_hash)
                db.commit()
            else:
                logger.warning("⚠️ Failed to upload deliverable to IPFS")
        else:
            # Use placeholder if IPFS not configured
            ipfs_hash = "QmPlaceholderDeliverable"
            logger.warning("⚠️ IPFS not configured, using placeholder hash")
        
        return {
            "ipfs_hash": ipfs_hash,
            "message": "Deliverable uploaded successfully (optional - can also share via chat)"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading deliverable: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/blockchain/approve")
async def approve_work_on_blockchain(
    job_id: str,
    blockchain_job_id: int,
    client_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Client approves work and releases payment"""
    try:
        # Convert address to checksum format
        checksum_address = Web3.to_checksum_address(client_address)
        
        # Build transaction for frontend to sign
        contract = blockchain_service.contract
        function_call = contract.functions.approveWork(blockchain_job_id)
        
        transaction = function_call.build_transaction({
            'from': checksum_address,
            'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_address),
            'gasPrice': blockchain_service.w3.eth.gas_price,
            'chainId': blockchain_service.w3.eth.chain_id,
        })
        
        estimated_gas = blockchain_service.estimate_gas(transaction)
        transaction['gas'] = int(estimated_gas * 1.2)
        
        return {
            "transaction": transaction,
            "message": "Sign this transaction with your wallet and submit via /blockchain/submit-tx"
        }
    
    except Exception as e:
        logger.error(f"Error approving work: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/blockchain/cancel")
async def cancel_job_on_blockchain(
    job_id: str,
    blockchain_job_id: int,
    client_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Cancel job and refund client"""
    try:
        # Convert address to checksum format
        checksum_address = Web3.to_checksum_address(client_address)
        
        # Build transaction for frontend to sign
        contract = blockchain_service.contract
        function_call = contract.functions.cancelJob(blockchain_job_id)
        
        transaction = function_call.build_transaction({
            'from': checksum_address,
            'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_address),
            'gasPrice': blockchain_service.w3.eth.gas_price,
            'chainId': blockchain_service.w3.eth.chain_id,
        })
        
        estimated_gas = blockchain_service.estimate_gas(transaction)
        transaction['gas'] = int(estimated_gas * 1.2)
        
        return {
            "transaction": transaction,
            "message": "Sign this transaction with your wallet and submit via /blockchain/submit-tx"
        }
    
    except Exception as e:
        logger.error(f"Error cancelling job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/blockchain/status/{tx_hash}", response_model=dict)
async def get_transaction_status(tx_hash: str):
    """Get transaction status"""
    try:
        status = blockchain_service.get_transaction_status(tx_hash)
        return status
    except Exception as e:
        logger.error(f"Error getting transaction status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    status: Optional[JobStatus] = None,
    category: Optional[str] = None,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """List all jobs with optional filters"""
    try:
        query = db.query(Job)
        
        if status:
            query = query.filter(Job.status == status.value)
        
        if category:
            query = query.filter(Job.category == category)
        
        jobs = query.order_by(Job.created_at.desc()).limit(limit).all()
        
        return [
            JobResponse(
                id=job.id,
                client_address=job.client_address,
                freelancer_address=job.freelancer_address,
                title=job.title,
                description=job.description,
                category=job.category,
                skills_required=job.skills_required or [],
                tags=job.tags or [],
                budget=job.budget,
                deadline=job.deadline,
                status=JobStatus(job.status),
                ipfs_hash=job.ipfs_hash,
                blockchain_job_id=job.blockchain_job_id,
                deliverable_url=job.deliverable_url,
                client_confirmed_completion=bool(job.client_confirmed_completion) if job.client_confirmed_completion is not None else False,
                freelancer_confirmed_completion=bool(job.freelancer_confirmed_completion) if job.freelancer_confirmed_completion is not None else False,
                created_at=job.created_at,
                updated_at=job.updated_at,
                proposal_count=job.proposal_count or 0,
            )
            for job in jobs
        ]
    except Exception as e:
        logger.error(f"Error listing jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: Session = Depends(get_db)):
    """Get a specific job by ID"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # If blockchain_job_id exists, sync with blockchain
        if job.blockchain_job_id:
            try:
                blockchain_job = blockchain_service.get_job(job.blockchain_job_id)
                if blockchain_job:
                    # Update PostgreSQL with latest blockchain state
                    # But preserve in_progress status if freelancer is assigned (database is source of truth for proposal-based assignments)
                    blockchain_status = blockchain_job['status']
                    
                    # If job has freelancer assigned in database, NEVER overwrite with blockchain status
                    # Database is source of truth for proposal-based assignments
                    if job.freelancer_address:
                        # Keep database status (in_progress/submitted) - don't sync from blockchain
                        # Only exception: if blockchain says completed and DB doesn't, we can update
                        if blockchain_status in ['completed', '3'] and job.status != 'completed':
                            job.status = 'completed'
                        # Also check: if DB has confirmations but status is open, fix it immediately
                        elif (job.client_confirmed_completion or job.freelancer_confirmed_completion) and job.status == 'open':
                            job.status = 'in_progress'
                            job.updated_at = datetime.utcnow()
                            db.commit()
                            logger.info(f"✅ Fixed job {job_id} status from open to in_progress (has confirmations)")
                        # Otherwise, keep database status
                        logger.debug(f"Job {job_id} has freelancer in DB, keeping status: {job.status} (blockchain says: {blockchain_status})")
                    else:
                        # No freelancer in DB - sync from blockchain
                        job.status = blockchain_status
                        logger.debug(f"Job {job_id} has no freelancer, syncing status from blockchain: {blockchain_status}")
                    
                    # Handle freelancer address - only update if blockchain has one and DB doesn't
                    # Don't overwrite existing freelancer_address from database
                    freelancer_addr = blockchain_job.get('freelancer', '')
                    if freelancer_addr and freelancer_addr.lower() != '0x0000000000000000000000000000000000000000':
                        freelancer_addr_lower = freelancer_addr.lower()
                        # Only update if job doesn't already have a freelancer assigned
                        if not job.freelancer_address:
                            # Check if user exists in database, create if not
                            freelancer_user = db.query(User).filter(User.wallet_address == freelancer_addr_lower).first()
                            if not freelancer_user:
                                freelancer_user = User(
                                    wallet_address=freelancer_addr_lower,
                                    username=f"User_{freelancer_addr_lower[:8]}",
                                    role="both"
                                )
                                db.add(freelancer_user)
                                db.flush()  # Flush to get the user in the session
                            job.freelancer_address = freelancer_addr_lower
                        # If blockchain has freelancer but DB doesn't, and they match, update DB
                        elif job.freelancer_address.lower() == freelancer_addr_lower:
                            # Already matches, no update needed
                            pass
                    # Don't set to None if blockchain doesn't have freelancer - keep DB value
                    # The database is the source of truth for proposal-based assignments
                    
                    # Final check: If confirmations exist, status must be at least in_progress
                    if (job.client_confirmed_completion or job.freelancer_confirmed_completion) and job.status == 'open':
                        job.status = 'in_progress'
                        logger.info(f"✅ Final fix: Job {job_id} has confirmations, updating status from open to in_progress")
                    
                    job.updated_at = datetime.utcnow()
                    db.commit()
            except Exception as e:
                logger.warning(f"Could not sync with blockchain: {e}")
                db.rollback()  # Rollback on error to prevent session issues
        
        return JobResponse(
            id=job.id,
            client_address=job.client_address,
            freelancer_address=job.freelancer_address,
            title=job.title,
            description=job.description,
            category=job.category,
            skills_required=job.skills_required or [],
            tags=job.tags or [],
            budget=job.budget,
            deadline=job.deadline,
            status=JobStatus(job.status),
            ipfs_hash=job.ipfs_hash,
            blockchain_job_id=job.blockchain_job_id,
            deliverable_url=job.deliverable_url,
            client_confirmed_completion=bool(job.client_confirmed_completion) if job.client_confirmed_completion is not None else False,
            freelancer_confirmed_completion=bool(job.freelancer_confirmed_completion) if job.freelancer_confirmed_completion is not None else False,
            created_at=job.created_at,
            updated_at=job.updated_at,
            proposal_count=job.proposal_count or 0,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/{client_address}", response_model=dict)
async def get_client_jobs(
    client_address: str,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Get all jobs posted by a client (based on wallet address) with pagination"""
    try:
        # Get total count
        total_count = db.query(Job).filter(Job.client_address == client_address.lower()).count()
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Query with pagination and sorting (latest first)
        jobs = db.query(Job).filter(
            Job.client_address == client_address.lower()
        ).order_by(Job.created_at.desc()).offset(offset).limit(limit).all()
        
        job_list = []
        for job in jobs:
            job_list.append(JobResponse(
                id=job.id,
                client_address=job.client_address,
                freelancer_address=job.freelancer_address,
                title=job.title,
                description=job.description,
                category=job.category,
                skills_required=job.skills_required or [],
                tags=job.tags or [],
                budget=job.budget,
                deadline=job.deadline,
                status=JobStatus(job.status),
                ipfs_hash=job.ipfs_hash,
                blockchain_job_id=job.blockchain_job_id,
                deliverable_url=job.deliverable_url,
                client_confirmed_completion=job.client_confirmed_completion,
                freelancer_confirmed_completion=job.freelancer_confirmed_completion,
                created_at=job.created_at,
                updated_at=job.updated_at,
                proposal_count=job.proposal_count or 0,
            ))
        
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        
        return {
            "jobs": job_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    except Exception as e:
        logger.error(f"Error getting client jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/{client_address}/blockchain", response_model=List[int])
async def get_client_blockchain_jobs(client_address: str):
    """Get all blockchain job IDs for a client"""
    try:
        job_ids = blockchain_service.get_client_jobs(client_address)
        return job_ids
    except Exception as e:
        logger.error(f"Error getting client blockchain jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/freelancer/{freelancer_address}", response_model=List[JobResponse])
async def get_freelancer_jobs(freelancer_address: str, db: Session = Depends(get_db)):
    """Get all jobs assigned to a freelancer (based on wallet address)"""
    try:
        jobs = db.query(Job).filter(Job.freelancer_address == freelancer_address.lower()).all()
        
        job_list = []
        for job in jobs:
            job_list.append(JobResponse(
                id=job.id,
                client_address=job.client_address,
                freelancer_address=job.freelancer_address,
                title=job.title,
                description=job.description,
                category=job.category,
                skills_required=job.skills_required or [],
                tags=job.tags or [],
                budget=job.budget,
                deadline=job.deadline,
                status=JobStatus(job.status),
                ipfs_hash=job.ipfs_hash,
                blockchain_job_id=job.blockchain_job_id,
                deliverable_url=job.deliverable_url,
                client_confirmed_completion=job.client_confirmed_completion,
                freelancer_confirmed_completion=job.freelancer_confirmed_completion,
                created_at=job.created_at,
                updated_at=job.updated_at,
                proposal_count=job.proposal_count or 0,
            ))
        
        return job_list
    except Exception as e:
        logger.error(f"Error getting freelancer jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/freelancer/{freelancer_address}/blockchain", response_model=List[int])
async def get_freelancer_blockchain_jobs(freelancer_address: str):
    """Get all blockchain job IDs for a freelancer"""
    try:
        job_ids = blockchain_service.get_freelancer_jobs(freelancer_address)
        return job_ids
    except Exception as e:
        logger.error(f"Error getting freelancer blockchain jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_update: JobUpdate,
    client_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Update a job (only by the client who created it)"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Verify client is the job owner
        if job.client_address.lower() != client_address.lower():
            raise HTTPException(status_code=403, detail="Only job owner can update job")
        
        # Update fields
        if job_update.title is not None:
            job.title = job_update.title
        if job_update.description is not None:
            job.description = job_update.description
        if job_update.category is not None:
            job.category = job_update.category
        if job_update.skills_required is not None:
            job.skills_required = job_update.skills_required
        if job_update.tags is not None:
            job.tags = job_update.tags
        if job_update.budget is not None:
            job.budget = job_update.budget
        if job_update.deadline is not None:
            job.deadline = job_update.deadline
        if job_update.status is not None:
            job.status = job_update.status.value
        
        job.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(job)
        
        return JobResponse(
            id=job.id,
            client_address=job.client_address,
            freelancer_address=job.freelancer_address,
            title=job.title,
            description=job.description,
            category=job.category,
            skills_required=job.skills_required or [],
            tags=job.tags or [],
            budget=job.budget,
            deadline=job.deadline,
            status=JobStatus(job.status),
            ipfs_hash=job.ipfs_hash,
            blockchain_job_id=job.blockchain_job_id,
            deliverable_url=job.deliverable_url,
            client_confirmed_completion=bool(job.client_confirmed_completion) if job.client_confirmed_completion is not None else False,
            freelancer_confirmed_completion=bool(job.freelancer_confirmed_completion) if job.freelancer_confirmed_completion is not None else False,
            created_at=job.created_at,
            updated_at=job.updated_at,
            proposal_count=job.proposal_count or 0,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating job: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    client_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Delete a job (only by the client who created it)"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Verify client is the job owner
        if job.client_address.lower() != client_address.lower():
            raise HTTPException(status_code=403, detail="Only job owner can delete job")
        
        # Only allow deletion if job is open or cancelled
        if job.status not in ['open', 'cancelled']:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete job with status: {job.status}. Only open or cancelled jobs can be deleted."
            )
        
        db.delete(job)
        db.commit()
        
        return {"message": "Job deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/confirm-completion/client")
async def client_confirm_completion(
    job_id: str,
    client_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Client confirms job completion
    When both client and freelancer confirm, job is marked as completed and payment is released
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Verify client is the job owner
        if job.client_address.lower() != client_address.lower():
            raise HTTPException(status_code=403, detail="Only job owner can confirm completion")
        
        # Check if job is in a state that allows completion
        # Also allow if status is 'open' but freelancer is assigned (edge case fix)
        if job.status not in ['in_progress', 'submitted']:
            # If freelancer is assigned but status is wrong, fix it first
            if job.freelancer_address and job.status == 'open':
                job.status = 'in_progress'
                logger.info(f"✅ Fixed job {job_id} status from open to in_progress before client confirmation")
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot confirm completion for job with status: {job.status}"
                )
        
        # Mark client confirmation
        job.client_confirmed_completion = True
        # Ensure status is correct if confirmations exist
        if job.status == 'open' and job.freelancer_address:
            job.status = 'in_progress'
        job.updated_at = datetime.utcnow()
        
        # Check if both parties have confirmed
        if job.client_confirmed_completion and job.freelancer_confirmed_completion:
            # Both confirmed - mark as completed
            job.status = "completed"
            
            # Release payment on blockchain if job has blockchain_job_id
            if job.blockchain_job_id and blockchain_service.contract:
                try:
                    # First, check the job status on blockchain
                    blockchain_job = blockchain_service.get_job(job.blockchain_job_id)
                    if not blockchain_job:
                        raise Exception(f"Job {job.blockchain_job_id} not found on blockchain")
                    
                    # Check if job is in Submitted status (required for approveWork)
                    blockchain_status = blockchain_job.get('status', '').lower()
                    logger.info(f"Blockchain job status: {blockchain_status}")
                    
                    if blockchain_status not in ['submitted', '2']:  # 2 is JobStatus.Submitted enum value
                        # If job is not submitted, try to auto-submit if both parties confirmed
                        if blockchain_status in ['inprogress', 'in_progress', '1']:
                            # Both parties confirmed but work not submitted - auto-submit with placeholder
                            if job.freelancer_address and job.client_confirmed_completion and job.freelancer_confirmed_completion:
                                logger.info(f"Auto-submitting work for job {job.blockchain_job_id} since both parties confirmed (deliverables optional)")
                                try:
                                    # Extract IPFS hash from deliverable_url if it's an IPFS URL, otherwise use placeholder
                                    # Deliverables are optional - can be shared via chat (git link, etc.)
                                    deliverable_hash = "QmPlaceholderDeliverableConfirmed"
                                    if job.deliverable_url:
                                        # Try to extract IPFS hash from URL (format: https://gateway.pinata.cloud/ipfs/Qm...)
                                        ipfs_match = re.search(r'Qm[a-zA-Z0-9]{44}', job.deliverable_url)
                                        if ipfs_match:
                                            deliverable_hash = ipfs_match.group(0)
                                            logger.info(f"Using IPFS hash from deliverable_url: {deliverable_hash}")
                                        else:
                                            # If it's not an IPFS URL, use placeholder (could be git link, etc.)
                                            logger.info(f"Deliverable URL is not IPFS, using placeholder (deliverables may be shared via chat)")
                                    else:
                                        logger.info(f"No deliverable_url set, using placeholder (deliverables optional - can be shared via chat)")
                                    
                                    # Build submitWork transaction with placeholder or extracted hash
                                    contract = blockchain_service.contract
                                    function_call = contract.functions.submitWork(job.blockchain_job_id, deliverable_hash)
                                    
                                    checksum_freelancer = Web3.to_checksum_address(job.freelancer_address)
                                    submit_transaction = function_call.build_transaction({
                                        'from': checksum_freelancer,
                                        'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_freelancer),
                                        'gasPrice': blockchain_service.w3.eth.gas_price,
                                        'chainId': blockchain_service.w3.eth.chain_id,
                                    })
                                    
                                    estimated_gas = blockchain_service.estimate_gas(submit_transaction)
                                    submit_transaction['gas'] = int(estimated_gas * 1.2)
                                    
                                    # Return submit transaction for freelancer to sign
                                    # Note: Deliverables are optional - can be shared via chat (git link, etc.)
                                    db.commit()
                                    return {
                                        "message": "Both parties confirmed! Please sign the submit transaction to finalize on blockchain. (Deliverables are optional - can be shared via chat)",
                                        "both_confirmed": True,
                                        "needs_submit": True,
                                        "submit_transaction": {
                                            "transaction": submit_transaction,
                                            "message": "Freelancer must sign this transaction to submit work on blockchain (deliverables optional)"
                                        },
                                        "blockchain_status": blockchain_status,
                                        "blockchain_job_id": job.blockchain_job_id,
                                        "deliverable_hash": deliverable_hash,
                                        "deliverables_optional": True
                                    }
                                except Exception as submit_error:
                                    logger.error(f"Failed to build submit transaction: {submit_error}")
                                    return {
                                        "message": "Job needs to be submitted on blockchain first. Please submit work before confirming completion.",
                                        "both_confirmed": True,
                                        "needs_submit": True,
                                        "blockchain_status": blockchain_status,
                                        "blockchain_job_id": job.blockchain_job_id,
                                        "error": str(submit_error)
                                    }
                            else:
                                logger.warning(f"Job {job.blockchain_job_id} is in InProgress, needs to be submitted first")
                                return {
                                    "message": "Job needs to be submitted on blockchain first. Please submit work before confirming completion.",
                                    "both_confirmed": True,
                                    "needs_submit": True,
                                    "blockchain_status": blockchain_status,
                                    "blockchain_job_id": job.blockchain_job_id
                                }
                        elif blockchain_status in ['open', '0']:
                            # Job is still open on blockchain - needs to be accepted first
                            if job.freelancer_address and job.client_confirmed_completion and job.freelancer_confirmed_completion:
                                logger.info(f"Job {job.blockchain_job_id} is open, needs acceptance first")
                                try:
                                    # Build acceptJob transaction
                                    contract = blockchain_service.contract
                                    function_call = contract.functions.acceptJob(job.blockchain_job_id)
                                    
                                    checksum_freelancer = Web3.to_checksum_address(job.freelancer_address)
                                    accept_transaction = function_call.build_transaction({
                                        'from': checksum_freelancer,
                                        'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_freelancer),
                                        'gasPrice': blockchain_service.w3.eth.gas_price,
                                        'chainId': blockchain_service.w3.eth.chain_id,
                                    })
                                    
                                    estimated_gas = blockchain_service.estimate_gas(accept_transaction)
                                    accept_transaction['gas'] = int(estimated_gas * 1.2)
                                    
                                    db.commit()
                                    return {
                                        "message": "Job needs to be accepted on blockchain first, then submitted, then payment can be released.",
                                        "both_confirmed": True,
                                        "needs_accept": True,
                                        "needs_submit": True,
                                        "accept_transaction": {
                                            "transaction": accept_transaction,
                                            "message": "Freelancer must sign this transaction to accept job on blockchain"
                                        },
                                        "blockchain_status": blockchain_status,
                                        "blockchain_job_id": job.blockchain_job_id
                                    }
                                except Exception as accept_error:
                                    logger.error(f"Failed to build accept transaction: {accept_error}")
                                    return {
                                        "message": f"Job is in '{blockchain_status}' status on blockchain. Freelancer must accept the job first, then submit work, before payment can be released.",
                                        "both_confirmed": True,
                                        "needs_accept": True,
                                        "needs_submit": True,
                                        "blockchain_status": blockchain_status,
                                        "blockchain_job_id": job.blockchain_job_id,
                                        "error": str(accept_error)
                                    }
                            else:
                                raise Exception(f"Job status is {blockchain_status} on blockchain. Freelancer must accept the job first, then submit work, before payment can be released.")
                        else:
                            raise Exception(f"Job status is {blockchain_status}, cannot approve. Job must be in Submitted status.")
                    
                    # Check if funds are already released
                    if blockchain_job.get('fundsReleased', False):
                        logger.warning(f"Funds already released for job {job.blockchain_job_id}")
                        db.commit()
                        return {
                            "message": "Payment already released for this job.",
                            "both_confirmed": True,
                            "funds_already_released": True
                        }
                    
                    # Build approveWork transaction to release payment
                    contract = blockchain_service.contract
                    function_call = contract.functions.approveWork(job.blockchain_job_id)
                    
                    # Convert address to checksum format
                    checksum_address = Web3.to_checksum_address(client_address)
                    
                    # Try to estimate gas first to validate the transaction
                    try:
                        estimated_gas = function_call.estimate_gas({'from': checksum_address})
                        logger.info(f"Estimated gas for approveWork: {estimated_gas}")
                    except Exception as gas_error:
                        logger.error(f"Gas estimation failed: {gas_error}")
                        raise Exception(f"Cannot estimate gas. Job may not be in correct status or already completed. Error: {str(gas_error)}")
                    
                    transaction = function_call.build_transaction({
                        'from': checksum_address,
                        'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_address),
                        'gasPrice': blockchain_service.w3.eth.gas_price,
                        'chainId': blockchain_service.w3.eth.chain_id,
                    })
                    
                    transaction['gas'] = int(estimated_gas * 1.2)
                    
                    logger.info(f"✅ Built approveWork transaction for job {job.blockchain_job_id}")
                    
                    # Return transaction for frontend to sign
                    db.commit()
                    return {
                        "message": "Both parties confirmed! Please sign the transaction to release payment.",
                        "both_confirmed": True,
                        "blockchain_transaction": {
                            "transaction": transaction,
                            "message": "Sign this transaction to release payment to freelancer",
                            "chain_id": blockchain_service.w3.eth.chain_id,
                            "contract_address": blockchain_service.contract_address
                        }
                    }
                except Exception as e:
                    logger.error(f"Error building blockchain transaction: {e}", exc_info=True)
                    # Continue without blockchain - job is still marked as completed
                    db.commit()
                    return {
                        "message": f"Both parties confirmed, but blockchain transaction failed: {str(e)}. Job marked as completed in database.",
                        "both_confirmed": True,
                        "blockchain_error": str(e),
                        "blockchain_job_id": job.blockchain_job_id
                    }
        
        db.commit()
        
        return {
            "message": "Completion confirmed. Waiting for freelancer confirmation.",
            "both_confirmed": False,
            "client_confirmed": job.client_confirmed_completion,
            "freelancer_confirmed": job.freelancer_confirmed_completion
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming completion: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/confirm-completion/freelancer")
async def freelancer_confirm_completion(
    job_id: str,
    freelancer_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Freelancer confirms job completion
    When both client and freelancer confirm, job is marked as completed and payment is released
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Verify freelancer is assigned to this job
        if not job.freelancer_address or job.freelancer_address.lower() != freelancer_address.lower():
            raise HTTPException(status_code=403, detail="Only assigned freelancer can confirm completion")
        
        # Check if job is in a state that allows completion
        # Also allow if status is 'open' but freelancer is assigned (edge case fix)
        if job.status not in ['in_progress', 'submitted']:
            # If freelancer is assigned but status is wrong, fix it first
            if job.freelancer_address and job.status == 'open':
                job.status = 'in_progress'
                logger.info(f"✅ Fixed job {job_id} status from open to in_progress before freelancer confirmation")
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot confirm completion for job with status: {job.status}"
                )
        
        # Mark freelancer confirmation
        job.freelancer_confirmed_completion = True
        # Ensure status is correct if confirmations exist
        if job.status == 'open' and job.freelancer_address:
            job.status = 'in_progress'
        job.updated_at = datetime.utcnow()
        
        # Check if both parties have confirmed
        if job.client_confirmed_completion and job.freelancer_confirmed_completion:
            # Both confirmed - mark as completed
            job.status = "completed"
            
            # Release payment on blockchain if job has blockchain_job_id
            if job.blockchain_job_id and blockchain_service.contract:
                try:
                    # First, check the job status on blockchain
                    blockchain_job = blockchain_service.get_job(job.blockchain_job_id)
                    if not blockchain_job:
                        raise Exception(f"Job {job.blockchain_job_id} not found on blockchain")
                    
                    # Check if job is in Submitted status (required for approveWork)
                    blockchain_status = blockchain_job.get('status', '').lower()
                    logger.info(f"Blockchain job status: {blockchain_status}")
                    
                    if blockchain_status not in ['submitted', '2']:  # 2 is JobStatus.Submitted enum value
                        # If job is not submitted, try to auto-submit if both parties confirmed
                        if blockchain_status in ['inprogress', 'in_progress', '1']:
                            # Both parties confirmed but work not submitted - auto-submit with placeholder
                            if job.freelancer_address and job.client_confirmed_completion and job.freelancer_confirmed_completion:
                                logger.info(f"Auto-submitting work for job {job.blockchain_job_id} since both parties confirmed")
                                try:
                                    # Use deliverable URL if available, otherwise placeholder
                                    deliverable_hash = job.deliverable_url or "QmPlaceholderDeliverableConfirmed"
                                    # Build submitWork transaction
                                    contract = blockchain_service.contract
                                    function_call = contract.functions.submitWork(job.blockchain_job_id, deliverable_hash)
                                    
                                    checksum_freelancer = Web3.to_checksum_address(job.freelancer_address)
                                    submit_transaction = function_call.build_transaction({
                                        'from': checksum_freelancer,
                                        'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_freelancer),
                                        'gasPrice': blockchain_service.w3.eth.gas_price,
                                        'chainId': blockchain_service.w3.eth.chain_id,
                                    })
                                    
                                    estimated_gas = blockchain_service.estimate_gas(submit_transaction)
                                    submit_transaction['gas'] = int(estimated_gas * 1.2)
                                    
                                    # Return submit transaction for freelancer to sign first
                                    db.commit()
                                    return {
                                        "message": "Work needs to be submitted on blockchain first. Please sign the submit transaction, then payment can be released.",
                                        "both_confirmed": True,
                                        "needs_submit": True,
                                        "submit_transaction": {
                                            "transaction": submit_transaction,
                                            "message": "Freelancer must sign this transaction to submit work on blockchain"
                                        },
                                        "blockchain_status": blockchain_status,
                                        "blockchain_job_id": job.blockchain_job_id
                                    }
                                except Exception as submit_error:
                                    logger.error(f"Failed to build submit transaction: {submit_error}")
                                    db.commit()
                                    return {
                                        "message": "Job needs to be submitted on blockchain first. Please submit work before confirming completion.",
                                        "both_confirmed": True,
                                        "needs_submit": True,
                                        "blockchain_status": blockchain_status,
                                        "blockchain_job_id": job.blockchain_job_id,
                                        "error": str(submit_error)
                                    }
                            else:
                                logger.warning(f"Job {job.blockchain_job_id} is in InProgress, needs to be submitted first")
                                db.commit()
                                return {
                                    "message": "Job needs to be submitted on blockchain first. Please submit work before confirming completion.",
                                    "both_confirmed": True,
                                    "needs_submit": True,
                                    "blockchain_status": blockchain_status,
                                    "blockchain_job_id": job.blockchain_job_id
                                }
                        elif blockchain_status in ['open', '0']:
                            # Job is still open on blockchain - needs to be accepted first
                            if job.freelancer_address and job.client_confirmed_completion and job.freelancer_confirmed_completion:
                                logger.info(f"Job {job.blockchain_job_id} is open, needs acceptance first")
                                try:
                                    # Build acceptJob transaction
                                    contract = blockchain_service.contract
                                    function_call = contract.functions.acceptJob(job.blockchain_job_id)
                                    
                                    checksum_freelancer = Web3.to_checksum_address(job.freelancer_address)
                                    accept_transaction = function_call.build_transaction({
                                        'from': checksum_freelancer,
                                        'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_freelancer),
                                        'gasPrice': blockchain_service.w3.eth.gas_price,
                                        'chainId': blockchain_service.w3.eth.chain_id,
                                    })
                                    
                                    estimated_gas = blockchain_service.estimate_gas(accept_transaction)
                                    accept_transaction['gas'] = int(estimated_gas * 1.2)
                                    
                                    db.commit()
                                    return {
                                        "message": "Job needs to be accepted on blockchain first, then submitted, then payment can be released.",
                                        "both_confirmed": True,
                                        "needs_accept": True,
                                        "needs_submit": True,
                                        "accept_transaction": {
                                            "transaction": accept_transaction,
                                            "message": "Freelancer must sign this transaction to accept job on blockchain"
                                        },
                                        "blockchain_status": blockchain_status,
                                        "blockchain_job_id": job.blockchain_job_id
                                    }
                                except Exception as accept_error:
                                    logger.error(f"Failed to build accept transaction: {accept_error}")
                                    db.commit()
                                    return {
                                        "message": f"Job is in '{blockchain_status}' status on blockchain. Freelancer must accept the job first, then submit work, before payment can be released.",
                                        "both_confirmed": True,
                                        "needs_accept": True,
                                        "needs_submit": True,
                                        "blockchain_status": blockchain_status,
                                        "blockchain_job_id": job.blockchain_job_id,
                                        "error": str(accept_error)
                                    }
                            else:
                                raise Exception(f"Job status is {blockchain_status} on blockchain. Freelancer must accept the job first, then submit work, before payment can be released.")
                        else:
                            raise Exception(f"Job status is {blockchain_status}, cannot approve. Job must be in Submitted status.")
                    
                    # Check if funds are already released
                    if blockchain_job.get('fundsReleased', False):
                        logger.warning(f"Funds already released for job {job.blockchain_job_id}")
                        db.commit()
                        return {
                            "message": "Payment already released for this job.",
                            "both_confirmed": True,
                            "funds_already_released": True
                        }
                    
                    # Build approveWork transaction to release payment
                    contract = blockchain_service.contract
                    function_call = contract.functions.approveWork(job.blockchain_job_id)
                    
                    # Convert address to checksum format
                    checksum_address = Web3.to_checksum_address(job.client_address)
                    
                    # Try to estimate gas first to validate the transaction
                    try:
                        estimated_gas = function_call.estimate_gas({'from': checksum_address})
                        logger.info(f"Estimated gas for approveWork: {estimated_gas}")
                    except Exception as gas_error:
                        logger.error(f"Gas estimation failed: {gas_error}")
                        raise Exception(f"Cannot estimate gas. Job may not be in correct status or already completed. Error: {str(gas_error)}")
                    
                    transaction = function_call.build_transaction({
                        'from': checksum_address,  # Client releases payment
                        'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_address),
                        'gasPrice': blockchain_service.w3.eth.gas_price,
                        'chainId': blockchain_service.w3.eth.chain_id,
                    })
                    
                    transaction['gas'] = int(estimated_gas * 1.2)
                    
                    logger.info(f"✅ Built approveWork transaction for job {job.blockchain_job_id}")
                    
                    # Return transaction for frontend to sign
                    db.commit()
                    return {
                        "message": "Both parties confirmed! Client needs to sign transaction to release payment.",
                        "both_confirmed": True,
                        "blockchain_transaction": {
                            "transaction": transaction,
                            "message": "Client must sign this transaction to release payment to freelancer",
                            "chain_id": blockchain_service.w3.eth.chain_id,
                            "contract_address": blockchain_service.contract_address
                        }
                    }
                except Exception as e:
                    logger.error(f"Error building blockchain transaction: {e}", exc_info=True)
                    # Continue without blockchain - job is still marked as completed
                    db.commit()
                    return {
                        "message": f"Both parties confirmed, but blockchain transaction failed: {str(e)}. Job marked as completed in database.",
                        "both_confirmed": True,
                        "blockchain_error": str(e),
                        "blockchain_job_id": job.blockchain_job_id
                    }
        
        db.commit()
        
        return {
            "message": "Completion confirmed. Waiting for client confirmation.",
            "both_confirmed": False,
            "client_confirmed": job.client_confirmed_completion,
            "freelancer_confirmed": job.freelancer_confirmed_completion
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming completion: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/escrow/pending")
async def get_escrow_pending_jobs(
    escrow_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Get all jobs where the escrow address matches and both parties have confirmed
    """
    try:
        escrow_address_lower = escrow_address.lower()
        
        # Get jobs where escrow_address matches and both parties confirmed
        jobs = db.query(Job).filter(
            and_(
                Job.escrow_address == escrow_address_lower,
                Job.client_confirmed_completion == True,
                Job.freelancer_confirmed_completion == True,
                Job.status.in_(['in_progress', 'submitted', 'completed'])
            )
        ).all()
        
        # Also include jobs where escrow can revert (if allow_escrow_revert is True)
        revertable_jobs = db.query(Job).filter(
            and_(
                Job.escrow_address == escrow_address_lower,
                Job.allow_escrow_revert == True,
                Job.status.in_(['open', 'in_progress']),
                Job.freelancer_address.is_(None)  # No freelancer assigned yet
            )
        ).all()
        
        # Combine and deduplicate
        all_jobs = {job.id: job for job in jobs + revertable_jobs}.values()
        
        result = []
        for job in all_jobs:
            # Get blockchain job info to check payment release status
            payment_released_at = None
            funds_released = False
            if job.blockchain_job_id:
                try:
                    blockchain_job = blockchain_service.get_job(job.blockchain_job_id)
                    if blockchain_job:
                        funds_released = blockchain_job.get('funds_released', False)
                        completed_at = blockchain_job.get('completed_at')
                        if completed_at and funds_released:
                            payment_released_at = completed_at
                except Exception as e:
                    logger.warning(f"Could not fetch blockchain job {job.blockchain_job_id} for payment info: {e}")
            
            job_dict = {
                "id": job.id,
                "client_address": job.client_address,
                "freelancer_address": job.freelancer_address,
                "title": job.title,
                "description": job.description,
                "category": job.category,
                "skills_required": job.skills_required or [],
                "tags": job.tags or [],
                "budget": job.budget,
                "deadline": job.deadline,
                "status": JobStatus(job.status),
                "ipfs_hash": job.ipfs_hash,
                "blockchain_job_id": job.blockchain_job_id,
                "deliverable_url": job.deliverable_url,
                "client_confirmed_completion": bool(job.client_confirmed_completion) if job.client_confirmed_completion is not None else False,
                "freelancer_confirmed_completion": bool(job.freelancer_confirmed_completion) if job.freelancer_confirmed_completion is not None else False,
                "escrow_address": job.escrow_address,
                "allow_escrow_revert": bool(job.allow_escrow_revert) if job.allow_escrow_revert is not None else False,
                "created_at": job.created_at,
                "updated_at": job.updated_at,
                "proposal_count": job.proposal_count or 0,
                "payment_released_at": payment_released_at,
                "funds_released": funds_released,
            }
            result.append(job_dict)
        
        return result
    
    except Exception as e:
        logger.error(f"Error fetching escrow jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/escrow/release")
async def escrow_release_payment(
    job_id: str,
    escrow_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Escrow releases payment when both parties have confirmed
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Verify escrow address matches
        if job.escrow_address.lower() != escrow_address.lower():
            raise HTTPException(status_code=403, detail="Not authorized as escrow for this job")
        
        # Check if both parties confirmed
        if not job.client_confirmed_completion or not job.freelancer_confirmed_completion:
            raise HTTPException(
                status_code=400,
                detail="Both parties must confirm completion before escrow can release payment"
            )
        
        # Check if job has blockchain_job_id
        if not job.blockchain_job_id or not blockchain_service.contract:
            raise HTTPException(
                status_code=400,
                detail="Job does not have a blockchain job ID or contract not configured"
            )
        
        try:
            # Check blockchain job status
            blockchain_job = blockchain_service.get_job(job.blockchain_job_id)
            if not blockchain_job:
                raise Exception(f"Job {job.blockchain_job_id} not found on blockchain")
            
            blockchain_status = blockchain_job.get('status', '').lower()
            
            if blockchain_status not in ['submitted', '2']:
                if blockchain_status in ['inprogress', 'in_progress', '1']:
                    return {
                        "needs_submit": True,
                        "message": "Job needs to be submitted on blockchain first"
                    }
                elif blockchain_status in ['open', '0']:
                    return {
                        "needs_accept": True,
                        "needs_submit": True,
                        "message": f"Job is in '{blockchain_status}' status on blockchain. Freelancer must accept the job first, then submit work, before payment can be released."
                    }
                else:
                    raise Exception(f"Job status is {blockchain_status}, cannot approve. Job must be in Submitted status.")
            
            # Check if funds already released
            if blockchain_job.get('fundsReleased', False):
                return {
                    "funds_already_released": True,
                    "message": "Funds already released for this job"
                }
            
            # Build approveWork transaction (escrow acts on behalf of client)
            # Note: The contract requires onlyClient modifier, so we need to use client's address
            checksum_client = Web3.to_checksum_address(job.client_address)
            
            contract = blockchain_service.contract
            function_call = contract.functions.approveWork(job.blockchain_job_id)
            
            transaction = function_call.build_transaction({
                'from': checksum_client,
                'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_client),
                'gasPrice': blockchain_service.w3.eth.gas_price,
                'chainId': blockchain_service.w3.eth.chain_id,
            })
            
            estimated_gas = blockchain_service.estimate_gas(transaction)
            transaction['gas'] = int(estimated_gas * 1.2)
            
            logger.info(f"✅ Built approveWork transaction for escrow release on job {job.blockchain_job_id}")
            
            return {
                "message": "Transaction ready for escrow to sign and release payment",
                "blockchain_transaction": {
                    "transaction": transaction,
                    "message": "Sign this transaction to release payment to freelancer",
                    "chain_id": blockchain_service.w3.eth.chain_id,
                    "contract_address": blockchain_service.contract_address
                }
            }
        except Exception as e:
            logger.error(f"Error building blockchain transaction: {e}", exc_info=True)
            return {
                "blockchain_error": str(e),
                "message": f"Failed to build transaction: {str(e)}"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in escrow release: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/escrow/revert")
async def escrow_revert_payment(
    job_id: str,
    escrow_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Escrow reverts payment back to client if no work is done
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Verify escrow address matches
        if job.escrow_address.lower() != escrow_address.lower():
            raise HTTPException(status_code=403, detail="Not authorized as escrow for this job")
        
        # Check if escrow revert is allowed
        if not job.allow_escrow_revert:
            raise HTTPException(
                status_code=400,
                detail="This job does not allow escrow revert"
            )
        
        # Check if job has blockchain_job_id
        if not job.blockchain_job_id or not blockchain_service.contract:
            raise HTTPException(
                status_code=400,
                detail="Job does not have a blockchain job ID or contract not configured"
            )
        
        try:
            # Check blockchain job status
            blockchain_job = blockchain_service.get_job(job.blockchain_job_id)
            if not blockchain_job:
                raise Exception(f"Job {job.blockchain_job_id} not found on blockchain")
            
            blockchain_status = blockchain_job.get('status', '').lower()
            
            # Can only revert if job is Open or InProgress and no freelancer assigned
            if blockchain_status not in ['open', '0', 'inprogress', 'in_progress', '1']:
                raise Exception(f"Cannot revert job in status: {blockchain_status}")
            
            if blockchain_job.get('fundsReleased', False):
                return {
                    "funds_already_released": True,
                    "message": "Funds already released for this job"
                }
            
            # Build cancelJob transaction (escrow acts on behalf of client)
            checksum_client = Web3.to_checksum_address(job.client_address)
            
            contract = blockchain_service.contract
            function_call = contract.functions.cancelJob(job.blockchain_job_id)
            
            transaction = function_call.build_transaction({
                'from': checksum_client,
                'nonce': blockchain_service.w3.eth.get_transaction_count(checksum_client),
                'gasPrice': blockchain_service.w3.eth.gas_price,
                'chainId': blockchain_service.w3.eth.chain_id,
            })
            
            estimated_gas = blockchain_service.estimate_gas(transaction)
            transaction['gas'] = int(estimated_gas * 1.2)
            
            # Update job status in database
            job.status = "refunded"
            db.commit()
            
            logger.info(f"✅ Built cancelJob transaction for escrow revert on job {job.blockchain_job_id}")
            
            return {
                "message": "Transaction ready for escrow to sign and revert payment",
                "blockchain_transaction": {
                    "transaction": transaction,
                    "message": "Sign this transaction to revert payment to client",
                    "chain_id": blockchain_service.w3.eth.chain_id,
                    "contract_address": blockchain_service.contract_address
                }
            }
        except Exception as e:
            logger.error(f"Error building blockchain transaction: {e}", exc_info=True)
            return {
                "blockchain_error": str(e),
                "message": f"Failed to build transaction: {str(e)}"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in escrow revert: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/escrow/check")
async def check_is_escrow(
    escrow_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Check if an address is the designated escrow address.
    Only the designated escrow address (Linux 2) should show the escrow dashboard.
    Mac and Linux 1 should show normal client/freelancer interface.
    """
    try:
        escrow_address_lower = escrow_address.lower()
        designated_escrow = settings.DESIGNATED_ESCROW_ADDRESS.lower()
        
        # Only return true if this is the designated escrow address (Linux 2)
        is_designated_escrow = escrow_address_lower == designated_escrow
        
        # Also get job count for info purposes
        count = db.query(Job).filter(Job.escrow_address == escrow_address_lower).count()
        
        return {
            "is_escrow": is_designated_escrow,
            "job_count": count,
            "designated_escrow_address": designated_escrow
        }
    except Exception as e:
        logger.error(f"Error checking escrow status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/saved/{user_address}", response_model=List[JobResponse])
async def get_saved_jobs(
    user_address: str,
    db: Session = Depends(get_db)
):
    """
    Get all saved jobs for a user
    """
    try:
        user_address_lower = user_address.lower()
        
        # Get all saved jobs for this user
        saved_jobs = db.query(SavedJob).filter(
            SavedJob.user_address == user_address_lower
        ).all()
        
        # Get the actual job details
        job_ids = [saved_job.job_id for saved_job in saved_jobs]
        jobs = db.query(Job).filter(Job.id.in_(job_ids)).all()
        
        return [
            JobResponse(
                id=job.id,
                client_address=job.client_address,
                freelancer_address=job.freelancer_address,
                title=job.title,
                description=job.description,
                category=job.category,
                skills_required=job.skills_required or [],
                tags=job.tags or [],
                budget=job.budget,
                deadline=job.deadline,
                status=JobStatus(job.status),
                ipfs_hash=job.ipfs_hash,
                blockchain_job_id=job.blockchain_job_id,
                deliverable_url=job.deliverable_url,
                client_confirmed_completion=bool(job.client_confirmed_completion) if job.client_confirmed_completion is not None else False,
                freelancer_confirmed_completion=bool(job.freelancer_confirmed_completion) if job.freelancer_confirmed_completion is not None else False,
                escrow_address=job.escrow_address,
                allow_escrow_revert=bool(job.allow_escrow_revert) if job.allow_escrow_revert is not None else False,
                created_at=job.created_at,
                updated_at=job.updated_at,
                proposal_count=job.proposal_count or 0,
            )
            for job in jobs
        ]
    except Exception as e:
        logger.error(f"Error getting saved jobs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/repair-freelancer", response_model=JobResponse)
async def repair_job_freelancer(
    job_id: str,
    db: Session = Depends(get_db)
):
    """Repair job by assigning freelancer from accepted proposal"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # If job already has freelancer, still check and fix status if needed
        if job.freelancer_address:
            logger.info(f"Job {job_id} already has freelancer: {job.freelancer_address}, current status: {job.status}")
            # ALWAYS fix status if it's 'open' or 'pending' but freelancer is assigned
            # Also check if confirmations exist - if so, should be in_progress or submitted
            has_confirmations = job.client_confirmed_completion or job.freelancer_confirmed_completion
            status_changed = False
            
            if job.status in ['open', 'pending']:
                old_status = job.status
                # If confirmations exist, should be at least in_progress
                job.status = 'in_progress'
                status_changed = True
                logger.info(f"✅ Fixed job status from {old_status} to in_progress (freelancer: {job.freelancer_address}, confirmations: {has_confirmations})")
            elif has_confirmations and job.status == 'open':
                # Edge case: confirmations exist but status is still open
                old_status = job.status
                job.status = 'in_progress'
                status_changed = True
                logger.info(f"✅ Fixed job status from {old_status} to in_progress (has confirmations)")
            
            # Final safety check: If confirmations exist, status must NEVER be 'open'
            if (job.client_confirmed_completion or job.freelancer_confirmed_completion) and job.status == 'open':
                job.status = 'in_progress'
                status_changed = True
                logger.info(f"✅ Final safety fix: Job {job_id} has confirmations, forcing status to in_progress")
            
            if status_changed:
                job.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(job)
            return JobResponse(
                id=job.id,
                client_address=job.client_address,
                freelancer_address=job.freelancer_address,
                title=job.title,
                description=job.description,
                category=job.category,
                skills_required=job.skills_required or [],
                tags=job.tags or [],
                budget=job.budget,
                deadline=job.deadline,
                status=JobStatus(job.status),
                ipfs_hash=job.ipfs_hash,
                blockchain_job_id=job.blockchain_job_id,
                deliverable_url=job.deliverable_url,
                client_confirmed_completion=bool(job.client_confirmed_completion) if job.client_confirmed_completion is not None else False,
                freelancer_confirmed_completion=bool(job.freelancer_confirmed_completion) if job.freelancer_confirmed_completion is not None else False,
                created_at=job.created_at,
                updated_at=job.updated_at,
                proposal_count=job.proposal_count or 0,
            )
        
        # Find accepted proposal for this job
        proposals = db.query(Proposal).filter(
            Proposal.job_id == job_id,
            Proposal.status == 'accepted'
        ).all()
        
        if not proposals:
            raise HTTPException(status_code=404, detail="No accepted proposal found for this job")
        
        # Use the first accepted proposal
        accepted_proposal = proposals[0]
        freelancer_address_lower = accepted_proposal.freelancer_address.lower()
        
        # Ensure freelancer user exists
        freelancer_user = db.query(User).filter(User.wallet_address == freelancer_address_lower).first()
        if not freelancer_user:
            username_hex = freelancer_address_lower[2:10] if freelancer_address_lower.startswith('0x') else freelancer_address_lower[:8]
            freelancer_user = User(
                wallet_address=freelancer_address_lower,
                username=f"User_{username_hex}",
                role="freelancer"
            )
            db.add(freelancer_user)
            db.flush()
            logger.info(f"Auto-created user for freelancer: {freelancer_address_lower}")
        
        # Update job
        job.freelancer_address = freelancer_address_lower
        # Always set to in_progress when freelancer is assigned (unless already completed/cancelled)
        if job.status in ['open', 'pending']:
            job.status = 'in_progress'
            logger.info(f"Updated job status from {job.status} to in_progress")
        job.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(job)
        
        logger.info(f"✅ Repaired job {job_id}: assigned freelancer {freelancer_address_lower}, status: {job.status}")
        
        return JobResponse(
            id=job.id,
            client_address=job.client_address,
            freelancer_address=job.freelancer_address,
            title=job.title,
            description=job.description,
            category=job.category,
            skills_required=job.skills_required or [],
            tags=job.tags or [],
            budget=job.budget,
            deadline=job.deadline,
            status=JobStatus(job.status),
            ipfs_hash=job.ipfs_hash,
            blockchain_job_id=job.blockchain_job_id,
            deliverable_url=job.deliverable_url,
            client_confirmed_completion=bool(job.client_confirmed_completion) if job.client_confirmed_completion is not None else False,
            freelancer_confirmed_completion=bool(job.freelancer_confirmed_completion) if job.freelancer_confirmed_completion is not None else False,
            created_at=job.created_at,
            updated_at=job.updated_at,
            proposal_count=job.proposal_count or 0,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error repairing job: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/save")
async def save_job(
    job_id: str,
    user_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Save a job for a user
    """
    try:
        # Check if job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        user_address_lower = user_address.lower()
        
        # Check if already saved
        existing = db.query(SavedJob).filter(
            and_(
                SavedJob.user_address == user_address_lower,
                SavedJob.job_id == job_id
            )
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Job is already saved")
        
        # Create saved job entry
        saved_job = SavedJob(
            id=str(uuid.uuid4()),
            user_address=user_address_lower,
            job_id=job_id
        )
        
        db.add(saved_job)
        db.commit()
        
        return {"message": "Job saved successfully", "job_id": job_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving job: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{job_id}/save")
async def unsave_job(
    job_id: str,
    user_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Unsave a job for a user
    """
    try:
        user_address_lower = user_address.lower()
        
        # Find and delete saved job entry
        saved_job = db.query(SavedJob).filter(
            and_(
                SavedJob.user_address == user_address_lower,
                SavedJob.job_id == job_id
            )
        ).first()
        
        if not saved_job:
            raise HTTPException(status_code=404, detail="Job is not saved")
        
        db.delete(saved_job)
        db.commit()
        
        return {"message": "Job removed from saved", "job_id": job_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsaving job: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
