# Contrato de API: Detalhes e Auditoria de Pagamento e Consulta

## 1. Rota
`GET /api/admin/payments/[transactionId]`

## 2. Autenticação e Autorização
- **Nível**: `admin` ou `super_admin` ativo em `admin_profiles`.

---

## 3. Resposta de Sucesso (HTTP 200 OK)

```json
{
  "transaction": {
    "id": "4c8e1227-293b-41a7-a3f4-f3f0437f8e46",
    "mpPaymentId": "177874977077",
    "mpPreferenceId": "pref_999888777",
    "amount": 49.90,
    "currency": "BRL",
    "paymentMethodId": "pix",
    "paymentTypeId": "bank_transfer",
    "status": "approved",
    "statusDetail": "accredited",
    "createdAt": "2026-09-13T16:20:10.000Z",
    "confirmedAt": "2026-09-13T16:21:00.000Z",
    "updatedAt": "2026-09-13T16:22:30.000Z"
  },
  "consultation": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "plate": "BRA2E19",
    "plateNormalized": "BRA2E19",
    "status": "failed",
    "paymentStatus": "paid",
    "hasReportData": false,
    "createdAt": "2026-09-13T16:20:00.000Z",
    "processedAt": null,
    "customer": {
      "id": "c0a80101-0000-0000-0000-000000000001",
      "fullName": "Carlos Eduardo Silva",
      "email": "carlos.silva@email.com",
      "phone": "(11) 98765-4321"
    }
  },
  "delivery": {
    "jobId": "f1e2d3c4-b5a6-7890-1234-56789abcdef0",
    "status": "failed_permanent",
    "attemptCount": 1,
    "maxAttempts": 5,
    "provider": "apibrasil",
    "mode": "live",
    "lastErrorCode": "APIBRASIL_INSUFFICIENT_CREDITS",
    "lastHttpStatus": 402,
    "lastFailureClass": "permanent",
    "lastErrorMessageSafe": "Saldo insuficiente na conta corporativa do provedor veicular.",
    "supportActionRequired": "RECHARGE_APIBRASIL",
    "nextRetryAt": null,
    "lockedAt": null,
    "lockedBy": null
  },
  "refund": {
    "refundId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "pending",
    "providerRefundId": null,
    "amountCents": 4990,
    "currency": "BRL",
    "reasonCode": "APIBRASIL_INSUFFICIENT_CREDITS",
    "reasonSafe": "Saldo insuficiente no provedor de laudos.",
    "requestedAt": "2026-09-13T16:25:00.000Z",
    "confirmedAt": null,
    "lastErrorCode": null,
    "lastErrorSafe": null
  },
  "eligibility": {
    "canRefund": false,
    "refundBlockedReason": "Estorno já solicitado anteriormente e com processamento pendente.",
    "canReprocess": false,
    "reprocessBlockedReason": "Reprocessamento bloqueado enquanto houver estorno ativo ou pendente.",
    "canReconcile": true,
    "isInsufficientCredits": true
  },
  "timeline": [
    {
      "id": "log-001",
      "timestamp": "2026-09-13T16:20:10.000Z",
      "actorType": "customer",
      "actorIdMasked": "c0a8****0001",
      "event": "payment_preference_created",
      "previousStatus": null,
      "newStatus": "pending",
      "summary": "Preferência de pagamento criada via Mercado Pago Checkout Pro."
    },
    {
      "id": "log-002",
      "timestamp": "2026-09-13T16:21:00.000Z",
      "actorType": "webhook",
      "actorIdMasked": "mercadopago",
      "event": "payment_approved",
      "previousStatus": "pending",
      "newStatus": "approved",
      "summary": "Notificação autoritativa de pagamento aprovado recebida do Mercado Pago."
    },
    {
      "id": "log-003",
      "timestamp": "2026-09-13T16:21:02.000Z",
      "actorType": "system",
      "actorIdMasked": "worker-delivery",
      "event": "delivery_attempt_failed",
      "previousStatus": "processing",
      "newStatus": "failed_permanent",
      "summary": "Chamada à API Brasil retornou HTTP 402: APIBRASIL_INSUFFICIENT_CREDITS."
    },
    {
      "id": "log-004",
      "timestamp": "2026-09-13T16:25:00.000Z",
      "actorType": "admin",
      "actorIdMasked": "adm_****1234",
      "event": "admin_refund_requested",
      "previousStatus": "approved",
      "newStatus": "refund_pending",
      "summary": "Administrador confirmou solicitação de estorno total por saldo insuficiente."
    }
  ]
}
```
