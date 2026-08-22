# Implementation Plan: AF Motos – Digital Platform for Motorcycle Catalog, Sales, Consignment & Rental

**Branch**: `001-af-motos-platform` | **Date**: 2026-08-21 | **Spec**: [spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/001-af-motos-platform/spec.md)

**Input**: Feature specification from `/specs/001-af-motos-platform/spec.md`

## Summary

Build a full-stack motorcycle dealership platform for AF Motos using Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and Supabase. The platform serves three user profiles: public visitors (browse, contact via WhatsApp, submit sell/consignment/rental proposals), admins (manage inventory, leads, consignments, rentals, analytics), and motorcycle owners (submit sale/consignment proposals). The MVP prioritizes conversion through WhatsApp integration, rich motorcycle catalog with SEO, and streamlined admin operations. Architecture follows provider-agnostic abstractions for external integrations (plate lookup, WhatsApp), domain logic isolation from UI, and Supabase RLS for data security.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20+

**Primary Dependencies**:

- Next.js 16.3.2 (App Router, Server Components, Server Actions)
- React 19.2.8
- Tailwind CSS v4 (CSS-first configuration via `@tailwindcss/postcss`)
- Supabase JS SDK v2 (`@supabase/supabase-js`, `@supabase/ssr`)
- shadcn/ui (Radix-based components)
- Lucide React (icons)
- Motion (animations, formerly Framer Motion)
- Sonner (toast notifications)
- Embla Carousel (image galleries)
- date-fns (date utilities)
- React Hook Form + Zod + @hookform/resolvers (forms & validation)
- TanStack Table (admin data tables)

**Storage**: PostgreSQL via Supabase (database), Supabase Storage (images/documents)

**Testing**: Vitest (unit/integration), Testing Library (component), Playwright (e2e, future)

**Target Platform**: Web (mobile-first responsive), deployed to Vercel or self-hosted

**Project Type**: Full-stack web application (SSR + SSG + CSR hybrid)

**Performance Goals**: LCP < 3s on 4G mobile, motorcycle detail page fully interactive in < 3s, admin motorcycle registration in < 5 minutes

**Constraints**: Single admin (MVP), no online payments, no automated booking, no public user accounts, Portuguese (Brazil) UI, plate lookup provider TBD

**Scale/Scope**: ~15 public pages, ~12 admin pages, ~13 database tables, ~10 domain components, single-tenant

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #    | Principle                                 | Status  | Evidence                                                                                                                                      |
| ---- | ----------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| I    | Product First                             | ✅ PASS | Three clear user profiles (buyers, owners, admin). All flows deliver direct business value. No unnecessary features.                          |
| II   | Mobile First                              | ✅ PASS | Spec explicitly mandates mobile-first design. Instagram/WhatsApp traffic origin acknowledged. All components designed mobile-first.           |
| III  | Type Safety                               | ✅ PASS | TypeScript strict mode enabled in tsconfig.json. Zod validation on all form boundaries. Shared types in `types/`.                             |
| IV   | Segurança                                 | ✅ PASS | Secrets server-side only. RLS on all tables. Server Actions for mutations. Plate lookup server-only. No public exposure of plates/owner data. |
| V    | Supabase como Fonte de Dados              | ✅ PASS | PostgreSQL via Supabase for all persistence. No parallel databases. Storage for images.                                                       |
| VI   | Componentização & Organização por Domínio | ✅ PASS | Code organized by domain (motorcycles, leads, rentals, admin). Reusable components in shared `components/ui/`.                                |
| VII  | Integrações Desacopladas                  | ✅ PASS | PlateProvider interface abstraction. WhatsApp message generation isolated. Storage path abstraction.                                          |
| VIII | UX Consistente                            | ✅ PASS | shadcn/ui design system. Consistent tokens via Tailwind CSS v4. Loading/error/empty/success states on all flows.                              |
| IX   | Performance & SEO                         | ✅ PASS | Next/Image for optimization. Server Components by default. Dynamic metadata + OG + JSON-LD. Sitemap + robots.                                 |
| X    | Testabilidade                             | ✅ PASS | Business logic in `lib/` isolated from UI. Commission calculation, status transitions, WhatsApp messages testable independently.              |
| XI   | Observabilidade                           | ✅ PASS | analytics_events table. Event tracking for views, clicks, submissions. UTM tracking.                                                          |
| XII  | Evolução Incremental                      | ✅ PASS | MVP scope clearly bounded. No premature features. Architecture extensible via abstractions without over-engineering.                          |

**Gate Result**: ✅ ALL PASS — Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-af-motos-platform/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api-routes.md
│   └── server-actions.md
└── tasks.md             # Phase 2 output (NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/                              # Next.js App Router (stays at root, no src/)
├── (public)/                     # Route group: public-facing pages
│   ├── layout.tsx                # Public layout (header + footer)
│   ├── page.tsx                  # Home page
│   ├── motos/
│   │   ├── page.tsx              # Catalog listing
│   │   └── [slug]/
│   │       └── page.tsx          # Motorcycle detail
│   ├── motos-vendidas/
│   │   └── page.tsx              # Sold motorcycles portfolio
│   ├── aluguel/
│   │   ├── page.tsx              # Rental catalog
│   │   └── [slug]/
│   │       └── page.tsx          # Rental detail
│   ├── venda-sua-moto/
│   │   └── page.tsx              # Sell your motorcycle form
│   ├── consignar-moto/
│   │   └── page.tsx              # Consignment form
│   ├── sobre/
│   │   └── page.tsx              # About page
│   └── contato/
│       └── page.tsx              # Contact page
├── admin/                        # Admin area
│   ├── layout.tsx                # Admin layout (sidebar + auth guard)
│   ├── page.tsx                  # Dashboard
│   ├── login/
│   │   └── page.tsx              # Admin login
│   ├── motos/
│   │   ├── page.tsx              # Motorcycles list
│   │   ├── nova/
│   │   │   └── page.tsx          # Create motorcycle
│   │   └── [id]/
│   │       ├── page.tsx          # View motorcycle
│   │       └── editar/
│   │           └── page.tsx      # Edit motorcycle
│   ├── consignacoes/
│   │   └── page.tsx              # Consignments management
│   ├── vendas/
│   │   └── page.tsx              # Sales history
│   ├── locacoes/
│   │   └── page.tsx              # Rentals management
│   ├── leads/
│   │   └── page.tsx              # Leads management
│   ├── propostas/
│   │   └── page.tsx              # Purchase proposals
│   └── configuracoes/
│       └── page.tsx              # Site settings
├── api/                          # Route Handlers
│   ├── plate-lookup/
│   │   └── route.ts              # Plate lookup (server-only)
│   ├── analytics/
│   │   └── route.ts              # Track events
│   └── upload/
│       └── route.ts              # Image upload handling
├── layout.tsx                    # Root layout
├── globals.css                   # Global styles + Tailwind
├── not-found.tsx                 # Custom 404
├── error.tsx                     # Global error boundary
├── loading.tsx                   # Global loading
├── sitemap.ts                    # Dynamic sitemap
└── robots.ts                     # Robots config

components/                       # Reusable components
├── ui/                           # shadcn/ui base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   ├── tabs.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── table.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── calendar.tsx
│   ├── date-picker.tsx
│   ├── skeleton.tsx
│   ├── alert.tsx
│   ├── checkbox.tsx
│   ├── switch.tsx
│   ├── drawer.tsx
│   └── toast/ (sonner)
├── motorcycles/                  # Motorcycle domain components
│   ├── motorcycle-card.tsx
│   ├── motorcycle-gallery.tsx
│   ├── motorcycle-specs.tsx
│   ├── motorcycle-price.tsx
│   ├── motorcycle-filters.tsx
│   ├── motorcycle-status-badge.tsx
│   ├── motorcycle-grid.tsx
│   └── similar-motorcycles.tsx
├── forms/                        # Form components
│   ├── motorcycle-form.tsx
│   ├── sell-request-form.tsx
│   ├── consignment-form.tsx
│   ├── rental-request-form.tsx
│   ├── lead-form.tsx
│   └── plate-lookup-field.tsx
├── gallery/                      # Gallery components
│   ├── image-uploader.tsx
│   ├── image-carousel.tsx
│   ├── image-fullscreen.tsx
│   └── image-grid.tsx
├── admin/                        # Admin-specific components
│   ├── admin-sidebar.tsx
│   ├── admin-header.tsx
│   ├── dashboard-card.tsx
│   ├── data-table.tsx
│   └── status-select.tsx
├── leads/                        # Lead domain components
│   ├── lead-status-badge.tsx
│   └── lead-card.tsx
├── rentals/                      # Rental domain components
│   ├── rental-card.tsx
│   ├── rental-requirements.tsx
│   └── date-range-picker.tsx
├── layout/                       # Layout components
│   ├── header.tsx
│   ├── footer.tsx
│   ├── mobile-nav.tsx
│   └── whatsapp-button.tsx
└── shared/                       # Shared/generic components
    ├── empty-state.tsx
    ├── error-state.tsx
    ├── loading-state.tsx
    ├── share-button.tsx
    └── page-header.tsx

lib/                              # Business logic & utilities
├── supabase/
│   ├── client.ts                 # Browser client
│   ├── server.ts                 # Server Component client
│   ├── admin.ts                  # Service role client
│   ├── middleware.ts             # Auth middleware helpers
│   └── storage.ts                # Storage helpers
├── plate/
│   ├── types.ts                  # PlateProvider interface
│   ├── provider.ts               # Provider factory
│   └── providers/
│       └── default-provider.ts   # Initial provider implementation
├── whatsapp/
│   ├── templates.ts              # Message templates
│   ├── generate-link.ts          # WhatsApp link generator
│   └── types.ts                  # WhatsApp types
├── analytics/
│   ├── track.ts                  # Event tracking
│   └── types.ts                  # Event types
├── validations/
│   ├── motorcycle.ts             # Motorcycle Zod schemas
│   ├── lead.ts                   # Lead Zod schemas
│   ├── sell-request.ts           # Sell request schemas
│   ├── consignment.ts            # Consignment schemas
│   ├── rental.ts                 # Rental schemas
│   └── common.ts                 # Shared schemas (phone, email, etc.)
├── domain/
│   ├── motorcycle-status.ts      # Status transitions & rules
│   ├── commission.ts             # Commission calculation
│   ├── rental-pricing.ts         # Rental price calculation
│   ├── slug.ts                   # Slug generation
│   └── motorcycle-filters.ts     # Filter logic
├── actions/                      # Server Actions
│   ├── motorcycles.ts
│   ├── leads.ts
│   ├── sell-requests.ts
│   ├── consignments.ts
│   ├── rentals.ts
│   ├── analytics.ts
│   ├── settings.ts
│   └── auth.ts
├── queries/                      # Data fetching (Server Components)
│   ├── motorcycles.ts
│   ├── leads.ts
│   ├── consignments.ts
│   ├── rentals.ts
│   ├── sales.ts
│   ├── dashboard.ts
│   └── settings.ts
└── utils/
    ├── format.ts                 # Currency, date, number formatting
    ├── cn.ts                     # Class name utility (clsx + twMerge)
    └── constants.ts              # App-wide constants

types/                            # Shared TypeScript types
├── database.ts                   # Supabase generated types
├── motorcycle.ts                 # Motorcycle domain types
├── lead.ts                       # Lead types
├── consignment.ts                # Consignment types
├── rental.ts                     # Rental types
├── analytics.ts                  # Analytics types
└── common.ts                     # Shared types

hooks/                            # Custom React hooks
├── use-motorcycle-filters.ts
├── use-image-upload.ts
├── use-plate-lookup.ts
└── use-analytics.ts

supabase/                         # Supabase project config
└── migrations/                   # SQL migrations (ordered)
    ├── 00001_admin_profiles.sql
    ├── 00002_categories.sql
    ├── 00003_motorcycles.sql
    ├── 00004_motorcycle_images.sql
    ├── 00005_motorcycle_features.sql
    ├── 00006_motorcycle_owners.sql
    ├── 00007_consignments.sql
    ├── 00008_sales.sql
    ├── 00009_rentals.sql
    ├── 00010_rental_settings.sql
    ├── 00011_leads.sql
    ├── 00012_sell_requests.sql
    ├── 00013_analytics_events.sql
    └── 00014_rls_policies.sql

tests/                            # Test files
├── unit/
│   ├── commission.test.ts
│   ├── motorcycle-status.test.ts
│   ├── whatsapp-templates.test.ts
│   ├── plate-provider.test.ts
│   ├── rental-pricing.test.ts
│   └── slug.test.ts
└── integration/
    ├── motorcycle-crud.test.ts
    └── lead-submission.test.ts
```

**Structure Decision**: The project uses the existing root-level `app/` directory (no `src/` folder), which matches the scaffold created by `create-next-app`. All application code (`components/`, `lib/`, `types/`, `hooks/`) lives at root level alongside `app/`. This avoids a disruptive migration of the existing project and is fully supported by Next.js 16. The `@/*` path alias resolves to `./*` per the existing `tsconfig.json`. The `supabase/migrations/` directory holds versioned SQL migrations at the project root.

## Complexity Tracking

No constitution violations requiring justification. All design choices align with the 12 constitutional principles.

## Post-Design Constitution Re-Check

| #    | Principle                | Status | Notes                                                                              |
| ---- | ------------------------ | ------ | ---------------------------------------------------------------------------------- |
| I    | Product First            | ✅     | All entities directly serve buyer/owner/admin flows                                |
| II   | Mobile First             | ✅     | Component design prioritizes mobile; carousel, filters, gallery designed for touch |
| III  | Type Safety              | ✅     | Zod schemas for all form boundaries; shared types in `types/`; strict TS           |
| IV   | Segurança                | ✅     | RLS policies on all tables; server-only plate lookup, auth, mutations              |
| V    | Supabase                 | ✅     | Single PostgreSQL database; Storage for images; no external DBs                    |
| VI   | Componentização          | ✅     | Domain-organized components; reusable UI base; clean separation                    |
| VII  | Integrações Desacopladas | ✅     | PlateProvider interface; WhatsApp template isolation; Storage abstraction          |
| VIII | UX Consistente           | ✅     | shadcn/ui + custom tokens; all states handled (loading/error/empty/success)        |
| IX   | Performance & SEO        | ✅     | Server Components default; Next/Image; generateMetadata; JSON-LD; sitemap          |
| X    | Testabilidade            | ✅     | Domain logic in `lib/domain/` testable independently; Vitest for unit tests        |
| XI   | Observabilidade          | ✅     | analytics_events table; event tracking module; UTM support                         |
| XII  | Evolução Incremental     | ✅     | Clean abstractions without premature complexity; extensible data model             |

**Post-Design Gate Result**: ✅ ALL PASS
