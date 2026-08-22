-- Migration: 00024_add_external_image_metadata.sql
-- Objetivo: Suportar imagens hospedadas no ImgBB com fallback no Supabase Storage

-- 1. motorcycle_images
ALTER TABLE public.motorcycle_images
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'supabase',
  ADD COLUMN IF NOT EXISTS public_url text,
  ADD COLUMN IF NOT EXISTS display_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS delete_url text;

-- Garantir valor default para registros antigos
UPDATE public.motorcycle_images
SET provider = 'supabase'
WHERE provider IS NULL;

-- 2. sell_request_images (se a tabela existir no schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sell_request_images'
  ) THEN
    ALTER TABLE public.sell_request_images
      ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'supabase',
      ADD COLUMN IF NOT EXISTS public_url text,
      ADD COLUMN IF NOT EXISTS delete_url text;
  END IF;
END $$;

-- 3. consignment_request_images (se a tabela existir no schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'consignment_request_images'
  ) THEN
    ALTER TABLE public.consignment_request_images
      ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'supabase',
      ADD COLUMN IF NOT EXISTS public_url text,
      ADD COLUMN IF NOT EXISTS delete_url text;
  END IF;
END $$;

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_motorcycle_images_provider ON public.motorcycle_images(provider);
