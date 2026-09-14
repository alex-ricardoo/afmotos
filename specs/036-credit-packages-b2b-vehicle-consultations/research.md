# Research & Schema Analysis: B2B Credit Packages & Database Architecture

## 1. Diagnóstico do Problema da Migration Anterior

### Causa Raiz do Erro `ERROR: 42883: function public.moddatetime() does not exist`
Na migration inicial `20260914100000_create_b2b_credit_packages.sql`, foi incluído:
```sql
CREATE TRIGGER handle_updated_at_customer_credit_balances
    BEFORE UPDATE ON public.customer_credit_balances
    FOR EACH ROW
    EXECUTE FUNCTION public.moddatetime (updated_at);
```
No PostgreSQL e Supabase, `moddatetime` não é uma função nativa da instalação padrão do engine. Trata-se de uma extensão opcional (`extensions.moddatetime`) que deve ser explicitamente criada via `CREATE EXTENSION moddatetime WITH SCHEMA extensions;`.
A inspeção em todo o histórico de migrações (`supabase/migrations/`) revelou que:
1. Nenhuma migration anterior jamais ativou a extensão `moddatetime`.
2. A convenção estabelecida no projeto desde a migration `001_initial_schema.sql` sempre foi o uso de funções PL/pgSQL dedicadas para gerenciar a coluna `updated_at`.
3. Presumir a existência de `public.moddatetime()` causou a interrupção imediata na execução da DDL no Supabase.

### Estratégia de Trigger `updated_at` Adotada
Para garantir **zero dependências externas**, conformidade estrita com o PostgreSQL 15/16/17 e isolamento seguro, adotamos a estratégia preferida:
```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;
```
- **SECURITY INVOKER**: Evita elevação indevida de privilégios.
- **`SET search_path = ''`**: Protege contra ataques de schema poisoning / search_path injection.
- **Idempotência**: `DROP TRIGGER IF EXISTS trg_... ON ...; CREATE TRIGGER trg_...`.

---

## 2. Análise do Modelo de Dados & Falhas Estruturais da Migration Antiga

| Item | Implementação Antiga (Falha) | Nova Arquitetura Corrigida |
|---|---|---|
| **Fonte Única de Saldo** | Saldo numérico simples em tabela única (`balance INT`). Sem rastreabilidade de lotes. | Saldo agregado apenas como cache (`customer_credit_balances`). A fonte de verdade é a composição do Ledger + Pacotes + Reservas. |
| **Pacotes Comerciais** | Inexistente. Apenas lançava saldo arbitrário sem vínculo a uma negociação. | Entidade `customer_credit_packages` com rastreio de lote, tipo (`manual_negotiated`), canal (`whatsapp`), valor pago e expiração. |
| **Entidade de Reserva** | Inexistente. Tratava reserva apenas como um evento genérico no ledger. | Tabela `customer_credit_reservations` com ciclo de vida isolado (`reserved` → `consumed` ou `released`), garantindo unicidade por consulta. |
| **Reserva vs Consumo** | Misturava estados, considerando crédito "gasto" na reserva. | Separação estrita: `reserved_credits` bloqueia o saldo; o consumo (`consumed_credits`) só ocorre após a entrega válida de laudo live (não-mock). |
| **Concorrência & Locks** | Apenas bloqueava a linha de saldo, permitindo race conditions na seleção de pacotes e chamadas duplicadas. | Lock transacional pessimista (`FOR UPDATE`) no saldo e no pacote por ordem FIFO (`expires_at ASC NULLS LAST`), com chave de idempotência obrigatória. |
| **RLS e Permissões** | Policies permissivas com `FOR ALL USING (admin_profiles.id = auth.uid())` (errôneo, pois `admin_profiles.id` é UUID autogerado, o correto é `auth_user_id`). | Políticas granulares (`SELECT` para clientes nos seus próprios registros; `public.is_admin()` para leitura de admin; mutações restritas a RPCs `SECURITY DEFINER` e service role). |
| **Classificação de Consultas** | Adicionava `payment_coverage_type NOT NULL DEFAULT 'mercadopago'`, corrompendo o histórico. | Campo adicionado como nullable, com backfill baseado em transações aprovadas reais e constraint progressiva. |

---

## 3. Padrões Existentes Inspecionados no Repositório

1. **Autenticação Administrativa:**
   - Tabela: `public.admin_profiles`
   - Vínculo: `admin_profiles.auth_user_id = auth.uid()`
   - Função utilitária existente: `public.is_admin()` (criada em `00020_fix_is_admin.sql`), que valida `role IN ('admin', 'super_admin') AND is_active = true`.
2. **Consultas Veiculares:**
   - Tabela: `public.customer_plate_consultations`
   - Chave estrangeira de usuário: `user_id REFERENCES auth.users(id) ON DELETE CASCADE`.
   - Estados suportados: `'pending', 'paid', 'processing', 'completed', 'retry_scheduled', 'failed', 'failed_permanent', 'refund_pending', 'refunded', 'manual_review'`.
3. **Logs de Auditoria:**
   - Tabela: `public.consultation_audit_logs`
   - Campo `actor_type`: `'customer', 'system', 'admin', 'webhook'`.
4. **Entrega Resiliente de Laudos:**
   - `lib/vehicle-delivery/delivery-service.ts`: Executa jobs assíncronos (`consultation_delivery_jobs`).
   - Em caso de falha definitiva, aciona estorno. O estorno de créditos deve liberar a reserva chamando `release_reserved_credit`, sem gerar requisições de estorno ao Mercado Pago.
