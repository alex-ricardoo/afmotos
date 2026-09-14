# Implementation Plan: 036-credit-packages-b2b-vehicle-consultations (Hotfixed Schema)

**Feature**: Pacotes B2B de Créditos para Consultas Veiculares  
**Status**: Arquitetura Revisada & Schema Hotfix  
**Spec**: [spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/036-credit-packages-b2b-vehicle-consultations/spec.md) | **Data Model**: [data-model.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/036-credit-packages-b2b-vehicle-consultations/data-model.md) | **Research**: [research.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/036-credit-packages-b2b-vehicle-consultations/research.md)

---

## 1. Diagnóstico e Resumo do Hotfix

A migração preliminar gerou falha no Supabase por tentar invocar `public.moddatetime()`, uma extensão inexistente no projeto. Além disso, identificamos que um simples saldo numérico sem separação entre **Reserva** e **Consumo**, e sem controle de **Pacotes Comerciais** e **Ledger Imutável com dupla partida**, violaria os requisitos de consistência e auditoria.

### Pilares da Solução Revisada:
1. **Trigger `updated_at` seguro**: Substituição total por `public.set_updated_at()` com `SECURITY INVOKER` e `SET search_path = ''`.
2. **Entidades especializadas**:
   - `customer_credit_packages`: Lotes negociados comercialmente.
   - `customer_credit_reservations`: Entidade com ciclo de vida isolado (`reserved` → `consumed` ou `released`), com constraint de unicidade `UNIQUE (consultation_id)`.
   - `customer_credit_ledger`: Extrato contábil append-only com trigger de bloqueio contra UPDATE/DELETE.
   - `customer_credit_balances`: Balanço agregado em cache materializado para otimização de leitura e lock pessimista (`SELECT FOR UPDATE`).
3. **RPCs Transacionais**:
   - `public.grant_credit_package`: Concessão administrativa atômica e idempotente.
   - `public.reserve_credit_for_consultation`: Reserva atômica com lock pessimista, garantindo que duas abas não reservem o mesmo saldo e que não haja conflito com Mercado Pago.
   - `public.consume_reserved_credit`: Consumo atômico após entrega de laudo real (com proteção estrita contra laudo mock em produção).
   - `public.release_reserved_credit`: Liberação atômica em caso de falha definitiva, sem gerar chamadas de estorno no Mercado Pago.
   - `public.adjust_credit_package`: Ajuste manual com justificativa e bloqueio contra saldo negativo.
4. **Segurança RLS e RBAC**:
   - Clientes finais possuem permissão estritamente `SELECT` sobre seus próprios dados (`auth.uid() = user_id`).
   - Mutações contábeis e de reserva são restritas a RPCs `SECURITY DEFINER` e `service_role`.
   - Administradores validados via `public.is_admin()`.

---

## 2. Fases de Entrega

### Fase 1: Análise e Especificação de Dados (Concluída)
- [x] Diagnóstico da falha de `moddatetime`.
- [x] Criação de `research.md`.
- [x] Criação de `data-model.md`.
- [x] Criação dos contratos de API (`credit-reservation-api.md`, `credit-rbac-rls.md`, `admin-credit-grants-api.md`).

### Fase 2: Nova Migração SQL Idempotente e Segura
- [x] Criação de `supabase/migrations/20260914120000_create_secure_b2b_credit_packages.sql`.
- [x] Desativação/substituição segura da migração com falha `20260914100000_create_b2b_credit_packages.sql`.

### Fase 3: Camada de Serviços TypeScript & Tipagem
- [x] Atualização de `lib/credits/types.ts` com o novo modelo analítico (pacotes, reservas, ledger com efeitos).
- [x] Atualização de `lib/credits/credit-service.ts` para consumir as novas RPCs transacionais estruturadas.

### Fase 4: Integração com Pipeline de Entrega & Estorno
- [x] Integração no `lib/vehicle-delivery/delivery-service.ts` para consumir o crédito no sucesso.
- [x] Integração no estorno para liberar o crédito quando `payment_coverage_type = 'platform_credit'`, sem disparar API do Mercado Pago.

### Fase 5: Validação, Runbook e Checklist
- [x] Verificação de build e tipagem (`npm run typecheck`).
- [x] Criação do `runbook.md` com instruções detalhadas de aplicação no Supabase.
