-- Migration: 20261007000000_secure_public_motorcycles_and_permissions.sql
-- Objetivo: Arquitetura Segura de Leitura Pública do Catálogo de Motos
-- 1. Criação de view sanitizada public.public_motorcycles com imagens agregadas
-- 2. Criação de view sanitizada public.public_motorcycle_images
-- 3. Revogação de permissões excessivas de escrita e leitura direta em motorcycles e motorcycle_images
-- 4. Garantia de RLS estrita para administração via is_admin()
-- 5. Tratamento de elegibilidade pública (AVAILABLE e SOLD) sem ocultação indevida por published_at

-- ============================================================================
-- 1. PREPARAÇÃO DA TABELA motorcycles E BACKFILL DE PUBLICAÇÃO
-- ============================================================================

-- Garante que a coluna published_at existe
ALTER TABLE public.motorcycles 
  ADD COLUMN IF NOT EXISTS published_at timestamptz DEFAULT now();

-- Backfill: motos ativas (AVAILABLE e SOLD) sem published_at recebem created_at
-- para que não fiquem ocultas silenciosamente
UPDATE public.motorcycles
SET published_at = COALESCE(created_at, now())
WHERE published_at IS NULL 
  AND status IN ('AVAILABLE', 'SOLD');

-- Índices de alta performance para consultas públicas
CREATE INDEX IF NOT EXISTS idx_motorcycles_status_published_at
  ON public.motorcycles (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_motorcycles_featured_status
  ON public.motorcycles (featured, status) 
  WHERE featured = true;

CREATE INDEX IF NOT EXISTS idx_motorcycles_slug_status
  ON public.motorcycles (slug, status);

-- ============================================================================
-- 2. VIEWS PÚBLICAS SANITIZADAS
-- ============================================================================

-- Remove views antigas se existirem
DROP VIEW IF EXISTS public.public_motorcycle_images CASCADE;
DROP VIEW IF EXISTS public.public_motorcycles CASCADE;

-- View principal: public.public_motorcycles
-- Retorna estritamente dados públicos e não confidenciais.
-- NUNCA expõe: license_plate, renavam, chassi, purchase_amount, purchase_date,
-- seller_customer_id, acquisition_agreement_id, ownership_type interno ou delete_url.
CREATE VIEW public.public_motorcycles AS
SELECT
    m.id,
    m.slug,
    m.brand,
    m.model,
    m.version,
    m.year_manufacture,
    m.year_model,
    m.mileage,
    m.engine_capacity,
    m.fuel,
    m.transmission,
    m.color,
    m.price,
    m.description,
    m.status,
    m.featured,
    COALESCE(m.is_repasse, false) AS is_repasse,
    m.published_at,
    m.category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    m.operation_type,
    m.created_at,
    m.updated_at,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', img.id,
            'storage_path', img.storage_path,
            'alt_text', img.alt_text,
            'sort_order', img.sort_order,
            'is_primary', img.is_primary,
            'width', img.width,
            'height', img.height,
            'provider', img.provider,
            'public_url', img.public_url,
            'display_url', img.display_url,
            'thumbnail_url', img.thumbnail_url
          ) ORDER BY img.sort_order ASC, img.created_at ASC
        )
        FROM public.motorcycle_images img
        WHERE img.motorcycle_id = m.id
      ),
      '[]'::json
    ) AS images
FROM public.motorcycles m
LEFT JOIN public.motorcycle_categories c ON c.id = m.category_id
WHERE m.status IN ('AVAILABLE', 'SOLD')
  AND (m.published_at IS NULL OR m.published_at <= now());

COMMENT ON VIEW public.public_motorcycles IS 'Visão pública sanitizada do estoque de motocicletas da AF Veículos. Acessível por anon e authenticated sem expor dados internos sensíveis.';

-- View auxiliar de imagens: public.public_motorcycle_images
CREATE VIEW public.public_motorcycle_images AS
SELECT
    img.id,
    img.motorcycle_id,
    img.storage_path,
    img.alt_text,
    img.sort_order,
    img.is_primary,
    img.width,
    img.height,
    img.provider,
    img.public_url,
    img.display_url,
    img.thumbnail_url,
    img.created_at
FROM public.motorcycle_images img
JOIN public.motorcycles m ON m.id = img.motorcycle_id
WHERE m.status IN ('AVAILABLE', 'SOLD')
  AND (m.published_at IS NULL OR m.published_at <= now());

COMMENT ON VIEW public.public_motorcycle_images IS 'Visão pública sanitizada de imagens de motocicletas vinculadas a veículos disponíveis ou vendidos.';

-- ============================================================================
-- 3. PERMISSÕES E PRIVILÉGIOS (MÍNIMO PRIVILÉGIO)
-- ============================================================================

-- 3.1 Revogar permissões perigosas de escrita das tabelas internas
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.motorcycles
FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.motorcycle_images
FROM anon, authenticated;

-- 3.2 Revogar acesso direto do visitante anônimo às tabelas internas sensíveis
-- O visitante anônimo agora deve consultar exclusivamente as views públicas
REVOKE SELECT
ON TABLE public.motorcycles
FROM anon;

REVOKE SELECT
ON TABLE public.motorcycle_images
FROM anon;

-- 3.3 Conceder SELECT exclusivo nas views públicas para anon, authenticated e service_role
REVOKE ALL ON public.public_motorcycles FROM PUBLIC;
REVOKE ALL ON public.public_motorcycle_images FROM PUBLIC;

GRANT SELECT ON public.public_motorcycles TO anon, authenticated, service_role;
GRANT SELECT ON public.public_motorcycle_images TO anon, authenticated, service_role;

-- Garantir que anon e authenticated não tenham privilégios de mutação nas views
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.public_motorcycles
FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.public_motorcycle_images
FROM anon, authenticated;

-- ============================================================================
-- 4. POLICIES RLS NAS TABELAS INTERNAS
-- ============================================================================

ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycle_images ENABLE ROW LEVEL SECURITY;

-- Limpar policies antigas permissivas se existirem
DROP POLICY IF EXISTS "Public Read Motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "Public Read Images" ON public.motorcycle_images;

-- Políticas administrativas estritas baseadas em public.is_admin()
DROP POLICY IF EXISTS "Admins have full access to motorcycles" ON public.motorcycles;
CREATE POLICY "Admins have full access to motorcycles" 
ON public.motorcycles
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to motorcycle_images" ON public.motorcycle_images;
CREATE POLICY "Admins have full access to motorcycle_images" 
ON public.motorcycle_images
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 5. NOTIFICAÇÃO DO POSTGREST PARA RECARREGAR SCHEMA CACHE
-- ============================================================================

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
