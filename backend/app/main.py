"""
FastAPI Backend for Freelance Escrow Platform
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api.v1 import jobs, users, proposals, auth

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Freelance Escrow API...")
    print(f"📝 Environment: {settings.ENVIRONMENT}")
    print(f"🔗 Blockchain Network: {settings.CHAIN_NAME}")
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(proposals.router, prefix="/api/v1/proposals", tags=["Proposals"])

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
