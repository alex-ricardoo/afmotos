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

DROP POLICY IF EXISTS "Customers see own profile" ON public.customer_profiles;
CREATE POLICY "Customers see own profile"
  ON public.customer_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Customers insert own profile" ON public.customer_profiles;
CREATE POLICY "Customers insert own profile"
  ON public.customer_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Customers update own profile" ON public.customer_profiles;
CREATE POLICY "Customers update own profile"
  ON public.customer_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can also view customer profiles (for future admin dashboard)
DROP POLICY IF EXISTS "Admins view all customer profiles" ON public.customer_profiles;
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

DROP POLICY IF EXISTS "Customers see own consultations" ON public.customer_plate_consultations;
CREATE POLICY "Customers see own consultations"
  ON public.customer_plate_consultations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers insert own consultations" ON public.customer_plate_consultations;
CREATE POLICY "Customers insert own consultations"
  ON public.customer_plate_consultations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers update own consultations" ON public.customer_plate_consultations;
CREATE POLICY "Customers update own consultations"
  ON public.customer_plate_consultations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all customer consultations
DROP POLICY IF EXISTS "Admins view all customer consultations" ON public.customer_plate_consultations;
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

DROP POLICY IF EXISTS "Customers see own payments" ON public.payment_simulations;
CREATE POLICY "Customers see own payments"
  ON public.payment_simulations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers insert own payments" ON public.payment_simulations;
CREATE POLICY "Customers insert own payments"
  ON public.payment_simulations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all payments
DROP POLICY IF EXISTS "Admins view all payments" ON public.payment_simulations;
CREATE POLICY "Admins view all payments"
  ON public.payment_simulations FOR SELECT TO authenticated
  USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
