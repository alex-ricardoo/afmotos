# Tasks: Hotfix de Schema & Pacotes B2B de Créditos

Este arquivo gerencia a checklist de tarefas técnicas executadas e planejadas para a entrega da feature e hotfix de schema.

---

## Checklist de Tarefas

### 1. Documentação & Análise Arquitetural
- [x] **T-01**: Documentar análise de falha de `public.moddatetime()` e trigger `updated_at` em `research.md`.
- [x] **T-02**: Elaborar especificação estruturada do modelo de dados em `data-model.md`.
- [x] **T-03**: Especificar contrato da API de Reserva e Ciclo de Vida em `contracts/credit-reservation-api.md`.
- [x] **T-04**: Especificar matriz de políticas RLS e privilégios em `contracts/credit-rbac-rls.md`.
- [x] **T-05**: Especificar contratos administrativos em `contracts/admin-credit-grants-api.md`.
- [x] **T-06**: Atualizar `plan.md` e criar `tasks.md`.
- [x] **T-07**: Criar `runbook.md` com checklist pré e pós-aplicação no Supabase.

### 2. Migração SQL (`supabase/migrations/`)
- [x] **T-08**: Criar `public.set_updated_at()` segura com `SECURITY INVOKER` e `SET search_path = ''`.
- [x] **T-09**: Criar tabela agregada `public.customer_credit_balances`.
- [x] **T-10**: Criar tabela de lotes negociados `public.customer_credit_packages`.
- [x] **T-11**: Criar tabela de reservas isoladas `public.customer_credit_reservations` com `UNIQUE (consultation_id)`.
- [x] **T-12**: Criar extrato contábil `public.customer_credit_ledger` com trigger de imutabilidade append-only.
- [x] **T-13**: Adicionar colunas de cobertura em `public.customer_plate_consultations` com backfill seguro e retrocompatível.
- [x] **T-14**: Criar políticas RLS para isolamento entre usuários e autorização de administradores via `public.is_admin()`.
- [x] **T-15**: Implementar RPC `public.grant_credit_package` (transacional, idempotente, admin-only).
- [x] **T-16**: Implementar RPC `public.reserve_credit_for_consultation` (lock pessimista, exclusão com MP, FIFO de pacotes).
- [x] **T-17**: Implementar RPC `public.consume_reserved_credit` (validação de laudo live, proteção contra mock em produção).
- [x] **T-18**: Implementar RPC `public.release_reserved_credit` (idempotente, bloqueio contra estorno de crédito consumido).
- [x] **T-19**: Implementar RPC `public.adjust_credit_package` (ajustes administrativos com justificativa e proteção contra saldo negativo).
- [x] **T-20**: Tratar e substituir com segurança a migração inválida anterior (`20260914100000_create_b2b_credit_packages.sql`).

### 3. Integração na Aplicação
- [x] **T-21**: Atualizar definições TypeScript em `lib/credits/types.ts`.
- [x] **T-22**: Atualizar chamadas de serviço em `lib/credits/credit-service.ts` para consumir as novas RPCs estruturadas.
- [x] **T-23**: Integrar consumo de crédito no worker de entrega (`delivery-service.ts`) e liberação em caso de falha definitiva.
- [x] **T-24**: Validar tipagem estática do projeto via `npx tsc --noEmit`.
