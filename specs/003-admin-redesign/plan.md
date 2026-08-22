# Implementation Plan: Admin Panel Redesign

**Branch**: `003-admin-redesign` | **Date**: 2026-08-21 | **Spec**: [spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/003-admin-redesign/spec.md)

**Input**: Feature specification from `/specs/003-admin-redesign/spec.md`

## Summary
Redesign and fix the administrative panel for AF Motos to establish a clear visual and structural separation from the public site using Next.js Route Groups. Ensure that the dashboard and motorcycle management modules are deeply integrated with real Supabase data and protected by strict Row Level Security (RLS) policies.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, Supabase SSR Auth, Zod, React Hook Form

**Storage**: Supabase PostgreSQL and Supabase Storage

**Testing**: Manual E2E (as defined in quickstart)

**Target Platform**: Web (Desktop & Mobile 320px+)

**Project Type**: Web Application

**Performance Goals**: Fast loading admin interface with optimistic UI updates on data mutation

**Constraints**: Security (Admin data must not leak to public), Separation of Concerns (Layouts must be strictly isolated)

**Scale/Scope**: Admin interface for a single business entity

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._
- **I. Product First**: Yes, the redesign is aimed at making the admin UX seamless.
- **III. Type Safety**: Yes, strict TS and Zod validation will be used for the motorcycle forms.
- **IV. Segurança**: Yes, RLS and Server Actions will be strictly enforced.
- **V. Supabase como Fonte de Dados**: Yes, removing mock data and connecting directly to Supabase.
- **VIII. UX Consistente**: Yes, aligning with the brand tokens (Graphite, Gold).

## Project Structure

### Documentation (this feature)

```text
specs/003-admin-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (to be generated)
```

### Source Code (repository root)

```text
app/
├── (public)/
│   ├── layout.tsx       # Public header/footer
│   └── page.tsx         # Public routes
└── admin/
    ├── login/
    │   ├── layout.tsx   # Login specific layout (no sidebar, no public header)
    │   └── page.tsx
    └── (protected)/
        ├── layout.tsx   # Admin layout with Sidebar, Header, Breadcrumbs
        ├── page.tsx     # Dashboard connected to Supabase
        ├── motos/
        │   ├── page.tsx
        │   └── nova/
        └── propostas/
            └── page.tsx
```

**Structure Decision**: We will utilize Next.js Route Groups `(public)` and `(protected)` inside the `app` directory to cleanly separate the public site layout from the administrative layout. The `/admin/login` will have its own localized layout to ensure no sidebars or headers leak into the auth flow.

## Complexity Tracking

N/A - The proposed route grouping is the standard Next.js approach for this problem and introduces no unnecessary complexity.
