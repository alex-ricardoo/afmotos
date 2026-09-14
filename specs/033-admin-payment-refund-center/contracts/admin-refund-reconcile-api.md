# Contrato de API: Reconciliação Autoritativa de Estorno

## 1. Rota
`POST /api/admin/payments/[transactionId]/refund/reconcile`

## 2. Autenticação e Autorização
- **Nível**: `admin` ou `super_admin` ativo em `admin_profiles`.

---

## 3. Comportamento e Regras de Negócio

1. Busca a transação e o registro de estorno associado (`payment_refunds`).
2. Recupera o `mp_payment_id` real (caso não esteja presente, realiza busca autoritativa pelo ID externo).
3. Consulta diretamente o Mercado Pago via `fetchAuthoritativePayment` e `PaymentRefund.list({ payment_id })`.
4. Se o gateway confirmar o estorno:
   - Atualiza `payment_refunds.status = 'confirmed'`.
   - Atualiza `payment_transactions.status = 'refunded'` e `refund_status = 'refunded'`.
   - Atualiza `customer_plate_consultations.payment_status = 'refunded'`.
   - Cancela jobs de entrega pendentes ou em retentativa.
   - Registra auditoria com `actor_type = 'admin'`.
5. Se o estorno continuar em processamento:
   - Mantém `payment_refunds.status = 'pending'`.
6. Se não houver nenhum estorno no gateway:
   - Mantém o status e não cria um novo estorno automaticamente sem validação explícita de elegibilidade.

---

## 4. Respostas

### 4.1. Sucesso: Estorno Confirmado no Gateway (HTTP 200 OK)

```json
{
  "success": true,
  "transactionId": "4c8e1227-293b-41a7-a3f4-f3f0437f8e46",
  "refundId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "providerRefundId": "987654321",
  "status": "confirmed",
  "reconciled": true,
  "message": "Estorno confirmado com sucesso junto ao Mercado Pago."
}
```

### 4.2. Sucesso: Estorno Ainda em Análise (HTTP 200 OK)

```json
{
  "success": true,
  "transactionId": "4c8e1227-293b-41a7-a3f4-f3f0437f8e46",
  "refundId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "reconciled": false,
  "message": "Estorno continua em processamento no gateway Mercado Pago."
}
```

### 4.3. Erro: Pagamento não Encontrado (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "Transação não encontrada ou sem registro de estorno associado.",
  "code": "NOT_FOUND"
}
```
