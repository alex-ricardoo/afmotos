# Implementation Plan: Admin Fixes & Site Settings

**Branch**: `004-admin-fixes` | **Date**: 2026-08-21 | **Spec**: [spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/004-admin-fixes/spec.md)

**Input**: Feature specification from `/specs/004-admin-fixes/spec.md`

## Summary

This feature resolves a critical bug where the motorcycle edit page returns a 404 error, caused by synchronous access to asynchronous `params` in Next.js 15+. Additionally, it introduces a new global settings management page (`/admin/configuracoes`) which will allow administrators to manage store identity, contacts, and public text directly from the database without requiring code changes, leveraging the existing `public.site_settings` table.

## Technical Context

**Language/Version**: TypeScript, React 19, Next.js 16.3.2

**Primary Dependencies**: Supabase SSR, Zod, React Hook Form, Tailwind CSS, shadcn/ui

**Storage**: PostgreSQL (Supabase), Supabase Storage

**Testing**: N/A (Manual Validation)

**Target Platform**: Web Browser (Mobile-First UI)

**Project Type**: Next.js App Router Web Application

**Performance Goals**: Fast server-side rendering for settings

**Constraints**: Adhere to existing RLS and UI conventions

**Scale/Scope**: Internal admin dashboard, a few active admin users

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Product First**: Simplifies management for administrators.
- **Type Safety**: Forms will use Zod schemas for strict type safety.
- **Segurança**: Admins only (RLS checked), Server Actions used for mutations.
- **Supabase como Fonte de Dados**: `site_settings` table handles the global settings.

## Project Structure

### Documentation (this feature)

```text
specs/004-admin-fixes/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
app/
├── admin/
│   └── (protected)/
│       ├── motos/
│       │   └── [id]/
│       │       └── editar/
│       │           └── page.tsx      # Fix params access
│       └── configuracoes/
│           └── page.tsx              # New settings page
components/
└── admin/
    └── settings-form.tsx             # New form component
lib/
└── actions/
    └── settings.ts                   # Server actions for settings
```

**Structure Decision**: A new route directory `configuracoes` inside `app/admin/(protected)` ensures it inherits the administrative layout and middleware protection. Server actions are placed in `lib/actions` for consistency.

## Complexity Tracking

None.
