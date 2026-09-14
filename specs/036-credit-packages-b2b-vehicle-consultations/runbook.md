# Runbook: Procedimento Operacional para Aplicação no Supabase

Este guia detalha o procedimento estrito e passo a passo para revisão e futura aplicação da migração de créditos B2B no Supabase.

---

## 1. Regras Fundamentais de Segurança
- **Ambiente de Homologação / Staging Primeiro**: Nunca aplicar diretamente em produção sem validação prévia em projeto de teste/staging.
- **Nenhum Comando Automático**: Não execute scripts automatizados de deploy ou migração sem revisão humana prévia.
- **Backup**: Certifique-se de que um backup recente (snapshot) do PostgreSQL foi realizado antes da execução.

---

## 2. Checklist Pré-Aplicação (Pre-Flight Checks)

Execute as seguintes consultas no SQL Editor do Supabase para confirmar o estado do banco antes de aplicar a migração:

### Verificação 1: Confirmar Inexistência de Funções Antigas com Erro
```sql
SELECT routine_schema, routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('set_updated_at', 'reserve_credit_for_consultation', 'grant_credit_package');
```
*Esperado*: Podem inexistir ou estar com assinaturas antigas. O script usa `CREATE OR REPLACE` e `DROP TRIGGER IF EXISTS` para ser 100% idempotente.

### Verificação 2: Confirmar Estado das Tabelas
```sql
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name IN ('customer_credit_balances', 'customer_credit_packages', 'customer_credit_reservations', 'customer_credit_ledger');
```
*Esperado*: Devem inexistir se a migração antiga falhou no primeiro trigger.

### Verificação 3: Confirmar se `public.is_admin()` Existe
```sql
SELECT proname, prosrc FROM pg_proc WHERE proname = 'is_admin';
```
*Esperado*: Retorna 1 linha correspondente à função criada em `00020_fix_is_admin.sql`.

---

## 3. Procedimento de Aplicação

1. Acesse o **Supabase Dashboard** do projeto.
2. Navegue até **SQL Editor**.
3. Abra o arquivo de migração:
   `supabase/migrations/20260914120000_create_secure_b2b_credit_packages.sql`.
4. Cole o conteúdo integral do arquivo na janela do SQL Editor.
5. Clique em **Run**.
6. Verifique se a execução retornou: `Success. No rows returned` sem nenhum código de erro.

---

## 4. Checklist Pós-Aplicação (Post-Flight Validation)

Execute a seguinte bateria de testes no SQL Editor do Supabase:

### Teste 1: Validar se as Tabelas Foram Criadas com RLS Habilitado
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('customer_credit_balances', 'customer_credit_packages', 'customer_credit_reservations', 'customer_credit_ledger');
```
*Esperado*: 4 linhas, todas com `rowsecurity = true`.

### Teste 2: Validar Trigger de Imutabilidade do Ledger
```sql
-- Deve retornar erro ao tentar deletar do ledger
DO $$
BEGIN
  DELETE FROM public.customer_credit_ledger;
  RAISE EXCEPTION 'FALHA: Trigger permitiu exclusão!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'SUCESSO: Tentativa de mutação do ledger bloqueada: %', SQLERRM;
END $$;
```

### Teste 3: Validar Atualização Automática de `updated_at`
```sql
-- Atualização fictícia de teste (em ambiente de teste)
UPDATE public.customer_credit_balances 
SET available_credits = available_credits 
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```
*Esperado*: Executa sem erro de `public.moddatetime()`.

### Teste 4: Validar Permissões das RPCs
```sql
SELECT routine_name, security_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('grant_credit_package', 'reserve_credit_for_consultation', 'consume_reserved_credit', 'release_reserved_credit');
```
*Esperado*: Todas marcadas como `DEFINER`.

---

## 5. Plano de Rollback (Contingência)

Caso seja necessário reverter a migração em ambiente de homologação:
```sql
-- 1. Remover RPCs
DROP FUNCTION IF EXISTS public.adjust_credit_package(uuid, text, integer, text, text, text);
DROP FUNCTION IF EXISTS public.release_reserved_credit(uuid, text, text);
DROP FUNCTION IF EXISTS public.consume_reserved_credit(uuid, uuid, boolean, text);
DROP FUNCTION IF EXISTS public.reserve_credit_for_consultation(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.grant_credit_package(uuid, text, text, integer, text, text, text, integer, integer, text, text, timestamptz);

-- 2. Remover colunas de consultas
ALTER TABLE public.customer_plate_consultations 
  DROP COLUMN IF EXISTS credit_status,
  DROP COLUMN IF EXISTS credit_reservation_id,
  DROP COLUMN IF EXISTS credit_package_id,
  DROP COLUMN IF EXISTS payment_coverage_type;

-- 3. Remover tabelas
DROP TABLE IF EXISTS public.customer_credit_ledger CASCADE;
DROP TABLE IF EXISTS public.customer_credit_reservations CASCADE;
DROP TABLE IF EXISTS public.customer_credit_packages CASCADE;
DROP TABLE IF EXISTS public.customer_credit_balances CASCADE;

-- 4. Função de trigger (apenas se nenhuma outra tabela depender dela)
-- DROP FUNCTION IF EXISTS public.set_updated_at CASCADE;
```
