# Implementation Tasks: admin-fixes

**Feature**: `004-admin-fixes` | **Status**: Draft

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify branch `004-admin-fixes` is active

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**🚀 CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Verify `site_settings` table structure matches expected data model via Supabase dashboard or migrations

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Editar Moto (Priority: P1) 🚀 MVP

**Goal**: Fix the 404 error on the motorcycle edit page caused by synchronous params access.

**Independent Test**: Navigate to `/admin/motos/[id]/editar` with a valid ID and verify the form loads correctly.

### Implementation for User Story 1

- [X] T003 [P] [US1] Fix `params` resolution in `app/admin/(protected)/motos/[id]/editar/page.tsx` to await the promise
- [X] T004 [US1] Update query to include `images:motorcycle_images(*)` in `app/admin/(protected)/motos/[id]/editar/page.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Configurações do Site (Priority: P1)

**Goal**: Create a global settings management page for administrators and reflect the settings on the public site.

**Independent Test**: Navigate to `/admin/configuracoes`, modify a setting, and verify the change on the public site.

### Implementation for User Story 2

- [X] T005 [P] [US2] Create server actions `getSettings` and `saveSettingsAction` in `lib/actions/settings.ts`
- [X] T006 [US2] Create `SettingsForm` component with Zod validation in `components/admin/settings-form.tsx`
- [X] T007 [US2] Create settings page to render the form in `app/admin/(protected)/configuracoes/page.tsx`
- [X] T008 [P] [US2] Update `app/(public)/layout.tsx` to fetch settings and pass down as props
- [X] T009 [US2] Update `components/layout/header.tsx` to use dynamic settings
- [X] T010 [US2] Update `components/layout/footer.tsx` to use dynamic settings
- [X] T011 [US2] Update `components/layout/whatsapp-button.tsx` to use dynamic settings
- [X] T012 [US2] Update `app/(public)/page.tsx` to fetch settings and replace hardcoded names

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T013 Validate functionality according to `quickstart.md`
- [X] T014 Verify UI consistency on mobile and desktop devices

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 -> P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, both User Story 1 and User Story 2 can start in parallel
- Server Actions (T005) and Public Layout updates (T008) in User Story 2 can be developed in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Deploy/Demo (MVP!)
3. Add User Story 2 -> Test independently -> Deploy/Demo
4. Each story adds value without breaking previous stories
