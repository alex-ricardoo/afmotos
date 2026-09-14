# Contract: Credit Reservation & Lifecycle API

Este documento especifica os contratos de execução transacional via RPC (Remote Procedure Call) no Supabase para o ciclo de vida de créditos: Reserva, Consumo e Liberação.

---

## 1. `public.reserve_credit_for_consultation(...)`

### Assinatura SQL
```sql
CREATE OR REPLACE FUNCTION public.reserve_credit_for_consultation(
  p_consultation_id UUID,
  p_idempotency_key TEXT,
  p_override_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$ ... $$;
```

### Regras de Autorização e Validação
1. **Determinação do Usuário**: Se chamada por cliente via PostgREST/Supabase client, `auth.uid()` é obrigatório. Se chamado com service role via backend e `p_override_user_id` for fornecido, deve validar integridade.
2. **Ownership da Consulta**: A consulta especificada por `p_consultation_id` deve pertencer ao usuário ativo (`consultations.user_id = v_user_id`).
3. **Exclusão Mútua com Mercado Pago**: Verifica se existe registro em `payment_transactions` com status `'approved'` ou `'in_process'`. Se houver, a reserva é rejeitada com código `PAYMENT_CONFLICT`.
4. **Proteção contra Reserva Duplicada**: Se já existir reserva ativa em `customer_credit_reservations` para este `consultation_id`:
   - Se a chave de idempotência coincidir, retorna sucesso com dados da reserva já existente (idempotência limpa).
   - Se for uma nova tentativa de reserva para a mesma consulta, rejeita com `CONSULTATION_ALREADY_RESERVED`.
5. **Seleção FIFO de Pacote**: Seleciona o pacote do cliente com `status = 'active'`, `credits_remaining > 0` e menor `expires_at` (pacotes com expiração primeiro, NULL por último).
6. **Bloqueio Pessimista (`FOR UPDATE`)**:
   - Bloqueia a linha correspondente em `customer_credit_balances`.
   - Bloqueia a linha do pacote em `customer_credit_packages`.
   - Garante que `available_credits >= 1` e `credits_remaining >= 1`.
7. **Efeitos Atômicos**:
   - Insere `customer_credit_reservations` com status `'reserved'`.
   - Insere `customer_credit_ledger` com `entry_type = 'reserve'`, `available_effect = -1`, `reserved_effect = +1`.
   - Atualiza `customer_credit_balances`: `available_credits = available_credits - 1`, `reserved_credits = reserved_credits + 1`.
   - Atualiza `customer_credit_packages`: `credits_remaining = credits_remaining - 1`.
   - Atualiza `customer_plate_consultations`: `payment_coverage_type = 'platform_credit'`, `credit_status = 'reserved'`, `credit_package_id = v_package_id`, `credit_reservation_id = v_reservation_id`.
   - Registra log de auditoria em `consultation_audit_logs`.

### Resposta Estruturada (JSONB)
```json
{
  "success": true,
  "code": "CREDIT_RESERVED",
  "message_safe": "1 crédito foi reservado com sucesso para esta consulta.",
  "package_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "reservation_id": "4a71b2d4-05a8-422f-bc3f-763ec18d27a1",
  "available_credits": 4,
  "reserved_credits": 1,
  "consumed_credits": 0
}
```

---

## 2. `public.consume_reserved_credit(...)`

### Assinatura SQL
```sql
CREATE OR REPLACE FUNCTION public.consume_reserved_credit(
  p_consultation_id UUID,
  p_reservation_id UUID DEFAULT NULL,
  p_is_mock_delivery BOOLEAN DEFAULT FALSE,
  p_environment TEXT DEFAULT 'production'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$ ... $$;
```

### Regras de Execução
1. **Chamador**: Destinado exclusivamente a workers internos de entrega (`delivery-service.ts`) ou administradores.
2. **Mock Guard**: Se `p_environment = 'production'` e `p_is_mock_delivery = true`, a operação aborta com erro `MOCK_IN_PRODUCTION_BLOCKED`. Créditos reais jamais são consumidos por simulações em ambiente de produção.
3. **Validação da Consulta**: A consulta deve estar no status `'completed'` com relatório veicular persistido.
4. **Idempotência**: Se a reserva já estiver com status `'consumed'`, retorna sucesso idempotente imediatamente.
5. **Bloqueio e Transição**:
   - Bloqueia reserva e balanço `FOR UPDATE`.
   - Atualiza reserva: `status = 'consumed'`, `consumed_at = timezone('utc', now())`.
   - Insere ledger: `entry_type = 'consume'`, `reserved_effect = -1`, `consumed_effect = +1`.
   - Atualiza balanço: `reserved_credits = reserved_credits - 1`, `consumed_credits = consumed_credits + 1`.
   - Atualiza consulta: `credit_status = 'consumed'`.
   - Registra auditoria: `credit_consumed`.

---

## 3. `public.release_reserved_credit(...)`

### Assinatura SQL
```sql
CREATE OR REPLACE FUNCTION public.release_reserved_credit(
  p_consultation_id UUID,
  p_reason_code TEXT,
  p_reason_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$ ... $$;
```

### Regras de Execução
1. **Idempotência**: Se a reserva já estiver `'released'`, retorna sucesso imediatamente sem duplicar liberação.
2. **Proteção Contra Consumo Prévio**: Se a reserva estiver com status `'consumed'`, a liberação é sumariamente rejeitada (`CANNOT_RELEASE_CONSUMED_CREDIT`).
3. **Restauração de Saldo**:
   - Atualiza reserva: `status = 'released'`, `released_at = timezone('utc', now())`, `release_reason_code = p_reason_code`, `release_reason_note = p_reason_note`.
   - Insere ledger: `entry_type = 'release'`, `reserved_effect = -1`, `available_effect = +1`.
   - Atualiza balanço: `reserved_credits = reserved_credits - 1`, `available_credits = available_credits + 1`.
   - Devolve o crédito ao pacote de origem (`credits_remaining = credits_remaining + 1`), contanto que o pacote não tenha sido cancelado.
   - Atualiza consulta: `credit_status = 'released'`.
   - Registra auditoria: `credit_released`.
