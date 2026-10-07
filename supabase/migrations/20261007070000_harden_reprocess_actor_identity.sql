-- ============================================================
-- Migration: 20261007070000_harden_reprocess_actor_identity
-- Objetivo: Evolucao segura da identidade de atores em auditoria de reprocessamento.
--           Migra identificadores validos para UUID sem quebrar registros legados.
-- ============================================================

-- 1. Adicionar colunas novas para actor_uuid e preservacao legada
ALTER TABLE public.vehicle_provider_manual_reprocess_audit
  ADD COLUMN IF NOT EXISTS actor_uuid UUID NULL,
  ADD COLUMN IF NOT EXISTS actor_reference_legacy TEXT NULL;

-- 2. Migrar com seguranca usando regex antes do cast para UUID
UPDATE public.vehicle_provider_manual_reprocess_audit
SET actor_uuid = actor_id::UUID
WHERE actor_id IS NOT NULL
  AND actor_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND actor_uuid IS NULL;

-- 3. Preservar identificadores que nao sao UUID em actor_reference_legacy
UPDATE public.vehicle_provider_manual_reprocess_audit
SET actor_reference_legacy = actor_id
WHERE actor_id IS NOT NULL
  AND NOT (actor_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
  AND actor_reference_legacy IS NULL;

-- 4. Indice para consultas por actor_uuid
CREATE INDEX IF NOT EXISTS idx_manual_reprocess_audit_actor_uuid
  ON public.vehicle_provider_manual_reprocess_audit (actor_uuid)
  WHERE actor_uuid IS NOT NULL;

-- 5. Foreign key condicional para auth.users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_manual_reprocess_actor_uuid'
  ) THEN
    ALTER TABLE public.vehicle_provider_manual_reprocess_audit
      ADD CONSTRAINT fk_manual_reprocess_actor_uuid
      FOREIGN KEY (actor_uuid)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Garantir constraint check de actor_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_reprocess_actor_type'
  ) THEN
    ALTER TABLE public.vehicle_provider_manual_reprocess_audit
      ADD CONSTRAINT chk_reprocess_actor_type
      CHECK (actor_type IN ('admin', 'system'));
  END IF;
END $$;

-- 7. Constraint para integridade: admin deve ter identificacao valida
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_reprocess_actor_admin_identity'
  ) THEN
    ALTER TABLE public.vehicle_provider_manual_reprocess_audit
      ADD CONSTRAINT chk_reprocess_actor_admin_identity
      CHECK (
        (actor_type = 'admin' AND (actor_uuid IS NOT NULL OR actor_id IS NOT NULL))
        OR (actor_type = 'system')
      );
  END IF;
END $$;
