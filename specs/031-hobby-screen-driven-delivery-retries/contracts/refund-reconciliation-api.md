# Contract: Refund Reconciliation API

## Fluxo de Reconciliação Sob Demanda

Sob a ausência de crons frequentes no plano Vercel Hobby, a reconciliação de estornos pendentes é executada de forma transparente e autoritativa sempre que:
1. O cliente consulta seu status na rota `GET /api/mp/transactions/[transactionId]/status`.
2. Um administrador visualiza ou aciona a conferência de estornos.

### Integração com Mercado Pago SDK

```ts
const payment = await fetchAuthoritativePayment(refund.provider_payment_id);
if (payment.status === 'refunded' || payment.statusDetail === 'refunded') {
  // Transiciona status para 'confirmed'
  // Atualiza consulta e transação para 'refunded'
  // Cancela jobs pendentes de entrega
}
```

### Resposta de Reconciliação

```json
{
  "success": true,
  "status": "confirmed",
  "refundId": "uuid",
  "providerPaymentId": "1778123456",
  "amountCents": 1990,
  "confirmedAt": "2026-09-13T18:50:00.000Z"
}
```
