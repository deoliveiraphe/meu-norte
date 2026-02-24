import json
from datetime import datetime
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator

from app.services.llm.ollama_client import ollama_client
from app.services.rag.retriever import retriever
from app.services.rag.prompt_builder import prompt_builder
from app.models.embedding import FinanceEmbedding

from sqlalchemy import select, func
from datetime import date
from calendar import monthrange
from app.models.lancamento import Lancamento

async def get_real_user_context(user_id: int, db: AsyncSession) -> dict:
    hoje = date.today()
    target_mes = hoje.month
    target_ano = hoje.year
    
    _, last_day_atual = monthrange(target_ano, target_mes)
    inicio_mes_atual = date(target_ano, target_mes, 1)
    fim_mes_atual = date(target_ano, target_mes, last_day_atual)

    stmt_atual = select(
        Lancamento.tipo, func.sum(Lancamento.valor).label("total")
    ).where(
        Lancamento.user_id == user_id,
        Lancamento.data_vencimento >= inicio_mes_atual,
        Lancamento.data_vencimento <= fim_mes_atual
    ).group_by(Lancamento.tipo)
    
    result_atual = await db.execute(stmt_atual)
    agrupado_atual = {row.tipo: float(row.total) for row in result_atual.all()}
    
    receita_mes = agrupado_atual.get("receita", 0.0)
    despesa_mes = agrupado_atual.get("despesa", 0.0)
    saldo = receita_mes - despesa_mes
    
    meses_pt = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    mes_str = f"{meses_pt[target_mes-1]} de {target_ano}"
    
    return {
        "mes_atual": mes_str,
        "receita_total": receita_mes,
        "despesa_total": despesa_mes,
        "saldo": saldo
    }

async def interagir_com_chat_ws(
    pergunta: str,
    user_id: int,
    conversa_id: int,
    websocket: WebSocket,
    db: AsyncSession
) -> str:
    # 1. Obter os embeddings (assíncrono)
    await websocket.send_json({"type": "status", "content": "Analisando contexto..."})
    query_vector = await ollama_client.get_embedding(pergunta)
    
    # 2. Buscar Vetores Similares na Base (RAG)
    await websocket.send_json({"type": "status", "content": "Pesquisando lançamentos..."})
    fontes_recuperadas = await retriever.buscar_lancamentos_similares(
        db=db,
        user_id=user_id,
        query_vector=query_vector,
        top_k=7
    )
    
    # 3. Montar Contexto Global do Usuário (Mês Atual)
    real_metrics = await get_real_user_context(user_id=user_id, db=db)
    
    system_prompt = prompt_builder.construir_contexto_sistema(
        mes_atual=real_metrics["mes_atual"],
        receita_total=real_metrics["receita_total"],
        despesa_total=real_metrics["despesa_total"],
        saldo=real_metrics["saldo"],
        fontes=fontes_recuperadas
    )
    
    # 4. Enviar Tokens em Streaming Websocket
    resposta_completa = ""
    await websocket.send_json({"type": "status", "content": "Gerando resposta..."})
    
    stream_generator = ollama_client.generate_chat_stream(
        prompt=pergunta,
        system=system_prompt
    )
    
    async for token in stream_generator:
        try:
            # Emite cada pedaço de texto gerado para o cliente realtime
            await websocket.send_text(json.dumps({"type": "token", "content": token}))
            resposta_completa += token
        except Exception as e:
            # Em caso de quebra de conexão repentina, parar o stream
            print(f"Erro no envio do token WebSocket: {str(e)}")
            break
    # 5. Enviar link das fontes ao final
    fontes_ws = []
    for f in fontes_recuperadas:
        fontes_ws.append({
            "id": f.lancamento_id,
            "conteudo": f.conteudo,
            "data": f.created_at.strftime("%d/%m/%Y")
        })
        
    await websocket.send_text(json.dumps({
        "type": "sources",
        "content": fontes_ws
    }))

    await websocket.send_text(json.dumps({
        "type": "done",
        "content": "Resumo concluído"
    }))
    
    # Aqui vamos retornar a resposta completa gerada para os Handlers chamarem o save DB (Mensagens da Conversa)
    return resposta_completa
