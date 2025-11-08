"""
User endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import List

from app.models import UserCreate, UserProfile
from app.database import db, USERS_COLLECTION, JOBS_COLLECTION
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=UserProfile)
async def create_user(user: UserCreate):
    """Create new user profile"""
    try:
        wallet_address = user.wallet_address.lower()
        user_ref = db.collection(USERS_COLLECTION).document(wallet_address)
        
        # Check if user exists
        if user_ref.get().exists:
            raise HTTPException(status_code=400, detail="User already exists")
        
        user_data = {
            "wallet_address": wallet_address,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "bio": None,
            "skills": [],
            "portfolio_url": None,
            "avatar_url": None,
            "reputation_score": 0.0,
            "jobs_completed": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        user_ref.set(user_data)
        return UserProfile(**user_data)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{wallet_address}", response_model=UserProfile)
async def get_user(wallet_address: str):
    """Get user profile by wallet address"""
    try:
        user_ref = db.collection(USERS_COLLECTION).document(wallet_address.lower())
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserProfile(**user_doc.to_dict())
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{wallet_address}", response_model=UserProfile)
async def update_user(wallet_address: str, updates: dict):
    """Update user profile"""
    try:
        user_ref = db.collection(USERS_COLLECTION).document(wallet_address.lower())
        
        if not user_ref.get().exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        updates["updated_at"] = datetime.utcnow()
        user_ref.update(updates)
        
        updated_user = user_ref.get()
        return UserProfile(**updated_user.to_dict())
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{wallet_address}/stats")
async def get_user_stats(wallet_address: str):
    """Get user statistics"""
    try:
        # Get jobs as client
        client_jobs = db.collection(JOBS_COLLECTION).where(
            "client_address", "==", wallet_address.lower()
        ).stream()
        
        # Get jobs as freelancer
        freelancer_jobs = db.collection(JOBS_COLLECTION).where(
            "freelancer_address", "==", wallet_address.lower()
        ).stream()
        
        client_count = len(list(client_jobs))
        freelancer_count = len(list(freelancer_jobs))
        
        return {
            "jobs_posted": client_count,
            "jobs_completed": freelancer_count,
            "total_jobs": client_count + freelancer_count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
