"""
Search endpoints using Redis
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

from app.models import JobResponse
from app.database import SessionLocal, Job
from app.services.search import search_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/jobs")
async def search_jobs(
    q: Optional[str] = Query(None, description="Search query"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, le=100, description="Maximum number of results")
):
    """
    Search for jobs using Redis
    """
    try:
        # Search using Redis
        job_ids = search_service.search_jobs(
            query=q,
            tags=tags,
            category=category,
            status=status,
            limit=limit
        )
        
        # Fetch full job data from PostgreSQL
        db = SessionLocal()
        try:
            jobs = db.query(Job).filter(Job.id.in_(job_ids)).all()
            
            job_list = []
            for job in jobs:
                job_data = {
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
                    "status": job.status,
                    "ipfs_hash": job.ipfs_hash,
                    "blockchain_job_id": job.blockchain_job_id,
                    "deliverable_url": job.deliverable_url,
                    "created_at": job.created_at,
                    "updated_at": job.updated_at,
                    "proposal_count": job.proposal_count or 0,
                }
                job_list.append(JobResponse(**job_data))
            
            return {"jobs": job_list, "count": len(job_list)}
        finally:
            db.close()
    
    except Exception as e:
        logger.error(f"Error searching jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tags")
async def get_tags():
    """Get all available tags"""
    try:
        tags = search_service.get_all_tags()
        return {"tags": tags}
    except Exception as e:
        logger.error(f"Error getting tags: {e}")
        raise HTTPException(status_code=500, detail=str(e))

