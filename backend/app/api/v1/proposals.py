"""
Proposal endpoints with PostgreSQL
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import logging

from app.models import ProposalCreate, ProposalResponse, ProposalStatus
from app.database import get_db, Proposal, Job, User
from app.services.notification import notification_service
from app.services.blockchain import blockchain_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=ProposalResponse)
async def create_proposal(
    proposal: ProposalCreate,
    freelancer_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Submit a proposal for a job"""
    try:
        # Check if job exists
        job = db.query(Job).filter(Job.id == proposal.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Ensure freelancer user exists (create if not)
        freelancer_address_lower = freelancer_address.lower()
        user = db.query(User).filter(User.wallet_address == freelancer_address_lower).first()
        if not user:
            # Auto-create user if they don't exist
            username_hex = freelancer_address_lower[2:10] if freelancer_address_lower.startswith('0x') else freelancer_address_lower[:8]
            user = User(
                wallet_address=freelancer_address_lower,
                username=f"User_{username_hex}",
                role="freelancer"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Auto-created user for freelancer: {freelancer_address_lower}")
        
        proposal_id = str(uuid.uuid4())
        
        # Create proposal
        db_proposal = Proposal(
            id=proposal_id,
            job_id=proposal.job_id,
            freelancer_address=freelancer_address.lower(),
            cover_letter=proposal.cover_letter,
            proposed_timeline=proposal.proposed_timeline,
            portfolio_links=proposal.portfolio_links,
            status=ProposalStatus.PENDING.value,
        )
        
        db.add(db_proposal)
        
        # Increment proposal count on job
        job.proposal_count = (job.proposal_count or 0) + 1
        
        db.commit()
        db.refresh(db_proposal)
        
        # Notify job owner about new proposal
        try:
            notification_service.notify_proposal_received(
                db=db,
                job_id=proposal.job_id,
                proposal_id=db_proposal.id,
                freelancer_address=freelancer_address
            )
        except Exception as e:
            logger.warning(f"Failed to send proposal notification: {e}")
        
        return ProposalResponse(
            id=db_proposal.id,
            job_id=db_proposal.job_id,
            freelancer_address=db_proposal.freelancer_address,
            cover_letter=db_proposal.cover_letter,
            proposed_timeline=db_proposal.proposed_timeline,
            portfolio_links=db_proposal.portfolio_links or [],
            status=ProposalStatus(db_proposal.status),
            created_at=db_proposal.created_at,
            updated_at=db_proposal.updated_at,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating proposal: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/job/{job_id}", response_model=List[ProposalResponse])
async def get_job_proposals(job_id: str, db: Session = Depends(get_db)):
    """Get all proposals for a job"""
    try:
        proposals = db.query(Proposal).filter(Proposal.job_id == job_id).all()
        
        proposal_list = []
        for proposal in proposals:
            proposal_list.append(ProposalResponse(
                id=proposal.id,
                job_id=proposal.job_id,
                freelancer_address=proposal.freelancer_address,
                cover_letter=proposal.cover_letter,
                proposed_timeline=proposal.proposed_timeline,
                portfolio_links=proposal.portfolio_links or [],
                status=ProposalStatus(proposal.status),
                created_at=proposal.created_at,
                updated_at=proposal.updated_at,
            ))
        
        return proposal_list
    
    except Exception as e:
        logger.error(f"Error getting job proposals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/freelancer/{freelancer_address}", response_model=List[ProposalResponse])
async def get_freelancer_proposals(freelancer_address: str, db: Session = Depends(get_db)):
    """Get all proposals submitted by a freelancer"""
    try:
        proposals = db.query(Proposal).filter(
            Proposal.freelancer_address == freelancer_address.lower()
        ).all()
        
        proposal_list = []
        for proposal in proposals:
            proposal_list.append(ProposalResponse(
                id=proposal.id,
                job_id=proposal.job_id,
                freelancer_address=proposal.freelancer_address,
                cover_letter=proposal.cover_letter,
                proposed_timeline=proposal.proposed_timeline,
                portfolio_links=proposal.portfolio_links or [],
                status=ProposalStatus(proposal.status),
                created_at=proposal.created_at,
                updated_at=proposal.updated_at,
            ))
        
        return proposal_list
    
    except Exception as e:
        logger.error(f"Error getting freelancer proposals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(proposal_id: str, db: Session = Depends(get_db)):
    """Get a single proposal by ID"""
    try:
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        return ProposalResponse(
            id=proposal.id,
            job_id=proposal.job_id,
            freelancer_address=proposal.freelancer_address,
            cover_letter=proposal.cover_letter,
            proposed_timeline=proposal.proposed_timeline,
            portfolio_links=proposal.portfolio_links or [],
            status=ProposalStatus(proposal.status),
            created_at=proposal.created_at,
            updated_at=proposal.updated_at,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting proposal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{proposal_id}/accept")
async def accept_proposal(
    proposal_id: str, 
    client_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Accept a proposal and optionally build blockchain transaction"""
    try:
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Get job
        job = db.query(Job).filter(Job.id == proposal.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Verify client is the job owner
        if job.client_address.lower() != client_address.lower():
            raise HTTPException(status_code=403, detail="Only job owner can accept proposals")
        
        proposal.status = ProposalStatus.ACCEPTED.value
        
        # Ensure freelancer user exists (create if not)
        freelancer_address_lower = proposal.freelancer_address.lower()
        freelancer_user = db.query(User).filter(User.wallet_address == freelancer_address_lower).first()
        if not freelancer_user:
            username_hex = freelancer_address_lower[2:10] if freelancer_address_lower.startswith('0x') else freelancer_address_lower[:8]
            freelancer_user = User(
                wallet_address=freelancer_address_lower,
                username=f"User_{username_hex}",
                role="freelancer"
            )
            db.add(freelancer_user)
            db.flush()  # Flush to get the user in the session
            logger.info(f"Auto-created user for freelancer: {freelancer_address_lower}")
        
        # Update job to assign freelancer (use lowercase address)
        job.freelancer_address = freelancer_address_lower
        job.status = "in_progress"
        
        db.commit()
        db.refresh(job)  # Refresh to ensure changes are visible
        
        # Build blockchain transaction if job has blockchain_job_id
        blockchain_tx = None
        if job.blockchain_job_id and blockchain_service.contract:
            try:
                contract = blockchain_service.contract
                function_call = contract.functions.acceptJob(job.blockchain_job_id)
                
                transaction = function_call.build_transaction({
                    'from': proposal.freelancer_address,
                    'nonce': blockchain_service.w3.eth.get_transaction_count(proposal.freelancer_address),
                    'gasPrice': blockchain_service.w3.eth.gas_price,
                    'chainId': blockchain_service.w3.eth.chain_id,
                })
                
                estimated_gas = blockchain_service.estimate_gas(transaction)
                transaction['gas'] = int(estimated_gas * 1.2)
                
                blockchain_tx = {
                    "transaction": transaction,
                    "message": "Freelancer must sign this transaction to accept job on blockchain",
                    "chain_id": blockchain_service.w3.eth.chain_id,
                    "contract_address": blockchain_service.contract_address
                }
                logger.info(f"✅ Built blockchain acceptJob transaction for job {job.blockchain_job_id}")
            except Exception as e:
                logger.warning(f"Could not build blockchain transaction: {e}")
        
        # Notify freelancer about accepted proposal
        try:
            notification_service.notify_proposal_accepted(
                db=db,
                proposal_id=proposal_id,
                job_id=proposal.job_id
            )
        except Exception as e:
            logger.warning(f"Failed to send acceptance notification: {e}")
        
        return {
            "message": "Proposal accepted", 
            "proposal_id": proposal_id,
            "blockchain_transaction": blockchain_tx
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting proposal: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{proposal_id}/reject")
async def reject_proposal(proposal_id: str, db: Session = Depends(get_db)):
    """Reject a proposal"""
    try:
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        proposal.status = ProposalStatus.REJECTED.value
        db.commit()
        
        # Notify freelancer about rejected proposal
        try:
            notification_service.notify_proposal_rejected(
                db=db,
                proposal_id=proposal_id,
                job_id=proposal.job_id
            )
        except Exception as e:
            logger.warning(f"Failed to send rejection notification: {e}")
        
        return {"message": "Proposal rejected", "proposal_id": proposal_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting proposal: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{proposal_id}/withdraw")
async def withdraw_proposal(
    proposal_id: str,
    freelancer_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Withdraw a proposal (only by the freelancer who submitted it)"""
    try:
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Verify the freelancer is the owner of the proposal
        if proposal.freelancer_address.lower() != freelancer_address.lower():
            raise HTTPException(status_code=403, detail="You can only withdraw your own proposals")
        
        # Check if proposal is already accepted or rejected
        if proposal.status == ProposalStatus.ACCEPTED.value:
            raise HTTPException(status_code=400, detail="Cannot withdraw an accepted proposal")
        
        if proposal.status == ProposalStatus.REJECTED.value:
            raise HTTPException(status_code=400, detail="Proposal is already rejected")
        
        # Get job to decrement proposal count
        job = db.query(Job).filter(Job.id == proposal.job_id).first()
        if job:
            job.proposal_count = max(0, (job.proposal_count or 0) - 1)
        
        # Delete the proposal
        db.delete(proposal)
        db.commit()
        
        return {"message": "Proposal withdrawn successfully", "proposal_id": proposal_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error withdrawing proposal: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
