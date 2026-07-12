from fastapi import Header
from typing import Optional
from app.schemas.byok import UserAPIKeys

def get_byok_keys(
    x_user_provider: Optional[str] = Header("default", alias="X-User-Provider"),
    x_user_gemini_key: Optional[str] = Header(None, alias="X-User-Gemini-Key"),
    x_user_openai_key: Optional[str] = Header(None, alias="X-User-OpenAI-Key"),
    x_user_groq_key: Optional[str] = Header(None, alias="X-User-Groq-Key"),
    x_user_openrouter_key: Optional[str] = Header(None, alias="X-User-OpenRouter-Key"),
    x_user_model: Optional[str] = Header(None, alias="X-User-Model")
) -> UserAPIKeys:
    """Dependency helper to retrieve user's custom API keys and model preferences
    directly from request headers in-memory.
    """
    return UserAPIKeys(
        provider=x_user_provider if x_user_provider else "default",
        gemini_key=x_user_gemini_key.strip() if x_user_gemini_key and len(x_user_gemini_key.strip()) > 8 else None,
        openai_key=x_user_openai_key.strip() if x_user_openai_key and len(x_user_openai_key.strip()) > 8 else None,
        groq_key=x_user_groq_key.strip() if x_user_groq_key and len(x_user_groq_key.strip()) > 8 else None,
        openrouter_key=x_user_openrouter_key.strip() if x_user_openrouter_key and len(x_user_openrouter_key.strip()) > 8 else None,
        model=x_user_model if x_user_model else None
    )
