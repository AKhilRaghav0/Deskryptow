"""
Proposal endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import List

from app.models import ProposalCreate, ProposalResponse, ProposalStatus
from app.database import db, PROPOSALS_COLLECTION, JOBS_COLLECTION
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/", response_model=ProposalResponse)
async def create_proposal(proposal: ProposalCreate, freelancer_address: str):
    """Submit a proposal for a job"""
    try:
        # Check if job exists
        job_ref = db.collection(JOBS_COLLECTION).document(proposal.job_id)
        if not job_ref.get().exists:
            raise HTTPException(status_code=404, detail="Job not found")
        
        proposal_id = str(uuid.uuid4())
        
        proposal_data = {
            "id": proposal_id,
            "job_id": proposal.job_id,
            "freelancer_address": freelancer_address.lower(),
            "cover_letter": proposal.cover_letter,
            "proposed_timeline": proposal.proposed_timeline,
            "portfolio_links": proposal.portfolio_links,
            "status": ProposalStatus.PENDING,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        db.collection(PROPOSALS_COLLECTION).document(proposal_id).set(proposal_data)
        
        # Increment proposal count on job
        job_ref.update({
            "proposal_count": firestore.Increment(1)
        })
        
        return ProposalResponse(**proposal_data)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/job/{job_id}", response_model=List[ProposalResponse])
async def get_job_proposals(job_id: str):
    """Get all proposals for a job"""
    try:
        proposals = db.collection(PROPOSALS_COLLECTION).where(
            "job_id", "==", job_id
        ).stream()
        
        proposal_list = []
        for proposal_doc in proposals:
            proposal_data = proposal_doc.to_dict()
            proposal_data["id"] = proposal_doc.id
            proposal_list.append(ProposalResponse(**proposal_data))
        
        return proposal_list
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/freelancer/{freelancer_address}", response_model=List[ProposalResponse])
async def get_freelancer_proposals(freelancer_address: str):
    """Get all proposals submitted by a freelancer"""
    try:
        proposals = db.collection(PROPOSALS_COLLECTION).where(
            "freelancer_address", "==", freelancer_address.lower()
        ).stream()
        
        proposal_list = []
        for proposal_doc in proposals:
            proposal_data = proposal_doc.to_dict()
            proposal_data["id"] = proposal_doc.id
            proposal_list.append(ProposalResponse(**proposal_data))
        
        return proposal_list
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{proposal_id}/accept")
async def accept_proposal(proposal_id: str):
    """Accept a proposal"""
    try:
        proposal_ref = db.collection(PROPOSALS_COLLECTION).document(proposal_id)
        proposal_doc = proposal_ref.get()
        
        if not proposal_doc.exists:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        proposal_ref.update({
            "status": ProposalStatus.ACCEPTED,
            "updated_at": datetime.utcnow()
        })
        
        return {"message": "Proposal accepted", "proposal_id": proposal_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{proposal_id}/reject")
async def reject_proposal(proposal_id: str):
    """Reject a proposal"""
    try:
        proposal_ref = db.collection(PROPOSALS_COLLECTION).document(proposal_id)
        proposal_doc = proposal_ref.get()
        
        if not proposal_doc.exists:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        proposal_ref.update({
            "status": ProposalStatus.REJECTED,
            "updated_at": datetime.utcnow()
        })
        
        return {"message": "Proposal rejected", "proposal_id": proposal_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
