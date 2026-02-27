# 🏗️ Arquitetura — Meu Norte

## Visão Geral

O **Meu Norte** é construído sobre uma arquitetura de três camadas bem definidas, com separação clara de responsabilidades entre frontend, backend e infraestrutura.

```
┌──────────────────────────────────────────────────────────────┐
│  CAMADA DE APRESENTAÇÃO                                      │
│  React 18 + TypeScript + Vite                                │
│  Tailwind CSS + shadcn/ui + Recharts                         │
└────────────────────────┬─────────────────────────────────────┘
                         │  HTTP REST + WebSocket (ws://)
┌────────────────────────▼─────────────────────────────────────┐
│  CAMADA DE APLICAÇÃO                                         │
│  FastAPI (async) + Python 3.11                               │
│  SQLAlchemy (async) + Pydantic v2                            │
│  JWT Auth + bcrypt                                           │
└───────┬─────────────────────────────┬────────────────────────┘
        │                             │ Broker (Redis)
┌───────▼──────────┐     ┌────────────▼────────────────────────┐
│  CAMADA DE DADOS │     │  CAMADA DE PROCESSAMENTO ASSÍNCRONO│
│  PostgreSQL 15   │     │  Celery Worker                      │
│  + pgvector      │◄────│  Indexação de embeddings            │
└──────────────────┘     └───────────────────┬─────────────────┘
                                             │
                                  ┌──────────▼──────────┐
                                  │  Ollama (local)     │
                                  │  llama3.2           │
                                  │  nomic-embed-text   │
                                  └─────────────────────┘
```

---

## Decisões Técnicas

### Por que FastAPI?
- Suporte nativo a `async/await` — essencial para operações de I/O pesado (banco + Ollama)
- Geração automática de documentação OpenAPI/Swagger
- Validação de dados com Pydantic v2 (muito mais rápido que v1)
- Tipagem completa integrada com Python type hints

### Por que PostgreSQL + pgvector?
- Um único banco de dados para dados relacionais E embeddings vetoriais
- Elimina a necessidade de um vector store separado (Pinecone, Weaviate, etc.)
- Queries SQL com similaridade coseno: `<=>` operator
- Simples de hospedar (sem serviços extras)

### Por que Ollama?
- LLM 100% local sem custo de API
- Privacidade: dados financeiros não saem da máquina
- Modelos intercambiáveis (llama3.2, mistral, gemma, etc.)
- `nomic-embed-text` para embeddings de alta qualidade (768 dims)

### Por que Celery + Redis para indexação?
- A geração de embeddings é CPU/GPU-intensiva e levaria 2-5s por lançamento
- Ao criar/editar um lançamento, a resposta da API é imediata
- O worker indexa o embedding em background sem bloquear o usuário

---

## Fluxo de Dados — Criação de Lançamento

```
[Frontend] → POST /lancamentos → [API Route]
                                       │
                              Salva no PostgreSQL
                                       │
                              Dispara task Celery
                                       │
                                       ▼
                              [Celery Worker]
                              ├─ Gera embedding (Ollama/nomic)
                              └─ Salva no pgvector
```

## Fluxo de Dados — Chat com IA

```
[Frontend WebSocket] → query do usuário
                            │
                    [API WebSocket Handler]
                            │
                    Busca embeddings similares
                    (pgvector cosine similarity)
                            │
                    Constrói prompt com contexto RAG
                            │
                    Chama Ollama (llama3.2)
                            │
                    Stream de tokens → WebSocket → Frontend
```

---

## Módulos do Backend

| Módulo | Arquivo | Responsabilidade |
|--------|---------|-----------------|
| Auth | `api/v1/auth.py` | Login, registro, troca de senha |
| Lançamentos | `api/v1/lancamentos.py` | CRUD + parcelas + recorrências |
| Dashboard | `api/v1/dashboard.py` | KPIs, fluxo, vencimentos |
| Relatórios | `api/v1/relatorios.py` | Evolução, ranking, projeção |
| Categorias | `api/v1/categorias.py` | CRUD de categorias |
| Chat | `api/v1/chat.py` | WebSocket + RAG + LLM |
| RAG Pipeline | `services/rag/pipeline.py` | Indexação + retrieval |
| Prompt Builder | `services/rag/prompt_builder.py` | Construção de contexto |
| Ollama Client | `services/llm/ollama_client.py` | Client HTTP para Ollama |

---

## Módulos do Frontend

| Módulo | Arquivo | Responsabilidade |
|--------|---------|-----------------|
| API Client | `lib/api.ts` | `fetchWithAuth` + tratamento de 401 |
| Export Utils | `lib/exportUtils.ts` | PDF (jsPDF), Excel (XLSX), Share |
| Auth Context | `contexts/AuthContext.tsx` | Estado de autenticação global |
| Finance Store | `stores/useFinanceStore.ts` | Mês/ano selecionado (Zustand) |
| WS Hook | `hooks/useChatWebSocket.ts` | Gerencia conexão WebSocket |
