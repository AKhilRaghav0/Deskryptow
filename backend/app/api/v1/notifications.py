"""
Notification endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging

from app.models import NotificationResponse, NotificationCountResponse
from app.database import get_db, Notification

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    user_address: str = Query(...),
    unread_only: bool = Query(False, description="Filter to unread notifications only"),
    limit: int = Query(50, le=100, description="Maximum number of notifications"),
    db: Session = Depends(get_db)
):
    """Get notifications for a user"""
    try:
        query = db.query(Notification).filter(
            Notification.user_address == user_address.lower()
        )
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        notifications = query.order_by(desc(Notification.created_at)).limit(limit).all()
        
        return [
            NotificationResponse(
                id=n.id,
                user_address=n.user_address,
                type=n.type,
                title=n.title,
                message=n.message,
                related_job_id=n.related_job_id,
                related_proposal_id=n.related_proposal_id,
                is_read=n.is_read,
                created_at=n.created_at
            )
            for n in notifications
        ]
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/count", response_model=NotificationCountResponse)
async def get_notification_count(
    user_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Get notification count for a user"""
    try:
        total_count = db.query(Notification).filter(
            Notification.user_address == user_address.lower()
        ).count()
        
        unread_count = db.query(Notification).filter(
            Notification.user_address == user_address.lower(),
            Notification.is_read == False
        ).count()
        
        return NotificationCountResponse(
            unread_count=unread_count,
            total_count=total_count
        )
    except Exception as e:
        logger.error(f"Error getting notification count: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    try:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_address == user_address.lower()
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.is_read = True
        db.commit()
        
        return {"message": "Notification marked as read", "notification_id": notification_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/read-all")
async def mark_all_notifications_read(
    user_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for a user"""
    try:
        db.query(Notification).filter(
            Notification.user_address == user_address.lower(),
            Notification.is_read == False
        ).update({"is_read": True})
        
        db.commit()
        
        return {"message": "All notifications marked as read"}
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

