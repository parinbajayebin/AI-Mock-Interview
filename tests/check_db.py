import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import SessionLocal
from sqlalchemy import select
from app.models.user import User

async def main():
    try:
        async with SessionLocal() as db:
            result = await db.execute(select(User))
            users = result.scalars().all()
            print(f"Total Users: {len(users)}")
            for u in users:
                print(f" - {u.email} ({u.full_name}, Provider: {u.auth_provider})")
    except Exception as e:
        print(f"Database Query Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
