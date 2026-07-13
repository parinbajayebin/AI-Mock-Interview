from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.routes import router as auth_router
from app.resume.routes import router as resume_router
from app.interview.routes import router as interview_router
from app.analytics.routes import router as analytics_router
from app.payments.routes import router as payments_router
from app.ats.routes import router as ats_router
from app.core.config import settings

app = FastAPI(
    title="AI-Powered Mock Interview Platform API",
    description="Backend API for managing user authentication, resume uploads, interview generation, and response evaluations.",
    version="1.0.0"
)

# Configure CORS Middleware
# Allow all origins temporarily for easy deployment and testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
# All auth endpoints will be exposed under /api/auth/*
app.include_router(auth_router, prefix="/api")
app.include_router(resume_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(ats_router, prefix="/api")

@app.get("/", tags=["Root"])
async def root():
    """Health check and navigation API endpoint."""
    return {
        "message": "Welcome to the AI-Powered Mock Interview API",
        "docs_url": "/docs",
        "status": "healthy"
    }
