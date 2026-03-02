# 📡 Referência da API — FinAI Mente

> URL base local: `http://localhost:8000/api/v1`  
> Documentação interativa: `http://localhost:8000/docs` (Swagger UI)

---

## Autenticação

A API utiliza **JWT Bearer Token**. Para autenticar, faça login e inclua o token no header:
```
Authorization: Bearer <seu-token>
```

### `POST /auth/register`
Cadastra um novo usuário.

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "password": "SenhaSegura123!"
}
```

### `POST /auth/login`
Autentica e retorna o token JWT.

**Body (form-data):**
```
username=joao@email.com
password=SenhaSegura123!
```

**Response:**
```json
{ "access_token": "eyJhbGci...", "token_type": "bearer" }
```

---

## Lançamentos

### `GET /lancamentos`
Lista todos os lançamentos do usuário autenticado. Suporta filtros via query string.

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `tipo` | `receita` \| `despesa` | Filtrar por tipo |
| `categoria_id` | Integer | Filtrar por categoria |
| `data_inicio` | Date (YYYY-MM-DD) | Data mínima de vencimento |
| `data_fim` | Date (YYYY-MM-DD) | Data máxima de vencimento |
| `is_pago` | Boolean | Filtrar por status de pagamento |

### `POST /lancamentos`
Cria um novo lançamento. Dispara automaticamente a indexação do embedding em background.

**Body:**
```json
{
  "tipo": "despesa",
  "descricao": "Supermercado Extra",
  "valor": 250.00,
  "data_vencimento": "2026-03-05",
  "categoria_id": 2,
  "is_pago": false,
  "observacoes": "Compras do mês"
}
```

### `GET /lancamentos/{id}`
Retorna um lançamento específico.

### `PUT /lancamentos/{id}`
Atualiza um lançamento.

### `DELETE /lancamentos/{id}`
Remove o lançamento e seu embedding associado.

---

## Categorias

### `GET /categorias`
Lista categorias do usuário (globais + próprias).

### `POST /categorias`
Cria uma categoria personalizada.

**Body:**
```json
{
  "nome": "Streaming",
  "tipo": "despesa",
  "cor_hexa": "#7C3AED",
  "icone": "📺"
}
```

### `DELETE /categorias/{id}`
Remove uma categoria (e todos os lançamentos vinculados via cascade).

---

## Chat com IA

### `WebSocket /chat/ws`
Conexão WebSocket para chat em streaming com o assistente financeiro.

**Fluxo:**
1. Conectar: `ws://localhost:8000/api/v1/chat/ws?token=<jwt>`
2. Enviar mensagem: `{ "message": "Quanto gastei com alimentação este mês?" }`
3. Receber chunks de resposta em stream até receber `{ "done": true }`

---

## Dashboard / Resumos

### `GET /dashboard/resumo`
Retorna totais de receitas, despesas e saldo por período.

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `mes` | Integer | Mês (1–12) |
| `ano` | Integer | Ano |

**Response:**
```json
{
  "total_receitas": 5500.00,
  "total_despesas": 3200.50,
  "saldo": 2299.50,
  "por_categoria": [...]
}
```
