import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.lancamento import Lancamento
from app.models.embedding import FinanceEmbedding
from app.services.llm.gemini_client import gemini_client
from app.services.tasks.worker import celery_app
from app.services.finance.indexer import formatar_para_embedding

async def processar_indexacao(lancamento_id: int, user_id: int):
    """Lógica assíncrona que gerencia o DB e gera o embedding."""
    async with AsyncSessionLocal() as session:
        # Busca lancamento
        result = await session.execute(
            select(Lancamento).filter(Lancamento.id == lancamento_id, Lancamento.user_id == user_id)
        )
        lancamento = result.scalars().first()
        if not lancamento:
            return

        # Gera texto de contexto
        texto = formatar_para_embedding(lancamento)
        
        # Chama a API do Ollama (Async)
        vetor = await gemini_client.embed(texto)
        
        # Verifica se já existe embedding para atulizar, ou cria novo
        res_emb = await session.execute(
            select(FinanceEmbedding).filter(FinanceEmbedding.lancamento_id == lancamento_id)
        )
        embedding_obj = res_emb.scalars().first()
        
        if embedding_obj:
            embedding_obj.conteudo = texto
            embedding_obj.embedding = vetor
        else:
            embedding_obj = FinanceEmbedding(
                user_id=user_id,
                lancamento_id=lancamento_id,
                conteudo=texto,
                embedding=vetor
            )
            session.add(embedding_obj)
            
        await session.commit()

@celery_app.task
def indexar_lancamento(lancamento_id: int, user_id: int):
    """
    Task executada pelo worker para salvar o vetor no banco após CRUD.
    """
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # Se ocorrer de ser disparado em um event loop já em execução
        asyncio.ensure_future(processar_indexacao(lancamento_id, user_id))
    else:
        loop.run_until_complete(processar_indexacao(lancamento_id, user_id))
