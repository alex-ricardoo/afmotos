# Implementation Tasks: About Page

**Branch**: `[014-about-page]`
**Date**: 2026-08-24
**Spec**: [spec.md](file:///C:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/014-about-page/spec.md)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [ ] T001 Initialize the feature branch `014-about-page` (if not already created by hooks).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [x] T002 Create Zod schemas for the About page configuration (`aboutSettingsSchema`, `StoreDifferential`, `Location`, `StoreImage`) in `lib/settings/schema.ts` or equivalent file.
- [x] T003 Implement `getPublicSiteSettings` server query in `lib/settings/server-queries.ts` to fetch and sanitize `public.site_settings` JSONB data for public consumption (hiding admin-only fields).

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Public About Page View (Priority: P1)

**Goal**: As a visitor, I want to view an institutional page about AF Motos so that I can learn about the store, its differentials, and find contact and location information.

**Independent Test**: Navigate to `/sobre` and verify that the page renders the hero section, description, conditionals sections (image, differentials, socials, hours) based on available data, and the layout works on mobile.

### Implementation for User Story 1

- [x] T004 [P] [US1] Create component `components/about/about-hero.tsx` for the hero section with dynamic titles and image.
- [x] T005 [P] [US1] Create component `components/about/about-differentials.tsx` to render the grid of differentials using icons.
- [x] T006 [P] [US1] Create component `components/about/about-location.tsx` with address data and Google Maps encoded URL button.
- [x] T007 [P] [US1] Create component `components/about/about-contact.tsx` displaying WhatsApp, email, and business hours.
- [x] T008 [US1] Create the main page file `app/(public)/sobre/page.tsx` that fetches `getPublicSiteSettings` and assembles the about components.
- [x] T009 [US1] Implement dynamic SEO metadata (`generateMetadata`) in `app/(public)/sobre/page.tsx`.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (can be verified by manually editing the DB row or using fallback data).

---

## Phase 4: User Story 2 - Admin Configuration (Priority: P1)

**Goal**: As an admin, I want to manage the "Sobre a loja" content via the admin panel so that I don't need a developer to update the institutional information.

**Independent Test**: Open the admin settings page, fill the "Sobre a Loja" inputs (hero, descriptions, image, differentials), save, and verify they are persisted to the database.

### Implementation for User Story 2

- [ ] T010 [US2] Update the admin settings page (`app/admin/(protected)/configuracoes/page.tsx`) to add a new "Sobre a Loja" section or tab.
- [ ] T011 [US2] Add form fields for `isPublished`, `heroTitle`, `heroSubtitle`, `description`, and `additionalText`.
- [ ] T012 [US2] Add an image upload and preview component for `storeImage` utilizing existing Supabase storage logic.
- [ ] T013 [US2] Add a dynamic list interface (Add/Edit/Remove/Reorder) for `differentials`.
- [ ] T014 [US2] Add form fields for `location.mapsUrl` and `location.instructions`.
- [ ] T015 [US2] Add form fields for `seo.title`, `seo.description`, and `seo.ogImageUrl`.
- [ ] T016 [US2] Update the settings Server Action to validate the extended schema and persist the `about` JSONB property to `public.site_settings`.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Admins can update content, and the public page reflects the updates.

---

## Phase 5: User Story 3 - Site Navigation Integration (Priority: P2)

**Goal**: As a visitor, I want to see a link to "Sobre nós" in the main menu and footer so that I can easily discover the institutional page from anywhere on the site.

**Independent Test**: Check the main header and footer for the "Sobre nós" link, ensuring it works and doesn't break layout.

### Implementation for User Story 3

- [ ] T017 [P] [US3] Add the "Sobre nós" link (pointing to `/sobre`) to the main navigation menu in `components/layout/header.tsx` (for both desktop and mobile states).
- [ ] T018 [P] [US3] Update `components/layout/footer.tsx` to include the "Sobre nós" link and use dynamic data from `getPublicSiteSettings` for address and contact info.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [ ] T019 [P] Perform a final accessibility audit on `/sobre` (check contrast, alt texts, aria-labels).
- [ ] T020 Run the `quickstart.md` validation to ensure end-to-end functionality.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in priority order.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### Parallel Opportunities

- Components in Phase 3 (US1) marked with `[P]` (`about-hero`, `about-differentials`, `about-location`, `about-contact`) can be built in parallel.
- Header and Footer updates in Phase 5 (US3) can be built in parallel.

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup and Foundational tasks (Zod schemas and server fetcher).
2. Build User Story 1 (public page) using static fallback data or manually seeded DB data.
3. Build User Story 2 (admin configuration) so admins can start entering real data immediately.
4. **STOP and VALIDATE**: Ensure saving admin data immediately reflects on the `/sobre` page.
5. Build User Story 3 (navigation) to make the page discoverable.
