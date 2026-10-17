"""
PortfoliX FastAPI Application Entrypoint.
Initializes database, CORS, route handlers, and health endpoints.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import models  # noqa: F401  (ensures User and Holding tables are registered)
from backend.database import Base, engine
from backend.routers import auth, holdings, risk

from backend.routers import ws

# Initialize SQLite tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PortfoliX — Portfolio Risk Dashboard API",
    description="Quantitative risk analytics engine for Indian stock portfolios (NSE/BSE) using live market data.",
    version="1.0.0",
)
app.include_router(ws.router)

# Configure CORS for local dev, Vercel preview/production deployments, and custom domains
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000",
]

env_origins = os.getenv("CORS_ORIGINS", "")
if env_origins:
    origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if env_origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app" if not env_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(holdings.router)
app.include_router(risk.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": "PortfoliX API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}