# API Contract: Payment Status API

**Endpoint**: `GET /api/mp/transactions/[transactionId]/status`  
**Authentication**: Mandatory (Supabase Session Token / Cookie)  
**Role**: Authenticated Customer (Owner of transaction) or Admin  

---

## 1. Descrição

Retorna o status higienizado e normalizado de uma transação de pagamento para que a interface da área do cliente possa exibir o estado em tempo real (aprovado, pendente, rejeitado ou erro) e verificar a disponibilidade do laudo veicular.

---

## 2. Request

### Headers
```http
Accept: application/json
```

### URL Parameters
- `transactionId`: `string` (UUID da transação interna)

---

## 3. Regras de Segurança e Higienização

1. **Validação de Propriedade**: O servidor garante que `payment_transactions.user_id === user.id` (ou usuário possui role de administrador). Caso contrário, responde HTTP 403/404.
2. **Omissão Absoluta de Campos Sensíveis**:
   - NÃO retorna: `raw_response`, payloads do Mercado Pago, tokens, chaves, CPF, e-mail completo do pagador, chave de idempotência ou erros de infraestrutura.
   - Retorna APENAS: flags e enumeradores higienizados e normalizados.

---

## 4. Response

### Success Response (HTTP 200 OK)

```json
{
  "success": true,
  "transactionId": "d9887711-2233-4455-6677-8899aabbccdd",
  "consultationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "approved",
  "statusDetail": "accredited",
  "consultationStatus": "completed",
  "paymentStatus": "paid",
  "reportAvailable": true,
  "reportUrl": "/cliente/consultas/f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "retryable": false,
  "nextAction": "view_report"
}
```

### Estados Mapeados (`status`)
- `'approved'`: Pagamento confirmado. Se `consultationStatus === 'completed'`, `reportAvailable = true`.
- `'pending'`: Aguardando pagamento (Pix, boleto ou análise). `nextAction = 'wait'`.
- `'in_process'`: Em processamento no provedor. `nextAction = 'wait'`.
- `'rejected'`: Pagamento recusado. `retryable = true`, `nextAction = 'retry'`.
- `'cancelled'`: Pagamento cancelado. `retryable = true`, `nextAction = 'retry'`.
- `'provider_error'`: Instabilidade técnica momentânea. `retryable = true`, `nextAction = 'contact_support'`.

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Usuário não autenticado."
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Transação de pagamento não encontrada."
}
```
