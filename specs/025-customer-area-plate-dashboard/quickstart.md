# Quickstart Validation Guide: Customer Area

**Feature**: 025-customer-area-plate-dashboard
**Date**: 2026-09-11

## Prerequisites

- Node.js 20+ installed
- Supabase project configured (URL and anon key in `.env.local`)
- Google OAuth provider configured in Supabase Dashboard (Authentication → Providers → Google)
- ImgBB API key configured in `.env.local` (already exists for other features)
- Development server running (`npm run dev`)

## Setup

### 1. Apply Database Migration

Run the migration from [customer-api.md contracts](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/025-customer-area-plate-dashboard/contracts/customer-api.md):

```bash
# Apply via Supabase Dashboard (SQL Editor) or CLI
supabase db push
```

### 2. Configure Google OAuth (if not already done)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web Application)
3. Add authorized redirect URI: `https://<supabase-project-ref>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret
5. In Supabase Dashboard → Authentication → Providers → Google → Enable and paste credentials

### 3. Start Development Server

```bash
npm run dev
```

---

## Validation Scenarios

### Scenario 1: Email/Password Registration

**Steps**:
1. Navigate to `http://localhost:3000/cliente/cadastro`
2. Fill in: Name ("Maria Santos"), Email ("maria@test.com"), Phone ("11999887766"), Birth Date ("1990-01-15"), Password ("Teste@123")
3. Click "Criar Conta"

**Expected**:
- Form validates all fields before submission
- Supabase creates `auth.users` entry
- `customer_profiles` row is created with matching `id`
- User is automatically logged in and redirected to `/cliente`
- Dashboard shows "Olá, Maria Santos" with 0 consultations

---

### Scenario 2: Google OAuth Login

**Steps**:
1. Navigate to `http://localhost:3000/cliente/login`
2. Click "Entrar com Google"
3. Complete Google OAuth flow

**Expected**:
- Redirected to Google consent screen
- After consent, redirected back to `/api/auth/callback`
- If first login, `customer_profiles` row is created from Google user data
- Redirected to `/cliente` dashboard

---

### Scenario 3: Plate Consultation (Full Flow)

**Steps**:
1. Navigate to `http://localhost:3000/historico-veicular`
2. Enter a plate number (e.g., "ABC1234")
3. If not logged in, complete login/registration
4. See consultation summary (plate, price)
5. Click "Pagar e Consultar"
6. On payment page, select "PIX" and click "Confirmar Pagamento"
7. Wait for processing

**Expected**:
- `customer_plate_consultations` row created with `status: 'pending'`
- After payment, `status: 'paid'` → `'processing'` → `'completed'`
- `payment_simulations` row created with `status: 'confirmed'`
- If plate was previously consulted (by admin or other customer), result comes from cache (no API call)
- Redirected to `/cliente/consultas/{id}` with full vehicle data
- Vehicle data includes: make, model, year, color, risk indicators

---

### Scenario 4: Consultation History & Pagination

**Steps**:
1. Complete Scenario 3 multiple times (or seed test data)
2. Navigate to `/cliente/consultas`
3. Verify list shows consultations with plate, date, status
4. If >20 items, verify pagination controls work
5. Use plate filter to search for a specific plate

**Expected**:
- List shows all consultations owned by the authenticated user
- Each row shows: plate, date, status badge, "Ver Detalhes" button
- Pagination shows correct page count
- Filter narrows results by partial plate match
- Clicking "Ver Detalhes" navigates to `/cliente/consultas/{id}`

---

### Scenario 5: Profile Update

**Steps**:
1. Navigate to `/cliente/perfil`
2. Update phone number to "21988776655"
3. Add full address
4. Upload a profile photo (JPG, under 5MB)
5. Click "Salvar Alterações"

**Expected**:
- Form pre-fills with current profile data
- Phone field has Brazilian mask
- CEP field triggers address auto-fill (if implemented)
- Photo uploads via ImgBB and displays preview
- After save, success toast appears
- Refreshing the page shows updated data

---

### Scenario 6: Route Protection & Auth Redirect

**Steps**:
1. Open incognito/private browser
2. Navigate directly to `http://localhost:3000/cliente/consultas`

**Expected**:
- Middleware detects unauthenticated user
- Redirected to `/cliente/login?returnUrl=/cliente/consultas`
- After successful login, redirected back to `/cliente/consultas`

---

### Scenario 7: Logout

**Steps**:
1. While logged in as customer, click "Sair" in the customer nav
2. Try navigating to `/cliente`

**Expected**:
- Session is destroyed
- Redirected to home page (`/`)
- Attempting to access `/cliente` redirects to `/cliente/login`

---

### Scenario 8: RLS Isolation Test

**Steps**:
1. Register two different customer accounts (User A, User B)
2. Complete a consultation as User A
3. Log out and log in as User B
4. Navigate to `/cliente/consultas`
5. Try accessing User A's consultation detail URL directly

**Expected**:
- User B sees only their own consultations (empty if none)
- Direct URL to User A's consultation returns "not found" or redirects
- No data leakage between users

---

### Scenario 9: Main Menu Integration

**Steps**:
1. As a visitor (not logged in), open the main site menu (desktop + mobile hamburger)
2. Verify "Área do Cliente" link exists
3. Click it — should go to `/cliente/login`
4. Log in, then check menu again

**Expected**:
- Menu shows "Área do Cliente" item with appropriate icon
- Non-authenticated: links to `/cliente/login`
- Authenticated: links to `/cliente` (or shows avatar/name with dropdown)

---

## Security Checklist

- [ ] RLS enabled on all 3 new tables
- [ ] Customer can only SELECT/INSERT/UPDATE their own rows
- [ ] Admin can SELECT all rows (for future admin view)
- [ ] No DELETE policies for customers (customers cannot delete their data)
- [ ] Middleware redirects unauthenticated users from all `/cliente/*` routes except login/cadastro
- [ ] Google OAuth callback validates the `code` parameter
- [ ] ImgBB API key is never exposed to the client (upload happens via Server Action)
- [ ] Password is never stored or logged in application code (handled by Supabase Auth)

## Performance Checklist

- [ ] Dashboard loads in < 2s (measure with Chrome DevTools Network tab)
- [ ] Consultation history pagination doesn't load all records at once
- [ ] Cached plate lookups return in < 1s (verify via console log in Server Action)
- [ ] Skeleton loaders appear during all data loading states
