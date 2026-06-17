import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="The user's unique email address")
    full_name: str = Field(..., min_length=1, max_length=255, description="The user's full name")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="User password (minimum 6 characters)")

class UserResponse(UserBase):
    id: uuid.UUID
    auth_provider: str
    created_at: datetime
    updated_at: datetime

    class Config:
        # Pydantic v2 configuration to allow parsing from SQLAlchemy models
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, description="The new password (minimum 6 characters)")

class GoogleCallbackRequest(BaseModel):
    id_token: str = Field(..., description="Google ID Token returned from the frontend authentication flow")
