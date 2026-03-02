# 🚀 Guia de Execução Local — FinAI Mente

Este guia orienta a configuração completa da aplicação em ambiente local utilizando **Docker Compose** e **Ollama** para IA 100% offline, sem dependência de APIs externas.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Link |
|---|---|---|
| Docker | 24+ | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | v2+ | (incluído no Docker Desktop) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Git | qualquer | |

> **Hardware recomendado**: 8 GB RAM (o modelo `llama3.2` requer ~4 GB).

---

## Configuração do `.env`

```bash
cd financeai-backend
cp .env.example .env
```

Edite o `.env` com suas preferências:

```env
DB_PASSWORD=sua_senha_segura_aqui
SECRET_KEY=uma_chave_secreta_longa_e_aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
OLLAMA_URL=http://ollama:11434
REDIS_URL=redis://redis:6379
```

---

## Subindo o Projeto (Primeira Vez)

```bash
# Na raiz de financeai-backend
./start.sh
```

O script executa automaticamente:
1. `docker-compose up -d` — sobe todos os containers
2. Download dos modelos de IA no Ollama (`llama3.2` + `nomic-embed-text`)
3. `alembic upgrade head` — aplica as migrations no banco
4. `python seed.py` — cria o usuário e categorias iniciais
5. `npm run dev` — inicia o servidor de desenvolvimento do frontend

---

## Executando nas Próximas Vezes

Após a primeira configuração, para ligar novamente:

```bash
# Subir apenas os containers (sem baixar modelos novamente)
cd financeai-backend
docker-compose up -d

# Frontend (em outro terminal, na raiz do projeto)
npm run dev
```

---

## URLs de Acesso

| Serviço | URL |
|---|---|
| **Frontend** | `http://localhost:5173` |
| **API Docs (Swagger)** | `http://localhost:8000/docs` |
| **Monitor Celery** | `http://localhost:5555` |
| **Ollama API** | `http://localhost:11434` |

---

## Usuário de Demo (Testes)

Para popular o banco com dados de teste para demonstração:

```bash
docker exec financeai-backend-backend-1 python create_test_data.py
```

| Campo | Valor |
|---|---|
| **Email** | `portfolio@teste.com` |
| **Senha** | `Teste123!` |

---

## Parando os Serviços

```bash
cd financeai-backend
docker-compose down

# Para parar E remover os volumes (⚠️ apaga os dados do banco)
docker-compose down -v
```

---

## Solução de Problemas

**Container do Ollama sem memória:**  
Aumente o limite de memória do Docker em Preferências > Recursos.

**Porta 5432 em uso:**  
Verifique se há outro PostgreSQL rodando localmente: `sudo systemctl stop postgresql`

**Migrations falham:**  
```bash
docker exec financeai-backend-backend-1 alembic upgrade head
```
