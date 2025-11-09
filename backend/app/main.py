"""
FastAPI Backend for Freelance Escrow Platform
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api.v1 import jobs, users, proposals, auth, search, notifications, chat
from app.database import init_db, init_redis

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Freelance Escrow API...")
    print(f"📝 Environment: {settings.ENVIRONMENT}")
    print(f"🔗 Blockchain Network: {settings.CHAIN_NAME}")
    
    # Initialize databases
    try:
        init_db()
        print("✅ PostgreSQL initialized")
    except Exception as e:
        print(f"⚠️ PostgreSQL initialization failed: {e}")
    
    try:
        init_redis()
    except Exception as e:
        print(f"⚠️ Redis initialization failed: {e}")
    
    yield
    # Shutdown
    print("👋 Shutting down API...")

# Create FastAPI app
app = FastAPI(
    title="Freelance Escrow API",
    description="Backend API for decentralized freelance escrow platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware - Allow local network access
# For development, allow all origins from local network
import re
def is_local_network(origin: str) -> bool:
    """Check if origin is from local network"""
    if not origin:
        return False
    # Allow localhost
    if origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1"):
        return True
    # Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    local_patterns = [
        r"^http://192\.168\.\d+\.\d+:\d+$",
        r"^http://10\.\d+\.\d+\.\d+:\d+$",
        r"^http://172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$",
    ]
    return any(re.match(pattern, origin) for pattern in local_patterns)

# In development, allow all local network origins (any port)
cors_origins = settings.CORS_ORIGINS.copy()
if settings.ENVIRONMENT == "development":
    # Allow any local network origin with any port
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(proposals.router, prefix="/api/v1/proposals", tags=["Proposals"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Freelance Escrow API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }
