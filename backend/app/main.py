from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from contextlib import asynccontextmanager

from .core.config import settings
from .db.session import engine, Base, SessionLocal
from .db.init_db import init_db
from .api.v1 import auth, users, members, contributions, welfare, disbursements, treasury, reports, audit, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database Schema & Seed Initial Records
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade modular FastAPI backend for Solian Wolves Welfare Management System (WMS). Features PostgreSQL connection pooling, fixed-precision Decimal financial ledger, double-spend prevention, and tamper-evident audit logging.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware for React frontend and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Versioned API Routers (/api/v1)
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(members.router, prefix=api_prefix)
app.include_router(contributions.router, prefix=api_prefix)
app.include_router(welfare.router, prefix=api_prefix)
app.include_router(disbursements.router, prefix=api_prefix)
app.include_router(treasury.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)

# Backward-compatibility alias for unversioned /api endpoints
app.include_router(members.router, prefix="/api")
app.include_router(contributions.router, prefix="/api")
app.include_router(welfare.router, prefix="/api")
app.include_router(treasury.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(audit.router, prefix="/api")

@app.get("/", tags=["Health & Status"])
def root_status():
    return {
        "system": settings.PROJECT_NAME,
        "status": "online",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "documentation": "/docs",
        "api_v1": {
            "auth": f"{api_prefix}/auth",
            "users": f"{api_prefix}/users",
            "members": f"{api_prefix}/members",
            "contributions": f"{api_prefix}/contributions",
            "welfare": f"{api_prefix}/welfare",
            "disbursements": f"{api_prefix}/disbursements",
            "treasury_reconciliation": f"{api_prefix}/treasury/reconciliation",
            "treasury_ledger": f"{api_prefix}/treasury/ledger",
            "reports_summary": f"{api_prefix}/reports/summary",
            "audit_trail": f"{api_prefix}/audit"
        }
    }

@app.get("/health", tags=["Health & Status"])
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "currency": settings.CURRENCY
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
