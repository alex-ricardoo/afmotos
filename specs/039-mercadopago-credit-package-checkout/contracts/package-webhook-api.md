# Contract: Package Webhook API (Mercado Pago Event Processing)

## Notificação Assíncrona de Pagamento

`POST /api/webhooks/mercadopago`

Reutiliza o endpoint oficial existente, processando eventos de compras de pacotes e consultas individuais com base na finalidade (`purpose`).

### Headers Obrigatórios
- `x-signature`: manifesto contendo `ts` e `v1` para validação criptográfica HMAC SHA-256.
- `x-request-id`: identificador único de rastreamento do Mercado Pago.

### Payload Recebido

```json
{
  "id": "1234567890",
  "live_mode": true,
  "type": "payment",
  "date_created": "2026-09-17T15:30:00Z",
  "user_id": 987654321,
  "api_version": "v1",
  "action": "payment.created",
  "data": {
    "id": "9988776655"
  }
}
```

### Ciclo de Processamento e Roteamento por Finalidade

1. **Validação Criptográfica HMAC**:
   - Rejeição imediata (`401 Unauthorized`) se assinatura inválida ou ausente.
2. **Deduplicação do Evento**:
   - Se o identificador de pagamento já foi processado com sucesso, ignora retornando `200 OK` (`duplicate_ignored`).
3. **Busca Autoritativa do Pagamento**:
   - Chamada direta à API oficial do Mercado Pago (`GET /v1/payments/9988776655`).
4. **Localização da Ordem / Transação Interna**:
   - Localiza por `payment.external_reference` em `credit_package_orders.id` ou `payment_transactions.id`.
5. **Validação Rigorosa de Dados**:
   - `payment.status === 'approved'`
   - `Math.round(payment.transaction_amount * 100) === order.price_cents`
   - `payment.currency_id === order.currency`
6. **Execução da Concessão**:
   - Atualiza `credit_package_orders.status = 'paid'` e `paid_at = now()`.
   - Atualiza `payment_transactions.status = 'approved'`.
   - Chama a função atômica `grant_credit_package_from_paid_order(order.id)`.
7. **Resposta**: Retorna `200 OK` em menos de 1000ms.

### Resposta de Sucesso (200 OK)

```json
{
  "received": true,
  "status": "processed",
  "purpose": "credit_package",
  "orderId": "770e8400-e29b-41d4-a716-446655440022",
  "durationMs": 420
}
```
