import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Solian Wolves Welfare Management System API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database: defaults to SQLite for local zero-config, or PostgreSQL in production via DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./welfare_system.db")
    
    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "*",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

    class Config:
        case_sensitive = True

settings = Settings()
