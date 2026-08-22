# Feature Specification: AF Motos – Premium Visual Redesign

**Feature Branch**: `002-premium-redesign`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "Analise e redesenhe visualmente o projeto AF Motos existente... O objetivo é transformar o produto em uma plataforma profissional... aparência de concessionária premium, alto nível de confiança e foco em conversão."

## Clarifications

- None required at this time. All requirements are clear and focus heavily on UI/UX redesign without altering business logic or database structure.

## User Scenarios & Testing _(mandatory)_

### User Story 1 – Premium Discovery Experience (Priority: P1)

A visitor lands on the AF Motos homepage and immediately perceives the brand as a premium, high-trust digital dealership. They can easily navigate to buy, rent, sell, or consign motorcycles with a modern, high-contrast, editorial layout that highlights inventory.

**Why this priority**: First impressions dictate trust. A premium look increases conversion rates for sales and consignments.

**Independent Test**: Load the homepage on desktop and mobile. Verify the hero section, quick search, categorized inventory, and benefits sections are visually distinct, use the new typography, and are fully responsive.

**Acceptance Scenarios**:

1. **Given** a visitor on the home page, **When** they view the hero section, **Then** they see a strong commercial headline, clear CTAs ("Ver motos disponíveis", "Venda sua moto"), and high contrast over existing assets.
2. **Given** a visitor on the home page, **When** they view the quick search, **Then** they can easily select brand, model, price, and year, with a clear CTA to search.
3. **Given** a visitor on a mobile device, **When** they use the quick search, **Then** it opens in a usable drawer/modal or stacked layout without horizontal overflow.
4. **Given** the "Motos em destaque" section, **When** data is loading, **Then** premium skeleton loaders are displayed.

---

### User Story 2 – High-Conversion Motorcycle Card (Priority: P1)

A visitor browsing the catalog or homepage sees individual motorcycle cards that present all crucial information clearly (status badge, brand, model, year, mileage, price, old price) while maintaining a consistent visual height and a clear CTA to view details.

**Why this priority**: The card is the primary entry point to the product details. It must build desire and provide necessary information at a glance.

**Independent Test**: View a grid of motorcycle cards. Verify all data points are present, alignment is consistent, images maintain aspect ratio, and missing data (like old price) doesn't break the layout.

**Acceptance Scenarios**:

1. **Given** a motorcycle card, **When** it is displayed, **Then** the image has a fixed aspect ratio and a proper fallback if missing.
2. **Given** a motorcycle card with a discount, **When** it is displayed, **Then** the old price is visually distinct (strikethrough/muted) and the current price is highlighted.
3. **Given** a motorcycle card for an unavailable product, **When** it is displayed, **Then** it has a clear visual state indicating it's not available (e.g., "Vendida" badge).
4. **Given** a keyboard user, **When** they navigate through cards, **Then** focus states are clearly visible and the card is fully accessible.

---

### User Story 3 – Premium Motorcycle Details (Priority: P1)

A visitor clicks on a motorcycle and lands on a detailed product page with a large, professional gallery, clear pricing, technical specifications in a grid, and prominent CTAs for WhatsApp contact or scheduling a visit.

**Why this priority**: This is the decision page. It must convince the user to initiate contact.

**Independent Test**: Open a motorcycle detail page. Verify the gallery functionality, specifications layout, and fixed mobile CTA.

**Acceptance Scenarios**:

1. **Given** a motorcycle detail page, **When** viewed on mobile, **Then** a fixed or highly visible CTA for WhatsApp is always accessible without covering content.
2. **Given** the image gallery, **When** a user interacts with it, **Then** they can view a large main image and accessible thumbnails.
3. **Given** the technical specifications, **When** they are displayed, **Then** they use a structured grid layout for easy reading.

---

### User Story 4 – Streamlined Services Pages (Venda/Consignação/Aluguel) (Priority: P2)

A visitor interested in selling, consigning, or renting a motorcycle visits the respective pages and experiences a clear, step-by-step explanation of the process, followed by a well-designed, validated form with clear success/error states.

**Why this priority**: These pages capture leads for inventory acquisition and rental revenue.

**Independent Test**: Visit `/venda-sua-moto`, `/consignar-moto`, and `/aluguel`. Verify the layout, typography, and form interaction states (loading, success, error).

**Acceptance Scenarios**:

1. **Given** the `/venda-sua-moto` page, **When** it loads, **Then** it displays a specific hero, benefits, numbered steps, and a clean form.
2. **Given** a user submitting a form, **When** they submit with errors, **Then** visual validation clearly indicates which fields need correction using colors and text (not just color).

## Requirements _(mandatory)_

### Functional Requirements (Visual & UX)

- **FR-001**: System MUST implement a new visual identity using the suggested palette: Graphite (#0B0D0F), Dark Surface (#171A1D), Light Background (#F5F5F2), White (#FFFFFF), Action Color (#D94832), Secondary Text (#A8ADB2), Borders (#E4E6E8).
- **FR-002**: System MUST use CSS tokens or Tailwind theme variables for all colors, spacing, radii, shadows, and typography.
- **FR-003**: System MUST implement a modern sans-serif typography scale (Display, H1, H2, H3, Body, Small, Label, Price, Metadata, Button) with strong hierarchy.
- **FR-004**: System MUST redesign the global Header to include the logo, navigation, WhatsApp CTA, and a professional mobile menu.
- **FR-005**: System MUST redesign the Homepage to include: Hero, Quick Search, Categories, Featured Motorcycles, Benefits, Sell/Consign blocks, Sold Motorcycles, and a final CTA.
- **FR-006**: System MUST redesign the Motorcycle Card to include fixed aspect ratio images, badges, brand/model/version, year, mileage, engine, prices, and clear CTAs.
- **FR-007**: System MUST redesign the Motorcycle Detail Page with a professional gallery, prominent pricing, specs grid, and fixed mobile CTAs.
- **FR-008**: System MUST redesign the Catalog/Filters with a clear sidebar on desktop and a drawer/modal on mobile.
- **FR-009**: System MUST redesign `/venda-sua-moto`, `/consignar-moto`, and `/aluguel` with professional service layouts, numbered steps, and validated forms.
- **FR-010**: System MUST implement comprehensive states for all interactive elements: hover, active, focus-visible, disabled, loading (skeletons), empty, and error.
- **FR-011**: System MUST meet WCAG 2.1 AA contrast requirements and provide full keyboard navigation.
- **FR-012**: System MUST preserve all existing functionalities, Supabase integrations, and routing. No business logic can be removed.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of the public pages use the new centralized design tokens (colors, typography, spacing).
- **SC-002**: Lighthouse Accessibility score is 95 or higher on all public pages.
- **SC-003**: Lighthouse Performance score remains 90 or higher on mobile for the homepage and catalog.
- **SC-004**: Zero horizontal overflow on any screen size down to 320px width.
- **SC-005**: All interactive elements have distinct `:hover` and `:focus-visible` states.
- **SC-006**: Existing end-to-end user flows (searching, filtering, submitting leads) complete successfully without errors after the redesign.

## Assumptions

- We are using the existing Supabase backend and data schemas.
- The redesign will reuse existing Next.js App Router structure and Tailwind CSS configuration.
- We will not create "fake" data; the UI must gracefully handle real data, including missing fields or images.
- A modern sans-serif font (like Inter or Roboto) is acceptable and will be configured via Next.js `next/font`.
