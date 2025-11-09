"""
Chat endpoints for messaging between users
"""

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from datetime import datetime
import uuid
import logging
import os
import shutil
from pathlib import Path

from app.database import get_db, Conversation, Message, MessageAttachment, User, Job
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

# File upload directory
UPLOAD_DIR = Path("uploads/chat")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Response models
class MessageAttachmentResponse(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_size: int
    file_url: str
    created_at: datetime

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_address: str
    sender_username: Optional[str] = None
    content: Optional[str] = None
    message_type: str
    is_read: bool
    created_at: datetime
    attachments: List[MessageAttachmentResponse] = []

class ConversationResponse(BaseModel):
    id: str
    participant1_address: str
    participant2_address: str
    participant1_username: Optional[str] = None
    participant2_username: Optional[str] = None
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    last_message_at: datetime
    last_message_preview: Optional[str] = None
    unread_count: int = 0
    created_at: datetime

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    user_address: str = Query(...),
    db: Session = Depends(get_db)
):
    """Get all conversations for a user"""
    try:
        conversations = db.query(Conversation).filter(
            or_(
                Conversation.participant1_address == user_address.lower(),
                Conversation.participant2_address == user_address.lower()
            )
        ).order_by(desc(Conversation.last_message_at)).all()
        
        result = []
        for conv in conversations:
            # Get other participant
            other_address = conv.participant2_address if conv.participant1_address.lower() == user_address.lower() else conv.participant1_address
            other_user = db.query(User).filter(User.wallet_address == other_address.lower()).first()
            
            # Get last message
            last_message = db.query(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(desc(Message.created_at)).first()
            
            # Get unread count
            unread_count = db.query(Message).filter(
                Message.conversation_id == conv.id,
                Message.sender_address != user_address.lower(),
                Message.is_read == False
            ).count()
            
            result.append(ConversationResponse(
                id=conv.id,
                participant1_address=conv.participant1_address,
                participant2_address=conv.participant2_address,
                participant1_username=conv.participant1.username if conv.participant1 else None,
                participant2_username=conv.participant2.username if conv.participant2 else None,
                job_id=conv.job_id,
                job_title=conv.job.title if conv.job else None,
                last_message_at=conv.last_message_at,
                last_message_preview=last_message.content[:100] if last_message and last_message.content else None,
                unread_count=unread_count,
                created_at=conv.created_at
            ))
        
        return result
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    user_address: str = Query(...),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Get messages for a conversation"""
    try:
        # Verify user is part of conversation
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conversation.participant1_address.lower() != user_address.lower() and conversation.participant2_address.lower() != user_address.lower():
            raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
        
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(desc(Message.created_at)).limit(limit).all()
        
        # Mark messages as read
        db.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.sender_address != user_address.lower(),
            Message.is_read == False
        ).update({"is_read": True})
        db.commit()
        
        result = []
        for msg in reversed(messages):  # Reverse to show oldest first
            sender = db.query(User).filter(User.wallet_address == msg.sender_address.lower()).first()
            attachments = db.query(MessageAttachment).filter(
                MessageAttachment.message_id == msg.id
            ).all()
            
            result.append(MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                sender_address=msg.sender_address,
                sender_username=sender.username if sender else None,
                content=msg.content,
                message_type=msg.message_type,
                is_read=msg.is_read,
                created_at=msg.created_at,
                attachments=[
                    MessageAttachmentResponse(
                        id=att.id,
                        file_name=att.file_name,
                        file_type=att.file_type,
                        file_size=att.file_size,
                        file_url=att.file_url,
                        created_at=att.created_at
                    ) for att in attachments
                ]
            ))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/conversations")
async def create_or_get_conversation(
    participant1_address: str = Query(...),
    participant2_address: str = Query(...),
    job_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Create or get existing conversation"""
    try:
        # Normalize addresses
        p1 = participant1_address.lower()
        p2 = participant2_address.lower()
        
        # Ensure p1 < p2 for consistency
        if p1 > p2:
            p1, p2 = p2, p1
        
        # Check if conversation exists
        conversation = db.query(Conversation).filter(
            and_(
                Conversation.participant1_address == p1,
                Conversation.participant2_address == p2,
                Conversation.job_id == job_id
            )
        ).first()
        
        if conversation:
            return {"conversation_id": conversation.id, "created": False}
        
        # Create new conversation
        conversation_id = str(uuid.uuid4())
        conversation = Conversation(
            id=conversation_id,
            participant1_address=p1,
            participant2_address=p2,
            job_id=job_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        return {"conversation_id": conversation.id, "created": True}
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/messages")
async def send_message(
    conversation_id: str = Form(...),
    sender_address: str = Form(...),
    content: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    """Send a message with optional file attachments"""
    try:
        # Verify conversation exists and user is part of it
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        sender_lower = sender_address.lower()
        if conversation.participant1_address.lower() != sender_lower and conversation.participant2_address.lower() != sender_lower:
            raise HTTPException(status_code=403, detail="Not authorized to send messages in this conversation")
        
        # Determine message type
        message_type = "text"
        if files:
            if any(f.content_type and f.content_type.startswith("image/") for f in files):
                message_type = "image"
            else:
                message_type = "file"
        
        # Create message
        message_id = str(uuid.uuid4())
        message = Message(
            id=message_id,
            conversation_id=conversation_id,
            sender_address=sender_lower,
            content=content,
            message_type=message_type
        )
        db.add(message)
        db.flush()
        
        # Handle file uploads
        attachments = []
        if files:
            for file in files:
                if file.filename:
                    # Generate unique filename
                    file_ext = Path(file.filename).suffix
                    file_id = str(uuid.uuid4())
                    file_path = UPLOAD_DIR / f"{file_id}{file_ext}"
                    
                    # Save file
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)
                    
                    # Create attachment record
                    attachment_id = str(uuid.uuid4())
                    attachment = MessageAttachment(
                        id=attachment_id,
                        message_id=message_id,
                        file_name=file.filename,
                        file_type=file.content_type or "application/octet-stream",
                        file_size=file_path.stat().st_size,
                        file_url=f"/api/v1/chat/files/{file_id}{file_ext}"
                    )
                    db.add(attachment)
                    attachments.append(attachment)
        
        # Update conversation last_message_at
        from sqlalchemy.sql import func
        conversation.last_message_at = datetime.utcnow()
        
        db.commit()
        db.refresh(message)
        
        return {
            "message_id": message.id,
            "conversation_id": conversation_id,
            "created_at": message.created_at
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files/{filename}")
async def get_file(filename: str):
    """Serve uploaded files"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path)

