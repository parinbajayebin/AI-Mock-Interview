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

    # Gemini Settings
    GEMINI_API_KEY: Optional[str] = Field(default=None)

    # Frontend URL (used for CORS, redirect links, etc.)
    FRONTEND_URL: str = Field(default="http://localhost:5173")

    # Supabase Settings
    SUPABASE_URL: Optional[str] = Field(default=None)
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(default=None)
    SUPABASE_JWT_SECRET: Optional[str] = Field(default=None)

settings = Settings()
