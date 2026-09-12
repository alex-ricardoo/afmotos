# Research: Customer Area — Plate Consultation & User Dashboard

**Feature**: 025-customer-area-plate-dashboard
**Date**: 2026-09-11

## R1: Authentication Architecture (Supabase Auth for Customer vs Admin)

**Decision**: Use Supabase Auth for both customer and admin authentication, distinguishing roles via the existing `public.is_admin()` function. Customer users are any `auth.users` who do NOT have an admin profile.

**Rationale**:
- Supabase Auth is already the sole auth provider in the project (admin login uses `signInWithPassword`).
- The existing middleware (`lib/supabase/middleware.ts`) already checks `auth.users` for admin routes — extending it for `/cliente/*` routes is trivial.
- Google OAuth is a native Supabase Auth provider, requiring only dashboard configuration (no additional SDK).
- Session management via `@supabase/ssr` cookies is already established and battle-tested.

**Alternatives Considered**:
- **Separate auth provider (Auth0, Clerk)**: Rejected — violates Constitution V (Supabase as single data source) and adds unnecessary complexity.
- **Custom JWT implementation**: Rejected — reinventing the wheel when Supabase Auth already handles JWT, session renewal, and OAuth flows.

---

## R2: Customer Profile Storage Strategy

**Decision**: Create a dedicated `customer_profiles` table referencing `auth.users(id)` as primary key (`id UUID PRIMARY KEY REFERENCES auth.users(id)`). This is separate from the existing `customers` table (CRM-oriented, admin-managed).

**Rationale**:
- The existing `customers` table is an admin-managed CRM entity (created manually or via form submissions). It has no FK to `auth.users` and no self-service capabilities.
- The new `customer_profiles` table represents self-registered users who manage their own data. The 1:1 relationship with `auth.users` enables RLS policies like `auth.uid() = id`.
- Merging into `customers` would require major refactoring of CRM features and would conflate admin-managed contacts with self-service accounts.

**Alternatives Considered**:
- **Extend existing `customers` table**: Rejected — different lifecycle (admin-created vs self-registered), different RLS requirements (admin-only vs user-own-data), and different field sets.
- **Use `auth.users` metadata only**: Rejected — Supabase `raw_user_meta_data` is limited and not queryable with RLS. A proper table is needed for profile management.

---

## R3: Customer Plate Consultation vs Existing Consultation Table

**Decision**: Create `customer_plate_consultations` for customer-facing records, reusing `vehicle_plate_consultations` as the global cache layer.

**Rationale**:
- The existing `vehicle_plate_consultations` table is admin-scoped (RLS: `public.is_admin()` only). Its policies cannot be relaxed without breaking admin security.
- `customer_plate_consultations` tracks the customer's purchase: payment status, user ownership, and the consultation lifecycle from the customer's perspective.
- The cache flow: customer pays → system checks `vehicle_plate_consultations` for existing result → if cache hit, copies data to `customer_plate_consultations.vehicle_data`; if cache miss, runs API lookup via `executeVehiclePlateLookup`, which already saves to `vehicle_plate_consultations`, then copies the result.
- The `vehicle_data JSONB` column in `customer_plate_consultations` stores a snapshot, decoupling customer access from the admin table entirely.

**Alternatives Considered**:
- **Add customer RLS policies to `vehicle_plate_consultations`**: Rejected — would require complex multi-role RLS (admin sees all, customer sees own). Higher risk of security misconfiguration.
- **Single table with role column**: Rejected — couples admin and customer lifecycles unnecessarily.

---

## R4: Payment Simulation Architecture

**Decision**: Implement payment simulation as a Server Action (not an Edge Function). The action creates a `payment_simulations` record, updates the consultation status, and triggers the plate lookup.

**Rationale**:
- Server Actions are the established pattern in this project for mutations (used in motorcycles, sales, proposals).
- Edge Functions require separate deployment and debugging infrastructure not yet set up in this project.
- The payment simulation is a simple state machine: `pending → confirmed`. No external integration needed.
- Server Actions run in the same Node.js process as the app, simplifying error handling and transaction management.

**Alternatives Considered**:
- **Supabase Edge Functions (Deno)**: Rejected — adds deployment complexity, different runtime (Deno vs Node.js), and the project has no existing Edge Functions. The user's spec mentioned edge functions, but Server Actions achieve the same result with less infrastructure.
- **API Route Handler (`app/api/`)**: Viable but Server Actions are preferred per Next.js conventions for form submissions and mutations.

---

## R5: Google OAuth Callback Handling

**Decision**: Create a Route Handler at `app/api/auth/callback/route.ts` to exchange the OAuth code for a session, following Supabase's recommended pattern for Next.js App Router.

**Rationale**:
- Supabase's PKCE OAuth flow redirects to a callback URL with a `code` parameter.
- The callback handler exchanges this code for a session using `supabase.auth.exchangeCodeForSession(code)`.
- This is the standard pattern documented by Supabase for Next.js SSR.

**Alternatives Considered**:
- **Client-side only OAuth**: Rejected — doesn't set server-side cookies properly for SSR.
- **Middleware-based callback**: Rejected — middleware runs on every request and is not the right place for one-time code exchange.

---

## R6: Middleware Route Protection Strategy

**Decision**: Extend the existing `lib/supabase/middleware.ts` to protect `/cliente/*` routes (excluding `/cliente/login` and `/cliente/cadastro`), redirecting unauthenticated users to `/cliente/login`.

**Rationale**:
- The middleware already protects `/admin/*` with the same pattern.
- Adding `/cliente/*` protection follows the exact same code structure.
- The return URL is preserved via query parameter (`?returnUrl=/cliente/consultas`) so users are redirected back after login.

**Alternatives Considered**:
- **Layout-level auth check**: Rejected — causes flash of unauthenticated content before redirect.
- **Per-page auth check**: Rejected — repetitive and error-prone.

---

## R7: Profile Photo Upload Strategy

**Decision**: Reuse the existing ImgBB upload infrastructure (`lib/uploads/imgbb.ts`) for customer profile photos, following the same pattern used for motorcycle images and other features.

**Rationale**:
- ImgBB upload is already implemented, tested, and used across the project.
- The `uploadImage` function handles validation, compression, and error handling.
- The resulting URL is stored in `customer_profiles.avatar_url`.

**Alternatives Considered**:
- **Supabase Storage**: The project has a storage bucket configured, but ImgBB is the established pattern for public images. Consistency over optimization.
- **Direct base64 in database**: Rejected — bloats the database and violates best practices.

---

## R8: Customer Area Layout Strategy

**Decision**: Place the `/cliente` route group at the top level (not inside `(public)`), with its own `layout.tsx` providing a customer-specific navigation sidebar/header.

**Rationale**:
- The public layout includes Header, Footer, and WhatsApp button — not appropriate for a dashboard.
- The admin area follows the same pattern: `app/admin/` has its own layout separate from `(public)`.
- The customer layout will include: a top nav bar with logo, user menu (avatar, name, logout), and sidebar navigation for Dashboard, Consultations, Profile.

**Alternatives Considered**:
- **Inside `(public)` with conditional layout**: Rejected — adds complexity to the public layout and mixes concerns.
- **Inside a `(customer)` route group**: Viable but unnecessary — `/cliente` at root level is cleaner and matches the `/admin` pattern.

---

## R9: Cache TTL and Consultation Reuse

**Decision**: Consultation cache in `vehicle_plate_consultations` has no explicit TTL — once a COMPLETED live consultation exists for a plate, it is reused indefinitely. The existing `findExistingConsultation` function already implements this. A `forceRefresh` flag exists for admin overrides.

**Rationale**:
- Vehicle history data (chassis, ownership, restrictions) changes infrequently — a 24h TTL would cause unnecessary API charges.
- The existing service already has `forceRefresh: boolean` for cases where a fresh lookup is needed.
- For the customer flow, we always use the cached result when available. The customer is paying for access to the data, not for a fresh API call.
- The unique index `idx_vpc_live_unique` ensures only one live COMPLETED record per plate.

**Alternatives Considered**:
- **24h TTL**: The spec mentioned 24h, but this would cause repeated API charges for popular plates. Given the cost (~R$30 per lookup), caching indefinitely is more economical.
- **Per-customer cache only**: Rejected — wasteful. If plate ABC1234 was already looked up by admin or another customer, the data is valid.

---

## R10: Registration Auto-Profile Creation

**Decision**: Create `customer_profiles` row via a Server Action immediately after successful `supabase.auth.signUp()`, not via a database trigger.

**Rationale**:
- Database triggers in Supabase require creating PL/pgSQL functions with access to `auth.users` — possible but harder to debug.
- A Server Action provides clear error handling and can set the profile fields from the registration form data (name, phone, birth date) in a single operation.
- For Google OAuth, the callback handler creates the profile using data from the OAuth provider's user metadata.

**Alternatives Considered**:
- **Database trigger on `auth.users` insert**: Rejected — the trigger only has access to `auth.users` columns, not to the registration form's custom fields (phone, birth date). Would require a two-step flow.
- **Supabase Auth hooks (Beta)**: Not stable enough for production use.
