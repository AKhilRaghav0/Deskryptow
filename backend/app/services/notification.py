"""
Notification service for creating and managing notifications
"""

from sqlalchemy.orm import Session
from app.database import Notification, Job, Proposal, User
from typing import Optional
import uuid
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for creating and managing notifications"""
    
    @staticmethod
    def create_notification(
        db: Session,
        user_address: str,
        notification_type: str,
        title: str,
        message: str,
        related_job_id: Optional[str] = None,
        related_proposal_id: Optional[str] = None
    ) -> Notification:
        """Create a new notification"""
        try:
            notification = Notification(
                id=str(uuid.uuid4()),
                user_address=user_address.lower(),
                type=notification_type,
                title=title,
                message=message,
                related_job_id=related_job_id,
                related_proposal_id=related_proposal_id,
                is_read=False
            )
            
            db.add(notification)
            db.commit()
            db.refresh(notification)
            
            logger.info(f"Notification created: {notification_type} for {user_address}")
            return notification
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def notify_proposal_received(
        db: Session,
        job_id: str,
        proposal_id: str,
        freelancer_address: str
    ):
        """Notify job owner when a proposal is received"""
        try:
            # Get job details
            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                return
            
            # Get freelancer username
            freelancer = db.query(User).filter(User.wallet_address == freelancer_address.lower()).first()
            freelancer_name = freelancer.username if freelancer else freelancer_address[:10]
            
            NotificationService.create_notification(
                db=db,
                user_address=job.client_address,
                notification_type="proposal_received",
                title="New Proposal Received",
                message=f"{freelancer_name} submitted a proposal for your job: {job.title}",
                related_job_id=job_id,
                related_proposal_id=proposal_id
            )
        except Exception as e:
            logger.error(f"Error notifying proposal received: {e}")
    
    @staticmethod
    def notify_proposal_accepted(
        db: Session,
        proposal_id: str,
        job_id: str
    ):
        """Notify freelancer when their proposal is accepted"""
        try:
            # Get proposal and job details
            proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
            if not proposal:
                return
            
            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                return
            
            NotificationService.create_notification(
                db=db,
                user_address=proposal.freelancer_address,
                notification_type="proposal_accepted",
                title="Proposal Accepted! 🎉",
                message=f"Your proposal for '{job.title}' has been accepted! You can now start working on this job.",
                related_job_id=job_id,
                related_proposal_id=proposal_id
            )
        except Exception as e:
            logger.error(f"Error notifying proposal accepted: {e}")
    
    @staticmethod
    def notify_proposal_rejected(
        db: Session,
        proposal_id: str,
        job_id: str
    ):
        """Notify freelancer when their proposal is rejected"""
        try:
            # Get proposal and job details
            proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
            if not proposal:
                return
            
            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                return
            
            NotificationService.create_notification(
                db=db,
                user_address=proposal.freelancer_address,
                notification_type="proposal_rejected",
                title="Proposal Not Selected",
                message=f"Your proposal for '{job.title}' was not selected. Don't worry, keep applying to other opportunities!",
                related_job_id=job_id,
                related_proposal_id=proposal_id
            )
        except Exception as e:
            logger.error(f"Error notifying proposal rejected: {e}")

# Singleton instance
notification_service = NotificationService()

