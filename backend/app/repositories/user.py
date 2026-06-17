from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid
from datetime import datetime
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

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

    @staticmethod
    async def create_local_user(db: AsyncSession, schema: UserCreate) -> User:
        """Create a standard local login user with hashed password."""
        db_user = User(
            email=schema.email.strip().lower(),
            full_name=schema.full_name.strip(),
            hashed_password=get_password_hash(schema.password),
            auth_provider="local"
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    @staticmethod
    async def create_oauth_user(db: AsyncSession, email: str, full_name: str, provider: str, provider_id: str) -> User:
        """Create an OAuth (e.g. Google) user with no password."""
        db_user = User(
            email=email.strip().lower(),
            full_name=full_name.strip(),
            auth_provider=provider,
            provider_id=provider_id,
            hashed_password=None
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    @staticmethod
    async def update_reset_token(db: AsyncSession, user: User, token: Optional[str], expires_at: Optional[datetime]) -> User:
        """Update password reset token details for a user."""
        user.reset_token = token
        user.reset_token_expires_at = expires_at
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def update_password(db: AsyncSession, user: User, password_hash: str) -> User:
        """Change a user's password and revoke the reset token."""
        user.hashed_password = password_hash
        user.reset_token = None
        user.reset_token_expires_at = None
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
