from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os

from .routers import members, contributions, welfare, finance, stats
from .core.config import settings

app = FastAPI(
    title="Solian Wolves Welfare Management System API",
    version="1.0.0",
    description="Backend REST API for Solian Wolves Welfare Management System (WMS) handling members register, external payment recordings, financial reconciliation, and welfare claims.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware for seamless Vercel / local frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(members.router, prefix="/api")
app.include_router(contributions.router, prefix="/api")
app.include_router(welfare.router, prefix="/api")
app.include_router(finance.router, prefix="/api")
app.include_router(stats.router, prefix="/api")

@app.get("/", tags=["Health & Status"])
def root_status():
    return {
        "system": "Solian Wolves Welfare Management System (WMS)",
        "status": "online",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "documentation": "/docs",
        "portal_endpoints": {
            "members": "/api/members",
            "contributions": "/api/contributions",
            "welfare": "/api/welfare",
            "finance": "/api/finance",
            "stats": "/api/stats",
            "reconciliation": "/api/finance/reconciliation"
        }
    }

@app.get("/health", tags=["Health & Status"])
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
