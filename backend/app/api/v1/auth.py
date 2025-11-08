"""
Authentication endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from web3 import Web3
from datetime import datetime, timedelta
from jose import jwt

from app.models import WalletAuthRequest, TokenResponse, UserProfile
from app.config import settings
from app.database import db, USERS_COLLECTION

router = APIRouter()

@router.post("/wallet-login", response_model=TokenResponse)
async def wallet_login(auth_request: WalletAuthRequest):
    """
    Authenticate user with MetaMask wallet signature
    """
    try:
        # Verify signature
        w3 = Web3()
        message_hash = w3.keccak(text=auth_request.message)
        recovered_address = w3.eth.account.recoverHash(
            message_hash,
            signature=auth_request.signature
        )
        
        if recovered_address.lower() != auth_request.wallet_address.lower():
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Check if user exists, create if not
        user_ref = db.collection(USERS_COLLECTION).document(auth_request.wallet_address.lower())
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            # Create new user
            user_data = {
                "wallet_address": auth_request.wallet_address.lower(),
                "username": f"User_{auth_request.wallet_address[:8]}",
                "role": "both",
                "reputation_score": 0.0,
                "jobs_completed": 0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            user_ref.set(user_data)
        
        # Generate JWT token
        token_data = {
            "sub": auth_request.wallet_address.lower(),
            "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        access_token = jwt.encode(
            token_data,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        
        return TokenResponse(
            access_token=access_token,
            wallet_address=auth_request.wallet_address.lower()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nonce/{wallet_address}")
async def get_nonce(wallet_address: str):
    """
    Get nonce for wallet signature
    """
    nonce = f"Sign this message to authenticate with Freelance Escrow Platform.\n\nWallet: {wallet_address}\nNonce: {datetime.utcnow().isoformat()}"
    return {"nonce": nonce}
