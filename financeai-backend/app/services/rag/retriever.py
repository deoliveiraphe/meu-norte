from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from app.models.embedding import FinanceEmbedding

class RetinaRetriever:
    async def buscar_lancamentos_similares(
        self,
        db: AsyncSession,
        user_id: int,
        query_vector: List[float],
        top_k: int = 5,
        threshold: float = 0.5
    ) -> List[FinanceEmbedding]:
        """
        Busca os lançamentos mais relevantes com base no embedding (vetor da pergunta).
        Utiliza PGVector Cosine Distance (<=>).
        """
        
        # A distância cosseno do pgvector. 
        # Operador <=> calcula coseno. Valores mais próximos de 0 são mais similares.
        # threshold (0 a 1). Se limitarmos por relevância (1 - cosine_distance).
        
        distance = FinanceEmbedding.embedding.cosine_distance(query_vector)

        stmt = select(FinanceEmbedding).filter(
            FinanceEmbedding.user_id == user_id
        ).order_by(
            distance
        ).limit(top_k)

        result = await db.execute(stmt)
        embeddings = result.scalars().all()

        # Filtrar o limite por threshold (score = 1 - distance)
        # Opcional, mantido simples ordenado e com limite top_k
        return embeddings

retriever = RetinaRetriever()
