import os
from decimal import Decimal
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Solian Wolves Welfare Management System API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database: Supports managed PostgreSQL (Supabase, Render, AWS RDS) or SQLite for zero-config testing
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./welfare_system.db")
    
    # Enterprise Bounded Connection Pool settings scaled for 50,000–100,000 members
    # In PostgreSQL, pair with PgBouncer transaction pooling for thousands of concurrent sessions
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "25"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "50"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "1800"))  # Recycle idle connections every 30m
    
    # Caching Layer (Redis in production, graceful in-memory TTL cache fallback in local/dev)
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "60"))
    
    # Financial Configuration
    CURRENCY: str = "KES"
    DEFAULT_OPENING_RESERVE: Decimal = Decimal(os.getenv("DEFAULT_OPENING_RESERVE", "200000.00"))
    APPROVAL_QUORUM: int = int(os.getenv("APPROVAL_QUORUM", "2"))
    
    # Batch Processing & High-Throughput Limits
    BATCH_IMPORT_CHUNK_SIZE: int = int(os.getenv("BATCH_IMPORT_CHUNK_SIZE", "500"))
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))
    
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
