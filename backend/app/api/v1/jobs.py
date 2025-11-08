"""
Job endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.models import JobCreate, JobResponse, JobUpdate, JobStatus
from app.database import db, JOBS_COLLECTION, PROPOSALS_COLLECTION
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/", response_model=JobResponse)
async def create_job(job: JobCreate, client_address: str):
    """Create a new job listing"""
    try:
        job_id = str(uuid.uuid4())
        
        job_data = {
            "id": job_id,
            "client_address": client_address.lower(),
            "freelancer_address": None,
            "title": job.title,
            "description": job.description,
            "category": job.category,
            "skills_required": job.skills_required,
            "budget": job.budget,
            "deadline": job.deadline,
            "status": JobStatus.OPEN,
            "ipfs_hash": job.ipfs_hash,
            "blockchain_job_id": None,
            "deliverable_url": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "proposal_count": 0
        }
        
        db.collection(JOBS_COLLECTION).document(job_id).set(job_data)
        return JobResponse(**job_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    status: Optional[JobStatus] = None,
    category: Optional[str] = None,
    limit: int = Query(50, le=100)
):
    """List all jobs with optional filters"""
    try:
        query = db.collection(JOBS_COLLECTION)
        
        if status:
            query = query.where("status", "==", status)
        if category:
            query = query.where("category", "==", category)
        
        jobs = query.limit(limit).stream()
        
        job_list = []
        for job_doc in jobs:
            job_data = job_doc.to_dict()
            job_data["id"] = job_doc.id
            job_list.append(JobResponse(**job_data))
        
        return job_list
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get job details by ID"""
    try:
        job_ref = db.collection(JOBS_COLLECTION).document(job_id)
        job_doc = job_ref.get()
        
        if not job_doc.exists:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_data = job_doc.to_dict()
        job_data["id"] = job_doc.id
        
        return JobResponse(**job_data)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, updates: JobUpdate):
    """Update job details"""
    try:
        job_ref = db.collection(JOBS_COLLECTION).document(job_id)
        
        if not job_ref.get().exists:
            raise HTTPException(status_code=404, detail="Job not found")
        
        update_data = updates.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        job_ref.update(update_data)
        
        updated_job = job_ref.get()
        job_data = updated_job.to_dict()
        job_data["id"] = updated_job.id
        
        return JobResponse(**job_data)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/accept")
async def accept_freelancer(job_id: str, freelancer_address: str):
    """Accept a freelancer for the job"""
    try:
        job_ref = db.collection(JOBS_COLLECTION).document(job_id)
        job_doc = job_ref.get()
        
        if not job_doc.exists:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_ref.update({
            "freelancer_address": freelancer_address.lower(),
            "status": JobStatus.IN_PROGRESS,
            "updated_at": datetime.utcnow()
        })
        
        return {"message": "Freelancer accepted", "job_id": job_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/submit")
async def submit_work(job_id: str, deliverable_url: str):
    """Submit work for review"""
    try:
        job_ref = db.collection(JOBS_COLLECTION).document(job_id)
        job_doc = job_ref.get()
        
        if not job_doc.exists:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_ref.update({
            "deliverable_url": deliverable_url,
            "status": JobStatus.SUBMITTED,
            "updated_at": datetime.utcnow()
        })
        
        return {"message": "Work submitted", "job_id": job_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/{client_address}", response_model=List[JobResponse])
async def get_client_jobs(client_address: str):
    """Get all jobs posted by a client"""
    try:
        jobs = db.collection(JOBS_COLLECTION).where(
            "client_address", "==", client_address.lower()
        ).stream()
        
        job_list = []
        for job_doc in jobs:
            job_data = job_doc.to_dict()
            job_data["id"] = job_doc.id
            job_list.append(JobResponse(**job_data))
        
        return job_list
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/freelancer/{freelancer_address}", response_model=List[JobResponse])
async def get_freelancer_jobs(freelancer_address: str):
    """Get all jobs accepted by a freelancer"""
    try:
        jobs = db.collection(JOBS_COLLECTION).where(
            "freelancer_address", "==", freelancer_address.lower()
        ).stream()
        
        job_list = []
        for job_doc in jobs:
            job_data = job_doc.to_dict()
            job_data["id"] = job_doc.id
            job_list.append(JobResponse(**job_data))
        
        return job_list
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
