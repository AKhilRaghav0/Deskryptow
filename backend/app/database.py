"""
Database connections: PostgreSQL and Redis
"""

from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Boolean, Text, ARRAY, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import redis
from typing import Optional

from app.config import settings

# PostgreSQL Setup
DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=settings.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis Setup
redis_client: Optional[redis.Redis] = None

def init_redis():
    """Initialize Redis connection"""
    global redis_client
    try:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True,
            socket_connect_timeout=5
        )
        redis_client.ping()
        print("✅ Redis connected successfully")
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}")
        redis_client = None

def get_redis() -> Optional[redis.Redis]:
    """Get Redis client"""
    return redis_client

# Database Models
class User(Base):
    __tablename__ = "users"
    
    wallet_address = Column(String(42), primary_key=True, index=True)  # Ethereum address
    username = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    role = Column(String(20), default="both")  # client, freelancer, both
    bio = Column(Text, nullable=True)
    skills = Column(ARRAY(String), default=[])
    portfolio_url = Column(String(500), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    reputation_score = Column(Float, default=0.0)
    jobs_completed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    jobs_posted = relationship("Job", back_populates="client", foreign_keys="Job.client_address")
    jobs_accepted = relationship("Job", back_populates="freelancer", foreign_keys="Job.freelancer_address")
    proposals = relationship("Proposal", back_populates="freelancer")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    client_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False, index=True)
    freelancer_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    skills_required = Column(ARRAY(String), default=[])
    tags = Column(ARRAY(String), default=[])  # New tags field
    budget = Column(Float, nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="open", index=True)  # open, in_progress, submitted, completed, disputed, cancelled, refunded
    ipfs_hash = Column(String(255), nullable=True)
    blockchain_job_id = Column(Integer, nullable=True, index=True)
    deliverable_url = Column(String(500), nullable=True)
    client_confirmed_completion = Column(Boolean, default=False)  # Client confirms job is done
    freelancer_confirmed_completion = Column(Boolean, default=False)  # Freelancer confirms job is done
    escrow_address = Column(String(42), nullable=True, index=True)  # Optional escrow address
    allow_escrow_revert = Column(Boolean, default=False)  # Allow escrow to revert if no work done
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    proposal_count = Column(Integer, default=0)
    
    # Relationships
    client = relationship("User", foreign_keys=[client_address], back_populates="jobs_posted")
    freelancer = relationship("User", foreign_keys=[freelancer_address], back_populates="jobs_accepted")
    proposals = relationship("Proposal", back_populates="job", cascade="all, delete-orphan")

class Proposal(Base):
    __tablename__ = "proposals"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False, index=True)
    freelancer_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False, index=True)
    cover_letter = Column(Text, nullable=False)
    proposed_timeline = Column(String(255), nullable=False)
    portfolio_links = Column(ARRAY(String), default=[])
    status = Column(String(20), default="pending", index=True)  # pending, accepted, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    job = relationship("Job", back_populates="proposals")
    freelancer = relationship("User", back_populates="proposals")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # proposal_received, proposal_accepted, proposal_rejected, job_accepted, etc.
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    related_job_id = Column(String(36), ForeignKey("jobs.id"), nullable=True)
    related_proposal_id = Column(String(36), ForeignKey("proposals.id"), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_address])
    job = relationship("Job", foreign_keys=[related_job_id])
    proposal = relationship("Proposal", foreign_keys=[related_proposal_id])

class SavedJob(Base):
    __tablename__ = "saved_jobs"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_address])
    job = relationship("Job", foreign_keys=[job_id])
    
    # Unique constraint: one user can save a job only once
    __table_args__ = (
        UniqueConstraint('user_address', 'job_id', name='unique_user_saved_job'),
    )

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    participant1_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False, index=True)
    participant2_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=True, index=True)  # Optional: link to job
    last_message_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    participant1 = relationship("User", foreign_keys=[participant1_address])
    participant2 = relationship("User", foreign_keys=[participant2_address])
    job = relationship("Job", foreign_keys=[job_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    
    # Unique constraint: one conversation per pair of users per job
    __table_args__ = (
        UniqueConstraint('participant1_address', 'participant2_address', 'job_id', name='unique_conversation'),
    )

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    sender_address = Column(String(42), ForeignKey("users.wallet_address"), nullable=False, index=True)
    content = Column(Text, nullable=True)  # Nullable if it's a file-only message
    message_type = Column(String(20), default="text", index=True)  # text, image, file
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_address])
    attachments = relationship("MessageAttachment", back_populates="message", cascade="all, delete-orphan")

class MessageAttachment(Base):
    __tablename__ = "message_attachments"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    message_id = Column(String(36), ForeignKey("messages.id"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)  # image/jpeg, application/pdf, etc.
    file_size = Column(Integer, nullable=False)  # in bytes
    file_url = Column(String(500), nullable=False)  # URL to stored file
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    message = relationship("Message", back_populates="attachments")

# Dependency for getting database session
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database
def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
