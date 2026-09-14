# Contract: Admin Credit Grants & Adjustments API

Este documento especifica os contratos das operações administrativas de concessão de novos pacotes de créditos e ajustes operacionais.

---

## 1. `public.grant_credit_package(...)`

### Assinatura SQL
```sql
CREATE OR REPLACE FUNCTION public.grant_credit_package(
  p_user_id UUID,
  p_package_name TEXT,
  p_package_type TEXT,
  p_credits_granted INTEGER,
  p_payment_channel TEXT,
  p_idempotency_key TEXT,
  p_external_payment_reference TEXT DEFAULT NULL,
  p_unit_price_cents INTEGER DEFAULT NULL,
  p_total_paid_cents INTEGER DEFAULT NULL,
  p_sales_note TEXT DEFAULT NULL,
  p_admin_note TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$ ... $$;
```

### Validações Obrigatórias
1. **Autorização**: Valida se o chamador possui privilégio de administrador (`public.is_admin() = true`).
2. **Parâmetros Quantitativos**:
   - `p_credits_granted > 0`.
   - `p_unit_price_cents >= 0` (se fornecido).
   - `p_total_paid_cents >= 0` (se fornecido).
3. **Idempotência**: Se a `p_idempotency_key` já existir em `customer_credit_ledger`, a função aborta sem criar novo pacote ou saldo duplicado, retornando a resposta com código `GRANT_IDEMPOTENT_SUCCESS`.
4. **Mutação Atômica**:
   - Criação do lote em `customer_credit_packages` (`status = 'active'`, `credits_remaining = p_credits_granted`).
   - Inserção contábil em `customer_credit_ledger` (`entry_type = 'grant'`, `quantity = p_credits_granted`, `available_effect = +p_credits_granted`).
   - Upsert no balanço agregado `customer_credit_balances`:
     `available_credits = available_credits + p_credits_granted`.
   - Registro de auditoria em `consultation_audit_logs` (ou log unificado).

### Resposta Estruturada
```json
{
  "success": true,
  "code": "GRANT_SUCCESS",
  "message_safe": "Pacote de créditos concedido com sucesso.",
  "package_id": "c1f7a28e-8a8b-49eb-8153-294b9f39aa17",
  "user_id": "01783321-4f1e-4501-9a70-8e1008064a39",
  "credits_granted": 5,
  "available_credits": 5,
  "reserved_credits": 0,
  "consumed_credits": 0
}
```

---

## 2. `public.adjust_credit_package(...)`

### Assinatura SQL
```sql
CREATE OR REPLACE FUNCTION public.adjust_credit_package(
  p_package_id UUID,
  p_adjustment_type TEXT, -- 'add' | 'remove'
  p_quantity INTEGER,
  p_reason_code TEXT,
  p_admin_note TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$ ... $$;
```

### Regras de Ajuste
1. **Autorização**: Apenas administradores ativos.
2. **Justificativa Obrigatória**: `p_admin_note` não pode ser nulo nem vazio.
3. **Proteção Contra Saldo Negativo**:
   - No caso de remoção (`remove`), verifica se `package.credits_remaining >= p_quantity` e se `balance.available_credits >= p_quantity`.
   - Se for violado, rejeita com `INSUFFICIENT_AVAILABLE_CREDITS`.
4. **Mutação Atômica**:
   - Atualiza `customer_credit_packages.credits_remaining`.
   - Se `credits_remaining = 0`, atualiza `status = 'exhausted'`.
   - Insere lançamento correspondente no ledger (`adjustment_add` ou `adjustment_remove`).
   - Atualiza `customer_credit_balances.available_credits`.
