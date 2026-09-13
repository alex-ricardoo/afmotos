# Contract: Customer Delivery API

## Endpoint: `POST /api/cliente/consultas/[consultationId]/process-delivery`

Executa ou retenta o processamento de entrega do laudo veicular com o cliente presente em tela.

### Headers
- `Cookie`: Sessão autenticada do Supabase (`sb-...-auth-token`)

### Precondições
1. Usuário autenticado deve ser proprietário da consulta (`consultation.user_id === user.id`).
2. Transação associada deve estar com status `approved`.
3. Consulta e Job não podem estar em estado terminal (`completed`, `failed_permanent`, `refund_pending`, `refunded`, `manual_review`).
4. Se o job estiver em `retry_scheduled`, a hora atual (`now`) deve ser maior ou igual a `next_retry_at`.

### Resposta: Sucesso - Processamento Executado (HTTP 200)

```json
{
  "success": true,
  "status": "completed",
  "delivered": true,
  "message": "Laudo veicular entregue com sucesso.",
  "data": {
    "consultationId": "uuid",
    "status": "completed",
    "paymentStatus": "paid",
    "deliveryStatus": "completed"
  }
}
```

### Resposta: Horário de Retry ainda não atingido (HTTP 200)

```json
{
  "success": true,
  "status": "retry_scheduled",
  "delivered": false,
  "code": "retry_not_due",
  "nextRetryAt": "2026-09-13T18:30:00.000Z",
  "remainingSeconds": 45,
  "message": "Aguardando horário programado para nova tentativa."
}
```

### Resposta: Bloqueado por Concorrência / Em Processamento (HTTP 200)

```json
{
  "success": true,
  "status": "processing",
  "delivered": false,
  "code": "already_processing",
  "message": "A consulta já está sendo processada por outra requisição."
}
```

### Resposta: Não Autorizado (HTTP 401 / 403)

```json
{
  "error": "Não autorizado",
  "message": "Você precisa estar autenticado ou a consulta não pertence à sua conta."
}
```
