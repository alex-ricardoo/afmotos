# Implementation Plan: Customer Area — Plate Consultation & User Dashboard

**Branch**: `025-customer-area-plate-dashboard` | **Date**: 2026-09-11 | **Spec**: [spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/025-customer-area-plate-dashboard/spec.md)

**Input**: Feature specification from `specs/025-customer-area-plate-dashboard/spec.md`

## Summary

Build a self-service customer area enabling visitors to register, log in (email/password + Google OAuth), consult vehicle plates with a simulated payment flow, and manage their profile and consultation history via a protected dashboard. The implementation reuses the existing `vehicle_plate_consultations` table as a cache layer and the `executeVehiclePlateLookup` service for plate lookups. New tables (`customer_profiles`, `customer_plate_consultations`, `payment_simulations`) store customer-specific data behind Supabase RLS. The customer-facing UI follows the existing dark glassmorphism design language using shadcn/ui, Tailwind CSS, and mobile-first responsive patterns.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Node.js 20+

**Primary Dependencies**: Next.js 16.3 (App Router), @supabase/ssr 0.12, @supabase/supabase-js 2.112, shadcn/ui 4.19, Tailwind CSS 4, Zod 4.4, react-hook-form 7.85, lucide-react 1.33, sonner 2.0

**Storage**: PostgreSQL (Supabase) with Row Level Security. Image uploads via ImgBB (existing `lib/uploads/imgbb.ts`).

**Testing**: Node.js native test runner (`--experimental-strip-types --test`). No additional test framework needed.

**Target Platform**: Web (Next.js on Vercel). Mobile-first responsive, min 320px viewport.

**Project Type**: Full-stack web application (Next.js App Router with Server Components, Server Actions, and Route Handlers)

**Performance Goals**: Dashboard initial load < 2s. Cached plate consultations < 1s. Paginated queries < 500ms.

**Constraints**: No real payment integration (simulated only). No email/notification services. Google OAuth requires Supabase provider configuration.

**Scale/Scope**: ~15 new files (pages, components, actions, types). 3 new database tables. 1 new route group (`/cliente`). Middleware update for auth protection.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Product First | ✅ PASS | Self-service flow removes manual WhatsApp overhead. Clear value for all 3 personas. |
| II | Mobile First | ✅ PASS | All new pages designed mobile-first. Touch-friendly forms, responsive tables. |
| III | Type Safety | ✅ PASS | TypeScript strict mode. Zod schemas for all form inputs and API boundaries. |
| IV | Segurança | ✅ PASS | Server Actions for mutations. No secrets exposed to client. RLS on all customer tables. |
| V | Supabase como Fonte de Dados | ✅ PASS | All data in Supabase PostgreSQL. No external databases. |
| VI | Componentização | ✅ PASS | Domain-organized under `components/customer/` and `lib/customer/`. Reusable form components. |
| VII | Integrações Desacopladas | ✅ PASS | Plate lookup uses existing adapter pattern (`lib/vehicle-lookup/`). Payment simulation is an internal abstraction. |
| VIII | UX Consistente | ✅ PASS | shadcn/ui components, same dark theme with gold accents, skeleton loaders per spec 024. |
| IX | Performance & SEO | ✅ PASS | Customer area is auth-protected (no SEO needed for `/cliente/*`). Public pages already have SEO. |
| X | Testabilidade | ✅ PASS | Business logic isolated in `lib/customer/` service layer. Testable independently. |
| XI | Observabilidade | ✅ PASS | Payment simulations recorded in audit table. Consultation events tracked. |
| XII | Evolução Incremental | ✅ PASS | Simulated payment now, real payment gateway via separate spec later. No premature abstractions. |

**Gate Result**: ✅ ALL 12 PRINCIPLES PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/025-customer-area-plate-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── auth-api.md
│   └── customer-api.md
└── tasks.md             # Phase 2 output (NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# New routes (App Router)
app/
├── (public)/
│   └── historico-veicular/
│       └── page.tsx                        # MODIFY — add auth-aware plate submission
├── cliente/
│   ├── layout.tsx                          # NEW — customer area layout with sidebar/nav
│   ├── page.tsx                            # NEW — customer dashboard
│   ├── login/
│   │   └── page.tsx                        # NEW — login page (email/password + Google OAuth)
│   ├── cadastro/
│   │   └── page.tsx                        # NEW — registration page
│   ├── consultas/
│   │   ├── page.tsx                        # NEW — consultation history (paginated)
│   │   └── [id]/
│   │       └── page.tsx                    # NEW — consultation detail
│   ├── perfil/
│   │   └── page.tsx                        # NEW — profile editing
│   └── pagamento/
│       └── [consultationId]/
│           └── page.tsx                    # NEW — simulated payment
├── api/
│   └── auth/
│       └── callback/
│           └── route.ts                   # NEW — Google OAuth callback handler

# New components
components/
├── customer/
│   ├── auth-form.tsx                       # NEW — reusable login/register form
│   ├── auth-modal.tsx                      # NEW — modal for login prompt from public pages
│   ├── client-dashboard.tsx                # NEW — dashboard content
│   ├── consultation-history.tsx            # NEW — paginated consultation list
│   ├── consultation-details.tsx            # NEW — full vehicle data display
│   ├── profile-form.tsx                    # NEW — profile editing form
│   ├── payment-simulation.tsx              # NEW — payment flow UI
│   ├── plate-consultation-summary.tsx      # NEW — pre-payment summary card
│   └── customer-nav.tsx                    # NEW — sidebar/nav for customer area

# New library modules
lib/
├── customer/
│   ├── actions.ts                          # NEW — Server Actions (register, login, update profile, etc.)
│   ├── queries.ts                          # NEW — Data queries (dashboard stats, history, detail)
│   ├── payment-service.ts                  # NEW — Payment simulation logic
│   ├── consultation-service.ts             # NEW — Customer consultation orchestration
│   ├── schemas.ts                          # NEW — Zod schemas for all customer forms
│   └── types.ts                            # NEW — TypeScript types for customer domain

# Modified files
lib/
├── supabase/
│   └── middleware.ts                       # MODIFY — add /cliente/* route protection
components/
├── layout/
│   └── header.tsx                          # MODIFY — add "Área do Cliente" nav item

# New migrations
supabase/
└── migrations/
    └── 20260911000000_create_customer_area.sql  # NEW — customer_profiles, customer_plate_consultations, payment_simulations
```

**Structure Decision**: The customer area follows the existing project conventions — route groups under `app/`, domain-organized components under `components/customer/`, and business logic in `lib/customer/`. This mirrors the `app/admin/`, `components/admin/`, `lib/admin/` pattern already established. The `/cliente` route group is NOT inside `(public)` because it needs a distinct layout without the public Header/Footer (similar to how `/admin` has its own layout).

## Complexity Tracking

No constitution violations to justify — all gates pass cleanly.
