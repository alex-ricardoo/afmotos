# Implementation Plan: AF Motos Premium Visual Redesign

**Branch**: `002-premium-redesign` | **Date**: 2026-08-21 | **Spec**: [specs/002-premium-redesign/spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/002-premium-redesign/spec.md)

**Input**: Feature specification from `/specs/002-premium-redesign/spec.md`

---

## Summary

Transform the AF Motos digital platform into a high-conversion, professional digital motorcycle dealership. The redesign adopts an automotive aesthetic utilizing Tailwind CSS v4 CSS-first theming, high-contrast dark graphite (`#0B0D0F`), rich warm dark surfaces (`#171A1D`), crisp cards, clear typography, and action accents (`#D94832`). The inventory becomes the central focal point across all public views (Home, Catalog, Details, Venda, Consignação, Aluguel, Motos Vendidas) while strictly preserving Supabase database schemas, queries, and business logic.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: Next.js 16.3 (App Router, Server Components & Actions), React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), Radix UI / Base UI, Lucide React, Sonner, Zod  
**Storage**: Supabase PostgreSQL (Existing schemas, RLS, Storage buckets)  
**Testing & Validation**: `npx tsc --noEmit` (TypeScript strict mode), `npm run lint`, `npm run build`  
**Target Platform**: Universal Web (Mobile-First responsive down to 320px, Tablet, Desktop)  
**Project Type**: Full-stack Next.js Web Application  
**Performance Goals**: Core Web Vitals LCP < 2.5s on mobile 4G, 0 cumulative layout shift, 95+ Lighthouse Accessibility score  
**Constraints**: Zero regression in Supabase queries/types; preserve all route handlers and Server Actions; no placeholder mock data; strict adherence to WCAG 2.1 AA contrast standards  
**Scale/Scope**: 7 public customer-facing routes + components architecture (Layout, Filters, Motorcycles, Gallery, Forms)

---

## Constitution Check

_GATE: Initial assessment against the 12 Constitutional Principles._

| Principle                         | Status | Evaluation                                                                                        |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| **I. Product First**              | PASS   | High-trust dealership experience directly facilitates discovery, evaluation, and conversion.      |
| **II. Mobile First**              | PASS   | Navigation, gallery, search drawer, and sticky WhatsApp actions optimized for thumb reach.        |
| **III. Type Safety**              | PASS   | All component props strictly typed against database entities without `any`.                       |
| **IV. Segurança**                 | PASS   | No sensitive keys or private fields exposed in client markup or public routes.                    |
| **V. Supabase como Fonte**        | PASS   | All dynamic data continues to be queried directly from Supabase.                                  |
| **VI. Componentização**           | PASS   | Cohesive components organized by domain (`layout`, `motorcycles`, `filters`, `forms`, `gallery`). |
| **VII. Integrações Desacopladas** | PASS   | WhatsApp link generators and plate lookup remain behind clean helper abstractions.                |
| **VIII. UX Consistente**          | PASS   | Unified Tailwind v4 design tokens for colors, spacing, typography, and card states.               |
| **IX. Performance & SEO**         | PASS   | Optimized `next/image` with aspect ratios, dynamic Open Graph tags, and semantic HTML.            |
| **X. Testabilidade**              | PASS   | Business logic, formatters, and validation functions remain decoupled and verifiable.             |
| **XI. Observabilidade**           | PASS   | Existing analytics events (views, clicks, lead submissions) remain integrated.                    |
| **XII. Evolução Incremental**     | PASS   | Visual redesign builds directly upon existing architecture without breaking changes.              |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-premium-redesign/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0: Design tokens & UX decisions
├── data-model.md        # Phase 1: Entity models & UI presentation contracts
├── quickstart.md        # Phase 1: Verification guide
├── contracts/           # Phase 1: Component & action interfaces
│   └── ui-contracts.md
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code Layout

```text
app/
├── globals.css                       # Centralized Tailwind v4 theme tokens & typography
├── layout.tsx                        # Global root layout with font configuration & providers
├── page.tsx                          # Redesigned Home page (Hero, Quick Search, Featured, Trust, Services)
├── motos/
│   ├── page.tsx                      # Redesigned Catalog page with desktop & mobile filter drawer
│   └── [slug]/
│       └── page.tsx                  # Redesigned Motorcycle detail page (Gallery, Specs, Sticky CTA)
├── venda-sua-moto/
│   └── page.tsx                      # Redesigned Sell Motorcycle page (Steps, Form, Guarantee)
├── consignar-moto/
│   └── page.tsx                      # Redesigned Consignment page (How it works, Calculator, Form)
├── aluguel/
│   └── page.tsx                      # Redesigned Rental page (Plans, Terms, Request Form)
└── motos-vendidas/
    └── page.tsx                      # Redesigned Sold Inventory Showcase (Social Proof)

components/
├── layout/
│   ├── header.tsx                    # Premium sticky header with desktop nav & mobile sheet
│   ├── footer.tsx                    # Comprehensive automotive footer with links & trust info
│   └── whatsapp-button.tsx           # Floating WhatsApp direct contact widget
├── motorcycles/
│   ├── motorcycle-card.tsx           # Premium motorcycle card with badges, specs & hover zoom
│   ├── motorcycle-grid.tsx           # Responsive grid with skeleton loaders & empty states
│   ├── motorcycle-specs.tsx          # Structured technical specification table / grid
│   ├── motorcycle-status-badge.tsx   # Elegant status indicators (Disponível, Reservada, Vendida)
│   └── whatsapp-cta.tsx              # Context-aware WhatsApp conversion buttons
├── filters/
│   ├── quick-search.tsx              # Homepage fast search filter widget
│   └── motorcycle-filters.tsx        # Comprehensive catalog filter sidebar & mobile drawer
├── gallery/
│   ├── image-carousel.tsx            # Multi-image carousel with active thumbnails & mobile swipe
│   └── image-fullscreen.tsx          # Fullscreen zoom dialog
├── forms/
│   ├── sell-form.tsx                 # Enhanced lead capture form with visual feedback
│   ├── consignment-form.tsx          # Consignment proposal form with step guidance
│   └── rental-form.tsx               # Rental booking request form
└── ui/                               # Base UI / Shadcn primitives (button, badge, card, dialog, etc.)
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because              |
| --------- | ---------- | ------------------------------------------------- |
| None      | N/A        | Standard clean Next.js + Tailwind v4 architecture |
