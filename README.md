# 🧠 FinAI Mente — Assistente Financeiro com IA

> Plataforma de **gestão financeira pessoal** com assistente de inteligência artificial integrado, capaz de responder perguntas sobre suas finanças com base em seus próprios dados via RAG (Retrieval-Augmented Generation) local.

<p align="center">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img alt="Ollama" src="https://img.shields.io/badge/LLM-Ollama_Local-black?style=for-the-badge"/>
</p>

---

## 📸 Screenshots do Projeto


<!-- Exemplo de como adicionar prints:
![Dashboard](docs/screenshots/dashboard.png)
![Chat com IA](docs/screenshots/chat.png)
![Lançamentos](docs/screenshots/lancamentos.png)
-->

---

## ✨ Funcionalidades

- 📊 **Dashboard financeiro** — visualização de receitas, despesas e saldo por período
- 💬 **Chat com IA** — assistente conversacional que responde perguntas sobre suas finanças usando RAG local
- 📒 **Gestão de lançamentos** — controle de receitas e despesas por categoria, com suporte a parcelas
- 🔍 **Busca semântica** — os lançamentos são vetorizados e consultados com similaridade de cosseno via `pgvector`
- ⚡ **Processamento assíncrono** — indexação de embeddings via workers Celery em background

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│          React + Vite + TypeScript           │
│          Shadcn/UI + Tailwind CSS            │
└──────────────────┬──────────────────────────┘
                   │ REST API + WebSocket
┌──────────────────▼──────────────────────────┐
│                  Backend                     │
│         FastAPI (Async) + Python 3.12        │
│  ┌──────────────┐  ┌────────────────────┐   │
│  │  Auth (JWT)  │  │   RAG Pipeline     │   │
│  └──────────────┘  │  LangChain+Ollama  │   │
│  ┌──────────────┐  └────────────────────┘   │
│  │ Celery Worker│  ┌────────────────────┐   │
│  │ (Embeddings) │  │ PostgreSQL+pgvector│   │
│  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────┘
         │ Docker Compose (orquestração local)
┌────────▼──────────────────────────────┐
│  postgres | redis | ollama | flower   │
└───────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Backend** | FastAPI (Async), Python 3.12, SQLAlchemy, Alembic |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI |
| **Banco de dados** | PostgreSQL 15 + `pgvector` |
| **IA / LLM** | Ollama local (`llama3.2` + `nomic-embed-text`) |
| **Filas** | Redis + Celery + Flower |
| **Infraestrutura** | Docker + Docker Compose |

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose instalados
- [Node.js](https://nodejs.org/) (versão 18+)

### Passo a passo

**1. Clone o repositório**
```bash
git clone https://github.com/deoliveiraphe/finai-mente.git
cd finai-mente
```

**2. Configure as variáveis de ambiente**
```bash
cd financeai-backend
cp .env.example .env
# Edite o .env com uma senha para o banco e uma SECRET_KEY
```

**3. Suba toda a infraestrutura com o script de inicialização**
```bash
./start.sh
```

O script automaticamente:
- Inicia todos os containers (`postgres`, `redis`, `ollama`, `celery`)
- Faz o download dos modelos de IA no Ollama
- Roda as migrations do banco de dados (`alembic upgrade head`)
- Inicia o servidor de desenvolvimento do frontend

### Acesso

| Serviço | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| API Docs (Swagger) | `http://localhost:8000/docs` |
| Monitor Celery (Flower) | `http://localhost:5555` |

---

## 📁 Estrutura do Projeto

```
finai-mente/
├── financeai-backend/       # API FastAPI
│   ├── app/
│   │   ├── api/             # Endpoints REST
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── schemas/         # Schemas Pydantic
│   │   ├── services/        # LLM, RAG, Tasks
│   │   └── core/            # Auth / Config
│   ├── docker-compose.yml
│   └── start.sh
├── src/                     # Frontend React
│   ├── components/
│   ├── pages/
│   └── hooks/
└── docs/                    # Documentação técnica
```

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte o arquivo `LICENSE` para mais informações.