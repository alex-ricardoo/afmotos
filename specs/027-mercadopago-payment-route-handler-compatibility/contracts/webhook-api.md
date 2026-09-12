# Contract: Mercado Pago Webhook API

**Route**: `POST /api/webhooks/mercadopago`  
**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  

---

## 1. Descrição do Endpoint

Endpoint HTTP receptor de notificações assíncronas enviadas pelo Mercado Pago quando há eventos de criação ou atualização de pagamentos.

---

## 2. Autenticação & Segurança

- **Público**: Não exige sessão de usuário.
- **Validação Criptográfica**: Validação obrigatória da assinatura HMAC SHA-256 recebida no cabeçalho `x-signature` utilizando o segredo `MERCADO_PAGO_WEBHOOK_SECRET`.
- **Verificação Ativa**: O endpoint NUNCA confia cegamente no payload recebido; ele utiliza o `data.id` para consultar os dados reais na API oficial do Mercado Pago (`GET /v1/payments/{id}`).

---

## 3. Especificação do Request

### Headers
```http
POST /api/webhooks/mercadopago
Content-Type: application/json
x-signature: ts=1726176500,v1=a1b2c3d4e5f6...
x-request-id: req_123456789
```

### Body Exemplo (Mercado Pago IPN / Webhook v1)
```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "98765432101"
  },
  "date_created": "2026-09-12T21:00:00Z",
  "id": 123456789,
  "live_mode": false,
  "type": "payment"
}
```

---

## 4. Especificação das Respostas

### 4.1 Processado com Sucesso (200 OK)
```json
{
  "received": true,
  "action": "payment.updated",
  "paymentId": "98765432101",
  "status": "approved",
  "processed": true
}
```

### 4.2 Ignorado / Não Relevante (200 OK)
```json
{
  "received": true,
  "ignored": true,
  "reason": "Evento não associado a pagamento ou ação não processável."
}
```

### 4.3 Assinatura Inválida (401 Unauthorized)
```json
{
  "error": "Assinatura HMAC do webhook inválida ou ausente."
}
```
