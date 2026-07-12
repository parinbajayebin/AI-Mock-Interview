from pydantic import BaseModel
from typing import Optional

class UserAPIKeys(BaseModel):
    gemini_key: Optional[str] = None
    openai_key: Optional[str] = None
    groq_key: Optional[str] = None
    openrouter_key: Optional[str] = None
    provider: Optional[str] = "default"  # "default", "gemini", "openai", "groq", "openrouter"
    model: Optional[str] = None
