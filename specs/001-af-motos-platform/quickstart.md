# Quickstart Validation Guide: AF Motos Platform

**Feature**: 001-af-motos-platform | **Date**: 2026-08-21

This guide documents how to validate that the AF Motos platform works end-to-end. Use this to verify each phase during implementation.

---

## Prerequisites

- Node.js 20+ installed
- npm installed
- Supabase project created (free tier sufficient)
- Environment variables configured in `.env.local` (see `.env.example`)

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The application should be available at `http://localhost:3000`.

---

## Phase 1 Validation: Foundation

### ✅ Next.js boots

```bash
npm run dev
```

**Expected**: Server starts on `http://localhost:3000` without errors. Home page renders.

### ✅ TypeScript strict mode

```bash
npx tsc --noEmit
```

**Expected**: No TypeScript errors. `strict: true` is enforced.

### ✅ ESLint passes

```bash
npm run lint
```

**Expected**: No lint errors.

### ✅ Tailwind CSS v4 works

Verify custom theme tokens render in browser. Inspect elements for custom CSS variable values.

### ✅ Environment variables

Verify `.env.example` exists with all required variable names (no values). Verify `.env.local` is NOT committed (check `.gitignore`).

---

## Phase 2 Validation: Database

### ✅ Migrations run

Apply all migrations to the Supabase project (via Supabase CLI or Dashboard SQL Editor).

**Expected**: All tables created. Verify via Supabase Dashboard → Table Editor:

- `admin_profiles`
- `categories` (8 seed records)
- `features` (10 seed records)
- `motorcycles`
- `motorcycle_categories`
- `motorcycle_features_map`
- `motorcycle_images`
- `motorcycle_owners`
- `consignments`
- `sales`
- `rentals`
- `rental_settings` (1 seed record)
- `leads`
- `sell_requests`
- `analytics_events`
- `site_configuration` (1 seed record)

### ✅ RLS policies active

Verify via Supabase Dashboard → Authentication → Policies. Each table should have policies defined.

Test: Attempt to SELECT from `motorcycle_owners` without authentication via Supabase JS client in browser → should return empty/error.

### ✅ Storage buckets exist

Verify `motorcycle-images` (public) and `documents` (private) buckets exist in Supabase Dashboard → Storage.

---

## Phase 3 Validation: Design System

### ✅ Components render

Open the application and verify:

- Custom fonts load (Inter or configured font)
- Brand colors are applied
- Dark/light theme tokens work
- shadcn/ui components render correctly

### ✅ Layout structure

- Header renders on all public pages
- Footer renders on all public pages
- Mobile navigation works (hamburger menu)
- Responsive breakpoints: test at 375px, 768px, 1024px, 1440px

---

## Phase 4 Validation: Public Catalog

### ✅ Home page (SC-001)

1. Navigate to `/`
2. Verify: hero section, search bar, brand filters, featured motorcycles section, recently added section, WhatsApp CTA
3. Should reach motorcycle detail from home in ≤ 3 taps/clicks

### ✅ Catalog listing

1. Navigate to `/motos`
2. Verify: search input, filter panel (brand, price range, year, category), sort options, motorcycle cards with photo/name/year/mileage/price
3. Apply filters → verify results update
4. Remove all filters → verify empty state ("Nenhuma moto encontrada") when no motorcycles exist

### ✅ Motorcycle detail (SC-002)

1. Navigate to `/motos/[slug]`
2. Verify on mobile (375px): gallery swipe carousel, photo counter, fullscreen zoom
3. Verify specs section: brand, model, version, years, mileage, engine, fuel, transmission, color, price, internal code
4. Verify description section
5. Verify differentials badges
6. Verify WhatsApp button with pre-filled message
7. Verify similar motorcycles section
8. **Performance**: Page fully interactive < 3 seconds on 4G throttle (Chrome DevTools → Network → Slow 3G → verify LCP)

### ✅ SEO validation (SC-004)

1. View page source on any motorcycle detail page
2. Verify `<title>` format: "Brand Model Year à venda | AF Motos"
3. Verify `<meta name="description">` present
4. Verify Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`
5. Verify JSON-LD structured data (search for `application/ld+json` script)
6. Verify canonical URL

### ✅ Sitemap

1. Navigate to `/sitemap.xml`
2. Verify it lists all public motorcycle URLs

---

## Phase 5 Validation: WhatsApp (SC-005)

### ✅ WhatsApp button generates correct link

1. On motorcycle detail page, click WhatsApp button
2. Verify URL: `https://wa.me/[PHONE]?text=[ENCODED_MESSAGE]`
3. Verify message contains: brand, model, year, internal code, price
4. Test on actual mobile device: WhatsApp should open with pre-filled message

---

## Phase 6 Validation: Admin

### ✅ Authentication

1. Navigate to `/admin` without login → redirected to `/admin/login`
2. Login with admin credentials → redirected to `/admin`
3. Dashboard renders with metric cards

### ✅ Motorcycle CRUD (SC-003)

1. Navigate to `/admin/motos/nova`
2. Fill all fields manually → save → motorcycle created
3. Navigate to `/admin/motos` → verify motorcycle appears in list
4. Click edit → modify fields → save → changes persisted
5. Publish motorcycle → verify it appears on `/motos`
6. **Timing**: Complete motorcycle registration (with 8 photo uploads) in < 5 minutes

### ✅ Photo management

1. Upload 8 photos via drag-and-drop
2. Reorder photos via drag-and-drop → save → verify order persists
3. Set photo #3 as primary → verify main photo badge updates
4. Delete a photo → verify it's removed from storage and list
5. Verify uploaded photos display on public motorcycle detail page

### ✅ Status management

1. Change motorcycle status from AVAILABLE → RESERVED → verify transition works
2. Attempt invalid transition (e.g., SOLD → RENTED) → verify error message
3. Mark as sold → verify Sale record created, motorcycle appears on `/motos-vendidas`

---

## Phase 7 Validation: Plate Lookup

### ✅ With provider configured

1. Navigate to motorcycle creation form
2. Enter a valid plate number
3. Verify auto-fill: brand, model, version, year, color, engine capacity populated
4. Verify admin can edit/override auto-filled values

### ✅ Error handling

1. Enter invalid plate format → verify validation error message
2. Simulate provider timeout → verify friendly error ("Não foi possível consultar...") and manual entry available
3. Provider returns partial data → verify available fields filled, others remain empty

---

## Phase 8 Validation: Sell & Consignment

### ✅ Sell your motorcycle (SC-006)

1. Navigate to `/venda-sua-moto`
2. Fill form: name, phone, plate (auto-fill if provider configured), mileage, desired price, photos, notes
3. Submit → verify success message
4. Navigate to `/admin/propostas` → verify proposal visible with status "Novo"
5. Verify submission appears < 10 seconds after form submission

### ✅ Consignment proposal

1. Navigate to `/consignar-moto`
2. Verify explanation text about consignment model
3. Fill and submit form
4. Verify lead created in admin with type "consignação"

### ✅ Commission calculation (SC-009)

1. In admin, open consignment contract
2. Set: sale price R$35.000, commission 8%
3. Verify display: commission AF Motos R$2.800, owner receives R$32.200
4. Change to fixed commission R$3.000
5. Verify display: commission AF Motos R$3.000, owner receives R$32.000

---

## Phase 9 Validation: Sold Motorcycles (SC-008)

### ✅ Sold motorcycle page

1. Navigate to `/motos-vendidas`
2. Verify sold motorcycles display with photo, brand, model, year, "Vendida" badge
3. Verify NO license plate or owner info visible

### ✅ Sold motorcycle detail

1. Click a sold motorcycle → detail page shows "Vendida" status badge
2. Verify similar available motorcycles section displays
3. Verify sold motorcycle does NOT appear in main catalog `/motos`

---

## Phase 10 Validation: Rental

### ✅ Rental catalog

1. Navigate to `/aluguel`
2. Verify motorcycles available for rent display with photo, brand, model, daily/weekly/monthly pricing

### ✅ Rental detail & request

1. Open rental motorcycle detail page
2. Verify configurable requirements (age, documents, deposit, etc.) display
3. Select pickup date 10/09/2026 and return date 13/09/2026
4. Verify estimated price calculated (3 days × daily rate)
5. Fill name and WhatsApp → submit
6. Verify lead created in admin with type "aluguel"

---

## Phase 11 Validation: Analytics

### ✅ Events tracking

1. View a motorcycle detail page → verify `MOTORCYCLE_VIEW` event created in `analytics_events` table
2. Click WhatsApp button → verify `WHATSAPP_CLICK` event
3. Submit a sell request → verify `SELL_REQUEST_SUBMITTED` event

### ✅ Dashboard metrics

1. Navigate to `/admin` → verify dashboard shows correct counts for views and clicks

---

## Phase 12 Validation: Polish

### ✅ Security (SC-010)

1. View page source on any public motorcycle page → verify NO license plates or owner data in HTML
2. Check Network tab → verify no API responses contain private data
3. Verify `/admin/*` routes redirect to login when unauthenticated
4. Test RLS: anonymous Supabase client cannot read `motorcycle_owners`, `consignments`, `admin_profiles`

### ✅ Mobile experience

Test on real device or Chrome DevTools mobile view (375px):

- Gallery swipes smoothly
- Filters accessible via bottom sheet/drawer
- WhatsApp button easily tappable
- Forms complete and submit successfully
- Navigation menu works

### ✅ Loading/empty/error states

1. Verify skeleton loading states on catalog page
2. Verify empty state when no motorcycles match filters
3. Verify error state when API fails (simulate by disconnecting network)
4. Verify submitting state on all forms (button disabled, spinner visible)

### ✅ Production build

```bash
npm run build
```

**Expected**: Build completes without errors. No TypeScript or ESLint errors.

---

## Acceptance Criteria Checklist

Reference: [spec.md Success Criteria](./spec.md#success-criteria-mandatory)

| #      | Criterion                                     | Validation                       |
| ------ | --------------------------------------------- | -------------------------------- |
| SC-001 | ≤ 3 taps from landing to motorcycle detail    | Navigate home → catalog → detail |
| SC-002 | Detail page interactive < 3s on 4G            | Chrome DevTools throttle test    |
| SC-003 | Admin registers motorcycle < 5 min            | Time the full flow with photos   |
| SC-004 | Valid WhatsApp link preview on all moto pages | Share URL on WhatsApp            |
| SC-005 | WhatsApp message identifies motorcycle        | Check pre-filled message content |
| SC-006 | Sell proposal visible in admin < 10s          | Submit form, check admin         |
| SC-007 | Single-action lead status update              | Click status dropdown in admin   |
| SC-008 | Sold motorcycles accessible + show similar    | Check `/motos-vendidas`          |
| SC-009 | Commission calculation 100% accurate          | Test percentage and fixed        |
| SC-010 | No sensitive data on public pages             | Source inspection + network tab  |
