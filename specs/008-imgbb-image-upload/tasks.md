# Tasks: Migração de Uploads para ImgBB com Fallback Supabase Storage

**Input**: Design documents from `specs/008-imgbb-image-upload/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/upload-contracts.md`, `quickstart.md`)  
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `data-model.md`, `contracts/`  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure & Environment)

**Purpose**: Configuration of environment variables and image domain allowances.

- [X] T001 Update environment variable documentation in `.env.example` to include `IMGBB_API_KEY=`
- [X] T002 [P] Configure Next.js remotePatterns in `next.config.ts` for ImgBB domains (`i.ibb.co`, `image.ibb.co`)

---

## Phase 2: Foundational (Core Upload Layer & Database Schema)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] Create TypeScript types and contracts in `lib/uploads/types.ts`
- [X] T004 [P] Create upload constants and allowed MIME types in `lib/uploads/constants.ts`
- [X] T005 [P] Create file validation and sanitization helpers in `lib/uploads/validation.ts`
- [X] T006 [P] Create standardized error classes in `lib/uploads/errors.ts`
- [X] T007 [P] Create database migration script in `supabase/migrations/00024_add_external_image_metadata.sql`
- [X] T008 [P] Update database interface `MotorcycleImage` in `types/database.ts`
- [X] T009 Implement server-side ImgBB client with timeout, retry, and jitter in `lib/uploads/imgbb.ts`
- [X] T010 Implement Supabase Storage fallback client in `lib/uploads/supabase-storage.ts`
- [X] T011 Implement universal image URL resolver helper `getImageSource()` in `lib/uploads/image-url.ts`
- [X] T012 Implement master orchestrator `uploadImage()` in `lib/uploads/upload-image.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Upload Administrativo de Fotos de Motos (Priority: P1) 🎯 MVP

**Goal**: Permitir que administradores façam upload de fotos para motos no painel com envio prioritário ao ImgBB e fallback automático ao Supabase Storage.

**Independent Test**: Acessar `/admin/motos/[id]/editar`, enviar fotos, validar gravação com `provider = 'imgbb'` ou fallback `'supabase'` e exibição na galeria admin.

### Implementation for User Story 1

- [X] T013 [US1] Refactor `uploadMotorcycleImageAction` in `lib/actions/images.ts` to use `uploadImage()` orchestrator and store `provider`, `public_url`, `display_url`, `thumbnail_url`
- [X] T014 [US1] Refactor `deleteMotorcycleImageAction` in `lib/actions/images.ts` to handle provider-specific deletion and safe orphan cleanup
- [X] T015 [US1] Refactor `deleteMotorcycleAction` in `lib/actions/motorcycles.ts` to check provider before removing storage objects
- [X] T016 [US1] Update `components/gallery/image-uploader.tsx` to handle `public_url` and provide real-time upload and fallback feedback

**Checkpoint**: User Story 1 (Admin Motorcycle Upload) fully functional and testable independently.

---

## Phase 4: User Story 2 - Upload Público em Formulários de Anúncio e Venda (Priority: P2)

**Goal**: Permitir que visitantes enviem fotos de suas motos em formulários públicos com segurança e validação server-side.

**Independent Test**: Preencher `/anunciar-sua-moto` com fotos, enviar proposta e verificar que as fotos foram processadas via Server Action e salvas na proposta.

### Implementation for User Story 2

- [X] T017 [US2] Update `createSellRequestAction` in `lib/actions/leads.ts` to accept uploaded image URLs and link to lead metadata
- [X] T018 [US2] Refactor `components/forms/anunciar-moto-form.tsx` to remove direct browser storage calls and upload via Server Action with `uploadImage()`

**Checkpoint**: User Stories 1 AND 2 working independently.

---

## Phase 5: User Story 3 - Resolução Unificada e Compatibilidade com Fotos Legadas (Priority: P3)

**Goal**: Garantir que fotos antigas do Supabase e novas fotos do ImgBB renderizem perfeitamente no catálogo e galerias públicas via `next/image`.

**Independent Test**: Acessar `/motos` e `/motos/[slug]`, conferir que motos cadastradas antes e depois da migração renderizam sem links quebrados.

### Implementation for User Story 3

- [X] T019 [US3] Refactor `getPublicImageUrl()` and queries in `lib/queries/motorcycles.ts` to use universal resolver `getImageSource()`
- [X] T020 [US3] Update `components/gallery/image-carousel.tsx` and `components/motorcycles/motorcycle-card.tsx` to ensure proper Next.js image rendering with `getImageSource()`
- [X] T021 [US3] Adapt `components/admin/settings-form.tsx` to utilize universal image source resolution for store logo

**Checkpoint**: All user stories functional, zero broken legacy images.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Security auditing, typechecking, linting and final verification.

- [X] T022 [P] Verify `IMGBB_API_KEY` is not present in client bundle or exposed via `NEXT_PUBLIC_`
- [X] T023 Run typecheck and linting validation (`npm run typecheck && npm run lint`)
- [X] T024 Execute end-to-end validation scenarios documented in `specs/008-imgbb-image-upload/quickstart.md`
- [X] T025 Run production build validation (`npm run build`)

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (User Story 1 - P1)**: Depends on Phase 2 completion.
- **Phase 4 (User Story 2 - P2)**: Depends on Phase 2 completion.
- **Phase 5 (User Story 3 - P3)**: Depends on Phase 2 completion.
- **Phase 6 (Polish)**: Depends on completion of User Stories 1, 2, and 3.

### Parallel Opportunities
- T003, T004, T005, T006, T007, T008 in Phase 2 can run in parallel.
- Once Phase 2 is complete, User Story 1, 2, and 3 can be executed sequentially or in parallel.
- T022 and T023 in Polish phase can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`.env.example`, `next.config.ts`).
2. Complete Phase 2: Foundational (`lib/uploads/`, migration, types).
3. Complete Phase 3: User Story 1 (Admin Motorcycle Upload).
4. **Validate MVP**: Test upload of photos in `/admin/motos/[id]/editar` and verify ImgBB storage with Supabase fallback.

### Incremental Delivery
1. Foundation & MVP (US1) deployed and verified.
2. Add Public Form Uploads (US2).
3. Add Unified Legacy Rendering & Carousel Optimization (US3).
4. Execute Polish & Production Build (Phase 6).
