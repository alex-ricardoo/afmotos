# Tasks: Central de Relatórios Gerenciais e Exportação Contábil

**Input**: Design documents from `specs/017-central-relatorios-gerenciais/`  
**Prerequisites**: [plan.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/017-central-relatorios-gerenciais/plan.md), [spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/017-central-relatorios-gerenciais/spec.md), [research.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/017-central-relatorios-gerenciais/research.md), [data-model.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/017-central-relatorios-gerenciais/data-model.md), [contracts/export-api.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/017-central-relatorios-gerenciais/contracts/export-api.md)

---

## Phase 1: Setup (Shared Infrastructure & Domain Types)

**Purpose**: Estruturação inicial do módulo de relatórios, contratos de tipos TypeScript e formatadores.

- [X] T001 Create directory structure for domain logic in `lib/reports/` and UI components in `components/admin/reports/`
- [X] T002 [P] Implement core TypeScript domain types and metric confidence interfaces in `lib/reports/types.ts`
- [X] T003 [P] Implement financial, date and percentage formatters in `lib/reports/formatters.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Camada base de parsing de períodos temporais, consultas agregadas no PostgreSQL e integração de navegação.

- [X] T004 Implement date normalization and period preset utilities with timezone BR in `lib/reports/date-range.ts`
- [X] T005 [P] Create metric status badge component (`Confirmado`, `Estimado`, `Indisponível`) in `components/admin/reports/report-data-status-badge.tsx`
- [X] T006 [P] Create generic KPI card component with percentage comparison and tooltip in `components/admin/reports/report-kpi-card.tsx`
- [X] T007 [P] Create chart card container component in `components/admin/reports/report-chart-card.tsx`
- [X] T008 Add 'Relatórios' navigation item to desktop sidebar in `components/admin/admin-sidebar.tsx`
- [X] T009 Add 'Relatórios' link to mobile navigation drawer in `components/admin/admin-bottom-nav.tsx`

---

## Phase 3: User Story 1 — Visão Geral Executiva e Filtro Global de Período (Priority: P1) 🎯 MVP

- [X] T010 [US1] Implement aggregate query `getOverviewReportData` in `lib/reports/queries.ts`
- [X] T011 [US1] Implement global period selector with URL search params persistence in `components/admin/reports/report-period-filter.tsx`
- [X] T012 [US1] Implement composite revenue vs expenses SVG bar chart in `components/admin/reports/charts/revenue-expenses-bar-chart.tsx`
- [X] T013 [US1] Implement Overview Tab presenting top KPIs and financial summary in `components/admin/reports/tabs/overview-tab.tsx`
- [X] T014 [US1] Create root reports dashboard container with tab switcher in `components/admin/reports/reports-dashboard.tsx`
- [X] T015 [US1] Create protected route page in `app/admin/(protected)/relatorios/page.tsx`
- [X] T016 [US1] Create page loading skeleton in `app/admin/(protected)/relatorios/loading.tsx`

---

## Phase 4: User Story 2 — Relatório Comercial e Desempenho de Vendas (Priority: P1)

- [X] T017 [US2] Implement aggregate query `getSalesReportData` in `lib/reports/queries.ts`
- [X] T018 [P] [US2] Implement horizontal ranking bars chart in `components/admin/reports/charts/ranking-horizontal-bars.tsx`
- [X] T019 [P] [US2] Implement payment methods breakdown donut/progress chart in `components/admin/reports/charts/payment-methods-donut.tsx`
- [X] T020 [US2] Implement Sales Tab with KPIs, brand rankings, and detailed sales table in `components/admin/reports/tabs/sales-tab.tsx`

---

## Phase 5: User Story 3 — Relatório Financeiro, Despesas e Margem Operacional (Priority: P1)

- [X] T021 [US3] Implement aggregate query `getFinancialReportData` in `lib/reports/queries.ts`
- [X] T022 [US3] Implement Financial Tab detailing expenses by category and vehicle costs in `components/admin/reports/tabs/financial-tab.tsx`

---

## Phase 6: User Story 4 — Relatório de Estoque, Idade de Pátio e Alertas de Giro (Priority: P1)

- [X] T023 [US4] Implement aggregate query `getInventoryReportData` in `lib/reports/queries.ts`
- [X] T024 [P] [US4] Implement inventory age distribution pyramid chart in `components/admin/reports/charts/inventory-age-pyramid.tsx`
- [X] T025 [US4] Implement Inventory Tab with yard metrics and attention alerts table in `components/admin/reports/tabs/inventory-tab.tsx`

---

## Phase 7: User Story 5 — Relatório de Clientes e Origem Comercial (Priority: P2)

- [X] T026 [US5] Implement aggregate query `getCustomersReportData` in `lib/reports/queries.ts`
- [X] T027 [US5] Implement Customers & Leads Tab with origin distribution in `components/admin/reports/tabs/customers-tab.tsx`

---

## Phase 8: User Story 6 — Central do Contador e Exportação Estruturada (CSV / XLSX / PDF) (Priority: P1)

- [X] T028 [P] [US6] Implement CSV generation engine with UTF-8 BOM and delimiter `;` in `lib/reports/export-csv.ts`
- [X] T029 [P] [US6] Implement multi-sheet XLSX export engine in `lib/reports/export-xlsx.ts`
- [X] T030 [P] [US6] Implement executive PDF template with `@react-pdf/renderer` in `lib/reports/pdf/executive-report.tsx`
- [X] T031 [US6] Implement export Route Handler with admin authentication and streaming in `app/api/admin/reports/export/route.ts`
- [X] T032 [US6] Create export confirmation dialog with PII toggle in `components/admin/reports/report-export-dialog.tsx`
- [X] T033 [US6] Implement Accountant Tab with 1-click export cards in `components/admin/reports/tabs/accountant-tab.tsx`

---

## Phase 9: User Story 7 — Segurança, RLS e Responsividade Mobile-First (Priority: P1)

- [X] T034 [US7] Validate admin authorization across all report queries and export route
- [X] T035 [US7] Implement responsive drawer filter trigger for mobile viewports in `components/admin/reports/report-period-filter.tsx`
- [X] T036 [US7] Create error boundary and fallback UI in `app/admin/(protected)/relatorios/error.tsx`

---

## Phase 10: Polish & Cross-Cutting Concerns

- [X] T037 [P] Run TypeScript check `npm run typecheck` and ESLint
- [X] T038 Verify WCAG 2.2 AA contrast on all badges and charts
- [X] T039 Execute manual verification protocol described in `specs/017-central-relatorios-gerenciais/quickstart.md`
