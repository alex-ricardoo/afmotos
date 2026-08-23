-- Migration: 20260822193000_enhance_sell_request_form.sql
-- Objetivo: Garantir todas as colunas de anúncio de motocicleta, localização (PE e cidade),
-- dados de cotação FIPE em segundo plano, nulabilidade de license_plate/email
-- e persistência estruturada de fotos em sell_request_images.

-- 1. Garantir colunas base e novas em sell_requests
ALTER TABLE public.sell_requests
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS year_manufacture integer,
  ADD COLUMN IF NOT EXISTS year_model integer,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS photos text[],
  ADD COLUMN IF NOT EXISTS state text DEFAULT 'PE',
  ADD COLUMN IF NOT EXISTS city text;

-- Permitir license_plate e email serem nulos caso a tabela tenha sido criada com NOT NULL
DO $$
BEGIN
  -- Remover NOT NULL de license_plate se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'sell_requests' 
      AND column_name = 'license_plate' 
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.sell_requests ALTER COLUMN license_plate DROP NOT NULL;
  END IF;

  -- Remover NOT NULL de motorcycle_data se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'sell_requests' 
      AND column_name = 'motorcycle_data' 
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.sell_requests ALTER COLUMN motorcycle_data DROP NOT NULL;
  END IF;
END $$;

-- 2. Colunas de Cotação FIPE em sell_requests
ALTER TABLE public.sell_requests
  ADD COLUMN IF NOT EXISTS fipe_provider text,
  ADD COLUMN IF NOT EXISTS fipe_vehicle_type_id text,
  ADD COLUMN IF NOT EXISTS fipe_brand_id text,
  ADD COLUMN IF NOT EXISTS fipe_brand_name text,
  ADD COLUMN IF NOT EXISTS fipe_model_id text,
  ADD COLUMN IF NOT EXISTS fipe_model_name text,
  ADD COLUMN IF NOT EXISTS fipe_year_id text,
  ADD COLUMN IF NOT EXISTS fipe_year_label text,
  ADD COLUMN IF NOT EXISTS fipe_fuel_id text,
  ADD COLUMN IF NOT EXISTS fipe_fuel_name text,
  ADD COLUMN IF NOT EXISTS fipe_code text,
  ADD COLUMN IF NOT EXISTS fipe_price numeric(12, 2),
  ADD COLUMN IF NOT EXISTS fipe_reference_period text,
  ADD COLUMN IF NOT EXISTS fipe_queried_at timestamptz,
  ADD COLUMN IF NOT EXISTS fipe_snapshot jsonb;

-- 3. Constraints Seguras (verificando existência para idempotência)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sell_requests_fipe_price_nonnegative'
  ) THEN
    ALTER TABLE public.sell_requests
      ADD CONSTRAINT sell_requests_fipe_price_nonnegative
      CHECK (fipe_price IS NULL OR fipe_price >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sell_requests_state_pe'
  ) THEN
    ALTER TABLE public.sell_requests
      ADD CONSTRAINT sell_requests_state_pe
      CHECK (state IS NULL OR state = 'PE');
  END IF;
END $$;

-- 4. Garantir Tabela sell_request_images e metadados
CREATE TABLE IF NOT EXISTS public.sell_request_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sell_request_id uuid NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
  storage_path text,
  provider text NOT NULL DEFAULT 'supabase',
  public_url text NOT NULL,
  delete_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS em sell_requests e sell_request_images
ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_request_images ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sell_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sell_requests' AND policyname = 'Public Insert Sell Requests'
  ) THEN
    CREATE POLICY "Public Insert Sell Requests" ON public.sell_requests FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sell_requests' AND policyname = 'Admin Full Access sell_requests'
  ) THEN
    CREATE POLICY "Admin Full Access sell_requests" ON public.sell_requests FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Políticas RLS para sell_request_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sell_request_images' AND policyname = 'Public Insert Sell Request Images'
  ) THEN
    CREATE POLICY "Public Insert Sell Request Images" ON public.sell_request_images FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sell_request_images' AND policyname = 'Admin Full Access sell_request_images'
  ) THEN
    CREATE POLICY "Admin Full Access sell_request_images" ON public.sell_request_images FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 5. Índices de performance
CREATE INDEX IF NOT EXISTS idx_sell_requests_city ON public.sell_requests(city);
CREATE INDEX IF NOT EXISTS idx_sell_requests_state ON public.sell_requests(state);
CREATE INDEX IF NOT EXISTS idx_sell_request_images_request_id ON public.sell_request_images(sell_request_id);
CREATE INDEX IF NOT EXISTS idx_sell_request_images_sort_order ON public.sell_request_images(sort_order);
