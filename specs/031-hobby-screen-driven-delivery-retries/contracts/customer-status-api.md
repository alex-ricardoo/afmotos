# Contract: Customer Transaction & Consultation Status API

## Endpoint: `GET /api/mp/transactions/[transactionId]/status`

### Resposta Expandida para Hotfix Vercel Hobby (HTTP 200)

```json
{
  "id": "uuid",
  "status": "approved",
  "statusDetail": "accredited",
  "transactionAmount": 19.9,
  "consultationId": "uuid",
  "consultationStatus": "retry_scheduled",
  "deliveryStatus": "retry_scheduled",
  "isPaid": true,
  "isCompleted": false,
  "isFailed": false,
  "isRefunded": false,
  "isRetrying": true,
  "customerTitle": "Instabilidade temporária na consulta",
  "customerMessage": "Estamos enfrentando uma instabilidade temporária para consultar a placa. Você não precisa pagar novamente; tentaremos novamente automaticamente enquanto esta página estiver aberta.",
  "nextAction": "wait_retry",
  "nextRetryAt": "2026-09-13T18:32:00.000Z",
  "remainingRetrySeconds": 48,
  "retryAttempt": 2,
  "maxRetryAttempts": 5,
  "contactSupport": false,
  "supportUrl": "https://wa.me/5511999999999?text=..."
}
```

### Estados Mapeados

| `consultationStatus` | `customerTitle` | `nextAction` |
|---|---|---|
| `pending` | Aguardando confirmação | `wait_payment` |
| `approved_pending_report` / `processing` | Pagamento aprovado! Gerando laudo... | `wait_report` |
| `retry_scheduled` | Instabilidade temporária na consulta | `wait_retry` |
| `completed` | Laudo disponível! | `view_report` |
| `failed_permanent` / `refund_pending` | Indisponibilidade na consulta | `contact_support` |
| `refunded` | Pagamento estornado | `none` |
