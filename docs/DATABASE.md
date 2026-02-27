# 🗄️ Banco de Dados — Meu Norte

## Tecnologia
- **PostgreSQL 15** com extensão **pgvector** para buscas vetoriais
- **SQLAlchemy** (modo assíncrono com `asyncpg`) como ORM
- **Alembic** para migrations versionadas

---

## Modelos / Entidades

### `users`
```sql
id            SERIAL PRIMARY KEY
email         VARCHAR UNIQUE NOT NULL
nome          VARCHAR NOT NULL
hashed_password VARCHAR NOT NULL
created_at    TIMESTAMP DEFAULT now()
```

### `categorias`
```sql
id        SERIAL PRIMARY KEY
nome      VARCHAR NOT NULL
tipo      VARCHAR  -- 'receita' | 'despesa' | 'renegociacao'
icone     VARCHAR  -- emoji
user_id   INTEGER FK → users.id
```

### `lancamentos`
```sql
id                 SERIAL PRIMARY KEY
descricao          VARCHAR NOT NULL
valor              NUMERIC(12,2) NOT NULL
tipo               VARCHAR  -- 'receita' | 'despesa' | 'renegociacao'
status             VARCHAR  -- 'pago' | 'pendente'
data_vencimento    DATE NOT NULL
observacoes        TEXT
categoria_id       INTEGER FK → categorias.id
user_id            INTEGER FK → users.id
grupo_parcelamento UUID     -- agrupa parcelas do mesmo parcelamento
created_at         TIMESTAMP DEFAULT now()
```

### `lancamento_embeddings` (pgvector)
```sql
id            SERIAL PRIMARY KEY
lancamento_id INTEGER FK → lancamentos.id (ON DELETE CASCADE)
embedding     VECTOR(768)   -- nomic-embed-text output
texto_indexado TEXT          -- texto que gerou o embedding
created_at    TIMESTAMP DEFAULT now()
```

---

## Relacionamentos

```
users ──── 1:N ──── categorias
users ──── 1:N ──── lancamentos
categorias ─ 1:N ── lancamentos
lancamentos ─ 1:1 ─ lancamento_embeddings
```

---

## Migrations (Alembic)

As migrations ficam em `financeai-backend/alembic/versions/`.

```bash
# Aplicar todas as migrations
alembic upgrade head

# Criar nova migration
alembic revision --autogenerate -m "descricao"

# Reverter uma migration
alembic downgrade -1
```

O `start.sh` executa `alembic upgrade head` automaticamente ao iniciar o container.

---

## Queries de Exemplo

### Busca por similaridade vetorial (RAG)
```sql
SELECT l.descricao, l.valor, l.tipo
FROM lancamento_embeddings le
JOIN lancamentos l ON l.id = le.lancamento_id
WHERE l.user_id = :user_id
ORDER BY le.embedding <=> :query_embedding
LIMIT 5;
```

### Fluxo de caixa diário
```sql
SELECT
    EXTRACT(day FROM data_vencimento) AS day,
    tipo,
    SUM(valor) AS total
FROM lancamentos
WHERE user_id = :user_id
  AND EXTRACT(month FROM data_vencimento) = :mes
  AND EXTRACT(year FROM data_vencimento) = :ano
GROUP BY day, tipo
ORDER BY day;
```

### Ranking de categorias vs. mês anterior
```sql
SELECT c.nome, SUM(l.valor) AS total
FROM lancamentos l
JOIN categorias c ON c.id = l.categoria_id
WHERE l.user_id = :user_id
  AND l.tipo = 'despesa'
  AND l.data_vencimento BETWEEN :inicio AND :fim
GROUP BY c.nome
ORDER BY total DESC;
```

---

## Seeding Inicial

O arquivo `seed.py` popula o banco com:
- 1 usuário admin padrão
- Categorias de receita: `Salário`, `Freelance`, `Investimentos`, `Outros`
- Categorias de despesa: `🏠 Moradia`, `🍔 Alimentação`, `🚗 Transporte`, etc.
- Categorias de renegociação: `🔄 Renegociação`

```bash
# Executar seed manualmente
docker exec -it financeai-backend-backend-1 python seed.py
```
