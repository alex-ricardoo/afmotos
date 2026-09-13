# API Contract: Mercado Pago Webhook API

**Endpoint**: `POST /api/webhooks/mercadopago`  
**Authentication**: Baseada em Assinatura Criptográfica HMAC-SHA256 (`x-signature`, `x-request-id`)  
**Caller**: Serviço Oficial de Notificações do Mercado Pago  

---

## 1. Descrição

Recebe notificações assíncronas do Mercado Pago informando atualizações em recursos de pagamento (`payment`). Valida a assinatura HMAC-SHA256 com tratamento resiliente de cabeçalhos e identificadores, audita o evento na tabela `webhook_events`, busca os dados canônicos na API do provedor com token de servidor e atualiza atomicamente a transação interna e a consulta veicular.

---

## 2. Request

### Headers
```http
Content-Type: application/json
x-signature: ts=1778579076,v1=9f83a1c... (ordem de chaves arbitrária)
x-request-id: a641bfb3-1579-4d69-a1b7-7e6df5b9e59d
```

### Request Body (Exemplo Real de Notificação Mercado Pago)
```json
{
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "177857907601"
  },
  "date_created": "2026-09-13T14:10:00Z",
  "id": 9876543210,
  "live_mode": true,
  "type": "payment",
  "user_id": 123456789
}
```

### Query Parameters (Alternativa Suportada)
```text
POST /api/webhooks/mercadopago?data.id=177857907601&type=payment
```

---

## 3. Algoritmo de Verificação de Assinatura

1. **Extração do Segredo**: Obter `MERCADO_PAGO_WEBHOOK_SECRET` do ambiente. Se ausente, rejeitar com 401.
2. **Resolução do Recurso**:
   - Prioridade 1: `payload.data.id` (string ou número convertido para string sem espaços externos).
   - Prioridade 2: `data.id` da query string.
   - Prioridade 3: `id` da query string (apenas se for aplicável ao evento de pagamento).
   - Se nenhum encontrado: rejeitar com motivo `missing_resource_id`.
3. **Parse de `x-signature`**:
   - Suportar `ts=...,v1=...` e `v1=...,ts=...` com espaços tolerados.
   - Extrair `ts` e `v1`.
4. **Construção do Manifesto Oficial**:
   ```text
   id:{resourceId};request-id:{xRequestId};ts:{ts};
   ```
5. **Cálculo HMAC-SHA256**:
   - `crypto.createHmac('sha256', secret).update(manifest, 'utf8').digest('hex')`
6. **Comparação Timing-Safe**:
   - Validar que `v1` é hexadecimal válido e possui 64 caracteres hexadecimais (32 bytes).
   - Comparar `Buffer.from(expected, 'hex')` e `Buffer.from(v1, 'hex')` com `crypto.timingSafeEqual`.
7. **Tratamento de Mismatch**:
   - Se divergente: responder HTTP 401 sem revelar segredos ou hashes completos.

---

## 4. Responses

### Success Response (HTTP 200 OK)
```json
{
  "received": true,
  "status": "processed",
  "durationMs": 142
}
```

### Ignored / Duplicate Response (HTTP 200 OK)
```json
{
  "received": true,
  "status": "ignored"
}
```

### Unauthorized (HTTP 401 Unauthorized)
```json
{
  "error": "Assinatura de notificação inválida ou ausente."
}
```

### Provider Error (HTTP 502 Bad Gateway)
```json
{
  "error": "Falha ao buscar pagamento na API do provedor."
}
```
