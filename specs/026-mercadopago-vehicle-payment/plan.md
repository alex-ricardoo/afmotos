# Implementation Plan: Mercado Pago Vehicle Consultation Payment & Mock/Live Orchestration

**Branch**: `026-mercadopago-vehicle-payment` | **Date**: 2026-09-12 | **Spec**: [spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/026-mercadopago-vehicle-payment/spec.md)

**Input**: Feature specification from `specs/026-mercadopago-vehicle-payment/spec.md`

---

## Summary

Replace the simulated payment in the customer area with a production-grade **Mercado Pago Payment Brick (SDK v2)** integration. This feature provides real credit card and Pix checkout for Brazilian vehicle consultations, cryptographically validates incoming webhook notifications using HMAC-SHA256, protects against concurrent duplicates via database idempotency, executes an automatic refund if the external vehicle lookup service fails after payment approval, and delivers an administrative transaction auditing & reconciliation dashboard at `/admin/transacoes-consultas`.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Node.js 20+

**Primary Dependencies**: Next.js 16.3 (App Router), `mercadopago` (Node.js SDK v2.x), `@mercadopago/sdk-react` (or client-side Brick loader), @supabase/ssr 0.12, @supabase/supabase-js 2.112, shadcn/ui 4.19, Tailwind CSS 4, Zod 4.4, lucide-react 1.33, sonner 2.0

**Storage**: PostgreSQL (Supabase) with Row Level Security. New tables: `payment_transactions`, `webhook_events`, `consultation_audit_logs`.

**Testing**: Node.js native test runner (`--experimental-strip-types --test`) with unit and service mocks.

**Target Platform**: Web (Next.js on Vercel), mobile-first responsive (min 320px).

**Project Type**: Full-stack Next.js App Router (Server Actions, Webhook Route Handler, Admin & Customer UI components).

**Performance Goals**: Payment Brick load < 1.5s, Webhook processing < 800ms, Automatic refund trigger < 30s upon lookup failure.

**Constraints**: Server-authoritative pricing (price never sent from client), no payment secrets exposed in client bundles, HMAC validation on raw request body, safe idempotency locks on payment confirmation.

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Product First | ✅ PASS | Direct revenue engine for vehicle consultations. Seamless customer checkout experience. |
| II | Mobile First | ✅ PASS | Payment Brick and customer payment screens fully responsive and touch-optimized. |
| III | Type Safety | ✅ PASS | Strict TypeScript types for MP SDK responses, database rows, server action payloads, and Zod schemas. |
| IV | Segurança | ✅ PASS | Access tokens stored securely in server env vars. HMAC webhook verification. RLS isolates customer transactions. |
| V | Supabase como Fonte de Dados | ✅ PASS | All transactions, webhooks, and audit logs persisted in Supabase PostgreSQL with RLS. |
| VI | Componentização | ✅ PASS | Clean separation: `components/customer/payment-brick.tsx`, `components/admin/transactions/`, `lib/mercadopago/`. |
| VII | Integrações Desacopladas | ✅ PASS | Mercado Pago logic encapsulated in `lib/mercadopago/` adapter, separate from vehicle lookup and customer state. |
| VIII | UX Consistente | ✅ PASS | Premium dark aesthetic matching AF Motos brand, real-time status banners, clear error and refund feedback. |
| IX | Performance & SEO | ✅ PASS | Async webhook processing, lightweight client script loading, optimized SQL queries with indexes. |
| X | Testabilidade | ✅ PASS | Independent unit tests for webhook signature validation, price calculation, and refund state machine. |
| XI | Observabilidade | ✅ PASS | Comprehensive audit logs in `consultation_audit_logs` and `webhook_events`. |
| XII | Evolução Incremental | ✅ PASS | Seamlessly upgrades Spec 025 simulated payment without breaking existing consultation data or admin manual lookups. |

**Gate Result**: ✅ ALL 12 PRINCIPLES PASS.

---

## Project Structure

### Documentation (this feature)

```text
specs/026-mercadopago-vehicle-payment/
├── plan.md              # Implementation Plan (this file)
├── research.md          # Architectural decisions & SDK research
├── data-model.md        # Database schema, entities & RLS policies
├── quickstart.md        # Sandbox testing & webhook instructions
├── contracts/           # API contracts
│   ├── payment-api.md
│   ├── webhook-api.md
│   └── admin-transactions-api.md
└── checklists/          # Validation checklists
```

### Source Code

```text
# Database Migrations
supabase/
└── migrations/
    └── 20260912110000_mercadopago_transactions_and_audit.sql

# Mercado Pago Integration & Service Layer
lib/
├── mercadopago/
│   ├── client.ts                           # Server-side SDK client initialization
│   ├── signature.ts                        # HMAC SHA-256 webhook validator
│   ├── payment-service.ts                  # Payment creation, verification & refund logic
│   ├── types.ts                            # Mercado Pago types & statuses
│   ├── schemas.ts                          # Zod schemas for payment actions
│   └── __tests__/
│       ├── signature.test.ts               # Unit test for HMAC validation
│       └── payment-service.test.ts         # Unit test for payment & refund workflows
├── customer/
│   ├── payment-service.ts                  # Updated to orchestrate MP Brick & real consultations
│   └── queries.ts                          # Updated with customer transaction history
└── admin/
    └── transaction-queries.ts              # Queries for admin transactions panel

# API Webhook Route
app/
└── api/
    └── webhooks/
        └── mercadopago/
            └── route.ts                    # HMAC-validated webhook handler

# Customer Payment UI
app/
└── cliente/
    └── pagamento/
        └── [consultationId]/
            └── page.tsx                    # Updated to render Payment Brick

components/
└── customer/
    ├── payment-brick.tsx                   # Mercado Pago Payment Brick component
    ├── payment-status-banner.tsx           # Status indicators (pending pix, approved, refunded)
    └── auto-refund-notice.tsx              # User-friendly refund & support alert

# Admin Transactions UI
app/
└── admin/
    └── transacoes-consultas/
        └── page.tsx                        # Admin transaction management & audit screen

components/
└── admin/
    └── transactions/
        ├── transaction-table.tsx           # Paginated, filterable transaction list
        ├── transaction-detail-dialog.tsx   # Detailed timeline & audit modal
        └── refund-retry-dialog.tsx         # Manual refund retry / reconciliation trigger
```

---

## Implementation Phases

### Phase 1: Database & Migration
1. Create Supabase migration `20260912110000_mercadopago_transactions_and_audit.sql` with tables: `payment_transactions`, `webhook_events`, `consultation_audit_logs`.
2. Configure RLS policies and performance indexes.
3. Update TypeScript database types.

### Phase 2: Core Mercado Pago Backend Layer
1. Install `mercadopago` package.
2. Implement `lib/mercadopago/client.ts` with timeout configuration and credentials handling.
3. Implement `lib/mercadopago/signature.ts` for HMAC-SHA256 signature verification.
4. Implement `lib/mercadopago/payment-service.ts` for `createPayment`, `getPayment`, `refundPayment`, and audit logging.
5. Create comprehensive unit tests (`signature.test.ts`, `payment-service.test.ts`).

### Phase 3: Webhook Handler & Idempotency
1. Implement `app/api/webhooks/mercadopago/route.ts`.
2. Ensure raw body extraction, HMAC verification, logging in `webhook_events`, and idempotency check.
3. Orchestrate post-payment vehicle lookup execution and auto-refund on failure.

### Phase 4: Customer Area Payment Brick Integration
1. Implement `components/customer/payment-brick.tsx` loading Mercado Pago JS SDK v2 safely in React 19.
2. Update `/cliente/pagamento/[consultationId]/page.tsx` with server-authoritative price fetching.
3. Handle async payment statuses (Pix QR Code display, pending status polling, success auto-redirect).
4. Implement `components/customer/auto-refund-notice.tsx` with WhatsApp support button.

### Phase 5: Admin Auditing & Reconciliation Panel
1. Implement admin query functions in `lib/admin/transaction-queries.ts`.
2. Create `/admin/transacoes-consultas/page.tsx` with filters, search, and metric cards.
3. Implement `components/admin/transactions/` components (table, detail dialog, refund retry action).
4. Update `components/admin/admin-sidebar.tsx` with link to `Transações de Consultas`.

### Phase 6: Verification & End-to-End Testing
1. Run automated test suite (`npm test`).
2. Run TypeScript check (`npm run typecheck`).
3. Verify mobile responsiveness and dark mode styling.
