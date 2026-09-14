# Contrato de API: Listagem de Pagamentos e Consultas Administrativas

## 1. Rota
`GET /api/admin/payments`

## 2. Autenticação e Autorização
- **Cabeçalho**: Cookie de sessão Supabase (`sb-...-auth-token`).
- **Nível**: `admin` ou `super_admin` ativo em `admin_profiles`.

---

## 3. Query Parameters

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `page` | `integer` | `1` | Página atual (base 1) |
| `pageSize` | `integer` | `20` | Itens por página (máx. 100) |
| `search` | `string` | `null` | Busca por placa, transactionId, mpPaymentId, refundId, e-mail ou nome |
| `status` | `string` | `null` | Filtro por status de pagamento (`approved`, `pending`, `refunded`, etc.) |
| `deliveryStatus` | `string` | `null` | Filtro por status de entrega (`completed`, `processing`, `failed_permanent`, etc.) |
| `refundStatus` | `string` | `null` | Filtro por status de estorno (`none`, `pending`, `confirmed`, `failed`, `manual_review`) |
| `attentionOnly` | `boolean` | `false` | Apenas transações que requerem atenção operacional |
| `insufficientCreditsOnly` | `boolean` | `false` | Apenas casos com erro `APIBRASIL_INSUFFICIENT_CREDITS` ou HTTP 402 |
| `approvedWithoutReportOnly` | `boolean` | `false` | Pagamentos aprovados sem laudo entregue |
| `pendingRefundsOnly` | `boolean` | `false` | Estornos em estado solicitado, pendente ou falho |
| `startDate` | `string` | `null` | Data ISO inicial (ex.: `2026-09-01T00:00:00Z`) |
| `endDate` | `string` | `null` | Data ISO final (ex.: `2026-09-13T23:59:59Z`) |

---

## 4. Resposta de Sucesso (HTTP 200 OK)

```json
{
  "summary": {
    "totalApproved": 142,
    "totalReportsCompleted": 138,
    "totalInProcessing": 2,
    "totalRetryScheduled": 1,
    "totalPermanentFailures": 1,
    "totalPendingRefunds": 1,
    "totalConfirmedRefunds": 2,
    "totalInsufficientCredits": 1
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 145,
    "totalPages": 8
  },
  "items": [
    {
      "transactionId": "4c8e1227-293b-41a7-a3f4-f3f0437f8e46",
      "paymentCreatedAt": "2026-09-13T16:20:10.000Z",
      "paymentUpdatedAt": "2026-09-13T16:22:30.000Z",
      "amount": 49.90,
      "amountFormatted": "R$ 49,90",
      "paymentMethodId": "pix",
      "paymentTypeId": "bank_transfer",
      "paymentStatus": "approved",
      "paymentStatusDetail": "accredited",
      "mpPaymentId": "177874977077",
      
      "consultationId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "plate": "BRA2E19",
      "plateNormalized": "BRA2E19",
      "consultationStatus": "failed",
      "consultationPaymentStatus": "paid",
      "hasReportData": false,
      
      "customer": {
        "id": "c0a80101-0000-0000-0000-000000000001",
        "name": "Carlos Eduardo Silva",
        "email": "carlos.silva@email.com",
        "phone": "(11) 98765-4321"
      },
      
      "delivery": {
        "jobId": "f1e2d3c4-b5a6-7890-1234-56789abcdef0",
        "status": "failed_permanent",
        "attemptCount": 1,
        "maxAttempts": 5,
        "nextRetryAt": null,
        "lastErrorCode": "APIBRASIL_INSUFFICIENT_CREDITS",
        "lastHttpStatus": 402,
        "lastFailureClass": "permanent",
        "reportOrigin": "apibrasil_live_failed"
      },
      
      "refund": {
        "refundId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "pending",
        "providerRefundId": null,
        "reasonCode": "APIBRASIL_INSUFFICIENT_CREDITS",
        "reasonSafe": "Saldo insuficiente na conta corporativa do provedor veicular.",
        "requestedAt": "2026-09-13T16:25:00.000Z",
        "confirmedAt": null,
        "lastErrorCode": null
      },
      
      "flags": {
        "isInsufficientCredits": true,
        "isRefundEligible": false,
        "isReprocessEligible": false,
        "requiresAttention": true,
        "attentionReason": "Saldo insuficiente na API Brasil e estorno pendente de reconciliação."
      }
    }
  ]
}
```

---

## 5. Respostas de Erro

- **401 Unauthorized**: `{ "error": "Não autenticado.", "code": "UNAUTHORIZED" }`
- **403 Forbidden**: `{ "error": "Acesso restrito a administradores.", "code": "FORBIDDEN" }`
- **500 Internal Server Error**: `{ "error": "Erro ao consultar transações operacionais.", "code": "INTERNAL_SERVER_ERROR" }`
