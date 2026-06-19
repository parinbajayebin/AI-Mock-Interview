import uuid
import re
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="The user's unique email address")
    full_name: str = Field(..., min_length=1, max_length=255, description="The user's full name")

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v_clean = v.strip()
        if not re.match(r"^[a-zA-Z\s'-]+$", v_clean):
            raise ValueError("Full name must contain only letters, spaces, hyphens, or apostrophes")
        if len(v_clean) < 2 or len(v_clean) > 50:
            raise ValueError("Full name must be between 2 and 50 characters")
        return v_clean

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="User password (minimum 6 characters)")

class UserResponse(UserBase):
    id: uuid.UUID
    auth_provider: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        # Pydantic v2 configuration to allow parsing from SQLAlchemy models
        from_attributes = True
