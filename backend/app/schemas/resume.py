import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ResumeBase(BaseModel):
    pass

class ResumeResponse(ResumeBase):
    id: uuid.UUID
    file_name: str
    uploaded_at: datetime
    skills: List[str] = []
    experience_summary: Optional[str] = None
    parsed_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
