# Feature Specification: AF Motos – Digital Platform for Motorcycle Catalog, Sales, Consignment & Rental

**Feature Branch**: `001-af-motos-platform`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "AF Motos – Plataforma Digital de Catálogo, Vendas, Consignação e Locação de Motos"

## Clarifications

### Session 2026-08-21

- Q: When two motorcycles share the same brand, model, and year, how should the system generate unique URL slugs? → A: Append a numeric suffix (e.g., `/motos/honda-cb-500f-2022`, `/motos/honda-cb-500f-2022-2`).
- Q: Are there restricted transitions between motorcycle statuses, or can the admin freely change from any status to any? → A: Restricted transitions — define a small set of valid paths (e.g., "vendida" is final unless explicitly reversed; "alugada"→"disponível" only after return).

## User Scenarios & Testing _(mandatory)_

### User Story 1 – Browse & Discover Motorcycles (Priority: P1)

A visitor arrives at the AF Motos site (typically from an Instagram link or WhatsApp share) and browses available motorcycles. They can scroll through the catalog, search by keyword, filter by brand/price/category, and view detailed information including gallery, specs, price, and differentials. They can contact AF Motos via WhatsApp with a pre-filled message referencing the specific motorcycle.

**Why this priority**: This is the core value proposition — turning social media traffic into motorcycle views and WhatsApp contacts. Without this, the platform has no purpose.

**Independent Test**: Can be fully tested by loading the public home page, navigating to the catalog, searching/filtering, opening a motorcycle detail page, viewing the gallery, and clicking the WhatsApp button. Delivers the primary conversion funnel.

**Acceptance Scenarios**:

1. **Given** a visitor on the home page, **When** they scroll, **Then** they see a hero section, quick search, brand filters, featured motorcycles, recently added motorcycles, and a WhatsApp CTA.
2. **Given** a visitor on the catalog page, **When** they apply filters (brand: "Honda", price: up to R$30.000), **Then** only matching available motorcycles appear.
3. **Given** a visitor viewing a motorcycle detail page, **When** they click "Tenho interesse nessa moto", **Then** WhatsApp opens with a pre-filled message containing brand, model, year, and internal code.
4. **Given** a visitor on a motorcycle detail page, **When** they scroll through the gallery on mobile, **Then** they can swipe horizontally, see a photo counter, and tap to open fullscreen with zoom.
5. **Given** a visitor viewing a sold motorcycle page, **When** the page loads, **Then** it clearly indicates "Vendida" status and displays similar available motorcycles.

---

### User Story 2 – Admin Registers a Motorcycle (Priority: P1)

The AF Motos administrator logs into the admin panel, enters a license plate, and the system auto-fills motorcycle data from an external plate lookup API. The admin reviews, corrects, adds pricing/description/photos/status/differentials, and publishes the motorcycle to the public catalog.

**Why this priority**: The catalog is only useful if the admin can quickly populate it. Fast motorcycle registration (especially via plate lookup) is the backbone of daily operations.

**Independent Test**: Can be tested by logging in as admin, entering a plate, verifying auto-fill, completing all fields, uploading photos, setting order, and confirming the motorcycle appears on the public catalog.

**Acceptance Scenarios**:

1. **Given** an authenticated admin on the motorcycle registration page, **When** they enter a valid plate, **Then** the system queries the plate provider and pre-fills brand, model, year, version, and color.
2. **Given** auto-filled data, **When** the admin edits any field (e.g., corrects year), **Then** the corrected value is preserved.
3. **Given** the admin uploads 8 photos, **When** they drag to reorder and select photo 3 as the main photo, **Then** the order and main photo selection persist after saving.
4. **Given** a plate API timeout or unavailability, **When** the admin submits the plate, **Then** a friendly error message appears and the admin can proceed with manual entry.
5. **Given** a fully completed motorcycle form, **When** the admin clicks "Publicar", **Then** the motorcycle appears on the public catalog with status "Disponível".

---

### User Story 3 – Sell Your Motorcycle to AF Motos (Priority: P2)

A motorcycle owner visits the "/venda-sua-moto" page, fills in their personal data (name, WhatsApp), motorcycle data (plate, mileage, desired price, photos, observations), and submits a sales proposal. The system attempts plate lookup to auto-fill data, allows the user to review/correct, and creates a lead/proposal in the admin panel.

**Why this priority**: Motorcycle acquisition (both direct purchase and consignment) is a key revenue channel. The platform must convert motorcycle owners into leads.

**Independent Test**: Can be tested by visiting the sell page, filling the form, submitting, and verifying the lead appears in the admin panel with status "Novo".

**Acceptance Scenarios**:

1. **Given** a visitor on "/venda-sua-moto", **When** they enter a valid plate, **Then** the system auto-fills available motorcycle data and the user can review/correct before submission.
2. **Given** a completed sales proposal form, **When** the user submits, **Then** a lead is created with type "venda de moto" and status "novo", and the user sees a success confirmation.
3. **Given** the admin panel, **When** an admin views the purchase proposals list, **Then** they see the new proposal with all submitted data and can update its status through the lifecycle (novo → em análise → contato realizado → proposta enviada → negociação → aprovado/recusado → comprado/encerrado).

---

### User Story 4 – Consign a Motorcycle (Priority: P2)

A motorcycle owner visits "/consignar-moto", reads how consignment works (owner keeps motorcycle, AF Motos advertises, commission on sale), fills the consignment form (name, WhatsApp, plate, brand/model, year, mileage, desired price, photos, observations), and submits. The admin receives the proposal and can manage the consignment lifecycle, including commission calculation.

**Why this priority**: Consignment expands inventory without capital investment. It is a core business model that differentiates AF Motos from simple dealerships.

**Independent Test**: Can be tested by submitting a consignment proposal and verifying the admin can view it, set commission terms, and see the financial breakdown.

**Acceptance Scenarios**:

1. **Given** a visitor on "/consignar-moto", **When** the page loads, **Then** a clear explanation of the consignment model is displayed (owner owns → AF Motos advertises → commission on sale).
2. **Given** a completed consignment form, **When** the user submits, **Then** a consignment lead is created with type "consignação" and status "novo".
3. **Given** an admin managing a consignment, **When** they set sale price R$35.000 and commission 8%, **Then** the system displays: commission AF Motos R$2.800, owner receives R$32.200.
4. **Given** an approved consignment, **When** the admin publishes the motorcycle, **Then** it appears on the public catalog with ownership type "consignada" (not visible publicly) and the consignment contract data is only visible in admin.

---

### User Story 5 – Motorcycle Rental (Priority: P3)

A visitor browses "/aluguel", views motorcycles available for rent with daily/weekly/monthly pricing, opens a rental detail page with requirements and terms, selects pickup/return dates, sees an estimated price, fills in name/WhatsApp, and submits a rental request. The request generates a lead and optionally opens WhatsApp with a pre-filled message.

**Why this priority**: Rental is a secondary revenue stream. The MVP requires only lead generation and WhatsApp contact, not full booking/payment.

**Independent Test**: Can be tested by browsing the rental catalog, viewing a rental detail page, submitting a rental request, and verifying the lead is created in admin.

**Acceptance Scenarios**:

1. **Given** a visitor on "/aluguel", **When** the page loads, **Then** motorcycles available for rent are displayed with photo, brand, model, and pricing (daily/weekly/monthly when applicable).
2. **Given** a visitor on a rental detail page, **When** they view requirements, **Then** they see configurable information: documentation, minimum age, license requirements, deposit, payment methods, insurance, included items.
3. **Given** a visitor selects pickup date 10/09/2026 and return date 13/09/2026, **When** the system calculates, **Then** an estimated price is shown based on configured daily rates.
4. **Given** a completed rental request form, **When** the user submits, **Then** a lead is created with type "aluguel" and a WhatsApp link opens with message: "Olá! Vim pelo site da AF Motos e tenho interesse em alugar uma [Brand] [Model] de [pickup] a [return]."

---

### User Story 6 – Admin Dashboard & Lead Management (Priority: P2)

The admin logs into the admin panel and sees a dashboard with key indicators (available/reserved/sold/rented motorcycles, open proposals, rental requests, leads, views, WhatsApp clicks). They can manage all leads in a unified view, update statuses, and track conversions.

**Why this priority**: The admin panel centralizes all business operations. Without lead management, the admin cannot follow up on sales/consignment/rental opportunities.

**Independent Test**: Can be tested by logging in, verifying dashboard metrics render with current data, navigating to leads, filtering by type, and updating a lead status.

**Acceptance Scenarios**:

1. **Given** an authenticated admin, **When** they access "/admin", **Then** the dashboard displays current counts: available motorcycles, reserved, sold, rented, in maintenance, open purchase proposals, consignment proposals, rental requests, and total leads.
2. **Given** the leads management page, **When** the admin filters by type "consignação", **Then** only consignment leads appear.
3. **Given** a lead with status "novo", **When** the admin updates it to "em atendimento", **Then** the status is persisted and the change is reflected in the dashboard.

---

### User Story 7 – Sold Motorcycles Portfolio (Priority: P3)

Visitors can browse a dedicated "/motos-vendidas" page showing previously sold motorcycles as a portfolio/social proof. Each sold motorcycle shows photos, brand, model, year, key characteristics, and "Vendida" badge. No sensitive data (plate, owner info) is displayed.

**Why this priority**: Social proof builds trust. Showing sold inventory demonstrates market activity and business credibility.

**Independent Test**: Can be tested by marking a motorcycle as sold in admin and verifying it appears on the sold motorcycles page with appropriate display restrictions.

**Acceptance Scenarios**:

1. **Given** the "/motos-vendidas" page, **When** it loads, **Then** sold motorcycles are displayed in a grid/list with photos, brand, model, year, and "Vendida" badge.
2. **Given** a sold motorcycle, **When** a visitor accesses its direct URL, **Then** the page shows the motorcycle details, "Vendida" status, and a section of similar available motorcycles.
3. **Given** the sold motorcycles page, **When** viewing any motorcycle card, **Then** no plate number or owner personal information is visible.

---

### User Story 8 – SEO & Social Sharing (Priority: P2)

Every public motorcycle page has a unique, friendly URL (e.g., /motos/honda-cb-500f-2022), dynamically generated meta tags (title, description, Open Graph image), and structured data. When shared on WhatsApp or Instagram, the link preview shows the motorcycle photo, name, and price.

**Why this priority**: Most traffic originates from social media shares. Rich link previews dramatically increase click-through rate from WhatsApp/Instagram.

**Independent Test**: Can be tested by sharing a motorcycle URL on WhatsApp and verifying the preview renders correctly with photo, title, and price.

**Acceptance Scenarios**:

1. **Given** a motorcycle "Yamaha MT-07 2022", **When** its page loads, **Then** the HTML `<title>` is "Yamaha MT-07 2022 à venda | AF Motos" and Open Graph tags include the main photo, model name, and price.
2. **Given** a motorcycle URL shared on WhatsApp, **When** the recipient sees the message, **Then** a rich preview displays with the motorcycle's main photo, title, and price.
3. **Given** a search engine crawler, **When** it indexes a motorcycle page, **Then** the page contains structured data (JSON-LD) with product/vehicle schema and a canonical URL.

---

### Edge Cases

- What happens when a visitor accesses a motorcycle that was just sold? → The page remains accessible with "Vendida" status and similar motorcycles displayed.
- What happens when the plate API is unavailable during motorcycle registration? → The admin receives a clear error message and can proceed with full manual entry.
- What happens when the plate API returns incomplete data? → Available fields are pre-filled; missing fields remain empty for manual input.
- What happens when a visitor tries to filter and no motorcycles match? → An empty state is shown with a message like "Nenhuma moto encontrada" and suggestion to broaden filters.
- What happens when the admin uploads photos exceeding storage limits? → The system shows a clear error with file size/format requirements.
- What happens when a motorcycle is marked for both sale and rental? → The motorcycle appears in both the sales catalog and the rental section with appropriate pricing in each context.
- What happens when a consignment contract expires? → The motorcycle can be set to "indisponível" or returned to the owner; admin manages this via status changes.
- What happens when a visitor accesses the admin panel without authentication? → They are redirected to the login page.
- What happens when a rental request date range conflicts with an existing reservation? → In the MVP, this is handled manually by the admin. The data model is prepared for automated conflict detection in future versions.

## Requirements _(mandatory)_

### Functional Requirements

**Public Site**

- **FR-001**: System MUST display a public home page with hero section, quick search, brand filters, featured motorcycles, recently added motorcycles, sold motorcycles preview, rental section preview, "venda sua moto" CTA, about section, and WhatsApp CTA.
- **FR-002**: System MUST provide a motorcycle catalog page with search, filters (brand, model, price range, year, mileage, displacement, type/category, purpose), sorting (most recent, lowest price, highest price, lowest mileage, newest year), and pagination or progressive loading.
- **FR-003**: Each motorcycle MUST have a unique, SEO-friendly URL (e.g., /motos/honda-cb-500f-2022) with dynamic metadata, Open Graph tags, and structured data. When multiple motorcycles share the same brand, model, and year, the system MUST append a sequential numeric suffix to ensure uniqueness (e.g., `/motos/honda-cb-500f-2022-2`, `/motos/honda-cb-500f-2022-3`).
- **FR-004**: Each motorcycle detail page MUST display: gallery (swipe carousel on mobile, grid on desktop, fullscreen with zoom), main specs (brand, model, version, manufacturing year, model year, mileage, displacement, fuel, transmission, color, price, location, internal code), description, structured differentials, WhatsApp button with pre-filled message, share functionality, and similar motorcycles section.
- **FR-005**: System MUST NOT display license plates, owner personal data, or consignment financial details on any public page.
- **FR-006**: System MUST provide a "/venda-sua-moto" page with a form collecting: name, WhatsApp, optional email, plate (with auto-fill via plate API), mileage, desired price, photos, and observations. Submission creates a purchase proposal lead.
- **FR-007**: System MUST provide a "/consignar-moto" page explaining the consignment model, with a form collecting: name, WhatsApp, optional email, plate, brand/model, year, mileage, desired price, photos, and observations. Submission creates a consignment lead.
- **FR-008**: System MUST provide a "/aluguel" page listing motorcycles available for rental, with cards showing photo, brand, model, characteristics, and pricing (daily/weekly/monthly). Each rental motorcycle has a detail page with configurable requirements, terms, and a rental request form (pickup date, return date, price estimate, name, WhatsApp).
- **FR-009**: System MUST provide a "/motos-vendidas" page displaying sold motorcycles as a portfolio with photos, brand, model, year, and "Vendida" badge. No sensitive data displayed.
- **FR-010**: System MUST generate pre-filled WhatsApp messages dynamically per context (interest in motorcycle, direct sale, consignment, rental, specific motorcycle request), including variables: brand, model, year, price, and internal code.
- **FR-011**: System MUST support UTM parameter tracking to identify lead sources (site, Instagram, WhatsApp, Google, direct access, campaigns).

**Admin Panel**

- **FR-012**: System MUST provide an authenticated admin panel at "/admin" with session-based authentication.
- **FR-013**: System MUST display a dashboard showing: available/reserved/sold/rented/in-maintenance motorcycle counts, open purchase proposals, consignment proposals, rental requests, total leads, page views, and WhatsApp clicks. Also display most viewed motorcycles, motorcycles with most contacts, recently added motorcycles, and recent proposals.
- **FR-014**: System MUST provide motorcycle management with: list (table with photo, name, year, mileage, price, ownership, purpose, status, registration date, actions), create (with plate lookup auto-fill), edit, duplicate, feature/highlight, publish, hide, change status (available, reserved, sold, rented, in maintenance, unavailable, hidden), and soft delete.
- **FR-015**: System MUST support multi-photo upload with drag-and-drop, reordering, main photo selection, removal, replacement, and preview before publishing. Photo order MUST persist.
- **FR-016**: System MUST support motorcycle ownership types (own, consigned) and purpose types (sale, rental, sale and rental) as separate, independent fields.
- **FR-017**: System MUST provide lead management with: unified list, filtering by type (interest in motorcycle, motorcycle sale, consignment, rental, specific motorcycle request, general contact), status tracking (novo, em atendimento, qualificado, convertido, perdido, encerrado), and lead details including name, WhatsApp, email, related motorcycle, origin, date, status, and observations.
- **FR-018**: System MUST provide consignment management with: owner, motorcycle, owner's requested price, minimum price, advertised price, commission type (percentage or fixed), commission percentage/amount, commission value, entry date, start date, end date, contract status, observations, and automatic financial calculation (sale price − commission = owner payment).
- **FR-019**: System MUST provide purchase proposal management with: view proposal, evaluate motorcycle, contact owner, register offered amount, register accepted amount, approve/reject, and convert to inventory motorcycle.
- **FR-020**: System MUST provide rental motorcycle management including availability status (available, reserved, rented, in maintenance, unavailable), configurable pricing, configurable requirements, and rental request lead management.

**Plate Lookup Integration**

- **FR-021**: System MUST provide a decoupled plate lookup abstraction (PlateProvider interface) that returns: brand, model, version, year, color, engine specs, and any additional available fields.
- **FR-022**: System MUST handle plate lookup errors gracefully: invalid plate format, API unavailable, timeout, rate limiting, incomplete data, vehicle not found, authentication error. In all cases, the user MUST be able to proceed with manual entry.
- **FR-023**: Plate lookup credentials MUST exist exclusively as server-side environment variables. The lookup MUST execute only on the server.

**Analytics & Observability**

- **FR-024**: System MUST track events: motorcycle view, WhatsApp click, share, sales proposal submission, consignment proposal submission, rental request, search query, filter application. Events MUST be associated with the specific motorcycle when applicable.

**Data Model**

- **FR-025**: System MUST separate motorcycle ownership (own, consigned) from purpose (sale, rental, sale and rental) as independent fields.
- **FR-026**: Motorcycle status MUST support at minimum: disponível, reservada, vendida, alugada, em manutenção, indisponível, oculta. Status transitions MUST be restricted to a defined set of valid paths. "Vendida" is a terminal status that cannot be reversed without an explicit administrative reversal action. "Alugada" can only transition to "disponível" after return is confirmed. "Oculta" can transition to any non-terminal status. The system MUST prevent invalid transitions and display a clear message when an admin attempts one.
- **FR-027**: Sold motorcycles MUST be retained in the database with status "vendida", not deleted.
- **FR-028**: The rental data model MUST be designed to support future date-based conflict detection, even if the MVP relies on manual admin confirmation.

### Key Entities

- **Motorcycle**: The central entity. Represents a motorcycle in the system. Key attributes: brand, model, version, year (fabrication and model), mileage, displacement, fuel type, transmission, color, price, status, ownership type, purpose, description, differentials, featured flag, internal code, slug, location.
- **MotorcycleImage**: Photos associated with a motorcycle. Key attributes: image URL/path, display order, is-main flag.
- **Lead**: A unified entity capturing all types of incoming interest. Key attributes: type, name, WhatsApp, email, related motorcycle, origin/source, status, observations, dates.
- **PurchaseProposal**: A proposal from a motorcycle owner to sell their motorcycle to AF Motos. Key attributes: owner data, motorcycle data (from form and plate lookup), mileage, desired price, photos, status lifecycle, offered amount, accepted amount, observations.
- **ConsignmentContract**: Governs the consignment relationship. Key attributes: owner, motorcycle, owner's requested price, minimum price, advertised price, commission type, commission rate/amount, calculated commission value, entry date, start date, end date, contract status, observations.
- **RentalListing**: Rental-specific data for a motorcycle. Key attributes: daily rate, weekly rate, monthly rate, requirements, terms, availability status.
- **RentalRequest**: A request from a visitor to rent a motorcycle. Key attributes: motorcycle, pickup date, return date, estimated price, requester name, requester WhatsApp, status.
- **AdminUser**: Authenticated administrator. Key attributes: email, role (for future multi-user support).
- **SiteConfiguration**: Global site settings. Key attributes: WhatsApp number, default messages per context, about text, commercial information, rental general terms.
- **AnalyticsEvent**: Tracked events for observability. Key attributes: event type, motorcycle ID (when applicable), metadata, timestamp, source/UTM parameters.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A visitor arriving from Instagram or WhatsApp can discover and view a motorcycle detail page (including gallery, specs, and price) within 3 taps/clicks from landing.
- **SC-002**: The motorcycle detail page loads and is fully interactive on a 4G mobile connection within 3 seconds (including gallery first image).
- **SC-003**: The admin can register a new motorcycle (with plate lookup, all fields, 8 photos, and publish) in under 5 minutes.
- **SC-004**: 100% of public motorcycle pages produce a valid link preview when shared on WhatsApp (photo, title, price visible).
- **SC-005**: The WhatsApp pre-filled message correctly identifies the specific motorcycle (brand, model, year, internal code) in 100% of cases.
- **SC-006**: Sales/consignment proposal submissions result in a visible lead in the admin panel within 10 seconds of submission.
- **SC-007**: The admin can update any lead status in a single action (one click/tap) from the leads management page.
- **SC-008**: Sold motorcycles remain publicly accessible and display similar available motorcycles, contributing to continued engagement.
- **SC-009**: The system correctly calculates consignment commission results (commission value = sale price × percentage; owner payment = sale price − commission) with 100% accuracy for any valid inputs.
- **SC-010**: No sensitive data (license plates, owner personal information, consignment financial details, admin credentials) is ever visible on any public page or in client-side source code.

## Assumptions

- The AF Motos business is currently small-scale, operating primarily through Instagram (@af_motos2026) and WhatsApp. The platform starts with a single administrator.
- Portuguese (Brazil) is the primary language for all user-facing content, labels, and messages.
- There is no existing database, user base, or legacy system to migrate from. This is a greenfield project.
- Image optimization (WebP/AVIF conversion, resizing) will be handled by the platform's built-in capabilities (e.g., Next.js Image component) and storage provider.
- The MVP does not require online payment processing, digital contracts, automated booking confirmation, or a public user authentication system.
- Rental requests in the MVP generate leads for manual admin follow-up via WhatsApp; automated booking and conflict detection are deferred to future versions.
- The plate lookup API provider has not been selected. The system is designed with a provider-agnostic abstraction to allow future changes.
- Commission rules (percentage, fixed amount, hybrid) are configurable by the admin per consignment contract, not hardcoded.
- The "Buscar moto específica" (search for a specific motorcycle) feature is identified as a future enhancement and is not part of the MVP scope.
- Favorites and motorcycle comparator features are identified as future enhancements and are not part of the MVP scope.
- Multi-admin support (multiple users with role-based permissions) is a future enhancement; the MVP supports a single admin account.
- Analytics/event tracking infrastructure is set up to record events; advanced dashboards and reporting are deferred to future versions.
