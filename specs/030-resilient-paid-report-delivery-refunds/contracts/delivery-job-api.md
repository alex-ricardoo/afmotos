# Contract: Delivery Job Service API

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Contract Type**: Internal Service Contract  
**Location**: `lib/vehicle-delivery/delivery-service.ts`

---

## 1. Enqueue Delivery Job

Cria um job de entrega de forma atômica e idempotente no momento da aprovação do pagamento.

### Assinatura TypeScript
```ts
export interface EnqueueDeliveryJobParams {
  consultationId: string;
  transactionId: string;
  dbClient?: unknown;
}

export interface EnqueueDeliveryJobResult {
  success: boolean;
  jobId: string;
  alreadyExists: boolean;
  status: 'pending' | 'processing' | 'completed';
  error?: string;
}

export async function enqueueDeliveryJob(
  params: EnqueueDeliveryJobParams,
): Promise<EnqueueDeliveryJobResult>;
```

### Comportamento & Garantias
- Utiliza a constraint `idx_active_delivery_job_per_consultation` para garantir que no máximo 1 job ativo exista por consulta.
- Se já existir job em `pending` ou `processing`, retorna `alreadyExists: true` sem lançar erro.
- Atualiza `customer_plate_consultations.status = 'paid'` e `payment_status = 'paid'`.
- Registra evento `delivery_job_created` em `consultation_audit_logs`.

---

## 2. Claim and Process Batch

Reivindica atômica e concorrentemente um lote de jobs prontos para execução.

### Assinatura TypeScript
```ts
export interface ProcessBatchOptions {
  workerId: string;
  batchSize?: number;
  lockDurationSeconds?: number;
  dbClient?: unknown;
}

export interface ProcessBatchResult {
  claimedCount: number;
  completedCount: number;
  retriedCount: number;
  failedCount: number;
  durationMs: number;
}

export async function claimAndProcessDeliveryJobs(
  options: ProcessBatchOptions,
): Promise<ProcessBatchResult>;
```

### Comportamento & Garantias
- Executa a stored procedure `claim_next_delivery_jobs` com `FOR UPDATE SKIP LOCKED`.
- Processa cada job aplicando a regra Cache-First:
  - Cache Hit: snapshot copiado, job `completed`, consulta `completed`.
  - Cache Miss: chamada à API Brasil Live.
  - Sucesso: persiste dados, job `completed`, consulta `completed`.
  - Falha Transitória: incrementa `attempt_count`, calcula `next_retry_at`, job `retry_scheduled`.
  - Falha Definitiva / Max Attempts: marca job como `failed_permanent`, consulta como `failed_permanent` e dispara `initiateRefundForFailedDelivery`.
