-- Migration: Enhance Sales Table and Receipt System
-- Date: 2026-08-23

-- 1. Create or alter sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id uuid NOT NULL REFERENCES public.motorcycles(id) ON DELETE CASCADE,
  sale_price numeric(12,2) NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  buyer_name text,
  buyer_phone text,
  buyer_email text,
  buyer_document text,
  buyer_address text,
  payment_method text,
  payment_status text DEFAULT 'PAID',
  amount_paid numeric(12,2) DEFAULT 0,
  receipt_number text,
  receipt_notes text,
  consignment_id uuid REFERENCES public.consignments(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure all columns exist on sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_name text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_phone text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_email text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_document text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_address text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PAID';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS amount_paid numeric(12,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS receipt_number text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS receipt_notes text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS consignment_id uuid REFERENCES public.consignments(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Indexes on sales table
CREATE INDEX IF NOT EXISTS idx_sales_motorcycle ON public.sales(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_receipt_number ON public.sales(receipt_number) WHERE receipt_number IS NOT NULL;

-- 2. Create or verify site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'AF Motos',
  whatsapp_phone text NOT NULL DEFAULT '',
  contact_email text DEFAULT '',
  address text DEFAULT '',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default site_settings row if table is empty
INSERT INTO public.site_settings (site_name, whatsapp_phone, contact_email, address, settings)
SELECT 'AF Motos', '11999999999', 'contato@afmotos.com.br', 'São Paulo, SP', '{"short_name": "AF Motos", "slogan": "As melhores motos seminovas e premium"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

-- 3. RLS for sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view sales" ON public.sales;
CREATE POLICY "Admins can view sales" ON public.sales
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert sales" ON public.sales;
CREATE POLICY "Admins can insert sales" ON public.sales
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update sales" ON public.sales;
CREATE POLICY "Admins can update sales" ON public.sales
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;
CREATE POLICY "Admins can delete sales" ON public.sales
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 4. RLS for site_settings table
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings" ON public.site_settings
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can insert site_settings" ON public.site_settings;
CREATE POLICY "Admins can insert site_settings" ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update site_settings" ON public.site_settings;
CREATE POLICY "Admins can update site_settings" ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
