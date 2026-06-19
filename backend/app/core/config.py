import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from typing import Optional, List, Union

class Settings(BaseSettings):
    # Search for .env first in current directory (backend/) then parent (root)
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # CORS Configuration
    CORS_ORIGINS: List[str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if v == "*":
            return ["*"]
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

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
    VITE_SUPABASE_ANON_KEY: Optional[str] = Field(default=None)

settings = Settings()
