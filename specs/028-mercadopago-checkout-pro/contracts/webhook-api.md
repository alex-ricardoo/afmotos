# API Contract: Webhook API

**Endpoint**: `POST /api/webhooks/mercadopago`  
**Authentication**: Signature-based (HMAC-SHA256 via `x-signature` header)  
**Caller**: Mercado Pago Notification Service  

---

## 1. Descrição

Recebe notificações assíncronas do Mercado Pago sobre atualizações de pagamento (`payment`), valida a assinatura criptográfica, audita o evento em `webhook_events`, busca as informações definitivas na API do provedor e atualiza a transação e a consulta veicular de forma atômica e idempotente.

---

## 2. Request

### Headers
```http
Content-Type: application/json
x-signature: ts=1704067200,v1=a1b2c3d4e5f6...
x-request-id: 9a8b7c6d-5e4f-3a2b-1c0d-ef0123456789
```

### Request Body (Exemplo Mercado Pago v1/v2)
```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "12345678901"
  },
  "date_created": "2026-09-12T15:30:00Z",
  "id": 9988776655,
  "live_mode": false,
  "type": "payment",
  "user_id": 123456789
}
```

---

## 3. Algoritmo de Processamento do Webhook

1. **Validação de Cabeçalhos**:
   - Se `x-signature` ou `x-request-id` estiverem ausentes: responder HTTP 400 (`MISSING_SIGNATURE`).
2. **Validação Criptográfica HMAC-SHA256**:
   - Extrair `ts` e `v1` do cabeçalho `x-signature`.
   - Obter o ID do recurso (`data.id` ou `id`).
   - Montar o template: `id:${dataId};request-id:${xRequestId};ts:${ts};`
   - Computar HMAC com `MERCADO_PAGO_WEBHOOK_SECRET`.
   - Comparar usando `crypto.timingSafeEqual`. Se inválido: gravar em `webhook_events` com `signature_valid = false` e responder HTTP 401.
3. **Idempotência de Notificação**:
   - Verificar se o evento já foi processado com sucesso na tabela `webhook_events`.
   - Se sim, responder HTTP 200 imediatamente.
4. **Consulta Direta à API do Mercado Pago**:
   - Executar `Payment.get({ id: dataId })` usando o `MERCADO_PAGO_ACCESS_TOKEN` do servidor.
5. **Correlação e Mapeamento**:
   - Localizar a transação em `payment_transactions` usando `external_reference` (ID interno da transação) ou `mp_payment_id`.
   - Atualizar a transação com `mp_payment_id`, status normalizado (`approved`, `in_process`, etc.) e timestamp.
6. **Liberação Condicional da Consulta**:
   - Se o status verificado for `approved` e a consulta veicular correspondente estiver com `payment_status = 'unpaid'`:
     - Acionar a rotina `releaseVerifiedPaidConsultation(transactionId)`.
     - A rotina executa a busca veicular (API Brasil), armazena o resultado em `customer_plate_consultations.vehicle_data` e marca como `completed`.
     - Gravar evento em `consultation_audit_logs`.
7. **Resposta Rápida**: Responder HTTP 200 ao provedor em menos de 3 segundos.

---

## 4. Response

### Success Response (HTTP 200 OK)
```json
{
  "received": true,
  "status": "processed"
}
```

### Ignored Response (HTTP 200 OK - para tópicos não suportados, ex.: merchant_order)
```json
{
  "received": true,
  "status": "ignored"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Assinatura ou cabeçalhos obrigatórios ausentes"
}
```

#### 401 Unauthorized
```json
{
  "error": "Assinatura de notificação inválida"
}
```
