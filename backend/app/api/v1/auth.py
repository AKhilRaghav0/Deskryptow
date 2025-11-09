"""
Authentication endpoints with PostgreSQL
"""

from fastapi import APIRouter, HTTPException, Depends
from web3 import Web3
from datetime import datetime, timedelta
from jose import jwt
from sqlalchemy.orm import Session

from app.models import WalletAuthRequest, TokenResponse, UserProfile
from app.config import settings
from app.database import get_db, User

router = APIRouter()

@router.post("/wallet-login", response_model=TokenResponse)
async def wallet_login(
    auth_request: WalletAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with MetaMask wallet signature
    Creates user if doesn't exist (using wallet address as primary key)
    """
    try:
        # Verify signature using MetaMask's message format (EIP-191)
        w3 = Web3()
        
        # MetaMask signs messages with the standard Ethereum message prefix
        # Format: "\x19Ethereum Signed Message:\n" + len(message) + message
        try:
            # Use the standard message recovery method for MetaMask signatures
            from eth_account.messages import encode_defunct
            message_encoded = encode_defunct(text=auth_request.message)
            recovered_address = w3.eth.account.recover_message(
                message_encoded,
                signature=auth_request.signature
            )
        except Exception as e:
            # Fallback: try alternative recovery methods
            try:
                # Try direct message recovery
                recovered_address = w3.eth.account.recover_message(
                    text=auth_request.message,
                    signature=auth_request.signature
                )
            except Exception as e2:
                # Last resort: hash-based recovery (may not work with MetaMask)
                try:
                    message_hash = w3.keccak(text=auth_request.message)
                    recovered_address = w3.eth.account.recoverHash(
                        message_hash,
                        signature=auth_request.signature
                    )
                except Exception as e3:
                    raise HTTPException(
                        status_code=401, 
                        detail=f"Signature verification failed: {str(e3)}"
                    )
        
        # Normalize addresses for comparison
        recovered_address_lower = recovered_address.lower()
        wallet_address_lower = auth_request.wallet_address.lower()
        
        if recovered_address_lower != wallet_address_lower:
            raise HTTPException(
                status_code=401, 
                detail=f"Invalid signature: recovered address does not match"
            )
        
        wallet_address = wallet_address_lower
        
        # Check if user exists, create if not (using wallet address as primary key)
        try:
            user = db.query(User).filter(User.wallet_address == wallet_address).first()
            
            if not user:
                # Create new user with wallet address as primary key
                # Use hex part without 0x prefix for username
                username_hex = wallet_address[2:10] if wallet_address.startswith('0x') else wallet_address[:8]
                user = User(
                    wallet_address=wallet_address,
                    username=f"User_{username_hex}",
                    role="both"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Database error while creating/fetching user: {str(e)}"
            )
        
        # Generate JWT token
        try:
            token_data = {
                "sub": wallet_address,
                "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            }
            access_token = jwt.encode(
                token_data,
                settings.JWT_SECRET_KEY,
                algorithm=settings.JWT_ALGORITHM
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Token generation failed: {str(e)}"
            )
        
        return TokenResponse(
            access_token=access_token,
            wallet_address=wallet_address
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = str(e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Authentication failed: {error_detail}")

@router.get("/nonce/{wallet_address}")
async def get_nonce(wallet_address: str):
    """
    Get nonce for wallet signature
    """
    nonce = f"Sign this message to authenticate with Freelance Escrow Platform.\n\nWallet: {wallet_address}\nNonce: {datetime.utcnow().isoformat()}"
    return {"nonce": nonce}
