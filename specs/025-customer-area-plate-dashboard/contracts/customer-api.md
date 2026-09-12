# Customer API Contract: Customer Area

**Feature**: 025-customer-area-plate-dashboard
**Date**: 2026-09-11

## Overview

Server Actions and data queries for the customer area — dashboard, consultation lifecycle, profile management, and payment simulation.

---

## Server Actions

### `updateCustomerProfile(formData)`
Updates the authenticated customer's profile.

**Input** (Zod-validated):
```typescript
{
  full_name: string;
  phone?: string;
  date_of_birth?: string;    // ISO date
  avatar_url?: string;       // ImgBB URL
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;    // 2-char UF
  address_zip?: string;      // 8-digit CEP
}
```

**Flow**:
1. Get authenticated user via `supabase.auth.getUser()`
2. Validate input with Zod schema
3. Update `customer_profiles` WHERE `id = auth.uid()`
4. Return `{ success: true }` or `{ error: string }`

---

### `initiateConsultation(plate)`
Creates a pending consultation record for the given plate.

**Input**:
```typescript
{
  plate: string;  // validated as Brazilian plate format
}
```

**Flow**:
1. Get authenticated user
2. Normalize plate via `normalizeBrazilianPlate(plate)`
3. Check if user already has a consultation for this plate (`customer_plate_consultations WHERE user_id = uid AND plate_normalized = normalized`)
4. If exists with status 'completed' → return `{ existing: true, consultationId }` (no new payment needed)
5. If exists with status 'pending' or 'paid' → return `{ existing: true, consultationId }` (resume flow)
6. Insert new row in `customer_plate_consultations` with `status: 'pending'`, `payment_status: 'unpaid'`
7. Return `{ success: true, consultationId }`

---

### `confirmPayment(consultationId, paymentMethod)`
Simulates payment confirmation and triggers plate lookup.

**Input**:
```typescript
{
  consultationId: string;  // UUID
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
}
```

**Flow**:
1. Get authenticated user
2. Fetch consultation WHERE `id = consultationId AND user_id = auth.uid()`
3. If not found or not owned → return `{ error: 'Consultation not found' }`
4. If already completed → return `{ error: 'Already processed' }`
5. Insert into `payment_simulations` with `status: 'confirmed'`
6. Update consultation: `payment_status = 'paid'`, `payment_method`, `payment_date = now()`, `status = 'processing'`
7. Check `vehicle_plate_consultations` cache for plate:
   - Cache hit → copy data to `vehicle_data`, set `status = 'completed'`, `processed_at = now()`
   - Cache miss → call `executeVehiclePlateLookup()` → copy result to `vehicle_data`, set `status = 'completed'`
8. If lookup fails → set `status = 'failed'`
9. Return `{ success: true, consultationId }` or `{ error: string }`

**Transaction Safety**: Steps 5-8 are executed sequentially. If step 7 fails, step 8 marks it as failed. The payment record (step 5) is always created for audit.

---

## Data Queries

### `getCustomerDashboardData()`
Fetches dashboard data for the authenticated customer.

**Returns**:
```typescript
{
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
  stats: {
    total_consultations: number;
  };
  recent_consultations: Array<{
    id: string;
    plate: string;
    plate_normalized: string;
    status: string;
    created_at: string;
    vehicle_data: {
      brand?: string;
      model?: string;
    } | null;
  }>;  // last 3
}
```

**Query**:
```sql
-- Profile
SELECT full_name, avatar_url FROM customer_profiles WHERE id = auth.uid();

-- Stats
SELECT count(*) FROM customer_plate_consultations WHERE user_id = auth.uid();

-- Recent
SELECT id, plate, plate_normalized, status, created_at, vehicle_data
FROM customer_plate_consultations
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 3;
```

---

### `getConsultationHistory(page, plateFilter?)`
Paginated consultation history with optional plate filter.

**Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` | `1` | Page number (1-indexed) |
| `plateFilter` | `string?` | — | Partial plate text for filtering |

**Returns**:
```typescript
{
  consultations: Array<{
    id: string;
    plate: string;
    status: string;
    payment_status: string;
    created_at: string;
    processed_at: string | null;
    vehicle_data: {
      brand?: string;
      model?: string;
      year_model?: number;
      color?: string;
    } | null;
  }>;
  total_count: number;
  page: number;
  page_size: 20;
  total_pages: number;
}
```

**Query**:
```sql
SELECT id, plate, status, payment_status, created_at, processed_at, vehicle_data
FROM customer_plate_consultations
WHERE user_id = auth.uid()
  AND (plate_normalized ILIKE '%' || $plateFilter || '%' OR $plateFilter IS NULL)
ORDER BY created_at DESC
LIMIT 20 OFFSET ($page - 1) * 20;

SELECT count(*) FROM customer_plate_consultations
WHERE user_id = auth.uid()
  AND (plate_normalized ILIKE '%' || $plateFilter || '%' OR $plateFilter IS NULL);
```

---

### `getConsultationDetail(consultationId)`
Full consultation detail for a single record.

**Returns**:
```typescript
{
  id: string;
  plate: string;
  plate_normalized: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_date: string | null;
  processed_at: string | null;
  created_at: string;
  vehicle_data: Record<string, unknown> | null;  // Full JSONB snapshot
}
```

**Security**: Query is scoped by `WHERE id = $id AND user_id = auth.uid()`. Returns null if not owned.

---

### `getCustomerProfile()`
Full profile data for the authenticated customer.

**Returns**: Full `customer_profiles` row or null if not found.

---

## Database Migration

File: `supabase/migrations/20260911000000_create_customer_area.sql`

```sql
-- ============================================================
-- Migration: Customer Area (Spec 025)
-- Creates: customer_profiles, customer_plate_consultations, payment_simulations
-- ============================================================

-- 1. Customer Profiles
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  phone_normalized TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT customer_profiles_name_length CHECK (length(trim(full_name)) >= 2),
  CONSTRAINT customer_profiles_birth_date CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE),
  CONSTRAINT customer_profiles_state_length CHECK (address_state IS NULL OR length(address_state) = 2)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_email
  ON public.customer_profiles (email);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone
  ON public.customer_profiles (phone_normalized)
  WHERE phone_normalized IS NOT NULL;

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own profile"
  ON public.customer_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Customers insert own profile"
  ON public.customer_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers update own profile"
  ON public.customer_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can also view customer profiles (for future admin dashboard)
CREATE POLICY "Admins view all customer profiles"
  ON public.customer_profiles FOR SELECT TO authenticated
  USING (public.is_admin());

-- updated_at trigger
DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON public.customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 2. Customer Plate Consultations
CREATE TABLE IF NOT EXISTS public.customer_plate_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  plate_normalized TEXT NOT NULL,
  vehicle_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'completed', 'failed')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_method TEXT
    CHECK (payment_method IS NULL OR payment_method IN ('pix', 'credit_card', 'boleto')),
  payment_date TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  source_consultation_id UUID REFERENCES public.vehicle_plate_consultations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_customer_plate UNIQUE (user_id, plate_normalized)
);

CREATE INDEX IF NOT EXISTS idx_cpc_user_id
  ON public.customer_plate_consultations (user_id);

CREATE INDEX IF NOT EXISTS idx_cpc_plate_normalized
  ON public.customer_plate_consultations (plate_normalized);

CREATE INDEX IF NOT EXISTS idx_cpc_user_created
  ON public.customer_plate_consultations (user_id, created_at DESC);

ALTER TABLE public.customer_plate_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own consultations"
  ON public.customer_plate_consultations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Customers insert own consultations"
  ON public.customer_plate_consultations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers update own consultations"
  ON public.customer_plate_consultations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all customer consultations
CREATE POLICY "Admins view all customer consultations"
  ON public.customer_plate_consultations FOR SELECT TO authenticated
  USING (public.is_admin());

-- updated_at trigger
DROP TRIGGER IF EXISTS update_customer_plate_consultations_updated_at ON public.customer_plate_consultations;
CREATE TRIGGER update_customer_plate_consultations_updated_at
  BEFORE UPDATE ON public.customer_plate_consultations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Payment Simulations
CREATE TABLE IF NOT EXISTS public.payment_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.customer_plate_consultations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('pix', 'credit_card', 'boleto')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  simulated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_ps_consultation_id
  ON public.payment_simulations (consultation_id);

CREATE INDEX IF NOT EXISTS idx_ps_user_id
  ON public.payment_simulations (user_id);

ALTER TABLE public.payment_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own payments"
  ON public.payment_simulations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Customers insert own payments"
  ON public.payment_simulations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins view all payments"
  ON public.payment_simulations FOR SELECT TO authenticated
  USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
```
