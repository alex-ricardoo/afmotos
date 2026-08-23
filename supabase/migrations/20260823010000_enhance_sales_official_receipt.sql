-- Migration: Official Receipt & Extended Fiscal/Cadastral Fields for Sales and Motorcycles
-- Date: 2026-08-23
-- Feature: 010-venda-recibo-oficial

-- 1. Extend sales table with fiscal, cadastral and financial fields
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS renavam text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS chassi text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS delivery_km integer;

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS entry_amount numeric(12,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS financed_amount numeric(12,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS trade_amount numeric(12,2) DEFAULT 0;

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS legal_terms_accepted boolean DEFAULT true;

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_cep text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_street text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_number text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_complement text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_neighborhood text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_city text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS buyer_state text;

-- 2. Extend motorcycles table with vehicle identification
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS renavam text;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS chassi text;

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_sales_chassi ON public.sales(chassi);
CREATE INDEX IF NOT EXISTS idx_sales_renavam ON public.sales(renavam);
CREATE INDEX IF NOT EXISTS idx_motorcycles_chassi ON public.motorcycles(chassi);
CREATE INDEX IF NOT EXISTS idx_motorcycles_renavam ON public.motorcycles(renavam);

-- 4. Ensure RLS policies
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
