# Research: AF Motos Platform

**Feature**: 001-af-motos-platform | **Date**: 2026-08-21

## 1. Next.js 16 App Router — Project Structure Without `src/`

**Decision**: Keep the existing root-level `app/` directory structure. Do NOT migrate to `src/`.

**Rationale**: The project was scaffolded by `create-next-app` with `app/` at root. Next.js 16 supports both patterns equally. The existing `tsconfig.json` paths alias `@/*` → `./*` already resolves correctly for root-level structure. Migrating to `src/` would require moving files, updating the alias to `./src/*`, and provides no functional benefit.

**Alternatives considered**:

- `src/` directory: Rejected because the project already exists without it. No advantage for a single-application project.

**Impact**: `components/`, `lib/`, `types/`, `hooks/` directories sit at project root alongside `app/`.

---

## 2. Next.js 16 Typing — `LayoutProps<>` and `PageProps<>`

**Decision**: Use Next.js 16's built-in typed page/layout props (`LayoutProps<"/">`, `PageProps<"/motos/[slug]">`) instead of manual type definitions.

**Rationale**: Next.js 16.3.2 (installed) uses the new typed props pattern visible in the existing `layout.tsx` (line 20: `LayoutProps<"/">`). This provides automatic type inference for `params` and `searchParams` as `Promise<>` types, matching the framework's conventions.

**Alternatives considered**:

- Manual type definitions: Rejected; would be redundant and drift from framework conventions.

---

## 3. Supabase Client Architecture

**Decision**: Use `@supabase/ssr` for server-side client creation, `@supabase/supabase-js` for browser client. Three client variants:

1. **Browser client** (`lib/supabase/client.ts`): `createBrowserClient()` for Client Components
2. **Server client** (`lib/supabase/server.ts`): `createServerClient()` with cookie handling for Server Components, Server Actions, Route Handlers
3. **Admin client** (`lib/supabase/admin.ts`): `createClient()` with `SUPABASE_SERVICE_ROLE_KEY` for admin operations that bypass RLS

**Rationale**: Supabase SSR package is the recommended approach for Next.js App Router. Separating clients enforces the security boundary between public/server/admin operations.

**Alternatives considered**:

- Single client for all contexts: Rejected; breaks security model and RLS enforcement.
- Middleware-only auth refresh: The `@supabase/ssr` handles cookie refresh automatically via middleware.

---

## 4. Database Enum Strategy

**Decision**: Use PostgreSQL `text` columns with `CHECK` constraints for status-like fields (motorcycle status, lead status, commission type, etc.) instead of PostgreSQL `CREATE TYPE ... AS ENUM`.

**Rationale**: PostgreSQL enums require `ALTER TYPE ... ADD VALUE` for additions, which cannot run inside transactions and is cumbersome. Check constraints provide the same validation guarantees but are easier to modify. For columns with truly fixed values (fuel types, transmission), enums are acceptable. The TypeScript types enforce correctness at the application layer via Zod.

**Alternatives considered**:

- PostgreSQL enums: Rejected for evolving fields; acceptable for truly static fields (fuel, transmission).
- Reference tables: Considered for categories (used) and features (used) where admin needs to manage values dynamically.
- Unconstrained text: Rejected; no database-level validation.

**Specific decisions**:

| Field                       | Strategy         | Reason                                |
| --------------------------- | ---------------- | ------------------------------------- |
| motorcycle.status           | CHECK constraint | Admin-managed transitions, may evolve |
| motorcycle.ownership_type   | CHECK constraint | Small set, might expand               |
| motorcycle.operation_type   | CHECK constraint | Small set, might expand               |
| lead.type                   | CHECK constraint | New types possible                    |
| lead.status                 | CHECK constraint | May evolve                            |
| consignment.commission_type | CHECK constraint | Fixed: percentage / fixed             |
| consignment.contract_status | CHECK constraint | May evolve                            |
| rental.status               | CHECK constraint | May evolve                            |
| motorcycle.fuel             | CHECK constraint | Semi-static but may expand            |
| motorcycle.transmission     | CHECK constraint | Semi-static but may expand            |
| categories                  | Reference table  | Admin-managed, dynamic                |
| features                    | Reference table  | Admin-managed, dynamic                |

---

## 5. Image Storage Architecture

**Decision**: Use Supabase Storage with two separate buckets:

1. **`motorcycle-images`** (public): Public motorcycle photos accessible via CDN URL
2. **`documents`** (private): Owner documents, contracts, private uploads (future)

**Rationale**: Public bucket allows direct URL access for motorcycle images, enabling CDN delivery and Next/Image optimization. Private bucket ensures documents are never publicly accessible.

**Implementation**:

- Upload via Server Action (validates auth, file type, size)
- Generate public URL via Supabase Storage `getPublicUrl()`
- Store `storage_path` in `motorcycle_images` table (not full URL, for portability)
- Reconstruct full URL at query time using `NEXT_PUBLIC_SUPABASE_URL`

**Alternatives considered**:

- Single bucket with folder separation: Rejected; RLS on storage is bucket-level, mixing public/private in one bucket requires complex policies.
- External CDN (Cloudinary, Imgix): Rejected for MVP; adds cost and complexity. Supabase Storage + Next/Image is sufficient.

---

## 6. Image Optimization Strategy

**Decision**: Rely on Next.js `<Image>` component for serving optimized images. Do NOT implement server-side resize/convert on upload in MVP.

**Rationale**: Next/Image automatically serves WebP/AVIF, resizes on demand, and caches results. This satisfies Constitution Principle IX without custom image processing. Adding Sharp-based resize on upload adds complexity with minimal benefit when Next/Image handles it transparently.

**Future**: If image count grows significantly, add upload-time optimization (thumbnail generation, max dimension capping).

---

## 7. Slug Generation Strategy

**Decision**: Generate slug on motorcycle creation using `brand-model-year_model` pattern. Handle duplicates with numeric suffix appended at insert time.

**Algorithm**:

1. Generate base slug: `slugify(brand)-slugify(model)-yearModel` → e.g., `honda-cb-500f-2022`
2. Query DB for existing slugs matching pattern `base-slug%`
3. If no conflict: use base slug
4. If conflict: append `-N` where N is next available number → `honda-cb-500f-2022-2`

**Rationale**: Matches spec requirement FR-003. Slug is stored in the database column, not computed at query time.

---

## 8. Motorcycle Status Transitions

**Decision**: Implement a strict transition map in `lib/domain/motorcycle-status.ts`:

```
AVAILABLE → RESERVED, SOLD, RENTED, MAINTENANCE, UNAVAILABLE, HIDDEN
RESERVED → AVAILABLE, SOLD, RENTED, UNAVAILABLE
SOLD → (terminal — no transitions unless explicit admin reversal)
RENTED → AVAILABLE (only after return confirmed), MAINTENANCE
MAINTENANCE → AVAILABLE, UNAVAILABLE
UNAVAILABLE → AVAILABLE, HIDDEN, MAINTENANCE
HIDDEN → AVAILABLE, RESERVED, MAINTENANCE, UNAVAILABLE
```

**Rationale**: Matches spec FR-026. "Vendida" is terminal. "Alugada→Disponível" requires admin confirmation. Transition validation happens in domain layer, not UI.

---

## 9. WhatsApp Message Templates

**Decision**: Store message templates as string constants with placeholder tokens. No external template engine.

**Template format**:

```
Olá! Vim pelo site da AF Motos e tenho interesse na {brand} {model} {year} (cód. {internalCode}), anunciada por {price}. Podemos conversar?
```

**Link generation**: `https://wa.me/{phone}?text={encodedMessage}`

**Rationale**: Simple, testable, no external dependencies. Templates defined in code; future: move to database (site_configuration).

---

## 10. Plate Lookup Architecture

**Decision**: Use Route Handler (`app/api/plate-lookup/route.ts`) that delegates to a PlateProvider interface.

**Flow**:

1. Client calls `POST /api/plate-lookup` with `{ plate: "ABC1234" }`
2. Route handler validates input, rate-limits, calls provider
3. Provider returns normalized response or error
4. Route handler returns result to client

**Provider interface** (`lib/plate/types.ts`):

```typescript
interface PlateProvider {
  lookup(plate: string): Promise<PlateResult>;
}

type PlateResult = {
  plate: string;
  brand?: string;
  model?: string;
  version?: string;
  yearManufacture?: number;
  yearModel?: number;
  color?: string;
  engineCapacity?: number;
  fuel?: string;
  rawData?: Record<string, unknown>;
};
```

**Rationale**: Server-only (credentials never exposed). Provider-agnostic (swap providers via env var). Graceful degradation (any missing field → user fills manually).

**Initial provider**: `DefaultProvider` — configurable via `PLATE_API_URL` and `PLATE_API_TOKEN` env vars. Returns raw data mapped to standard interface.

---

## 11. Authentication Strategy

**Decision**: Use Supabase Auth with email/password for admin. No social logins. No public user accounts.

**Implementation**:

- Login page at `/admin/login`
- Supabase Auth session management via `@supabase/ssr` middleware
- Admin layout checks session; redirects to login if unauthenticated
- Admin user created manually via Supabase Dashboard or seed script
- `admin_profiles` table links Supabase Auth UID to admin profile data

**Middleware** (`middleware.ts`):

- Refreshes Supabase Auth session on every request
- Protects `/admin/*` routes (except `/admin/login`)
- Redirects unauthenticated users to `/admin/login`

**Rationale**: Simplest auth for single-admin MVP. Supabase Auth handles session, cookies, token refresh. No custom auth implementation needed.

---

## 12. Tailwind CSS v4 Configuration

**Decision**: Use Tailwind CSS v4's CSS-first configuration. No `tailwind.config.ts` file.

**Rationale**: The existing project uses `@tailwindcss/postcss` v4. Tailwind v4 uses CSS-based configuration in `globals.css` with `@theme` blocks instead of the v3 JavaScript config. Custom tokens (colors, fonts, spacing) defined directly in CSS.

**Custom theme tokens**:

```css
@import 'tailwindcss';

@theme {
  --color-primary: oklch(...);
  --color-secondary: oklch(...);
  --font-sans: 'Inter', sans-serif;
  /* etc. */
}
```

---

## 13. shadcn/ui Setup

**Decision**: Use `npx shadcn@latest init` to scaffold, then add components individually with `npx shadcn@latest add [component]`.

**Rationale**: shadcn/ui installs components as source files (not npm packages). Each component can be customized. Uses Radix UI primitives + Tailwind styling.

**Configuration**: `components.json` with:

- Style: "new-york" (more polished)
- Color: custom (AF Motos brand colors)
- CSS variables: yes
- Base color: slate (dark theme base)
- Components directory: `components/ui`
- Utils: `lib/utils/cn.ts`

---

## 14. Form Architecture

**Decision**: React Hook Form + Zod for all forms. Server Actions for form submission.

**Pattern**:

1. Define Zod schema in `lib/validations/`
2. Create form component using `useForm` with `zodResolver`
3. Submit via Server Action (imported with `"use server"`)
4. Server Action re-validates with same Zod schema (defense in depth)
5. Return result to client; display via Sonner toast

**Rationale**: Consistent form handling across all forms. Client-side validation for UX. Server-side validation for security. Zod schemas shared between client and server.

---

## 15. Analytics Implementation

**Decision**: Lightweight custom analytics via `analytics_events` table + client-side tracking hook.

**Implementation**:

- `useAnalytics()` hook provides `track(event, data)` function
- Events sent via `POST /api/analytics` (fire-and-forget, non-blocking)
- Route handler inserts into `analytics_events` table
- Dashboard queries aggregate data with PostgreSQL

**Rationale**: No external analytics dependency for MVP. Simple, privacy-friendly, Supabase-native. Can add GA4/Posthog later alongside.

---

## 16. Commission Calculation

**Decision**: Pure function in `lib/domain/commission.ts`.

**Calculation**:

```typescript
function calculateCommission(salePrice: number, type: 'percentage' | 'fixed', value: number) {
  if (type === 'percentage') {
    return {
      commission: salePrice * (value / 100),
      ownerReceives: salePrice - salePrice * (value / 100),
    };
  }
  return { commission: value, ownerReceives: salePrice - value };
}
```

**Rationale**: Isolated, testable, no side effects. Commission type and value configured per consignment contract.

---

## 17. Data Fetching Strategy

**Decision**: Server Components fetch data directly via Supabase server client. Client Components use Server Actions for mutations.

**Patterns**:

- **List pages** (catalog, admin tables): Server Component with direct Supabase query → pass data as props
- **Detail pages** (motorcycle detail): Server Component with Supabase query by slug/ID
- **Forms**: Client Components with React Hook Form → submit via Server Actions
- **Filters/Search**: URL search params + Server Component re-render (no client-side state for initial render)
- **Infinite scroll**: Client Component with `useInfiniteQuery`-like pattern via Server Actions

**Rationale**: Maximizes Server Components (performance, SEO). Client Components only where interactivity required (forms, galleries, filters).

---

## 18. Testing Framework

**Decision**: Vitest for unit and integration tests.

**Rationale**: Vitest is compatible with the Vite-based toolchain, fast, and has excellent TypeScript support. Testing Library for component tests if needed. Playwright for e2e tests (deferred post-MVP).

**Priority tests** (MVP):

1. Commission calculation (unit)
2. Status transition validation (unit)
3. WhatsApp message generation (unit)
4. Slug generation with duplicates (unit)
5. Rental price calculation (unit)
6. Plate lookup response normalization (unit)
7. Zod schema validation edge cases (unit)
