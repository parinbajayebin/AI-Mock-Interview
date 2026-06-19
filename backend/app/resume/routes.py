from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import json

from app.core.database import get_db
from app.schemas.resume import ResumeResponse
from app.repositories.resume_repository import ResumeRepository
from app.services.resume_service import upload_resume_to_storage, extract_text_from_pdf
from app.auth.routes import get_current_user
from app.models.user import User

from app.services.ai_service import analyze_resume_text

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_bytes = await file.read()
    
    # 1. Upload to Supabase Storage
    file_path = await upload_resume_to_storage(current_user.id, file.filename, file_bytes)

    # 2. Extract text locally
    try:
        raw_text = extract_text_from_pdf(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF text: {str(e)}")

    # 3. Analyze text using Gemini 3.5 Flash
    analysis = await analyze_resume_text(raw_text)

    # 4. Create database entry with parsed AI features
    repo = ResumeRepository(db)
    resume = await repo.create(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        raw_text=raw_text,
        skills=analysis.get("skills", []),
        experience_summary=analysis.get("experience_summary", ""),
        parsed_metadata=analysis.get("parsed_metadata", {})
    )

    return resume

@router.get("", response_model=list[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo = ResumeRepository(db)
    resumes = await repo.get_by_user_id(current_user.id)
    return resumes

