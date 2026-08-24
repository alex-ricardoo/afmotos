# Feature Specification: About Page

**Feature Branch**: `[014-about-page]`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Criar uma nova página institucional pública para apresentar a AF Motos, explicar a atuação da loja, transmitir confiança e facilitar que o cliente encontre a unidade..."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Public About Page View (Priority: P1)

As a visitor, I want to view an institutional page about AF Motos so that I can learn about the store, its differentials, and find contact and location information.

**Why this priority**: It is the core goal of the feature—to present the store to prospective customers and build trust.

**Independent Test**: Can be fully tested by accessing the `/sobre` URL and verifying that all sections (hero, about, differentials, location, contacts, and social media) render correctly based on data.

**Acceptance Scenarios**:

1. **Given** the user navigates to `/sobre`, **When** the page loads, **Then** the hero section, description, and configured modules are displayed elegantly.
2. **Given** that some optional fields (like store photo or business hours) are not configured, **When** the `/sobre` page loads, **Then** those specific sections are gracefully hidden without breaking the layout.
3. **Given** the page renders, **When** viewed on a mobile device, **Then** it follows a single-column layout without horizontal overflow.

---

### User Story 2 - Admin Configuration (Priority: P1)

As an admin, I want to manage the "Sobre a loja" content (hero texts, descriptions, image, differentials, location, and SEO) via the admin panel so that I don't need a developer to update the institutional information.

**Why this priority**: Ensures the content is not hardcoded and can be maintained dynamically, fulfilling a critical requirement.

**Independent Test**: Can be fully tested by navigating to the admin configuration panel, filling out the new "Sobre a loja" fields, saving, and verifying the data is persisted in the database.

**Acceptance Scenarios**:

1. **Given** the admin is in the settings page, **When** they update the "Sobre a loja" content and save, **Then** the updates are persisted to the `site_settings` table.
2. **Given** the admin is configuring differentials, **When** they add, edit, reorder, or remove a differential, **Then** the list is updated correctly and saved in the JSONB structure.
3. **Given** the admin uploads a store image, **When** the upload completes, **Then** the URL is saved in the configuration and the file is stored in the correct Supabase bucket.

---

### User Story 3 - Site Navigation Integration (Priority: P2)

As a visitor, I want to see a link to "Sobre nós" in the main menu and footer so that I can easily discover the institutional page from anywhere on the site.

**Why this priority**: Ensures the new page is discoverable, but is secondary to the existence of the page itself.

**Independent Test**: Can be tested by opening the application and verifying the navigation components.

**Acceptance Scenarios**:

1. **Given** a user is on any public page, **When** they view the main header menu, **Then** they see a "Sobre nós" link pointing to `/sobre`.
2. **Given** a user scrolls to the bottom of the page, **When** they view the footer, **Then** they see updated links and dynamic contact/address info aligned with the new settings structure.

### Edge Cases

- What happens when the `public.site_settings` table has an empty `settings` JSONB or no `about` node? The page should use safe fallback content (e.g., standard title/subtitle) and hide optional sections.
- How does the system handle broken or empty maps URL / address data? It should fall back to dynamically encoding the address for Google Maps, and if not enough address info is present, hide the map link entirely.
- What happens if the store image is deleted from the bucket directly? The frontend should handle broken images gracefully, perhaps showing a placeholder or collapsing the image area.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a public route `/sobre` rendering institutional content.
- **FR-002**: System MUST allow authenticated admins to manage institutional settings (hero, about texts, store image, differentials, location, SEO) via the admin panel configuration page.
- **FR-003**: System MUST persist institutional configurations within the existing `public.site_settings` JSONB field, preserving other unrelated settings.
- **FR-004**: System MUST dynamically load site settings in the `/sobre` page using a secure public loader that strips out sensitive or admin-only data.
- **FR-005**: System MUST conditionally render optional sections (Store Image, Differentials, Socials, Hours) based on whether they are populated in settings.
- **FR-006**: System MUST include a "Sobre nós" link in the main navigation menu (desktop and mobile) and the footer.
- **FR-007**: System MUST generate dynamic SEO metadata (Title, Description, Open Graph) based on the configured settings for the `/sobre` page.
- **FR-008**: System MUST sanitize any text output and avoid dangerous HTML rendering.
- **FR-009**: System MUST generate a valid Google Maps URL from the address data if a custom Maps URL is not provided.

### Key Entities

- **Site Settings (JSONB Extension)**: Extends the existing `settings` field to include an `about` property containing `heroTitle`, `description`, `storeImage`, `location`, `seo`, etc.
- **Store Differential**: An object containing `id`, `title`, `description`, `icon`, `isActive`, and `sortOrder`, stored within the `about` configuration.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Admins can update the About Page text and differentials without developer assistance or code deployments.
- **SC-002**: The public `/sobre` page achieves 100/100 accessibility and SEO scores in automated Lighthouse audits.
- **SC-003**: The `/sobre` page loads successfully and is fully responsive across mobile (320px+) and desktop viewports, with no horizontal overflow.
- **SC-004**: All previously hardcoded institutional texts and contact links on the site are fully replaced by the dynamic configuration pipeline.

## Assumptions

- Supabase storage buckets and RLS policies are already configured to allow admins to upload images and the public to view them.
- The `public.site_settings` table contains a single active row that dictates global site settings.
- Integration for map rendering will initially use simple secure links/embeds, deferring complex interactive maps with custom markers to a future iteration.
