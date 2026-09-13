# Contract: Mercado Pago Refund Service API

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Contract Type**: Internal Service Contract  
**Location**: `lib/mercadopago/refund-service.ts`

---

## 1. Initiate Refund for Failed Delivery

Inicia de forma atômica e idempotente o estorno total no Mercado Pago após falha definitiva da entrega de laudo.

### Assinatura TypeScript
```ts
export interface InitiateRefundParams {
  transactionId: string;
  consultationId: string;
  reasonCode: string;
  reasonSafe: string;
  dbClient?: unknown;
}

export interface InitiateRefundResult {
  success: boolean;
  refundId: string;
  providerRefundId?: string;
  status: 'requested' | 'pending' | 'confirmed' | 'failed';
  alreadyProcessed: boolean;
  message: string;
  error?: string;
}

export async function initiateRefundForFailedDelivery(
  params: InitiateRefundParams,
): Promise<InitiateRefundResult>;
```

### Regras de Negócio e Validações
1. **Verificação de Elegibilidade**:
   - `payment_transactions.status` deve ser `approved`.
   - `payment_transactions.mp_payment_id` não pode ser nulo.
   - Não pode existir registro com `status IN ('requested', 'pending', 'confirmed')` na tabela `payment_refunds`.
   - A consulta veicular correspondente não pode estar com `status = 'completed'` e laudo preenchido.
2. **Execução no Gateway**:
   - Invoca o SDK `new PaymentRefund(mpConfig).total({ payment_id })`.
   - Envia cabeçalho `X-Idempotency-Key: <refund_idempotency_key>`.
3. **Persistência**:
   - Grava `provider_refund_id` retornado pela API do Mercado Pago.
   - Atualiza `payment_refunds.status = 'pending'`.
   - Atualiza `customer_plate_consultations.status = 'refund_pending'`.
   - Registra auditoria em `consultation_audit_logs`.

---

## 2. Reconcile Refund Status

Reconcilia o estado do estorno no Mercado Pago para confirmar a efetiva devolução.

### Assinatura TypeScript
```ts
export interface ReconcileRefundResult {
  refundId: string;
  transactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmedAt?: string;
}

export async function reconcileSingleRefund(
  refundId: string,
  dbClient?: unknown,
): Promise<ReconcileRefundResult>;
```

### Efeito da Confirmação (`confirmed`):
- `payment_refunds.status = 'confirmed'` e `confirmed_at = now()`.
- `payment_transactions.status = 'refunded'`.
- `customer_plate_consultations.status = 'refunded'` e `payment_status = 'refunded'`.
- Auditoria: evento `refund_confirmed` emitido.
