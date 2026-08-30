-- Migration: Add customer_id foreign keys to related domain tables
-- Feature: 016-cadastro-clientes-crm

-- 1. Sales
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_customer_id
  ON public.sales (customer_id)
  WHERE customer_id IS NOT NULL;

-- 2. Sell Requests
ALTER TABLE public.sell_requests
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sell_requests_customer_id
  ON public.sell_requests (customer_id)
  WHERE customer_id IS NOT NULL;

-- 3. Leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_customer_id
  ON public.leads (customer_id)
  WHERE customer_id IS NOT NULL;

-- 4. Motorcycle Owners
ALTER TABLE public.motorcycle_owners
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_motorcycle_owners_customer_id
  ON public.motorcycle_owners (customer_id)
  WHERE customer_id IS NOT NULL;

-- 5. Consignment Requests (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consignment_requests') THEN
    ALTER TABLE public.consignment_requests
      ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_consignment_requests_customer_id
      ON public.consignment_requests (customer_id)
      WHERE customer_id IS NOT NULL;
  END IF;
END $$;

-- 6. Rentals
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rentals_customer_id
  ON public.rentals (customer_id)
  WHERE customer_id IS NOT NULL;

-- 7. Rental Requests
ALTER TABLE public.rental_requests
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rental_requests_customer_id
  ON public.rental_requests (customer_id)
  WHERE customer_id IS NOT NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
