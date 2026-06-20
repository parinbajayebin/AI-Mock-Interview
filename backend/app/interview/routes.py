from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.schemas.interview import InterviewCreate, InterviewResponse
from app.schemas.response import AnswerSubmit, ResponseDetail
from app.repositories.interview_repository import InterviewRepository
from app.repositories.resume_repository import ResumeRepository
from app.repositories.response_repository import ResponseRepository
from app.services.ai_service import generate_interview_questions
from app.auth.routes import get_current_user
from app.models.user import User

router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    payload: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new mock interview session, invokes Gemini to generate 5 questions,
    and stores both the interview and the questions in the database.
    """
    resume_text = None
    if payload.resume_id:
        resume_repo = ResumeRepository(db)
        resume = await resume_repo.get_by_id(payload.resume_id)
        if not resume or resume.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found or access denied"
            )
        resume_text = resume.raw_text

    # 1. Fetch past question texts to avoid repetitions
    interview_repo = InterviewRepository(db)
    past_questions = await interview_repo.get_past_question_texts(current_user.id, payload.role)

    # 2. Ask Gemini to generate 5 challenging questions
    questions_data = await generate_interview_questions(
        role=payload.role,
        difficulty=payload.difficulty,
        resume_text=resume_text,
        past_questions=past_questions
    )

    if not questions_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate interview questions"
        )

    # 3. Persist the interview and questions in database
    interview = await interview_repo.create(
        user_id=current_user.id,
        role=payload.role,
        difficulty=payload.difficulty,
        resume_id=payload.resume_id,
        questions_data=questions_data
    )

    return interview

@router.get("", response_model=list[InterviewResponse])
async def list_interviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all mock interview sessions taken by the current user.
    """
    repo = InterviewRepository(db)
    interviews = await repo.get_user_interviews(current_user.id)
    return interviews

@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves details of a specific mock interview session.
    """
    repo = InterviewRepository(db)
    interview = await repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found"
        )
    if interview.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this interview session is denied"
        )
    return interview

@router.post("/{interview_id}/questions/{question_id}/answer", response_model=ResponseDetail, status_code=status.HTTP_201_CREATED)
async def submit_question_answer(
    interview_id: uuid.UUID,
    question_id: uuid.UUID,
    payload: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits or updates the candidate's answer and duration for a specific question
    within an active mock interview session.
    """
    response_repo = ResponseRepository(db)
    
    # 1. Verify question belongs to the interview, and interview belongs to the current user
    has_ownership = await response_repo.verify_question_ownership(
        user_id=current_user.id,
        interview_id=interview_id,
        question_id=question_id
    )
    if not has_ownership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found in this interview or access denied."
        )

    # 2. Save/update the response record
    response_rec = await response_repo.save_response(
        question_id=question_id,
        user_answer=payload.user_answer,
        duration_seconds=payload.duration_seconds
    )
    
    return response_rec

@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes an interview session and all associated questions/responses.
    """
    repo = InterviewRepository(db)
    interview = await repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found"
        )
    if interview.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this interview session is denied"
        )
    await db.delete(interview)
    await db.commit()

