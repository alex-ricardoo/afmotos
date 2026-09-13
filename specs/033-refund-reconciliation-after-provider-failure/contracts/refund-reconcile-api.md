# Contrato de API: Reconciliação de Refund Mercado Pago

## Endpoint
`POST /api/mp/transactions/:transactionId/refund/reconcile`

## Autenticação
- Usuário autenticado (cookie de sessão Supabase) que seja proprietário da transação, OU
- Administrador (`is_admin: true`).

## Resposta de Sucesso (HTTP 200)
```json
{
  "success": true,
  "transactionId": "4c8e1227-293b-41a7-a3f4-f3f0437f8e46",
  "refundStatus": "confirmed",
  "paymentStatus": "refunded",
  "mpRefundId": "12345678",
  "amountCents": 4999,
  "currency": "BRL",
  "reconciled": true,
  "message": "Estorno confirmado com sucesso junto ao Mercado Pago."
}
```

## Resposta de Erro (HTTP 403 / 404 / 500)
```json
{
  "success": false,
  "error": "Acesso não autorizado para esta transação."
}
```
