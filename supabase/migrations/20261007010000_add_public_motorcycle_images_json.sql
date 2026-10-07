-- Migration: 20261007010000_add_public_motorcycle_images_json.sql
-- Objetivo: Agregar imagens públicas diretamente na view public.public_motorcycles como coluna JSONB
-- sem expor delete_url ou qualquer dado confidencial interno.
-- IMPORTANTE: Não usa DROP VIEW ... CASCADE para preservar dependências.

CREATE OR REPLACE VIEW public.public_motorcycles AS
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
  COALESCE(m.featured, false) AS featured,
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
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', img.id,
          'storage_path', img.storage_path,
          'provider', img.provider,
          'public_url', img.public_url,
          'display_url', img.display_url,
          'thumbnail_url', img.thumbnail_url,
          'sort_order', img.sort_order,
          'is_primary', img.is_primary,
          'alt_text', img.alt_text,
          'created_at', img.created_at
        )
        ORDER BY img.is_primary DESC, img.sort_order ASC, img.created_at ASC
      )
      FROM public.motorcycle_images AS img
      WHERE img.motorcycle_id = m.id
    ),
    '[]'::jsonb
  ) AS images
FROM public.motorcycles AS m
LEFT JOIN public.motorcycle_categories AS c
  ON c.id = m.category_id
WHERE m.status IN ('AVAILABLE', 'SOLD')
  AND (m.published_at IS NULL OR m.published_at <= now());

COMMENT ON VIEW public.public_motorcycles IS 'Visão pública sanitizada do estoque de motocicletas com imagens agregadas em JSONB. Acessível por anon e authenticated sem expor dados internos sensíveis.';

-- Garantir concessão de SELECT para anon e authenticated na view
GRANT SELECT ON public.public_motorcycles TO anon, authenticated, service_role;

-- Notificar PostgREST para recarregar o schema imediatamente
NOTIFY pgrst, 'reload schema';
