import asyncio
from sqlalchemy import text
from app.core.database import engine

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users';
        """))
        for row in result:
            print(f"{row[0]}: {row[1]}")

if __name__ == "__main__":
    asyncio.run(main())
