import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.response import ResponseDetail

class QuestionResponse(BaseModel):
    id: uuid.UUID
    question_text: str
    order_index: int
    expected_skills: List[str]
    response: Optional[ResponseDetail] = None

    class Config:
        from_attributes = True

class InterviewCreate(BaseModel):
    resume_id: Optional[uuid.UUID] = None
    role: str = Field(..., max_length=100)
    difficulty: str = Field(..., max_length=50)

class InterviewResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    resume_id: Optional[uuid.UUID] = None
    role: str
    difficulty: str
    status: str
    created_at: datetime
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True
