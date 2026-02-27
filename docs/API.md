# 📡 API Reference — Meu Norte

Base URL: `http://localhost:8000/api/v1`

Autenticação: `Authorization: Bearer <token>` em todas as rotas protegidas.

---

## 🔐 Auth

### `POST /auth/login`
Login e geração de token JWT.

**Body (form-data):**
```
username: string  (email)
password: string
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

### `POST /auth/register`
Registro de novo usuário.

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "nome": "Pedro Oliveira",
  "password": "minhasenha123"
}
```

---

### `GET /auth/me` 🔒
Dados do usuário autenticado.

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "nome": "Pedro Oliveira"
}
```

---

### `PUT /auth/change-password` 🔒
Troca a senha do usuário autenticado.

**Body:**
```json
{
  "senha_atual": "senhaantiga",
  "nova_senha": "novasenha123"
}
```

---

## 💸 Lançamentos

### `GET /lancamentos` 🔒
Lista lançamentos com filtros opcionais.

**Query Params:**
```
mes:      int  (1-12)
ano:      int
tipo:     string  (receita | despesa | renegociacao)
status:   string  (pago | pendente)
```

**Response:** `Array<Lancamento>`

---

### `POST /lancamentos` 🔒
Cria um ou mais lançamentos.

**Body:**
```json
{
  "descricao": "Salário",
  "valor": 5000.00,
  "tipo": "receita",
  "status": "pago",
  "data_vencimento": "2026-02-05",
  "categoria_id": 1,
  "observacoes": "",
  "grupo_parcelamento": null
}
```

---

### `PUT /lancamentos/{id}` 🔒
Edita um lançamento. 

**Query Params:**
```
update_all: bool  (para parcelas agrupadas)
```

---

### `DELETE /lancamentos/{id}` 🔒
Remove lançamento. Com `delete_all=true` remove todo o grupo de parcelas.

---

## 📊 Dashboard

### `GET /dashboard/resumo` 🔒
Retorna todos os dados do Dashboard para o mês/ano.

**Query Params:** `mes`, `ano`

**Response:**
```json
{
  "kpis": {
    "receita_mes": 5000.0,
    "despesa_mes": 3200.0,
    "renegociacao_mes": 0.0,
    "saldo_disponivel": 1800.0,
    "taxa_poupanca_perc": 36.0,
    "crescimento_receita_perc": 5.2,
    "crescimento_despesa_perc": -1.3,
    "contas_a_vencer_qnt": 3,
    "contas_a_vencer_valor": 950.0
  },
  "despesas_categoria": [
    { "categoria": "Moradia", "valor": 1500.0, "percentual": 46.9 }
  ],
  "fluxo_caixa": [
    { "day": 1, "receita": 5000.0, "despesa": 0.0, "renegociacao": 0.0 }
  ],
  "proximos_vencimentos": [
    {
      "descricao": "Conta de Luz",
      "valor": 150.0,
      "data_vencimento": "2026-02-28",
      "dias_para_vencer": 1,
      "status": "HOJE"
    }
  ]
}
```

---

## 📈 Relatórios

### `GET /relatorios/resumo` 🔒

**Query Params:** `periodo` (mensal|trimestral|anual), `mes`, `ano`

**Response:**
```json
{
  "evolucao": [
    { "month": "Mar", "receita": 5000, "despesa": 3100, "renegociacao": 0, "saldo": 1900 }
  ],
  "ranking_categorias": [
    { "name": "Moradia", "current": 1500, "prev": 1500, "change": 0.0 }
  ],
  "indicadores": {
    "taxa_poupanca_perc": 36.0,
    "comprometimento_renda_perc": 64.0,
    "total_receitas": 5000.0,
    "total_despesas": 3200.0
  },
  "projecao_saldo": [
    { "month": "Dez/25", "saldo": 1800.0, "tipo": "real" },
    { "month": "Jan/26", "saldo": 1900.0, "tipo": "real" },
    { "month": "Fev/26", "saldo": 1900.0, "tipo": "real" },
    { "month": "Mar/26", "saldo": 1867.0, "tipo": "proj" },
    { "month": "Abr/26", "saldo": 1867.0, "tipo": "proj" },
    { "month": "Mai/26", "saldo": 1867.0, "tipo": "proj" }
  ]
}
```

---

## 🗂️ Categorias

### `GET /categorias` 🔒
Lista todas as categorias do usuário.

### `POST /categorias` 🔒
```json
{ "nome": "Streaming", "tipo": "despesa", "icone": "📺" }
```

### `PUT /categorias/{id}` 🔒 | `DELETE /categorias/{id}` 🔒

---

## 💬 Chat (WebSocket)

### `WS /chat/ws`

**Conexão:**
```
ws://localhost:8000/api/v1/chat/ws?token=<jwt_token>
```

**Envio:**
```json
{ "message": "Quanto gastei em alimentação este mês?" }
```

**Recebimento (streaming):**
```json
{ "type": "token", "content": "Você" }
{ "type": "token", "content": " gastou" }
{ "type": "done" }
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `400` | Dados inválidos (ex: senha atual incorreta) |
| `401` | Token inválido ou expirado |
| `403` | Sem permissão para o recurso |
| `404` | Recurso não encontrado |
| `422` | Erro de validação Pydantic |
| `500` | Erro interno do servidor |
