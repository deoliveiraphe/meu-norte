# 🚀 Deploy — Meu Norte

## Ambientes

| Ambiente | Endereço | Descrição |
|----------|----------|-----------|
| Local Dev | `http://localhost:5173` | Vite dev server |
| Backend Dev | `http://localhost:8000` | Uvicorn local |
| Produção | Configurável | VPS + Nginx + PM2 |

---

## Deploy Local (Docker Compose)

### Requisitos
- Docker Engine 24+
- Docker Compose v2+
- Ollama instalado no host

### 1. Variáveis de Ambiente

Crie `financeai-backend/.env`:
```env
DB_PASSWORD=suasenhasegura
SECRET_KEY=chave-secreta-jwt-muito-longa-aqui
POSTGRES_USER=postgres
POSTGRES_DB=financeai
```

### 2. Subir a stack completa
```bash
cd financeai-backend
docker compose up -d
```

Serviços que sobem:
- `postgres` — PostgreSQL 15 + pgvector
- `redis` — Redis 7 (broker do Celery)
- `backend` — FastAPI (porta 8000)
- `celery_worker` — Worker de indexação

### 3. Verificar logs
```bash
docker compose logs -f backend
docker compose logs -f celery_worker
```

### 4. Frontend
```bash
cd ..
npm run dev   # desenvolvimento
npm run build # produção → dist/
```

---

## Deploy em Produção (VPS)

### Backend (PM2 + Gunicorn)

```bash
# Instalar dependências
pip install -r requirements.txt

# Rodar migrations
alembic upgrade head

# Iniciar com Gunicorn
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000

# Celery worker
celery -A app.worker worker --loglevel=info
```

### Frontend (Nginx)

```nginx
server {
    listen 80;
    server_name meu-norte.com;

    root /var/www/finai-mente/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Build do Frontend para Produção
```bash
# Configurar URL da API
echo "VITE_API_URL=https://api.meu-norte.com/api/v1" > .env.production

npm run build
# Artefato em ./dist/
```

---

## Checklist de Deploy

- [ ] `.env` configurado com secrets seguros
- [ ] `SECRET_KEY` com pelo menos 32 caracteres aleatórios
- [ ] Migrations aplicadas (`alembic upgrade head`)
- [ ] Seed executado (`python seed.py`)
- [ ] Ollama rodando com modelos baixados
- [ ] Celery worker rodando
- [ ] SSL/HTTPS configurado (Let's Encrypt)
- [ ] Backup do PostgreSQL agendado

---

## Geração de SECRET_KEY Segura

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Variáveis de Ambiente — Referência Completa

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DATABASE_URL` | URL do PostgreSQL | obrigatório |
| `REDIS_URL` | URL do Redis | `redis://redis:6379` |
| `OLLAMA_URL` | URL do Ollama | `http://ollama:11434` |
| `SECRET_KEY` | Chave JWT | obrigatório |
| `ALGORITHM` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiração do token | `1440` (24h) |
| `DB_PASSWORD` | Senha do PostgreSQL | obrigatório |
