"""
User endpoints with PostgreSQL
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
import logging
import traceback

from app.models import UserCreate, UserProfile, UserRole
from app.database import get_db, User, Job

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=UserProfile)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create new user profile
    Uses wallet_address as primary key
    If user already exists, returns existing profile
    """
    try:
        wallet_address = user.wallet_address.lower()
        
        # Check if user exists
        existing_user = db.query(User).filter(User.wallet_address == wallet_address).first()
        if existing_user:
            # Return existing user instead of error
            return UserProfile(
                wallet_address=existing_user.wallet_address,
                username=existing_user.username,
                email=existing_user.email,
                role=existing_user.role,
                bio=existing_user.bio,
                skills=existing_user.skills or [],
                portfolio_url=existing_user.portfolio_url,
                avatar_url=existing_user.avatar_url,
                reputation_score=existing_user.reputation_score,
                jobs_completed=existing_user.jobs_completed,
                created_at=existing_user.created_at,
                updated_at=existing_user.updated_at,
            )
        
        # Create new user with wallet address as primary key
        # Handle role - convert enum to string if needed
        if isinstance(user.role, UserRole):
            role_value = user.role.value
        elif isinstance(user.role, str):
            # Validate and normalize role string
            role_lower = user.role.lower()
            if role_lower in ['client', 'freelancer', 'both']:
                role_value = role_lower
            else:
                role_value = 'both'  # Default to 'both'
        else:
            role_value = 'both'  # Default fallback
        
        db_user = User(
            wallet_address=wallet_address,
            username=user.username,
            email=user.email,
            role=role_value,
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return UserProfile(
            wallet_address=db_user.wallet_address,
            username=db_user.username,
            email=db_user.email,
            role=db_user.role,
            bio=db_user.bio,
            skills=db_user.skills or [],
            portfolio_url=db_user.portfolio_url,
            avatar_url=db_user.avatar_url,
            reputation_score=db_user.reputation_score,
            jobs_completed=db_user.jobs_completed,
            created_at=db_user.created_at,
            updated_at=db_user.updated_at,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.get("/{wallet_address}", response_model=UserProfile)
async def get_user(wallet_address: str, db: Session = Depends(get_db)):
    """
    Get user profile by wallet address
    Wallet address is the primary key
    """
    try:
        user = db.query(User).filter(User.wallet_address == wallet_address.lower()).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserProfile(
            wallet_address=user.wallet_address,
            username=user.username,
            email=user.email,
            role=user.role,
            bio=user.bio,
            skills=user.skills or [],
            portfolio_url=user.portfolio_url,
            avatar_url=user.avatar_url,
            reputation_score=user.reputation_score,
            jobs_completed=user.jobs_completed,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{wallet_address}", response_model=UserProfile)
async def update_user(
    wallet_address: str,
    updates: dict,
    db: Session = Depends(get_db)
):
    """Update user profile"""
    try:
        user = db.query(User).filter(User.wallet_address == wallet_address.lower()).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update fields
        for key, value in updates.items():
            if hasattr(user, key) and key != 'wallet_address':  # Don't allow changing wallet address
                if key == 'skills' and isinstance(value, list):
                    setattr(user, key, value)
                elif key in ['username', 'email', 'bio', 'portfolio_url']:
                    setattr(user, key, value if value else None)
                else:
                    setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        
        return UserProfile(
            wallet_address=user.wallet_address,
            username=user.username,
            email=user.email,
            role=user.role,
            bio=user.bio,
            skills=user.skills or [],
            portfolio_url=user.portfolio_url,
            avatar_url=user.avatar_url,
            reputation_score=user.reputation_score,
            jobs_completed=user.jobs_completed,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{wallet_address}/stats")
async def get_user_stats(wallet_address: str, db: Session = Depends(get_db)):
    """Get user statistics based on wallet address"""
    try:
        # Get jobs as client
        client_jobs = db.query(Job).filter(Job.client_address == wallet_address.lower()).all()
        
        # Get jobs as freelancer
        freelancer_jobs = db.query(Job).filter(Job.freelancer_address == wallet_address.lower()).all()
        
        return {
            "jobs_posted": len(client_jobs),
            "jobs_completed": len([j for j in freelancer_jobs if j.status == "completed"]),
            "total_jobs": len(client_jobs) + len(freelancer_jobs)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
