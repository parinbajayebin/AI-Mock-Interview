from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from typing import Optional

from app.core.database import get_db
from app.schemas.interview import InterviewCreate, InterviewResponse
from app.schemas.response import AnswerSubmit, ResponseDetail
from app.repositories.interview_repository import InterviewRepository
from app.repositories.resume_repository import ResumeRepository
from app.repositories.response_repository import ResponseRepository
from app.services.ai_service import generate_interview_questions, evaluate_interview_responses
from app.auth.routes import get_current_user
from app.models.user import User
from app.core.dependencies import get_byok_keys
from app.schemas.byok import UserAPIKeys

router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.post("/validate-key")
async def validate_byok_key(
    user_keys: UserAPIKeys = Depends(get_byok_keys),
    current_user: User = Depends(get_current_user)
):
    """
    Validates if the user-supplied API key is legitimate by making a micro test request to the specified provider.
    """
    if user_keys.provider == "default":
        return {"valid": True, "message": "Using Host Credits"}
        
    # Import locally to avoid circular dependencies
    from app.services.ai_service import _call_llm_json
    
    test_prompt = "Respond with a single JSON containing key 'status' and value 'ok'"
    system_instruction = "You are a test validator. You must output valid JSON."
    
    try:
        res = await _call_llm_json(
            prompt=test_prompt,
            system_instruction=system_instruction,
            user_keys=user_keys
        )
        if res and isinstance(res, dict) and "status" in res:
            return {"valid": True, "message": f"Successfully verified {user_keys.provider} API key"}
        else:
            raise ValueError("Provider did not return expected response structure")
    except Exception as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=400,
            detail=error_msg
        )

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    payload: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    user_keys: UserAPIKeys = Depends(get_byok_keys)
):
    """
    Creates a new mock interview session, invokes Gemini/OpenAI to generate 5 questions,
    and stores both the interview and the questions in the database.
    """
    # 1. Check if user is using host's key and has exceeded the free limit of 2 interviews
    interview_repo = InterviewRepository(db)
    if user_keys.provider == "default":
        usage_count = await interview_repo.count_user_interviews(current_user.id)
        if usage_count >= 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HOST_KEY_LIMIT_EXCEEDED: You have utilized all your free daily tokens. To continue practicing technical interviews with unlimited sessions, please provide your own API Key in the sidebar."
            )

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

    # 2. Fetch past question texts to avoid repetitions
    past_questions = await interview_repo.get_past_question_texts(current_user.id, payload.role)

    # 3. Ask AI to generate 5 challenging questions using target key/model settings
    questions_data = await generate_interview_questions(
        role=payload.role,
        difficulty=payload.difficulty,
        resume_text=resume_text,
        past_questions=past_questions,
        user_keys=user_keys
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
    role: Optional[str] = None,
    difficulty: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all mock interview sessions taken by the current user with optional filters.
    """
    repo = InterviewRepository(db)
    interviews = await repo.get_user_interviews(
        user_id=current_user.id,
        role=role,
        difficulty=difficulty,
        status=status
    )
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

@router.post("/{interview_id}/evaluate", response_model=InterviewResponse)
async def evaluate_interview(
    interview_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    user_keys: UserAPIKeys = Depends(get_byok_keys)
):
    """
    Submits all answered questions to Gemini/OpenAI for evaluation, updates scores and feedback,
    and marks the interview as Evaluated.
    """
    interview_repo = InterviewRepository(db)
    response_repo = ResponseRepository(db)
    
    interview = await interview_repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    # Check if all questions are answered
    questions_and_responses = []
    for q in interview.questions:
        if not q.response:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot evaluate: Question {q.order_index} is not answered."
            )
        questions_and_responses.append({
            "question_id": str(q.id),
            "question_text": q.question_text,
            "ideal_answer": q.ideal_answer,
            "user_answer": q.response.user_answer,
            "duration_seconds": q.response.duration_seconds
        })

    # Call AI Evaluator with keys
    evaluation_result = await evaluate_interview_responses(
        role=interview.role,
        difficulty=interview.difficulty,
        questions_and_responses=questions_and_responses,
        user_keys=user_keys
    )
    
    # Update Responses
    evals = evaluation_result.get("evaluations", [])
    if evals:
        await response_repo.update_evaluations(evals)
        
    # Update Interview Status
    interview.status = "Evaluated"
    await db.commit()
    await db.refresh(interview)
    
    # Reload interview with updated nested responses
    updated_interview = await interview_repo.get_by_id(interview_id)
    return updated_interview
