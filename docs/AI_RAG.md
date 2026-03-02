# 🤖 IA & RAG — Meu Norte

## Visão Geral

O assistente financeiro do Meu Norte utiliza **RAG (Retrieval-Augmented Generation)** para responder perguntas sobre os dados reais do usuário. Todo o processamento é local — sem APIs externas.

```
Pergunta do usuário
       │
       ▼
┌─────────────────┐
│ Gera embedding  │  ← nomic-embed-text (Ollama)
│ da pergunta     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Busca similares │  ← pgvector (cosine similarity)
│ no banco        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Constrói prompt │  ← prompt_builder.py
│ com contexto    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM gera        │  ← llama3.2 (Ollama)
│ resposta        │
└────────┬────────┘
         │
         ▼
  Stream via WebSocket → Frontend
```

---

## Modelos Utilizados

| Modelo | Uso | Dimensões |
|--------|-----|-----------|
| `llama3.2` | Geração de respostas em linguagem natural | — |
| `nomic-embed-text` | Geração de embeddings para indexação/busca | 768 |

---

## Pipeline de Indexação

Quando um lançamento é criado ou editado, uma **task Celery** é disparada:

```python
# services/rag/pipeline.py
async def indexar_lancamento(lancamento_id: int):
    # 1. Buscar lançamento no banco
    lancamento = await get_lancamento(lancamento_id)
    
    # 2. Montar texto descritivo
    texto = f"{lancamento.tipo}: {lancamento.descricao} - R${lancamento.valor:.2f} em {lancamento.data_vencimento}"
    
    # 3. Gerar embedding via Ollama
    embedding = await ollama_client.embed(texto, model="nomic-embed-text")
    
    # 4. Salvar no pgvector
    await salvar_embedding(lancamento_id, embedding, texto)
```

---

## Retrieval (Busca)

```python
# Busca os 5 lançamentos mais semanticamente similares à query
async def buscar_contexto(query: str, user_id: int, top_k: int = 5):
    query_embedding = await ollama_client.embed(query)
    
    stmt = select(LancamentoEmbedding, Lancamento) \
        .join(Lancamento) \
        .where(Lancamento.user_id == user_id) \
        .order_by(LancamentoEmbedding.embedding.cosine_distance(query_embedding)) \
        .limit(top_k)
    
    return await db.execute(stmt)
```

---

## Construção do Prompt

```python
# services/rag/prompt_builder.py
def construir_prompt(query: str, contexto: list, usuario: str) -> str:
    contexto_str = "\n".join([
        f"- {item.tipo.title()}: {item.descricao} "
        f"(R$ {item.valor:.2f}, {item.status}, {item.data_vencimento})"
        for item in contexto
    ])
    
    return f"""Você é um assistente financeiro pessoal do usuário {usuario}.
    
Com base nos lançamentos financeiros abaixo, responda à pergunta do usuário de forma clara e objetiva em português:

CONTEXTO FINANCEIRO:
{contexto_str}

PERGUNTA: {query}

RESPOSTA:"""
```

---

## WebSocket — Chat em Tempo Real

O frontend conecta via WebSocket para receber a resposta em streaming:

```typescript
// hooks/useChatWebSocket.ts
const ws = new WebSocket(`ws://localhost:8000/api/v1/chat/ws?token=${token}`);

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'token') {
        // Adiciona token à mensagem atual (efeito "digitando")
        setCurrentMessage(prev => prev + data.content);
    }
};

ws.send(JSON.stringify({ message: userMessage }));
```

---

## Como Configurar o Ollama

```bash
# 1. Instalar Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Baixar os modelos necessários
ollama pull llama3.2
ollama pull nomic-embed-text

# 3. Verificar
ollama list
```

No `docker-compose.yml`, o backend conecta ao Ollama do host via:
```yaml
OLLAMA_URL: http://host.docker.internal:11434
# No Linux: http://172.17.0.1:11434
```

---

## Performance

| Operação | Tempo médio |
|----------|-------------|
| Geração de embedding (nomic) | ~0.3s |
| Busca vetorial (pgvector) | < 50ms |
| Geração de resposta (llama3.2) | 2-8s (dependendo do hardware) |
| Indexação (background) | ~0.5s total |

> 💡 Com GPU disponível, o tempo de geração de resposta cai para < 1s
