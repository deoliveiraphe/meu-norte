import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).filter(User.email == 'ph.oliveira013@gmail.com'))
        user = res.scalars().first()
        if user:
            print(f"User found: {user.email}")
            print("123456 verified:", pwd_context.verify("123456", user.hashed_password))
            print("senha123 verified:", pwd_context.verify("senha123", user.hashed_password))

if __name__ == "__main__":
    asyncio.run(main())
