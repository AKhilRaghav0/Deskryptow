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
    
    # CORS - Allow localhost and local network access
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        # Allow local network (192.168.x.x and 10.x.x.x ranges)
        "http://192.168.0.0/16:3000",
        "http://192.168.0.0/16:5173",
        "http://10.0.0.0/8:3000",
        "http://10.0.0.0/8:5173",
    ]
    
    # PostgreSQL
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "deskryptow"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # Blockchain - Polygon Amoy Testnet
    POLYGON_RPC_URL: str = "https://rpc-amoy.polygon.technology"
    CHAIN_ID: int = 80002
    CHAIN_NAME: str = "Polygon Amoy"
    ESCROW_CONTRACT_ADDRESS: str = os.getenv("ESCROW_CONTRACT_ADDRESS", "")
    BLOCK_EXPLORER: str = "https://amoy.polygonscan.com"
    
    # Escrow Configuration
    # Only this address should show the escrow dashboard interface
    # Linux 2 address: 0xac654e9fec92194800a79f4fa479c7045c107b2a
    DESIGNATED_ESCROW_ADDRESS: str = os.getenv("DESIGNATED_ESCROW_ADDRESS", "0xac654e9fec92194800a79f4fa479c7045c107b2a").lower()
    
    # IPFS Configuration
    # Pinata (recommended - free tier available at https://pinata.cloud)
    PINATA_API_KEY: str = os.getenv("PINATA_API_KEY", "")
    PINATA_SECRET_KEY: str = os.getenv("PINATA_SECRET_KEY", "")
    PINATA_GATEWAY: str = "https://gateway.pinata.cloud/ipfs/"
    
    # Infura IPFS (alternative)
    INFURA_PROJECT_ID: str = ""
    INFURA_SECRET: str = ""
    INFURA_GATEWAY: str = "https://ipfs.infura.io/ipfs/"
    
    # Web3.Storage (alternative)
    WEB3_STORAGE_TOKEN: str = ""
    
    # Security
    JWT_SECRET_KEY: str = "your-secret-key-change-this"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 1 week
    
    class Config:
        env_file = "../.env"
        case_sensitive = True

settings = Settings()
