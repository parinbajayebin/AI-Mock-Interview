import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import engine  # type: ignore
from sqlalchemy import text  # type: ignore

async def migrate():
    print("Migrating Supabase database...")
    queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;"
    ]
    try:
        async with engine.begin() as conn:
            for q in queries:
                print(f"Executing: {q}")
                await conn.execute(text(q))
        print("Database migration successfully completed!")
    except Exception as e:
        print(f"Migration Failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(migrate())
