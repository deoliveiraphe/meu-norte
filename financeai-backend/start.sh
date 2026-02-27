#!/bin/bash

# Verificar script está rodando na raiz do projeto
cd "$(dirname "$0")"

echo "===🚀 Iniciando o FinanceAI ==="

if [ ! -f .env ]; then
  echo "📄 Arquivo .env não encontrado. Copiando do .env.example..."
  cp .env.example .env
fi

echo "1. Exportando variáveis do .env e subindo serviços..."
if [ -f .env ]; then
  # Carrega variáveis do .env ignorando comentários e linhas vazias
  export $(grep -v '^#' .env | xargs)
fi
docker-compose up -d

echo "2. Aguardando serviços (15 segundos para o Postgres e Ollama estabilizarem)..."
sleep 15

echo "3. Baixando modelos de IA no Ollama (Local LLM)..."
echo "  [Llama 3.2] Modelo Base para Chatbots RAG..."
docker exec financeai-backend-ollama-1 ollama pull llama3.2

echo "  [Nomic Embed Text] Modelo para Geração Vetorial de Embeddings PGVector..."
docker exec financeai-backend-ollama-1 ollama pull nomic-embed-text

echo "4. Rodando Migrations (Alembic) para recriar o BD atualizado..."
# Garantir que a migration vai para o Backend Container
docker exec financeai-backend-backend-1 alembic upgrade head || echo "⚠️  Migration Falhou. Revise os Logs e rode manualmente \`docker compose exec backend alembic upgrade head\`"

echo "5. Populando banco com dados iniciais (seed)..."
docker exec financeai-backend-backend-1 python seed.py || echo "⚠️  Seed Falhou. Revise os Logs e rode manualmente \`docker compose exec backend python seed.py\`"

echo "=== ✅ FinanceAI Iniciado com Sucesso! ==="
echo ""
echo "Rotas e Links de Acesso:"
echo "➡️  API Local /docs: http://localhost:8000/docs"
echo "➡️  Celery Flower (Monitor Tasks): http://localhost:5555"
echo "➡️  Frontend Web: http://localhost:8080"
echo ""
echo "Iniciando o servidor do Frontend agora..."
echo "Pressione Ctrl+C para encerrar o Frontend (o Backend Docker continuará no background)."
echo "================================================="

cd ..
npm install
npm run dev
