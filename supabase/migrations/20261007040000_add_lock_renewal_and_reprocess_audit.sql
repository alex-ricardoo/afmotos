-- ============================================================
-- Migration: 20261007040000_add_lock_renewal_and_reprocess_audit
-- Bloqueadores 5, 7: Lock renewal RPC, ambiguous attempt guard RPC,
--                    tabela de auditoria de reprocessamento manual.
-- ============================================================
-- Rollback seguro:
--   DROP FUNCTION public.renew_vehicle_provider_lock(TEXT, TEXT, INTEGER);
--   DROP FUNCTION public.check_ambiguous_provider_attempt(TEXT, TEXT, TEXT);
--   DROP TABLE public.vehicle_provider_manual_reprocess_audit;
-- ============================================================

-- 1. Lock Renewal RPC: renova lease apenas se o owner e lock coincidem e ainda está ativo
CREATE OR REPLACE FUNCTION public.renew_vehicle_provider_lock(
  p_lock_key TEXT,
  p_locked_by TEXT,
  p_ttl_seconds INTEGER DEFAULT 180
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_new_expires TIMESTAMPTZ := v_now + (p_ttl_seconds || ' seconds')::interval;
  v_updated INTEGER;
BEGIN
  UPDATE public.vehicle_provider_locks
  SET
    lock_expires_at = v_new_expires,
    updated_at = v_now
  WHERE lock_key = p_lock_key
    AND locked_by = p_locked_by
    AND lock_expires_at > v_now;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RETURN jsonb_build_object(
      'renewed', true,
      'lock_key', p_lock_key,
      'locked_by', p_locked_by,
      'new_expires_at', v_new_expires
    );
  ELSE
    RETURN jsonb_build_object(
      'renewed', false,
      'lock_key', p_lock_key,
      'locked_by', p_locked_by,
      'reason', 'LOCK_NOT_HELD_OR_EXPIRED'
    );
  END IF;
END;
$$;

-- 2. Ambiguous attempt guard RPC: verifica se existe tentativa recente ambígua
--    que bloqueia nova consulta automática
CREATE OR REPLACE FUNCTION public.check_ambiguous_provider_attempt(
  p_provider TEXT,
  p_operation TEXT,
  p_plate_normalized TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attempt RECORD;
BEGIN
  -- Procura a tentativa mais recente para provider/operation/plate nos últimos 24h
  SELECT id, status, charge_status, logical_request_id, physical_request_id,
         request_sent_at, created_at
  INTO v_attempt
  FROM public.vehicle_provider_attempts
  WHERE provider = p_provider
    AND operation = p_operation
    AND plate_normalized = p_plate_normalized
    AND created_at > (clock_timestamp() - interval '24 hours')
    AND status IN ('request_sent', 'response_received', 'charge_status_unknown', 'manual_review')
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'has_ambiguous_attempt', true,
      'attempt_id', v_attempt.id,
      'status', v_attempt.status,
      'charge_status', v_attempt.charge_status,
      'logical_request_id', v_attempt.logical_request_id,
      'physical_request_id', v_attempt.physical_request_id,
      'request_sent_at', v_attempt.request_sent_at,
      'created_at', v_attempt.created_at
    );
  ELSE
    RETURN jsonb_build_object(
      'has_ambiguous_attempt', false
    );
  END IF;
END;
$$;

-- 3. Tabela de auditoria de reprocessamento manual
CREATE TABLE IF NOT EXISTS public.vehicle_provider_manual_reprocess_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'admin' CHECK (actor_type IN ('admin', 'system')),
  action TEXT NOT NULL DEFAULT 'manual_reprocess_confirmed',
  previous_attempt_id UUID NULL REFERENCES public.vehicle_provider_attempts(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'apibrasil',
  operation TEXT NOT NULL DEFAULT 'veiculos-total',
  plate_normalized TEXT NOT NULL,
  reason TEXT NOT NULL,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 3000,
  acknowledged_risk BOOLEAN NOT NULL DEFAULT false,
  logical_request_id TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_manual_reprocess_audit_plate
  ON public.vehicle_provider_manual_reprocess_audit (plate_normalized);

CREATE INDEX IF NOT EXISTS idx_manual_reprocess_audit_actor
  ON public.vehicle_provider_manual_reprocess_audit (actor_id);

CREATE INDEX IF NOT EXISTS idx_manual_reprocess_audit_created
  ON public.vehicle_provider_manual_reprocess_audit (created_at);

-- 4. Índices adicionais para vehicle_provider_attempts (consultas de guarda)
CREATE INDEX IF NOT EXISTS idx_provider_attempts_provider_op_plate
  ON public.vehicle_provider_attempts (provider, operation, plate_normalized, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_attempts_request_sent_at
  ON public.vehicle_provider_attempts (request_sent_at);

-- 5. RLS para tabela de auditoria
ALTER TABLE public.vehicle_provider_manual_reprocess_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view reprocess audit" ON public.vehicle_provider_manual_reprocess_audit;
CREATE POLICY "Admins can view reprocess audit"
  ON public.vehicle_provider_manual_reprocess_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.auth_user_id = auth.uid()
        AND admin_profiles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Service role can insert reprocess audit" ON public.vehicle_provider_manual_reprocess_audit;
CREATE POLICY "Service role can insert reprocess audit"
  ON public.vehicle_provider_manual_reprocess_audit FOR INSERT
  WITH CHECK (true);

-- 6. Privilégios explícitos para novas RPCs
REVOKE ALL ON FUNCTION public.renew_vehicle_provider_lock(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.renew_vehicle_provider_lock(TEXT, TEXT, INTEGER) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.check_ambiguous_provider_attempt(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_ambiguous_provider_attempt(TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
