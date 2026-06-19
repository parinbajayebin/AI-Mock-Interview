from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid
from app.models.user import User

class UserRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        """Retrieve user by UUID."""
        result = await db.execute(select(User).filter(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Retrieve user by email (case-insensitive)."""
        result = await db.execute(select(User).filter(User.email == email.strip().lower()))
        return result.scalars().first()

    @staticmethod
    async def get_by_google_id(db: AsyncSession, provider_id: str) -> Optional[User]:
        """Retrieve OAuth user by Google Provider ID."""
        result = await db.execute(select(User).filter(User.provider_id == provider_id))
        return result.scalars().first()
