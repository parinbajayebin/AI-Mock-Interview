import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class AnswerSubmit(BaseModel):
    user_answer: str = Field(..., min_length=1, description="The answer text submitted by the user")
    duration_seconds: Optional[int] = Field(None, ge=0, description="Time taken in seconds to answer")

class ResponseDetail(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    user_answer: str
    duration_seconds: Optional[int] = None
    submitted_at: datetime

    class Config:
        from_attributes = True
