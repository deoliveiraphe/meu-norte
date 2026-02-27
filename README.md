<img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi" /> <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" /> <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" /> <img src="https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=for-the-badge&logo=postgresql" /> <img src="https://img.shields.io/badge/Ollama-LLM-black?style=for-the-badge" /> <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" />

# 💰 Meu Norte — Plataforma Financeira Inteligente

> **Gestão financeira pessoal full-stack com Inteligência Artificial local**, construída do zero com FastAPI, React e LLMs rodando 100% on-premise via Ollama.

---

## 📌 Sobre o Projeto

**Meu Norte** é uma aplicação web completa de controle financeiro pessoal que combina uma interface moderna com um assistente de IA local. O sistema permite gerenciar lançamentos (receitas, despesas e renegociações), visualizar relatórios analíticos em tempo real e conversar com um assistente financeiro powered por LLM — tudo sem depender de APIs externas pagas.

### 🎯 Destaques

- **IA On-Premise**: Integração com Ollama (llama3.2) e RAG com embeddings vectoriais via pgvector
- **Arquitetura Event-Driven**: Celery + Redis para indexação assíncrona de lançamentos
- **Full-Stack TypeScript + Python**: Frontend e backend completamente tipados
- **Padrão REST + WebSocket**: API RESTful + chat em tempo real via WebSocket
- **Exportações multiplas**: Geração de PDF e Excel no client-side com jsPDF e SheetJS

---

## 🚀 Stack Tecnológica

### Backend
| Tecnologia | Uso |
|------------|-----|
| **FastAPI** | API REST assíncrona com Python 3.11 |
| **SQLAlchemy (async)** | ORM com suporte a operações assíncronas |
| **Alembic** | Migrations de banco de dados versionadas |
| **PostgreSQL + pgvector** | Banco relacional com suporte a embeddings vetoriais |
| **Celery + Redis** | Fila de tarefas assíncronas para indexação RAG |
| **Ollama** | LLM local (llama3.2) + embeddings (nomic-embed-text) |
| **JWT (python-jose)** | Autenticação stateless via Bearer token |
| **Passlib + bcrypt** | Hash seguro de senhas |

### Frontend
| Tecnologia | Uso |
|------------|-----|
| **React 18** | SPA com hooks modernos e Context API |
| **TypeScript 5** | Tipagem estática completa |
| **Vite** | Build tool e dev server ultrarrápido |
| **Tailwind CSS** | Estilização utility-first |
| **shadcn/ui** | Componentes acessíveis e customizáveis |
| **Recharts** | Gráficos interativos (AreaChart, PieChart, RadialBar) |
| **Zustand** | State management global leve |
| **jsPDF + SheetJS** | Exportação de PDF e Excel no browser |
| **Sonner** | Sistema de notificações toast |

### Infraestrutura
| Tecnologia | Uso |
|------------|-----|
| **Docker + Docker Compose** | Orquestração completa da stack |
| **Nginx** (opcional) | Proxy reverso para produção |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite/React)                │
│  Dashboard │ Lançamentos │ Relatórios │ Assistente │ Config  │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API + WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                     BACKEND (FastAPI)                       │
│  /auth  /lancamentos  /relatorios  /dashboard  /chat        │
└──────┬───────────────────────┬──────────────────────────────┘
       │                       │
┌──────▼──────┐     ┌──────────▼───────────────────────────────┐
│ PostgreSQL  │     │           Celery Worker                  │
│  + pgvector │     │  Indexação assíncrona → embeddings       │
└─────────────┘     └────────────────┬─────────────────────────┘
       ▲                             │
       │                    ┌────────▼──────────┐
       └────────────────────│   Ollama (local)  │
                            │  llama3.2         │
                            │  nomic-embed-text │
                            └───────────────────┘
```

---

## ✨ Funcionalidades

### 📊 Dashboard
- KPIs em tempo real: Receita, Despesas, Renegociações, Saldo, A Vencer
- Gráfico de Fluxo de Caixa por dia do mês
- Despesas por categoria com barras de progresso
- Card de vencimentos com alertas visuais (vencido 🔴 / urgente ⚡ / hoje ⚠️)

### 💸 Lançamentos
- CRUD completo de lançamentos financeiros
- Suporte a **parcelas** com âncora de data (dia original, 1º ou último do mês)
- Receitas recorrentes mensais com seletor de meses ("Todos os meses")
- Três quadros separados: Receitas | Renegociações | Despesas
- Filtros com labels: Tipo, Categoria, Status + botão Reset
- **Exportação**: PDF com tabela colorida, Excel (.xlsx), Compartilhar

### 📈 Relatórios
- Evolução patrimonial — últimos 12 meses (gráfico de área)
- Distribuição de despesas por categoria (donut chart)
- Ranking de categorias com variação percentual vs. mês anterior
- Taxa de poupança (gauge radial) e comprometimento de renda
- **Projeção de saldo**: 3 meses reais + 3 meses projetados (média)
- Exportação em PDF e Excel

### 🤖 Assistente IA
- Chat em tempo real via WebSocket
- RAG (Retrieval-Augmented Generation) sobre os lançamentos do usuário
- Embeddings vetoriais via `nomic-embed-text` armazenados em pgvector
- LLM local sem custo de API: `llama3.2` via Ollama

### ⚙️ Configurações
- Gestão de categorias personalizadas (com ícone e tipo)
- Troca de senha com validação frontend + backend
- Perfil do usuário autenticado

---

## 🔐 Segurança

- Autenticação JWT com expiração de 24h
- Senhas armazenadas com hash bcrypt (cost factor 12)
- Todas as rotas protegidas por `get_current_user` (OAuth2 Bearer)
- Redirecionamento automático ao `/login` em caso de token expirado (401)
- Troca de senha validada contra a senha atual antes de atualizar

---

## 📂 Estrutura do Projeto

```
finai-mente/
├── src/                          # Frontend React/TypeScript
│   ├── components/               # Componentes reutilizáveis
│   │   ├── layout/               # AppLayout, AppSidebar
│   │   └── ui/                   # shadcn/ui components
│   ├── contexts/                 # AuthContext
│   ├── hooks/                    # useChatWebSocket
│   ├── lib/                      # api.ts, exportUtils.ts
│   ├── pages/                    # Dashboard, Transactions, Reports...
│   ├── stores/                   # useFinanceStore (Zustand)
│   └── data/                     # mockData / types
│
└── financeai-backend/            # Backend FastAPI
    ├── app/
    │   ├── api/v1/               # Rotas: auth, lancamentos, dashboard...
    │   ├── core/                 # security.py, config
    │   ├── db/                   # session.py, migrations (Alembic)
    │   ├── models/               # SQLAlchemy models
    │   ├── schemas/              # Pydantic schemas
    │   └── services/             # llm/, rag/ (pipeline, prompt_builder)
    ├── docker-compose.yml
    └── start.sh                  # Entrypoint: migrate + seed + uvicorn
```

---

## 🐳 Como Rodar Localmente

### Pré-requisitos
- Docker e Docker Compose instalados
- Ollama instalado localmente (`ollama pull llama3.2 && ollama pull nomic-embed-text`)

### 1. Clonar o repositório
```bash
git clone https://github.com/deoliveiraphe/finai-mente.git
cd finai-mente
```

### 2. Configurar variáveis de ambiente
```bash
cd financeai-backend
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Subir o backend
```bash
docker compose up -d
# O start.sh roda: alembic upgrade head → seed.py → uvicorn
```

### 4. Rodar o frontend
```bash
cd ..
npm install
npm run dev
```

Acesse: `http://localhost:5173`

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [Arquitetura](docs/ARCHITECTURE.md) | Visão geral da arquitetura e decisões técnicas |
| [API Reference](docs/API.md) | Endpoints, schemas e exemplos de uso |
| [Deploy](docs/DEPLOY.md) | Guia de deploy em produção |
| [IA & RAG](docs/AI_RAG.md) | Como funciona o assistente com RAG |
| [Banco de Dados](docs/DATABASE.md) | Modelos, relacionamentos e migrations |

---

## 👨‍💻 Autor

**Pedro Oliveira**  
Backend & Data Engineer | Python · FastAPI · PostgreSQL · IA/ML

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/pedro-oliveira-270a34131/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/deoliveiraphe)

---

> *Projeto desenvolvido como demonstração de competências em desenvolvimento full-stack moderno com integração de IA local.*
