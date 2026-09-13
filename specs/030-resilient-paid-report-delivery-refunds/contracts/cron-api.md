# Contract: Serverless Cron Endpoints

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Contract Type**: HTTP API Route Handlers (Protected)  
**Location**: `app/api/cron/`

---

## 1. Process Delivery Jobs

- **Endpoint**: `POST /api/cron/process-delivery-jobs`
- **Autenticação**: `Authorization: Bearer <CRON_SECRET>`

### Headers de Requisição
```http
POST /api/cron/process-delivery-jobs HTTP/1.1
Host: afmotos.vercel.app
Authorization: Bearer {CRON_SECRET}
Content-Type: application/json
```

### Respostas

#### 200 OK (Processamento Concluído)
```json
{
  "success": true,
  "workerId": "worker-f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "claimedCount": 3,
  "completedCount": 2,
  "retriedCount": 1,
  "failedCount": 0,
  "durationMs": 1420
}
```

#### 401 Unauthorized (Segredo Ausente ou Inválido)
```json
{
  "error": "Não autorizado. Token de cron inválido ou ausente."
}
```

---

## 2. Reconcile Pending Refunds

- **Endpoint**: `POST /api/cron/reconcile-pending-refunds`
- **Autenticação**: `Authorization: Bearer <CRON_SECRET>`

### Headers de Requisição
```http
POST /api/cron/reconcile-pending-refunds HTTP/1.1
Host: afmotos.vercel.app
Authorization: Bearer {CRON_SECRET}
Content-Type: application/json
```

### Respostas

#### 200 OK (Reconciliação Concluída)
```json
{
  "success": true,
  "checkedCount": 2,
  "confirmedCount": 1,
  "stillPendingCount": 1,
  "durationMs": 850
}
```
