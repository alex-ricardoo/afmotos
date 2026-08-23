# Tasks: Cadastro de Vendas e Recibo de Venda/Repasse

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create `tasks.md` (Completed by this command)
- [x] T002 Install `@react-pdf/renderer` dependency for PDF generation in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create migration for `sales` table in `supabase/migrations/[timestamp]_enhance_sales.sql`
- [x] T004 Apply migration to local Supabase database
- [x] T005 Run Supabase type generation in `types/database.types.ts`
- [x] T006 [P] Create `lib/queries/sales.ts` for listing sales and getting summary metrics
- [x] T007 [P] Create `lib/actions/sales.ts` for server actions related to mutations (create sale, update status)
- [x] T008 [P] Verify or update `lib/queries/settings.ts` to fetch `site_settings`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Registros e Fluxo Principal (Priority: P1) 🏆 MVP

**Goal**: Permitir que o admin altere o status da moto para vendida, preencha os dados e salve a venda.

**Independent Test**: A alteração do status no form da moto abre modal. Salvar a venda atualiza a moto e a tabela de vendas.

### Implementation for User Story 1

- [x] T009 [US1] Create UI component `SaleConfirmationModal` in `components/admin/sales/sale-confirmation-modal.tsx`
- [x] T010 [US1] Update `motorcycle-form.tsx` to intercept `SOLD` status and trigger `SaleConfirmationModal`
- [x] T011 [P] [US1] Create sale creation form UI `SaleForm` in `components/admin/sales/sale-form.tsx`
- [x] T012 [P] [US1] Create sale creation page in `app/admin/(protected)/vendas/nova/page.tsx`
- [x] T013 [US1] Implement Zod validation schema for sale creation in `lib/validations/sale.ts`
- [x] T014 [US1] Wire up `SaleForm` to use `lib/actions/sales.ts` for transactional saving (sale + motorcycle status)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Consulta do Histórico de Vendas (Priority: P1)

**Goal**: Listar vendas concluídas, com cards mobile e tabela desktop.

**Independent Test**: Acesso a `/admin/vendas` exibe as métricas de vendas e os itens na listagem com opções de filtro.

### Implementation for User Story 2

- [x] T015 [P] [US2] Create layout and shell for sales dashboard in `app/admin/(protected)/vendas/page.tsx`
- [x] T016 [P] [US2] Create metrics cards component in `components/admin/sales/sales-summary.tsx`
- [x] T017 [P] [US2] Create filters component in `components/admin/sales/sale-filters.tsx`
- [x] T018 [US2] Create desktop table view in `components/admin/sales/sales-table.tsx`
- [x] T019 [US2] Create mobile card view in `components/admin/sales/sale-card.tsx`
- [x] T020 [US2] Integrate `lib/queries/sales.ts` data into the page and components
- [x] T021 [US2] Update `components/admin/sidebar.tsx` to include the `Vendas` link

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Geração de Recibo PDF (Priority: P1)

**Goal**: Gerar e baixar um recibo formal em formato PDF.

**Independent Test**: Clicar em "Gerar Recibo" baixa um documento legível contendo informações da loja, comprador e veículo.

### Implementation for User Story 3

- [x] T022 [P] [US3] Create `SaleReceiptPDF` component layout using `@react-pdf/renderer` in `lib/pdf/sale-receipt.tsx`
- [x] T023 [US3] Create API route handler in `app/api/admin/sales/[id]/receipt/route.ts`
- [x] T024 [US3] Wire up API route to fetch sale, motorcycle, and site_settings data
- [x] T025 [US3] Add "Gerar Recibo" action buttons in the sales table/cards and confirmation modal
- [x] T026 [US3] Handle missing fields gracefully in the PDF (e.g. absent documents, absent logo)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T027 Code cleanup, removing unnecessary console.logs and addressing TypeScript warnings
- [x] T028 Refine mobile responsiveness specifically for `SaleConfirmationModal` and Filters drawer
- [x] T029 Implement WhatsApp button `Falar com o comprador` linking to `https://wa.me/...`
- [x] T030 Validate accessibility (focus states, labels, contrasts)
- [x] T031 Run quickstart.md validation tests manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed sequentially (US1 -> US2 -> US3) or in parallel.
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Can start after Foundational (Phase 2), independent from US1.
- **User Story 3 (P1)**: Depends on US1 (to generate actual records) and optionally US2 (for the action button), but the PDF logic itself can be developed in parallel.

### Parallel Opportunities

- DB Queries and Actions (Foundational) can be developed independently of the frontend UI.
- The PDF Document visual structure (`SaleReceiptPDF`) can be developed entirely in parallel with the database migrations and UI forms.
- Desktop Table and Mobile Card components can be built in parallel.

## Implementation Strategy

### Incremental Delivery

1. Complete Setup + Foundational -> Database ready.
2. Complete US1 -> Sales can now be registered (MVP complete).
3. Complete US2 -> Sales can now be managed and audited.
4. Complete US3 -> Sales can now be formalized with physical documents.
5. Complete Polish -> Seamless experience for admins.
