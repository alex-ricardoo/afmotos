# Implementation Plan: About Page

**Branch**: `[014-about-page]` | **Date**: 2026-08-24 | **Spec**: [spec.md](file:///C:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/014-about-page/spec.md)

**Input**: Feature specification from `/specs/014-about-page/spec.md`

## Summary

Create a new public institutional page (`/sobre`) for AF Motos that is fully dynamic, mobile-first, and SEO-friendly. The content will be configurable by admins via the existing settings panel, persisting into the `public.site_settings` JSONB field (`settings`). This removes hardcoded contact and institutional info from the codebase and adds the page to the main navigation and footer.

## Technical Context

**Language/Version**: TypeScript 5+ (Strict Mode)

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, Zod, Supabase SDK

**Storage**: PostgreSQL (Supabase `public.site_settings`), Supabase Storage (Store photo)

**Testing**: Jest / React Testing Library (for unit tests on helpers/components)

**Target Platform**: Web (Vercel / Node.js) - Mobile-First responsive design

**Project Type**: Next.js Web Application

**Performance Goals**: Optimized LCP/FCP, optimized images (WebP/AVIF), 100/100 Lighthouse score.

**Constraints**: Must run Server Actions for mutative operations; must not expose Supabase service roles or API keys in the client.

**Scale/Scope**: 1 public route (`/sobre`), 1 admin route modification, updates to global `Header` and `Footer`.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Product First**: PASS - Page delivers clear value for users seeking store details. Admin can manage content frictionlessly.
- **II. Mobile First**: PASS - Mobile-first design for the new `/sobre` route.
- **III. Type Safety**: PASS - Using Zod schemas and TypeScript for JSONB configurations.
- **IV. Segurança**: PASS - Public page uses read-only secure loaders, mutations use Server Actions.
- **V. Supabase como Fonte de Dados**: PASS - Uses existing `site_settings` table in Supabase.
- **VI. Componentização**: PASS - Reusable `SocialLinks`, `DifferentialCard`, and modular sections.
- **IX. Performance & SEO**: PASS - Dynamic metadata and Next/Image for optimization.

## Project Structure

### Documentation (this feature)

```text
specs/014-about-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code (repository root)

```text
app/
├── (public)/
│   └── sobre/
│       └── page.tsx
├── admin/
│   └── (protected)/
│       └── configuracoes/
│           └── page.tsx
components/
├── layout/
│   ├── header.tsx
│   └── footer.tsx
├── about/
│   ├── about-hero.tsx
│   ├── about-differentials.tsx
│   ├── about-location.tsx
│   └── about-contact.tsx
lib/
└── settings/
    ├── server-queries.ts (or similar)
    └── schema.ts
```

**Structure Decision**: The feature is integrated into the existing Next.js App Router structure. Components specific to the About page will be placed in `components/about/` or alongside existing UI components to maintain cohesion. Server queries and Zod schemas will be placed in `lib/settings/` or equivalent domain folders.
