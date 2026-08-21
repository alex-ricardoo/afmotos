# Tasks: AF Motos Platform

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js project with Tailwind v4 (Verify existing `app/` and `components/` structure)
- [ ] T002 [P] Initialize shadcn/ui configuration with `npx shadcn@latest init`
- [ ] T003 [P] Configure ESLint and Prettier for strict TypeScript checking
- [ ] T004 [P] Setup Supabase clients (server, browser, admin) in `lib/supabase/`
- [ ] T005 [P] Setup Zod validation structure in `lib/validations/`
- [ ] T006 Add base layout elements (Header, Footer, MobileNav) in `app/layout.tsx`

---

## Phase 2: Foundational (Database & Data Access)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create database schema migrations per `data-model.md`
- [ ] T008 [P] Setup Supabase Auth and RLS policies
- [ ] T009 [P] Create database types using Supabase CLI
- [ ] T010 Create base repository pattern/actions for data fetching in `lib/actions/`
- [ ] T011 Setup image storage buckets (`motorcycle-images`, `documents`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Public Catalog (Priority: P1) 🚀 MVP

**Goal**: Implement the public motorcycle catalog and home page listing.

**Independent Test**: Navigate to `/` and `/motos` to view listed motorcycles. Filter and search should work.

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create UI components: `MotorcycleCard`, `CatalogGrid`, `StatusBadge` in `components/motorcycles/`
- [ ] T013 [P] [US1] Implement Server Component for `/` (Home page) with featured listings
- [ ] T014 [US1] Implement Server Component for `/motos` with catalog listing
- [ ] T015 [US1] Create filter panel and search functionality in `components/filters/`
- [ ] T016 [US1] Integrate filter state with URL search params in `/motos/page.tsx`

**Checkpoint**: At this point, the public catalog (US1) should be fully functional and testable independently

---

## Phase 4: User Story 2 - Motorcycle Detail & Contact (Priority: P2)

**Goal**: View individual motorcycle details and contact via WhatsApp.

**Independent Test**: Click a motorcycle card, view details, and click the WhatsApp button to verify correct message generation.

### Implementation for User Story 2

- [ ] T017 [P] [US2] Create gallery components (`ImageCarousel`, `ImageFullscreen`) in `components/gallery/`
- [ ] T018 [P] [US2] Implement WhatsApp message generator utility in `lib/utils/whatsapp.ts`
- [ ] T019 [US2] Create Server Component for `/motos/[slug]`
- [ ] T020 [US2] Implement specs section and description renderer
- [ ] T021 [US2] Add WhatsApp CTA button component
- [ ] T022 [US2] Implement SEO metadata generation for detail pages

**Checkpoint**: At this point, Users can view full motorcycle specs and initiate contact.

---

## Phase 5: User Story 3 - Admin Dashboard & CRUD (Priority: P3)

**Goal**: Allow admin to manage the motorcycle inventory, images, and track status.

**Independent Test**: Login to `/admin`, create a new motorcycle, upload images, and publish it to the catalog.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Create admin layout (`AdminSidebar`, `AdminHeader`) in `app/admin/layout.tsx`
- [ ] T024 [P] [US3] Implement auth middleware for `/admin/*` routes in `middleware.ts`
- [ ] T025 [P] [US3] Create admin login page `/admin/login/page.tsx`
- [ ] T026 [US3] Create data tables for motorcycles inventory in `/admin/motos/page.tsx`
- [ ] T027 [US3] Implement create/edit motorcycle form in `/admin/motos/nova/page.tsx` using `react-hook-form`
- [ ] T028 [US3] Create Server Actions for motorcycle CRUD in `lib/actions/motorcycles.ts`
- [ ] T029 [US3] Implement ImageUploader component and Supabase Storage actions in `lib/actions/images.ts`
- [ ] T030 [US3] Add plate lookup integration (Route Handler + UI field)

**Checkpoint**: Admin can fully manage the catalog and inventory independently.

---

## Phase 6: User Story 4 - Leads, Forms & Specific Operations (Priority: P4)

**Goal**: Allow users to submit sell/consignment/rental requests and track them in the admin dashboard.

**Independent Test**: Submit a sell request via `/venda-sua-moto` and verify it appears in the admin dashboard `/admin/propostas`.

### Implementation for User Story 4

- [ ] T031 [P] [US4] Create public forms (`SellForm`, `ConsignmentForm`, `RentalForm`) in `components/forms/`
- [ ] T032 [P] [US4] Implement Server Actions for lead/request submission
- [ ] T033 [US4] Create public pages `/venda-sua-moto`, `/consignar-moto`, `/aluguel`
- [ ] T034 [US4] Create admin data tables for leads and proposals `/admin/propostas`
- [ ] T035 [US4] Implement commission calculation domain logic in `lib/domain/commission.ts`
- [ ] T036 [US4] Build Sold Motorcycles page `/motos-vendidas`

**Checkpoint**: All user interactive forms and CRM/lead capture are working.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T037 [P] Implement analytics tracking endpoint (`/api/analytics`) and hooks
- [ ] T038 [P] Configure global error boundaries and loading states
- [ ] T039 Add responsive design polish and mobile-first adjustments
- [ ] T040 Security hardening (review RLS policies, input sanitization)
- [ ] T041 Run `quickstart.md` validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Phase 3, Phase 4, Phase 5, Phase 6 proceed in priority order or parallelly if isolated.
- **Polish (Final Phase)**: Depends on all user stories being complete

### Parallel Opportunities

- Foundation tasks like DB types (T009) and Supabase Auth (T008) can run in parallel
- UI components (T012, T017, T023, T031) can be scaffolded while backend APIs are built
- Analytics (T037) can be added independently of core features

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3 & 4: Core catalog and detail pages
4. **STOP and VALIDATE**: Test basic catalog browsing
5. Deploy MVP to staging

### Incremental Delivery

1. Foundation ready
2. Add Catalog + Admin CRUD → Test → Admin can manage stock
3. Add Detail pages + WhatsApp → Test → Users can see bikes and contact
4. Add public forms + Leads CRM → Test → Full lifecycle supported
