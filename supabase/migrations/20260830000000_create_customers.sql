-- Migration: Create customers table with RLS and indexes
-- Feature: 016-cadastro-clientes-crm

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  full_name text NOT NULL,

  phone text NOT NULL,
  phone_normalized text NOT NULL,

  whatsapp text NULL,
  whatsapp_normalized text NULL,

  email text NULL,
  email_normalized text NULL,

  cpf text NULL,
  cpf_normalized text NULL,

  rg text NULL,

  gender text NULL,
  birth_date date NULL,

  cep text NULL,
  street text NULL,
  number text NULL,
  complement text NULL,
  neighborhood text NULL,
  city text NULL,
  state text NULL,

  source text NOT NULL DEFAULT 'manual',
  source_detail text NULL,

  notes text NULL,

  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  created_by uuid NULL REFERENCES auth.users(id),
  updated_by uuid NULL REFERENCES auth.users(id),

  CONSTRAINT customers_source_check CHECK (
    source IN (
      'manual',
      'website_sell_request',
      'website_consignment_request',
      'website_contact',
      'sale_registration',
      'rental_registration',
      'admin_proposal',
      'imported',
      'other'
    )
  ),

  CONSTRAINT customers_gender_check CHECK (
    gender IS NULL OR gender IN (
      'male',
      'female',
      'other',
      'prefer_not_to_say'
    )
  ),

  CONSTRAINT customers_full_name_length_check CHECK (
    length(trim(full_name)) >= 2
  ),

  CONSTRAINT customers_birth_date_check CHECK (
    birth_date IS NULL OR birth_date <= CURRENT_DATE
  ),

  CONSTRAINT customers_state_length_check CHECK (
    state IS NULL OR length(state) = 2
  )
);

-- Indexes for performance and uniqueness
CREATE INDEX IF NOT EXISTS idx_customers_created_at
  ON public.customers (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_source
  ON public.customers (source);

CREATE INDEX IF NOT EXISTS idx_customers_is_active_created_at
  ON public.customers (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_phone_normalized
  ON public.customers (phone_normalized);

CREATE INDEX IF NOT EXISTS idx_customers_email_normalized
  ON public.customers (email_normalized)
  WHERE email_normalized IS NOT NULL;

-- Strict unique index on CPF (partial, only when non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_cpf_normalized_unique
  ON public.customers (cpf_normalized)
  WHERE cpf_normalized IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to ensure idempotency
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view customers" ON public.customers;
  DROP POLICY IF EXISTS "Admins can insert customers" ON public.customers;
  DROP POLICY IF EXISTS "Admins can update customers" ON public.customers;
  DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;
END $$;

-- Policies for authenticated admins using public.is_admin()
CREATE POLICY "Admins can view customers" ON public.customers
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert customers" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update customers" ON public.customers
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
