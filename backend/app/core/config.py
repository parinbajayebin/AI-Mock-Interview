import os
import json
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

    # Firebase Service Account JSON
    FIREBASE_SERVICE_ACCOUNT_JSON: Optional[str] = Field(default=None)

    # Frontend URL (used for CORS, redirect links, etc.)
    FRONTEND_URL: str = Field(default="http://localhost:5173")

    # Supabase Settings
    SUPABASE_URL: Optional[str] = Field(default=None)
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(default=None)

settings = Settings()

# Initialize Firebase Admin SDK
if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
    try:
        import firebase_admin
        from firebase_admin import credentials
        
        # Check if already initialized to prevent duplicate errors
        if not firebase_admin._apps:
            cred_dict = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("[INFO] Firebase Admin SDK successfully initialized.")
    except Exception as e:
        print(f"[ERROR] Failed to initialize Firebase Admin SDK: {e}")
else:
    print("[WARN] FIREBASE_SERVICE_ACCOUNT_JSON environment variable not found. Token verification will fail.")
