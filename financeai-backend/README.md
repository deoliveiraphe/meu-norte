# FinanceAI Backend

> Plataforma de gestão financeira pessoal construída em FastAPI (Async) com RAG integrado usando Ollama local via WebSocket.

## Stack 

- **Framework**: FastAPI (Async)
- **DB**: PostgreSQL 15 + Alembic + pgvector (Embeddings)
- **Broker/Workers**: Redis + Celery + Flower 
- **LLM Local**: Ollama (`llama3.2` + `nomic-embed-text`)

## Setup Simplificado de Execução

Se você tem o Docker Instalado basta rodar o script raiz na primeira vez (ou quando quiser ligar tudo na ordem):

```bash
./start.sh
```

Nesse script as tarefas automatizadas são realizadas:
- `docker-compose up -d` 
- Dowloads dos Modelos Llama para o Container
- Rodar a carga inicial da Migrations (`alembic upgrade head`)

> Você pode acompanhar as doc endpoints iterando: `http://localhost:8000/docs` e os workers de Inteligência artificial analisando dados em `http://localhost:5555`.
