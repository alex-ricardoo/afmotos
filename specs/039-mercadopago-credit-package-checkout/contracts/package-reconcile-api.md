# Contract: Package Reconcile & Status API

## 1. Consulta de Status e Reconciliação do Cliente

`GET /api/cliente/credit-packages/orders/[orderId]/status`

Usado pela página de retorno `/cliente/pacotes/retorno/[orderId]` para acompanhar a liquidação do pagamento e a liberação dos créditos.

**Autenticação**: Sessão autenticada do usuário titular do pedido (`auth.uid() == order.user_id`).

### Resposta de Sucesso - Pagamento Ainda Pendente (200 OK)

```json
{
  "success": true,
  "orderId": "770e8400-e29b-41d4-a716-446655440022",
  "status": "pending",
  "isPaid": false,
  "isGranted": false,
  "creditsQuantity": 5,
  "amountFormatted": "R$ 180,00",
  "message": "Aguardando confirmação do pagamento pelo Mercado Pago."
}
```

### Resposta de Sucesso - Pagamento Confirmado e Créditos Liberados (200 OK)

```json
{
  "success": true,
  "orderId": "770e8400-e29b-41d4-a716-446655440022",
  "status": "paid",
  "isPaid": true,
  "isGranted": true,
  "creditsQuantity": 5,
  "newAvailableBalance": 12,
  "amountFormatted": "R$ 180,00",
  "grantedAt": "2026-09-17T15:31:02Z",
  "message": "Pagamento aprovado! 5 créditos foram adicionados ao seu saldo com sucesso."
}
```

---

## 2. Reconciliação Forçada Administrativa

`POST /api/admin/credit-package-orders/[orderId]/reconcile`

**Autenticação**: Administrador com perfil ativo (`is_active = true` e `role IN ('admin', 'super_admin')`).

### Comportamento
1. Localiza a ordem e sua transação associada.
2. Consulta a API oficial do Mercado Pago para obter o status atualizado em tempo real.
3. Se o pagamento estiver aprovado e o pedido ainda estiver pendente, atualiza a ordem para `paid` e invoca `grant_credit_package_from_paid_order(orderId)`.
4. Grava auditoria detalhada com o identificador do administrador responsável.

### Resposta de Sucesso (200 OK)

```json
{
  "success": true,
  "reconciled": true,
  "previousStatus": "pending",
  "currentStatus": "paid",
  "creditsGranted": 15,
  "mpPaymentId": "9988776655",
  "message": "Pedido reconciliado com sucesso. Créditos concedidos à conta do cliente."
}
```
