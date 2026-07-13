import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.models.interview import Interview, Question

class InterviewRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: uuid.UUID,
        role: str,
        difficulty: str,
        resume_id: Optional[uuid.UUID],
        questions_data: List[dict],
        job_description: Optional[str] = None,
        company_context: Optional[str] = None
    ) -> Interview:
        """
        Creates a new interview and its associated questions in a single transaction.
        """
        interview = Interview(
            user_id=user_id,
            role=role,
            difficulty=difficulty,
            resume_id=resume_id,
            status="Created",
            job_description=job_description,
            company_context=company_context
        )
        self.db.add(interview)
        await self.db.flush()  # Flushes to generate the interview.id

        # Create all questions
        for idx, q_data in enumerate(questions_data):
            question = Question(
                interview_id=interview.id,
                question_text=q_data["question_text"],
                order_index=idx + 1,
                expected_skills=q_data.get("expected_skills", []),
                ideal_answer=q_data.get("ideal_answer", "")
            )
            self.db.add(question)

        await self.db.commit()
        await self.db.refresh(interview)

        # Re-fetch with pre-loaded questions relationship
        return await self.get_by_id(interview.id)

    async def get_by_id(self, interview_id: uuid.UUID) -> Optional[Interview]:
        """
        Retrieves a single interview by its ID with all associated questions loaded.
        """
        query = (
            select(Interview)
            .where(Interview.id == interview_id)
            .options(selectinload(Interview.questions).selectinload(Question.response))
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_user_interviews(
        self, 
        user_id: uuid.UUID,
        role: Optional[str] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Interview]:
        """
        Retrieves all interviews created by a user, ordered by latest with optional filters.
        """
        query = select(Interview).where(Interview.user_id == user_id)
        
        if role:
            query = query.where(Interview.role.ilike(f"%{role}%"))
        if difficulty:
            query = query.where(Interview.difficulty == difficulty)
        if status:
            query = query.where(Interview.status == status)

        query = (
            query.options(selectinload(Interview.questions).selectinload(Question.response))
            .order_by(Interview.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_past_question_texts(self, user_id: uuid.UUID, role: str) -> List[str]:
        """
        Retrieves all past question texts asked of this user for a specific role
        to avoid repeating them.
        """
        query = (
            select(Question.question_text)
            .join(Interview)
            .where(Interview.user_id == user_id, Interview.role == role)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_user_interviews(self, user_id: uuid.UUID) -> int:
        """
        Counts the total number of interviews created by a user.
        """
        query = select(Interview).where(Interview.user_id == user_id)
        result = await self.db.execute(query)
        return len(result.scalars().all())
