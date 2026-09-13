# Contract: Admin Delivery API

## 1. Listagem de Jobs: `GET /api/admin/delivery/jobs`

### Headers
- `Cookie`: Sessão com permissão administrativa (`role = 'admin'`)

### Query Parameters
- `status`: `pending` | `processing` | `retry_scheduled` | `failed_permanent` | `completed`
- `limit`: padrão 50

### Resposta (HTTP 200)

```json
{
  "success": true,
  "metrics": {
    "total": 12,
    "queued": 0,
    "processing": 1,
    "retrying": 2,
    "permanentFailures": 1,
    "pendingRefunds": 1,
    "insufficientCreditsAlert": false
  },
  "jobs": [
    {
      "id": "uuid",
      "consultationId": "uuid",
      "transactionId": "uuid",
      "plate": "ABC1D23",
      "status": "retry_scheduled",
      "attemptCount": 2,
      "maxAttempts": 5,
      "nextRetryAt": "2026-09-13T18:45:00.000Z",
      "lastErrorCode": "APIBRASIL_TIMEOUT",
      "lastErrorMessageSafe": "Tempo limite esgotado ao consultar a API de veículos.",
      "createdAt": "2026-09-13T18:00:00.000Z"
    }
  ]
}
```

---

## 2. Reprocessamento Manual: `POST /api/admin/delivery/jobs/[jobId]/retry`

### Precondição
Não deve existir estorno solicitado (`requested`), pendente (`pending`) ou confirmado (`confirmed`).

### Resposta (HTTP 200)

```json
{
  "success": true,
  "jobId": "uuid",
  "status": "completed",
  "message": "Job reprocessado com sucesso pelo administrador."
}
```
