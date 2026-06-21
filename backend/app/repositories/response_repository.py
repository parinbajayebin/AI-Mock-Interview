import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
from app.models.interview import Response, Question, Interview

class ResponseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_question_id(self, question_id: uuid.UUID) -> Optional[Response]:
        """
        Retrieves a response by its question ID.
        """
        query = select(Response).where(Response.question_id == question_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def save_response(
        self,
        question_id: uuid.UUID,
        user_answer: str,
        duration_seconds: Optional[int]
    ) -> Response:
        """
        Saves a user answer for a question. If a response already exists, updates it.
        """
        response = await self.get_by_question_id(question_id)
        
        if response:
            response.user_answer = user_answer
            response.duration_seconds = duration_seconds
            # Reset any pre-existing scores/feedback if they re-answer it
            response.score = None
            response.feedback = None
        else:
            response = Response(
                question_id=question_id,
                user_answer=user_answer,
                duration_seconds=duration_seconds
            )
            self.db.add(response)

        await self.db.commit()
        await self.db.refresh(response)
        return response

    async def verify_question_ownership(
        self,
        user_id: uuid.UUID,
        interview_id: uuid.UUID,
        question_id: uuid.UUID
    ) -> bool:
        """
        Verifies that the question and interview exist and belong to the specified user.
        """
        query = (
            select(Question)
            .join(Interview)
            .where(
                Question.id == question_id,
                Interview.id == interview_id,
                Interview.user_id == user_id
            )
        )
        result = await self.db.execute(query)
        return result.scalars().first() is not None

    async def update_evaluations(self, evaluations: list[dict]):
        """
        Bulk updates the scores and feedback for multiple responses.
        evaluations is a list of dicts: [{"question_id": str, "score": float, "feedback": str}]
        """
        for eval_data in evaluations:
            q_id = uuid.UUID(str(eval_data["question_id"]))
            response = await self.get_by_question_id(q_id)
            if response:
                response.score = eval_data.get("score")
                response.feedback = eval_data.get("feedback")
        
        await self.db.commit()
