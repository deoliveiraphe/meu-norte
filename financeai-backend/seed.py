import asyncio
from datetime import timedelta
from sqlalchemy import select, delete
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.categoria import Categoria
from app.models.lancamento import Lancamento
from app.core.security import get_password_hash, create_access_token

async def seed():
    async with AsyncSessionLocal() as db:
        # Check if user exists
        result = await db.execute(select(User).filter_by(email="admin@financeai.com"))
        user = result.scalars().first()
        if not user:
            user = User(
                email="admin@financeai.com",
                hashed_password=get_password_hash("admin123"),
                nome="Admin",
                is_active=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        # Create categories idempotently for this user
        cats = [
            Categoria(nome="Moradia", tipo="despesa", icone="🏠", user_id=user.id),
            Categoria(nome="Alimentação", tipo="despesa", icone="🛒", user_id=user.id),
            Categoria(nome="Transporte", tipo="despesa", icone="🚗", user_id=user.id),
            Categoria(nome="Saúde", tipo="despesa", icone="💊", user_id=user.id),
            Categoria(nome="Lazer", tipo="despesa", icone="🎬", user_id=user.id),
            Categoria(nome="Educação", tipo="despesa", icone="📚", user_id=user.id),
            Categoria(nome="Contas", tipo="despesa", icone="💡", user_id=user.id),
            Categoria(nome="Empréstimo", tipo="despesa", icone="🏦", user_id=user.id),
            Categoria(nome="Outros", tipo="despesa", icone="💳", user_id=user.id),
            Categoria(nome="Receita Fixa", tipo="receita", icone="💼", user_id=user.id)
        ]
        
        for cat in cats:
            res = await db.execute(select(Categoria).filter_by(nome=cat.nome, user_id=user.id))
            if not res.scalars().first():
                db.add(cat)
        
        # Excluir explicitamente as despesas contendo 'Carro' como solicitado pelo usuário
        await db.execute(delete(Lancamento).where(Lancamento.descricao.ilike("%Carro%")))
        
        try:
            await db.commit()
            print("Database seeded with user and categories!")
        except Exception as e:
            print("Seed failed:", e)
            await db.rollback()
            
        print("\n=== TEST JWT TOKEN ===")
        print(create_access_token(subject="admin@financeai.com", expires_delta=timedelta(days=365)))
        print("======================\n")

if __name__ == "__main__":
    asyncio.run(seed())
