# Tasks: Admin Panel Redesign

**Input**: Design documents from `/specs/003-admin-redesign/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup & Project Restructuring

**Purpose**: Route Groups reorganization to separate public and administrative layouts.

- [x] T001 Move public routes and `app/layout.tsx` specific components into an `app/(public)` route group to isolate the public layout.
- [x] T002 Move `app/admin` routes into the correct route group structure: `app/admin/login` and `app/admin/(protected)`.

---

## Phase 2: Foundational (Security & Layouts)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Fix the `is_admin()` function in Supabase to properly set `search_path` and restrict `EXECUTE` permissions.
- [x] T004 Apply strict RLS policies on `public.motorcycles` and `public.motorcycle_images` tables.
- [x] T005 Update or create `app/admin/login/layout.tsx` to ensure a completely isolated login layout without public elements.
- [x] T006 Update or create `app/admin/(protected)/layout.tsx` to implement the administrative sidebar, header, and breadcrumbs.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Authentication Flow (Priority: P1) 🎯 MVP

**Goal**: Unauthenticated users cannot access the admin panel and are redirected to a dedicated login screen.

**Independent Test**: Navigate to `/admin` while logged out and get redirected to `/admin/login`, seeing only the login UI (no public header).

### Implementation for User Story 1

- [x] T007 [US1] Update `middleware.ts` to strictly validate server-side session for `/admin/(protected)/*` routes.
- [x] T008 [P] [US1] Refactor `app/admin/login/page.tsx` UI to align with the new brand tokens (Graphite/Gold) and remove any lingering public components.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Dashboard Data (Priority: P2)

**Goal**: Admin users see real-time metrics and data on the dashboard instead of mocked values.

**Independent Test**: Dashboard numbers (available, sold, rented, leads) correspond exactly to Supabase database counts.

### Implementation for User Story 2

- [x] T009 [P] [US2] Create data fetching functions for dashboard metrics in `lib/queries/dashboard.ts`.
- [x] T010 [US2] Update `app/admin/(protected)/page.tsx` (Dashboard) to consume real data and implement loading/empty states.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Motorcycle List (Priority: P3)

**Goal**: Admin users can manage, filter, and search the list of motorcycles using real Supabase data.

**Independent Test**: Filtering by "SOLD" or searching by model accurately reflects the database state.

### Implementation for User Story 3

- [x] T011 [P] [US3] Create data fetching and filtering functions in `lib/queries/motorcycles.ts`.
- [x] T012 [US3] Update `app/admin/(protected)/motos/page.tsx` to use a data table connected to the real queries.
- [x] T013 [US3] Implement status toggle server actions in `lib/actions/motorcycles.ts`.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Motorcycle Form & Images (Priority: P4)

**Goal**: Admin users can create/edit motorcycles and upload images directly to Supabase Storage.

**Independent Test**: Filling the "Nova Moto" form and uploading an image saves the record to `public.motorcycles` and the image to the `motorcycles` bucket.

### Implementation for User Story 4

- [x] T014 [P] [US4] Configure Supabase Storage bucket `motorcycles` and its RLS policies (via SQL migration).
- [x] T015 [US4] Refactor `components/admin/motorcycle-form.tsx` to handle multi-section layout and real-time Zod validation.
- [x] T016 [US4] Implement secure image upload utility communicating with Supabase Storage.
- [x] T017 [US4] Update server actions in `lib/actions/motorcycles.ts` for insert/update with image relations.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T018 Code cleanup, removing all remaining hardcoded or mocked data arrays used by the old admin panel.
- [x] T019 Verify UI responsiveness across all admin routes for mobile (320px+).
- [x] T020 Run `quickstart.md` validation to ensure end-to-end functionality.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - Stories can proceed sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- T007 (Middleware) and T008 (Login UI) can run in parallel.
- Data fetching queries (T009, T011) can be implemented in parallel with UI tasks if mock data is used temporarily.
