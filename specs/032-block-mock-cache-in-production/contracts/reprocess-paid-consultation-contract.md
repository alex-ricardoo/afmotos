# Contract: Safe Reprocessing of Paid Consultations

---

## Assinatura do Procedimento

```ts
export interface ReprocessConsultationParams {
  transactionId?: string;
  consultationId?: string;
  forceLiveProvider?: boolean;
}

export interface ReprocessConsultationResult {
  success: boolean;
  consultationId: string;
  transactionId: string;
  status: 'completed' | 'refunded' | 'failed_permanent' | 'processing';
  actionTaken: 'LIVE_LOOKUP_SUCCEEDED' | 'REFUND_INITIATED' | 'ALREADY_LIVE' | 'NO_OP';
  newVpcId?: string;
  error?: string;
}

export async function reprocessMockedPaidConsultation(
  params: ReprocessConsultationParams
): Promise<ReprocessConsultationResult>;
```

---

## Garantias de Idempotência e Auditoria

1. **Validação de Pagamento**: O reprocessamento exige transação aprovada no Mercado Pago (`payment_transactions.status = 'approved'`).
2. **Lock Pessimista Concorrente**: Utiliza o job de entrega persistido ou lock transacional para impedir duas chamadas concorrentes à API Brasil.
3. **Auditoria**: Registra todos os passos na tabela `consultation_audit_logs`.
