import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # Search for .env first in current directory (backend/) then parent (root)
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Database Settings
    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres_secure_pass@localhost:5432/ai_mock_interview")
    
    # Security/Auth Settings
    JWT_SECRET_KEY: str = Field(default="super_secret_jwt_sign_key_change_me_in_production")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)

    # Gemini Settings
    GEMINI_API_KEY: Optional[str] = Field(default=None)

    # Google OAuth Settings
    GOOGLE_CLIENT_ID: Optional[str] = Field(default=None)
    GOOGLE_CLIENT_SECRET: Optional[str] = Field(default=None)

    # Resend Email API Settings (https://resend.com)
    RESEND_API_KEY: Optional[str] = Field(default=None)
    RESEND_SENDER: str = Field(default="onboarding@resend.dev")

    # Frontend URL (used for password reset links, CORS, etc.)
    FRONTEND_URL: str = Field(default="http://localhost:5173")

    # Supabase Settings
    SUPABASE_URL: Optional[str] = Field(default=None)
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(default=None)

settings = Settings()
