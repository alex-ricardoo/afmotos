# Implementation Tasks: Consulta de Placa com Snapshot JSONB, Cache Pago e PDF

**Feature**: `018-consulta-placa-historico-veicular`  
**Status**: Completed  

---

## Task Breakdown

### Phase 1: Modelagem e Banco de Dados
- [x] **T001** [P] Criar arquivo de migração SQL `supabase/migrations/20260830100000_create_vehicle_plate_consultations.sql` contendo a tabela `vehicle_plate_consultations`, coluna `raw_response jsonb`, colunas escalares desnormalizadas, índices B-Tree, índice único condicional para live, trigger de `updated_at` e políticas RLS para administradores.
- [x] **T002** [P] Definir tipos TypeScript de banco de dados e DTOs de domínio em `lib/vehicle-lookup/types.ts`.

---

### Phase 2: Camada Core, Normalizadores e LGPD Sanitizers
- [x] **T003** [P] Implementar utilitários de placa brasileira (`normalizeBrazilianPlate`, `formatBrazilianPlate`, `isValidBrazilianPlate`) em `lib/vehicle-lookup/plate.ts`.
- [x] **T004** [P] Implementar sanitizadores e mascaramento de dados sensíveis (`mask-cpf.ts`, `mask-cnpj.ts`, `mask-chassis.ts`, `mask-renavam.ts`, `mask-engine.ts`) em `lib/vehicle-lookup/sanitizers/`.
- [x] **T005** [P] Criar testes unitários para validação de placa e mascaramento de dados em `lib/vehicle-lookup/__tests__/plate-and-sanitizers.test.ts`.

---

### Phase 3: Fixture Mock, Schemas Zod e Adapters
- [x] **T006** [P] Criar fixture estática com payload autêntico completo em `lib/vehicle-lookup/fixtures/vehicle-total.mock.json`.
- [x] **T007** [P] Implementar schemas Zod tolerantes e parsers em `lib/vehicle-lookup/schema.ts` e `lib/vehicle-lookup/adapters/apibrasil-vehicle-total.ts`.
- [x] **T008** [P] Implementar adaptadores especializados:
  - `lib/vehicle-lookup/adapters/vehicle-summary.ts` (extração para o banco)
  - `lib/vehicle-lookup/adapters/vehicle-risk.ts` (cálculo de risco e flags)
  - `lib/vehicle-lookup/adapters/vehicle-debts.ts` (agregação de multas/IPVA)
  - `lib/vehicle-lookup/adapters/vehicle-history.ts` (proprietários e leilões)
  - `lib/vehicle-lookup/adapters/vehicle-pdf.ts` (DTO seguro de cliente para PDF)
- [x] **T009** [P] Criar testes unitários para adapters com arrays vazios e dados parciais em `lib/vehicle-lookup/__tests__/adapters.test.ts`.

---

### Phase 4: Gateway de Serviço, Cache e Concorrência
- [x] **T010** [P] Implementar `lib/vehicle-lookup/config.ts` com leitura de variáveis de ambiente (`VEHICLE_LOOKUP_MODE`, `APIBRASIL_TOKEN`).
- [x] **T011** [P] Implementar `lib/vehicle-lookup/service.ts` com verificação prévia de cache no banco, orquestração mock/live, aquisição de lock de concorrência e tratamento de erro com `CHARGE_STATUS_UNKNOWN`.

---

### Phase 5: Server Actions e Queries
- [x] **T012** [P] Implementar queries otimizadas em `lib/queries/vehicle-lookup.ts`:
  - `getVehicleConsultationsList` (paginada, sem carregar `raw_response`)
  - `getVehicleConsultationById` (com `raw_response` e DTO interno)
  - `findExistingConsultationByPlate` (busca rápida no cache)
- [x] **T013** [P] Implementar Server Actions administrativas em `lib/actions/vehicle-lookup.ts`:
  - `executeVehiclePlateLookupAction` (com validação de confirmação e auditoria)
  - `linkVehicleConsultationAction` (associação com motos, solicitações ou propostas)

---

### Phase 6: Interface Administrativa — Busca, Cache e Modal de Confirmação
- [x] **T014** [P] Implementar card de busca com feedback instantâneo de cache em `components/admin/vehicle-lookup/plate-search-card.tsx`.
- [x] **T015** [P] Implementar modal de confirmação explícita de custo em `components/admin/vehicle-lookup/consultation-confirm-modal.tsx` com checkbox de ciência e dados da consulta.
- [x] **T016** [P] Implementar badges de status, risco e modo em `components/admin/vehicle-lookup/consultation-badge.tsx`.

---

### Phase 7: Interface Administrativa — Tabela de Histórico
- [x] **T017** [P] Implementar tabela de histórico paginado com filtros em `components/admin/vehicle-lookup/consultation-history-table.tsx`.
- [x] **T018** [P] Montar página principal em `app/admin/(protected)/consulta-placa/page.tsx` integrando busca, histórico e métricas de custo.

---

### Phase 8: Interface Administrativa — Detalhes em 9 Abas Temáticas
- [x] **T019** [P] Criar layout e cabeçalho de ações da página de detalhes em `components/admin/vehicle-lookup/vehicle-detail-header.tsx`.
- [x] **T020** [P] Implementar componentes de abas em `components/admin/vehicle-lookup/tabs/`:
  - `tab-summary.tsx` (Resumo & Riscos)
  - `tab-vehicle-data.tsx` (Dados do Veículo)
  - `tab-debts.tsx` (Situação & Débitos)
  - `tab-restrictions.tsx` (Restrições & Gravames)
  - `tab-history.tsx` (Histórico & Leilão)
  - `tab-fipe-pricing.tsx` (Preço & FIPE)
  - `tab-ads-mileage.tsx` (Anúncios & Km)
  - `tab-technical-specs.tsx` (Dados Técnicos)
  - `tab-raw-json.tsx` (Visualizador JSON com busca e cópia)
- [x] **T021** [P] Montar página de detalhes em `app/admin/(protected)/consulta-placa/[id]/page.tsx`.

---

### Phase 9: Motor de Laudo PDF Institucional
- [x] **T022** [P] Criar template de Laudo Veicular com `@react-pdf/renderer` em `lib/vehicle-lookup/pdf/vehicle-report-pdf.tsx` com A4 profissional, sem dados pessoais de terceiros e com disclaimer legal.
- [x] **T023** [P] Criar Route Handler `app/api/admin/vehicle-lookup/[id]/pdf/route.ts` para download seguro de PDF com auditoria de contadores.

---

### Phase 10: Vínculos com Estoque e Homologação
- [x] **T024** [P] Criar modal de vínculo `components/admin/vehicle-lookup/vehicle-link-modal.tsx` para associar consultas com motos e solicitações de venda.
- [x] **T025** [P] Adicionar link para "Consulta de Placa" no menu de navegação do painel admin (`components/admin/admin-header.tsx` / `sidebar`).
- [x] **T026** [P] Executar bateria de testes com `node --test` e validar fluxo completo de ponta a ponta.
