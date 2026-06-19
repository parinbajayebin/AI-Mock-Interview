import asyncio
from sqlalchemy import select
from app.core.database import SessionLocal, engine
from app.models.user import User

async def main():
    async with SessionLocal() as db:
        # Check users table
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"User: {u.email}, Provider: {u.auth_provider}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
