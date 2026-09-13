# Contract: Admin Operations API

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Contract Type**: HTTP Admin API Route Handlers  
**Location**: `app/api/admin/delivery/`

---

## 1. List Delivery Jobs & Operational Health

- **Endpoint**: `GET /api/admin/delivery/jobs`
- **Autenticação**: Sessão de usuário com perfil de administrador ativo (`public.is_admin()`).

### Query Parameters
- `status`: `pending | processing | retry_scheduled | failed_permanent | completed`
- `failure_code`: Ex: `APIBRASIL_INSUFFICIENT_CREDITS`
- `page`: Número da página (padrão: 1)
- `pageSize`: Limite de itens por página (padrão: 20)

### Resposta (200 OK)
```json
{
  "success": true,
  "alerts": {
    "insufficientCredits": true,
    "insufficientCreditsMessage": "Ação urgente necessária: Saldo insuficiente na API Brasil. Recarregar a conta do provedor.",
    "staleLocksCount": 0,
    "pendingRefundsCount": 1
  },
  "stats": {
    "pendingJobs": 2,
    "inRetryJobs": 1,
    "failedJobs": 4,
    "completedToday": 28
  },
  "jobs": [
    {
      "id": "7b04968c-2f3b-481d-b6a3-f09c7ebae495",
      "consultationId": "9c1c4f52-8255-46b0-9b48-18e0d6bc9f01",
      "transactionId": "d3b07384-d113-40e9-a5c9-9405626be4f1",
      "plate": "ABC-1234",
      "status": "failed_permanent",
      "attemptCount": 1,
      "maxAttempts": 5,
      "lastErrorCode": "APIBRASIL_INSUFFICIENT_CREDITS",
      "lastErrorMessageSafe": "Saldo ou crédito insuficiente na conta da API Brasil.",
      "refundStatus": "pending",
      "createdAt": "2026-09-13T14:10:00Z"
    }
  ]
}
```

---

## 2. Retry Delivery Job (Manual Admin Reprocess)

Permite ao administrador forçar a retentativa de um laudo, **desde que não haja estorno solicitado ou confirmado**.

- **Endpoint**: `POST /api/admin/delivery/jobs/[jobId]/retry`
- **Autenticação**: Sessão de administrador.

### Regras de Execução
1. Verifica se a transação possui estorno iniciado (`refund_status IN ('requested', 'pending', 'confirmed')`).
   - Se possuir, **rejeita com HTTP 400**: *"Não é permitido reprocessar entrega para uma transação com estorno em andamento ou confirmado."*
2. Reseta `status = 'pending'`, `attempt_count = 0`, `locked_at = NULL`, `next_retry_at = now()`.
3. Registra evento de auditoria `admin_manual_job_retry_triggered`.

### Resposta (200 OK)
```json
{
  "success": true,
  "message": "Job reagendado para execução imediata."
}
```
