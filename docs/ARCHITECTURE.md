# 🏗️ Arquitetura do Sistema — FinAI Mente

## Visão Geral

O **FinAI Mente** é uma aplicação de gestão financeira pessoal com assistente de inteligência artificial local. A arquitetura é dividida em três camadas principais: **Frontend**, **Backend** e **Infraestrutura Local**.

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO (Browser)                     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼────────────────────────────────┐
│                  FRONTEND (React + Vite)                 │
│              Porta 5173 (desenvolvimento)                │
│   - Dashboard financeiro                                 │
│   - Gestão de lançamentos e categorias                   │
│   - Chat com IA via WebSocket                            │
└────────────────────────┬────────────────────────────────┘
                         │ REST API + WebSocket (:8000)
┌────────────────────────▼────────────────────────────────┐
│                 BACKEND (FastAPI Async)                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │ API Layer  (routers: auth, users, lancamentos, chat) ││
│  ├─────────────────────────────────────────────────────┤│
│  │ Service Layer                                        ││
│  │  ├── RAG Pipeline (LangChain + pgvector)             ││
│  │  ├── LLM Client  (Ollama: llama3.2)                 ││
│  │  ├── Embedding   (Ollama: nomic-embed-text)          ││
│  │  └── Celery Tasks (indexação assíncrona)             ││
│  ├─────────────────────────────────────────────────────┤│
│  │ Data Layer (SQLAlchemy + Alembic)                    ││
│  └─────────────────────────────────────────────────────┘│
└──────┬──────────┬───────────────┬────────────────────────┘
       │          │               │
  ┌────▼───┐ ┌───▼────┐  ┌──────▼──────┐
  │Postgres│ │ Redis  │  │   Ollama    │
  │(+pgvec)│ │        │  │  LLM Local  │
  └────────┘ └────────┘  └─────────────┘
       ▲          ▲
  ┌────┴──────────┴────┐
  │   Celery Worker    │
  │  (embeddings BG)   │
  └────────────────────┘
```

---

## Componentes

### Frontend — React + Vite
- **Framework**: React 18 com TypeScript
- **UI**: Shadcn/UI + Tailwind CSS
- **Comunicação**: `axios` para REST, `WebSocket` nativo para chat em streaming
- **Estado**: React context + hooks customizados

### Backend — FastAPI (Async)
- **Framework**: FastAPI com `uvicorn` e `asyncio`
- **ORM**: SQLAlchemy (async) com `asyncpg`
- **Autenticação**: JWT via `python-jose` + bcrypt
- **Validação**: Pydantic v2

### Pipeline de IA (RAG)
1. **Indexação**: Ao criar/editar um lançamento financeiro, uma task Celery é disparada
2. **Embedding**: O texto do lançamento é vetorizado pelo modelo `nomic-embed-text` via Ollama
3. **Armazenamento**: O vetor é salvo na tabela `finance_embeddings` (coluna `vector(768)` via pgvector)
4. **Recuperação**: Durante o chat, o prompt do usuário é vetorizado e uma busca por similaridade de cosseno retorna os lançamentos mais relevantes
5. **Geração**: Os lançamentos recuperados são injetados no contexto do `llama3.2` que gera a resposta

### Infraestrutura (Docker Compose)
| Serviço | Imagem | Função |
|---|---|---|
| `postgres` | `pgvector/pgvector:pg15` | Banco de dados principal + extensão vetorial |
| `redis` | `redis:7-alpine` | Message broker para o Celery |
| `ollama` | `ollama/ollama` | Servidor de LLMs locais |
| `backend` | (build local) | API FastAPI |
| `celery_worker` | (build local) | Worker de indexação assíncrona |
| `flower` | `mher/flower` | Monitor visual do Celery |
