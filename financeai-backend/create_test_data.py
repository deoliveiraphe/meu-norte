import asyncio
import random
from datetime import date, timedelta
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.categoria import Categoria
from app.models.lancamento import Lancamento, TipoLancamento
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def create_test_data():
    async with AsyncSessionLocal() as session:
        # 1. Verificar/Criar o usuário
        user_email = "portfolio@teste.com"
        result = await session.execute(select(User).filter(User.email == user_email))
        user = result.scalars().first()
        
        if not user:
            print(f"Criando usuário de teste: {user_email}...")
            hashed_password = get_password_hash("Teste123!")
            user = User(
                nome="Usuário Portfólio",
                email=user_email,
                hashed_password=hashed_password,
                is_active=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        else:
            print(f"Usuário {user_email} já existe. ID: {user.id}")

            # Limpar dados antigos do usuário para recriar se necessário (opcional)
            # Para manter simples, vamos apenas adicionar mais dados ou não fazer nada.
            # Aqui vou prosseguir adicionando dados.

        # 2. Criar categorias
        categorias_data = [
            {"nome": "Salário", "tipo": "receita", "cor_hexa": "#10B981", "icone": "💰"},
            {"nome": "Freelance", "tipo": "receita", "cor_hexa": "#3B82F6", "icone": "💻"},
            {"nome": "Rendimentos", "tipo": "receita", "cor_hexa": "#8B5CF6", "icone": "📈"},
            {"nome": "Alimentação e Mercado", "tipo": "despesa", "cor_hexa": "#EF4444", "icone": "🛒"},
            {"nome": "Moradia (Aluguel/Condomínio)", "tipo": "despesa", "cor_hexa": "#F59E0B", "icone": "🏠"},
            {"nome": "Transporte (Uber/Combustível)", "tipo": "despesa", "cor_hexa": "#6B7280", "icone": "🚗"},
            {"nome": "Lazer e Restaurantes", "tipo": "despesa", "cor_hexa": "#EC4899", "icone": "🎉"},
            {"nome": "Saúde e Farmácia", "tipo": "despesa", "cor_hexa": "#14B8A6", "icone": "💊"},
            {"nome": "Educação (Cursos/Faculdade)", "tipo": "despesa", "cor_hexa": "#06B6D4", "icone": "📚"}
        ]

        categorias_objs = {}
        for cat_data in categorias_data:
            result = await session.execute(
                select(Categoria).filter(Categoria.nome == cat_data["nome"], Categoria.user_id == user.id)
            )
            cat = result.scalars().first()
            if not cat:
                cat = Categoria(
                    nome=cat_data["nome"],
                    tipo=cat_data["tipo"],
                    cor_hexa=cat_data["cor_hexa"],
                    icone=cat_data["icone"],
                    user_id=user.id
                )
                session.add(cat)
                await session.flush() # Para pegar o ID logo
            categorias_objs[cat.nome] = cat

        await session.commit()
        print("Categorias criadas/atualizadas.")

        # 3. Criar Lançamentos (distribuídos em 3 meses: anterior, atual e próximo)
        hoje = date.today()
        # Vamos gerar 60 lançamentos no total
        descricoes_receita = ["Salário Mensal", "Desenvolvimento de Landing Page", "Consultoria PJ", "Dividendos", "Venda de equipamento antigo"]
        descricoes_despesa = ["Supermercado Extra", "Uber para o trabalho", "Aluguel", "Conta de Luz", "Internet", "Restaurante Japonês", "Farmácia - Remédios", "Curso de Python", "Cinema", "Ifood - Pizza"]
        
        cats_receitas = [c for c in categorias_objs.values() if c.tipo == "receita"]
        cats_despesas = [c for c in categorias_objs.values() if c.tipo == "despesa"]

        novos_lancamentos = []
        for i in range(90):
            # Sortear um dia nos últimos 60 dias ou próximos 30 dias
            dias_offset = random.randint(-60, 30)
            data_lanc = hoje + timedelta(days=dias_offset)
            
            is_receita = random.random() < 0.25 # 25% de ser receita, 75% despesa

            if is_receita:
                cat = random.choice(cats_receitas)
                descricao = random.choice(descricoes_receita)
                # Receitas geralmente têm valor maior
                valor = round(random.uniform(500.0, 5000.0), 2)
            else:
                cat = random.choice(cats_despesas)
                descricao = random.choice(descricoes_despesa)
                # Despesas variam
                valor = round(random.uniform(20.0, 500.0), 2)

            is_pago = data_lanc <= hoje
            
            lancamento = Lancamento(
                user_id=user.id,
                categoria_id=cat.id,
                tipo=cat.tipo,
                descricao=descricao,
                valor=valor,
                data_vencimento=data_lanc,
                data_pagamento=data_lanc if is_pago else None,
                is_pago=is_pago,
                observacoes="Gerado por script de teste"
            )
            novos_lancamentos.append(lancamento)
            
        session.add_all(novos_lancamentos)
        await session.commit()
        
        print(f"Cerca de {len(novos_lancamentos)} lançamentos de teste foram criados para o usuário.")
        print(f"\n✅ DADOS DE TESTE CRIADOS COM SUCESSO!")
        print(f"Login: {user_email}")
        print(f"Senha: Teste123!")

if __name__ == "__main__":
    asyncio.run(create_test_data())
