# 🗄️ Banco de Dados — FinAI Mente

## Tecnologias

- **PostgreSQL 15** com a extensão **`pgvector`** para armazenamento e busca vetorial
- **Alembic** para migrations versionadas
- **SQLAlchemy** (modo async com `asyncpg`) como ORM

---

## Diagrama de Entidades (ER simplificado)

```
┌──────────────────────────────────────────────────────────┐
│                          users                           │
├──────────────────────────────────────────────────────────┤
│ id (PK)  │ nome  │ email (UNIQUE)  │ hashed_password     │
│ is_active │ created_at                                   │
└──────────────────────┬───────────────────────────────────┘
                       │ 1:N
          ┌────────────▼──────────────────────────┐
          │              categorias               │
          ├───────────────────────────────────────┤
          │ id (PK) │ nome │ tipo (receita|despesa)│
          │ cor_hexa │ icone │ user_id (FK)         │
          └────────────┬──────────────────────────┘
                       │ 1:N
          ┌────────────▼──────────────────────────┐
          │             lancamentos               │
          ├───────────────────────────────────────┤
          │ id (PK)  │ user_id (FK)               │
          │ categoria_id (FK)                     │
          │ tipo (receita|despesa)                │
          │ descricao  │ valor (Numeric 10,2)      │
          │ data_vencimento (Date)                │
          │ data_pagamento (Date, nullable)       │
          │ is_pago (Boolean)                     │
          │ observacoes (text, nullable)          │
          │ parcela_group_id (String, nullable)   │
          │ created_at │ updated_at               │
          └────────────┬──────────────────────────┘
                       │ 1:1
          ┌────────────▼──────────────────────────┐
          │         finance_embeddings            │
          ├───────────────────────────────────────┤
          │ id (PK)  │ lancamento_id (FK, UNIQUE) │
          │ content_text (Text)                   │
          │ embedding (vector(768))   ← pgvector  │
          │ created_at                            │
          └───────────────────────────────────────┘
```

---

## Tabelas e Campos

### `users`
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | Integer | ✅ | PK autoincrement |
| `nome` | String | ✅ | Nome do usuário |
| `email` | String (UNIQUE) | ✅ | Email para login |
| `hashed_password` | String | ✅ | Senha com bcrypt |
| `is_active` | Boolean | ✅ | Ativo/inativo |
| `created_at` | Timestamp | auto | Data de criação |

### `categorias`
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | Integer | ✅ | PK |
| `nome` | String | ✅ | Ex: "Alimentação" |
| `tipo` | String | ✅ | `receita` ou `despesa` |
| `cor_hexa` | String | ❌ | Ex: `#EF4444` |
| `icone` | String | ❌ | Ex: `🛒` |
| `user_id` | FK → users | ❌ | `null` = categoria global |

### `lancamentos`
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | Integer | ✅ | PK |
| `user_id` | FK → users | ✅ | Dono do lançamento |
| `categoria_id` | FK → categorias | ✅ | Categoria |
| `tipo` | String | ✅ | `receita` ou `despesa` |
| `descricao` | String | ✅ | Texto livre |
| `valor` | Numeric(10,2) | ✅ | Valor monetário |
| `data_vencimento` | Date | ✅ | Data de vencimento |
| `data_pagamento` | Date | ❌ | Data efetiva do pagamento |
| `is_pago` | Boolean | ❌ | Padrão: `false` |
| `observacoes` | String | ❌ | Notas adicionais |
| `parcela_group_id` | String | ❌ | UUID que agrupa parcelas |

### `finance_embeddings`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Integer | PK |
| `lancamento_id` | FK → lancamentos (UNIQUE) | Relação 1:1 |
| `content_text` | Text | Texto que foi vetorizado |
| `embedding` | `vector(768)` | Vetor gerado pelo `nomic-embed-text` |

---

## Migrations (Alembic)

```bash
# Criar nova migration após alterar models
alembic revision --autogenerate -m "descricao da mudanca"

# Aplicar migrations
alembic upgrade head

# Reverter última migration
alembic downgrade -1
```
