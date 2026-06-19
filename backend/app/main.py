from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.routes import router as auth_router
from app.core.config import settings

app = FastAPI(
    title="AI-Powered Mock Interview Platform API",
    description="Backend API for managing user authentication, resume uploads, interview generation, and response evaluations.",
    version="1.0.0"
)

# Configure CORS Middleware
# Dynamically includes the deployed frontend URL alongside local dev origins
allowed_origins = [
    "http://localhost:5173",
    "http://localhost",
    "https://localhost",
]
# Add the production frontend URL if configured
if settings.FRONTEND_URL and settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
# All auth endpoints will be exposed under /api/auth/*
app.include_router(auth_router, prefix="/api")

@app.get("/", tags=["Root"])
async def root():
    """Health check and navigation API endpoint."""
    return {
        "message": "Welcome to the AI-Powered Mock Interview API",
        "docs_url": "/docs",
        "status": "healthy"
    }
