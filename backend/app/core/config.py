import os
from decimal import Decimal
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Solian Wolves Welfare Management System API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database: Supports managed PostgreSQL (Supabase, Render, AWS RDS) or SQLite for zero-config testing
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./welfare_system.db")
    
    # Bounded Connection Pool settings for 100-1,000 simultaneous members
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    
    # Financial Configuration
    CURRENCY: str = "KES"
    DEFAULT_OPENING_RESERVE: Decimal = Decimal(os.getenv("DEFAULT_OPENING_RESERVE", "200000.00"))
    APPROVAL_QUORUM: int = int(os.getenv("APPROVAL_QUORUM", "2"))
    
    # Security & JWT Tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "solian-wolves-secure-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours
    
    # CORS Origins for production deployment
    CORS_ORIGINS: List[str] = [
        "*",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://solian-wolves.vercel.app",
        "https://welfare-management-system.vercel.app"
    ]

    class Config:
        case_sensitive = True
        extra = "ignore"

settings = Settings()
