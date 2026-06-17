import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    # id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    
    # email VARCHAR(255) UNIQUE NOT NULL
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    
    # hashed_password VARCHAR(255) (Nullable for Google OAuth-only users)
    hashed_password: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    # full_name VARCHAR(255) NOT NULL
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    # auth_provider VARCHAR(50) NOT NULL DEFAULT 'local'
    auth_provider: Mapped[str] = mapped_column(
        String(50),
        default="local",
        nullable=False
    )
    
    # provider_id VARCHAR(255) (Nullable, Google User ID)
    provider_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    # reset_token VARCHAR(255) (Nullable)
    reset_token: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    # reset_token_expires_at TIMESTAMPTZ (Nullable)
    reset_token_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<User email={self.email} full_name={self.full_name}>"
