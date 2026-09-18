# Contract: Package Grant API (Atomic RPC & Internal Service)

## Concessão Atômica de Créditos

### Assinatura da Função RPC (PostgreSQL)

`public.grant_credit_package_from_paid_order(p_order_id UUID) -> JSONB`

### Contexto de Execução
- Chamada exclusivamente pelo backend server-side com privilégios de `SECURITY DEFINER` (Service Role) dentro do Webhook ou Reconciliação.
- NUNCA pode ser chamada diretamente pelo cliente no frontend.

### Parâmetros
- `p_order_id`: UUID identificador do pedido em `public.credit_package_orders`.

### Pré-condições Verificadas no Banco
1. `credit_package_orders.id == p_order_id` com lock pessimista (`FOR UPDATE`).
2. `credit_package_orders.status == 'paid'`.
3. Não existir registro anterior em `public.customer_credit_packages` com `purchase_order_id == p_order_id`.

### Efeitos Atômicos Produzidos
1. **Criação de Pacote**: Inserção em `customer_credit_packages` com:
   - `source = 'mercadopago_package'`
   - `credits_granted = order.credits_quantity`
   - `credits_remaining = order.credits_quantity`
   - `status = 'active'`
2. **Lançamento Contábil (Ledger)**: Inserção em `customer_credit_ledger` com:
   - `entry_type = 'grant'`
   - `reason_code = 'PACKAGE_PURCHASE_APPROVED'`
   - `idempotency_key = 'package-grant:' || p_order_id::text`
   - `available_effect = order.credits_quantity`
3. **Atualização de Balanço**: Upsert atômico em `customer_credit_balances`:
   - `available_credits = available_credits + order.credits_quantity`
4. **Atualização da Ordem**: `granted_at = now()`.

### Retorno em Caso de Sucesso Inicial

```json
{
  "success": true,
  "code": "CREDITS_GRANTED",
  "message": "Créditos concedidos com sucesso.",
  "package_id": "660e8400-e29b-41d4-a716-446655440011",
  "credits_granted": 5
}
```

### Retorno em Caso de Invocação Duplicada (Idempotência Segura)

```json
{
  "success": true,
  "code": "ALREADY_GRANTED",
  "message": "Os créditos deste pedido já foram liberados anteriormente.",
  "package_id": "660e8400-e29b-41d4-a716-446655440011"
}
```
