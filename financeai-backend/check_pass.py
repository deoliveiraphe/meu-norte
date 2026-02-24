import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import verify_password

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).filter(User.email == 'ph.oliveira013@gmail.com'))
        user = res.scalars().first()
        if user:
            print(f"User found: {user.email}")
            print(f"Hash: {user.hashed_password}")
            # we need a hardcoded password string to test if the user enters "123456" for instance.
            # but I don't know the password... let me test creating an arbitrary hash here and verifying it.
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            hash_123 = pwd_context.hash("123456")
            print("123456 verified:", pwd_context.verify("123456", hash_123))

if __name__ == "__main__":
    asyncio.run(main())
