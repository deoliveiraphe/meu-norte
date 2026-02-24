import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User))
        users = res.scalars().all()
        for u in users:
            print(f"UID: {u.id}, Email: {u.email}, Hash: {u.hashed_password}, Passwd len: {len(u.hashed_password)}")

if __name__ == "__main__":
    asyncio.run(main())
