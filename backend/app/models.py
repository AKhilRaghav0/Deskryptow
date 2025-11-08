"""
Pydantic models for request/response
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class JobStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    COMPLETED = "completed"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class ProposalStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class UserRole(str, Enum):
    CLIENT = "client"
    FREELANCER = "freelancer"
    BOTH = "both"

# User Models
class UserCreate(BaseModel):
    wallet_address: str
    username: str
    email: Optional[str] = None
    role: UserRole = UserRole.BOTH

class UserProfile(BaseModel):
    wallet_address: str
    username: str
    email: Optional[str] = None
    role: UserRole
    bio: Optional[str] = None
    skills: List[str] = []
    portfolio_url: Optional[str] = None
    avatar_url: Optional[str] = None
    reputation_score: float = 0.0
    jobs_completed: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Job Models
class JobCreate(BaseModel):
    title: str
    description: str
    category: str
    skills_required: List[str]
    budget: float
    deadline: datetime
    ipfs_hash: Optional[str] = None

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    skills_required: Optional[List[str]] = None
    budget: Optional[float] = None
    deadline: Optional[datetime] = None

class JobResponse(BaseModel):
    id: str
    client_address: str
    freelancer_address: Optional[str] = None
    title: str
    description: str
    category: str
    skills_required: List[str]
    budget: float
    deadline: datetime
    status: JobStatus
    ipfs_hash: Optional[str] = None
    blockchain_job_id: Optional[int] = None
    deliverable_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    proposal_count: int = 0

    model_config = ConfigDict(from_attributes=True)

# Proposal Models
class ProposalCreate(BaseModel):
    job_id: str
    cover_letter: str
    proposed_timeline: str
    portfolio_links: List[str] = []

class ProposalResponse(BaseModel):
    id: str
    job_id: str
    freelancer_address: str
    cover_letter: str
    proposed_timeline: str
    portfolio_links: List[str]
    status: ProposalStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Auth Models
class WalletAuthRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    wallet_address: str

# File Upload Models
class FileUploadResponse(BaseModel):
    url: str
    filename: str
    size: int
    content_type: str

# Transaction Models
class TransactionResponse(BaseModel):
    tx_hash: str
    from_address: str
    to_address: str
    value: float
    status: str
    block_number: Optional[int] = None
    timestamp: Optional[datetime] = None
