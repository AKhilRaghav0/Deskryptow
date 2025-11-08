"""
Configuration settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # GCP
    GCP_PROJECT_ID: str = ""
    GCP_REGION: str = "us-central1"
    GCP_BUCKET_NAME: str = ""
    FIRESTORE_DATABASE_ID: str = "(default)"
    
    # Blockchain
    MUMBAI_RPC_URL: str = "https://rpc-mumbai.maticvigil.com"
    CHAIN_ID: int = 80001
    CHAIN_NAME: str = "Polygon Mumbai"
    ESCROW_CONTRACT_ADDRESS: str = ""
    
    # Security
    JWT_SECRET_KEY: str = "your-secret-key-change-this"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 1 week
    
    class Config:
        env_file = "../.env"
        case_sensitive = True

settings = Settings()
