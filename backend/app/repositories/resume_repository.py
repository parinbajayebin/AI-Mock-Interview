import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.resume import Resume

class ResumeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user_id: uuid.UUID, file_name: str, file_path: str, raw_text: str) -> Resume:
        resume = Resume(
            user_id=user_id,
            file_name=file_name,
            file_path=file_path,
            raw_text=raw_text
        )
        self.session.add(resume)
        await self.session.commit()
        await self.session.refresh(resume)
        return resume

    async def get_by_user_id(self, user_id: uuid.UUID) -> list[Resume]:
        result = await self.session.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(Resume.uploaded_at.desc())
        )
        return list(result.scalars().all())
