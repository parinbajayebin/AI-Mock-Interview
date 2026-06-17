import uuid
import re
from datetime import datetime
from typing import Optional
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

class OTPVerificationRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address to verify")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")

class OTPResendRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address to send new OTP")

