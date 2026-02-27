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

from sqlalchemy.orm import aliased
import uuid
from dateutil.relativedelta import relativedelta
from app.models.categoria import Categoria

async def _criar_lancamentos_ia(extracao: dict, user_id: int, db: AsyncSession, websocket: WebSocket) -> str:
    # Ler os dados extraídos pelo json schema
    nome = extracao.get("nome", "Lançamento via IA")
    valor = float(extracao.get("valor", 0.0))
    tipo = extracao.get("tipo", "despesa")
    data_inicial_str = extracao.get("data_inicial")
    parcelas = int(extracao.get("parcelas", 1))

    if not data_inicial_str:
        hoje = date.today()
        data_inicial = hoje
    else:
        try:
            from datetime import datetime
            data_inicial = datetime.strptime(data_inicial_str, "%Y-%m-%d").date()
        except Exception:
            data_inicial = date.today()

    # Buscar categoria "Outros" como fallback ou a primeira do tipo correspondente
    result_cat = await db.execute(select(Categoria).filter(Categoria.tipo == tipo).limit(1))
    categoria = result_cat.scalars().first()
    cat_id = categoria.id if categoria else (9 if tipo == 'receita' else 8)

    group_id = str(uuid.uuid4()) if parcelas > 1 else None
    
    for i in range(parcelas):
        data_parcela = data_inicial + relativedelta(months=i)
        desc_parcela = f"{nome} ({i+1}/{parcelas})" if parcelas > 1 else nome
        obs = "Criado pelo Assistente IA"
        if parcelas > 1 and i == parcelas - 1:
            obs += " - Última Parcela"
            
        lanc = Lancamento(
            user_id=user_id,
            tipo=tipo,
            descricao=desc_parcela,
            valor=valor,
            data_vencimento=data_parcela,
            categoria_id=cat_id,
            observacoes=obs,
            is_pago=False,
            parcela_group_id=group_id
        )
        db.add(lanc)
        
    await db.commit()
    
    # Notificar websocket com o resultado processado pelo backend
    msg_sucesso = f"Compreendido! Acabei de registrar '{nome}' ({tipo}) no valor de R$ {valor:,.2f}"
    if parcelas > 1:
        msg_sucesso += f" parcelado em {parcelas} vezes a partir de {data_inicial.strftime('%d/%m/%Y')}."
    else:
        msg_sucesso += f" para o dia {data_inicial.strftime('%d/%m/%Y')}."
        
    await websocket.send_text(json.dumps({"type": "token", "content": msg_sucesso}))
    await websocket.send_text(json.dumps({"type": "done", "content": "Sucesso"}))
    return msg_sucesso

async def get_real_user_context(user_id: int, db: AsyncSession) -> dict:
    hoje = date.today()
    target_mes = hoje.month
    target_ano = hoje.year
    
    _, last_day_atual = monthrange(target_ano, target_mes)
    inicio_mes_atual = date(target_ano, target_mes, 1)
    fim_mes_atual = date(target_ano, target_mes, last_day_atual)

    # Buscar Totais Globais
    stmt_atual = select(
        Lancamento.tipo, func.sum(Lancamento.valor).label("total")
    ).where(
        Lancamento.user_id == user_id,
        Lancamento.data_vencimento >= inicio_mes_atual,
        Lancamento.data_vencimento <= fim_mes_atual,
        Lancamento.is_pago == True # Opcional: considerar apenas os pagos no contexto de saldo real
    ).group_by(Lancamento.tipo)
    
    result_atual = await db.execute(stmt_atual)
    agrupado_atual = {row.tipo: float(row.total) for row in result_atual.all()}
    
    receita_mes = agrupado_atual.get("receita", 0.0)
    despesa_mes = agrupado_atual.get("despesa", 0.0)
    saldo = receita_mes - despesa_mes
    
    # Buscar Totais Agrupados por Categoria
    stmt_categorias = select(
        Lancamento.tipo, Categoria.nome.label("categoria_nome"), func.sum(Lancamento.valor).label("total")
    ).join(
        Categoria, Lancamento.categoria_id == Categoria.id
    ).where(
        Lancamento.user_id == user_id,
        Lancamento.data_vencimento >= inicio_mes_atual,
        Lancamento.data_vencimento <= fim_mes_atual
    ).group_by(Lancamento.tipo, Categoria.nome)
    
    result_cat = await db.execute(stmt_categorias)
    gastos_por_categoria = {"receita": {}, "despesa": {}}
    for row in result_cat.all():
        tipo_cat = row.tipo
        nome_cat = row.categoria_nome
        total_cat = float(row.total)
        gastos_por_categoria[tipo_cat][nome_cat] = total_cat

    meses_pt = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    mes_str = f"{meses_pt[target_mes-1]} de {target_ano}"
    
    return {
        "mes_atual": mes_str,
        "receita_total": receita_mes,
        "despesa_total": despesa_mes,
        "saldo": saldo,
        "detalhes_categoria": gastos_por_categoria
    }

async def interagir_com_chat_ws(
    pergunta: str,
    user_id: int,
    conversa_id: int,
    websocket: WebSocket,
    db: AsyncSession
) -> str:
    hoje = date.today()
    # 0. Avaliar Intenção Proativa (Criar Lançamento Automático) usando Function Calling nativo Mockado em JSON Format
    await websocket.send_json({"type": "status", "content": "Interpretando comando..."})
    prompt_intent = prompt_builder.construir_prompt_extracao(pergunta, hoje.month, hoje.year)
    extracao = await ollama_client.generate_json(prompt_intent)
    
    if extracao and extracao.get("intencao_de_criar") is True:
        await websocket.send_json({"type": "status", "content": "Registrando no banco de dados..."})
        return await _criar_lancamentos_ia(extracao, user_id, db, websocket)

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
        detalhes_categoria=real_metrics["detalhes_categoria"],
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
