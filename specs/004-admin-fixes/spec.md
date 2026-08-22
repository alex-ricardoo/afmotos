# Feature Specification: admin-fixes

**Feature Branch**: `004-admin-fixes`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "Corrigir dois problemas críticos do painel administrativo..."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Editar Moto (Priority: P1)

Administradores devem ser capazes de editar os dados de uma moto existente no painel.

**Why this priority**: Core functionality of the platform is missing, preventing updates to inventory.

**Independent Test**: Navigate to `/admin/motos/[id]/editar` with a valid ID, see the form populated with the motorcycle data, make a change, save, and see the change reflected in the list.

**Acceptance Scenarios**:

1. **Given** a valid motorcycle ID, **When** accessing the edit route, **Then** the edit form is loaded with the correct data.
2. **Given** modified data in the edit form, **When** clicking save, **Then** the data is updated in the database and a success message is shown.
3. **Given** an invalid motorcycle ID, **When** accessing the edit route, **Then** a "Not found" error state is shown instead of a 404 page.

---

### User Story 2 - Configurações do Site (Priority: P1)

Administradores devem ser capazes de gerenciar as configurações globais do site (contatos, textos, logo).

**Why this priority**: Essential to allow business owners to update contact info and basic site content without changing code.

**Independent Test**: Navigate to `/admin/configuracoes`, see the current configuration, modify the WhatsApp number, save, and see the new number reflected on the public site.

**Acceptance Scenarios**:

1. **Given** an authenticated admin user, **When** accessing `/admin/configuracoes`, **Then** the settings form is shown with current database values.
2. **Given** valid settings data, **When** saving the form, **Then** the data is persisted to the `site_settings` table.
3. **Given** an unauthenticated or non-admin user, **When** accessing `/admin/configuracoes`, **Then** access is denied.

### Edge Cases

- What happens when a motorcycle ID does not exist in the database? Shows a graceful "Motorcycle not found" error state, not a Next.js 404.
- How does system handle concurrent edits to site settings? Last write wins, no duplicate rows created.
- What happens if the logo upload fails? The rest of the settings are saved, and an error message is shown specifically for the upload.
- What happens if the database is temporarily down when accessing settings? A graceful error state is shown with a retry option.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow editing existing motorcycles by ID.
- **FR-002**: System MUST load motorcycle data, categories, and images for editing.
- **FR-003**: System MUST persist edits to the `public.motorcycles` table.
- **FR-004**: System MUST provide a dedicated route `/admin/configuracoes`.
- **FR-005**: System MUST allow managing store identity, contact info, commercial operation details, and social media/SEO.
- **FR-006**: System MUST persist global settings in the `public.site_settings` table.
- **FR-007**: System MUST reflect saved settings on the public website.
- **FR-008**: System MUST enforce Role-Level Security (RLS) allowing only admins to edit motorcycles and settings.
- **FR-009**: System MUST support uploading a logo to Supabase Storage (if configured).

### Key Entities

- **Motorcycle**: Inventory item with details like brand, model, year, price, status, etc.
- **SiteSetting**: Singleton record containing global configuration for the store (name, contacts, texts, branding).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The route `/admin/motos/[id]/editar` successfully renders and saves data for valid IDs.
- **SC-002**: The route `/admin/configuracoes` is accessible to admins and successfully updates `site_settings`.
- **SC-003**: Hardcoded values in the public site are replaced by values from `site_settings`.
- **SC-004**: No new tables are created; existing `public.site_settings` is utilized.

## Assumptions

- Supabase Storage is already configured or can be used minimally for logo upload.
- The `site_settings` table exists and has the mentioned columns.
- RLS policies on `motorcycles` and `site_settings` are already partially configured but need auditing.
