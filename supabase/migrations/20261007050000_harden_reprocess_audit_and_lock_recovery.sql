-- ============================================================
-- Migration: 20261007050000_harden_reprocess_audit_and_lock_recovery
-- Bloqueadores 3, 4, 5:
--   - Harden RLS para auditoria de reprocessamento (apenas service_role)
--   - Integridade referencial para actor_id
--   - Guarda de ambiguidade na recuperacao de lock expirado
-- ============================================================

-- 1. Refatorar schema de auditoria: actor_id para UUID e foreign key
ALTER TABLE public.vehicle_provider_manual_reprocess_audit
  ALTER COLUMN actor_id DROP NOT NULL;

ALTER TABLE public.vehicle_provider_manual_reprocess_audit
  ALTER COLUMN actor_id TYPE UUID USING (
    CASE WHEN actor_type = 'admin' THEN actor_id::UUID ELSE NULL END
  );

ALTER TABLE public.vehicle_provider_manual_reprocess_audit
  ADD CONSTRAINT fk_manual_reprocess_actor
  FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.vehicle_provider_manual_reprocess_audit
  ADD CONSTRAINT chk_actor_id_required_for_admin CHECK (
    (actor_type = 'admin' AND actor_id IS NOT NULL) OR
    (actor_type = 'system')
  );

-- 2. Harden RLS na tabela de auditoria (Bloqueador 3)
DROP POLICY IF EXISTS "Service role can insert reprocess audit" ON public.vehicle_provider_manual_reprocess_audit;

CREATE POLICY "Service role can insert reprocess audit"
  ON public.vehicle_provider_manual_reprocess_audit FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. Atualizar acquire_vehicle_provider_lock para verificar tentativas ambiguas ao recuperar
CREATE OR REPLACE FUNCTION public.acquire_vehicle_provider_lock(
  p_provider TEXT,
  p_operation TEXT,
  p_plate_normalized TEXT,
  p_logical_request_id TEXT,
  p_locked_by TEXT,
  p_ttl_seconds INTEGER DEFAULT 180,
  p_force_bypass BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lock_key TEXT := p_provider || ':' || p_operation || ':' || p_plate_normalized;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_expires TIMESTAMPTZ := v_now + (p_ttl_seconds || ' seconds')::interval;
  v_existing RECORD;
  v_ambiguous RECORD;
BEGIN
  -- Tenta lock pessimista se a linha ja existir
  SELECT * INTO v_existing
  FROM public.vehicle_provider_locks
  WHERE lock_key = v_lock_key
  FOR UPDATE;

  IF FOUND THEN
    -- Verifica se o lock ainda esta ativo
    IF v_existing.lock_expires_at > v_now THEN
      -- Lock ativo mantido por outra execucao
      RETURN jsonb_build_object(
        'acquired', false,
        'reason', 'ACTIVE_LOCK',
        'lock_key', v_lock_key,
        'locked_by', v_existing.locked_by,
        'locked_at', v_existing.locked_at,
        'lock_expires_at', v_existing.lock_expires_at,
        'logical_request_id', v_existing.logical_request_id
      );
    ELSE
      -- Lock expirou: MAS antes de recuperar, devemos checar se ha uma tentativa ambigua pendente.
      SELECT id, charge_status, status INTO v_ambiguous
      FROM public.vehicle_provider_attempts
      WHERE provider = p_provider
        AND operation = p_operation
        AND plate_normalized = p_plate_normalized
        AND created_at > (v_now - interval '24 hours')
        AND status IN ('request_sent', 'response_received', 'charge_status_unknown', 'manual_review')
      ORDER BY created_at DESC
      LIMIT 1;

      -- Se a tentativa mais recente tem charge_status_unknown ou status charge_status_unknown, bloqueamos
      IF NOT p_force_bypass THEN
        IF FOUND AND (v_ambiguous.charge_status = 'unknown' OR v_ambiguous.status IN ('charge_status_unknown', 'manual_review')) THEN
          RETURN jsonb_build_object(
            'acquired', false,
            'reason', 'AMBIGUOUS_ATTEMPT_PENDING',
            'lock_key', v_lock_key,
            'locked_by', v_existing.locked_by,
            'attempt_id', v_ambiguous.id
          );
        END IF;
      END IF;

      -- Sem ambiguidade: recuperacao controlada de lease abandonado
      UPDATE public.vehicle_provider_locks
      SET
        logical_request_id = p_logical_request_id,
        locked_by = p_locked_by,
        locked_at = v_now,
        lock_expires_at = v_expires,
        updated_at = v_now
      WHERE lock_key = v_lock_key;

      RETURN jsonb_build_object(
        'acquired', true,
        'recovered_expired', true,
        'lock_key', v_lock_key,
        'locked_by', p_locked_by,
        'lock_expires_at', v_expires
      );
    END IF;
  ELSE
    IF NOT p_force_bypass THEN
      SELECT id, charge_status, status INTO v_ambiguous
      FROM public.vehicle_provider_attempts
      WHERE provider = p_provider
        AND operation = p_operation
        AND plate_normalized = p_plate_normalized
        AND created_at > (v_now - interval '24 hours')
        AND status IN ('request_sent', 'response_received', 'charge_status_unknown', 'manual_review')
      ORDER BY created_at DESC
      LIMIT 1;

      IF FOUND AND (v_ambiguous.charge_status = 'unknown' OR v_ambiguous.status IN ('charge_status_unknown', 'manual_review')) THEN
        RETURN jsonb_build_object(
          'acquired', false,
          'reason', 'AMBIGUOUS_ATTEMPT_PENDING',
          'lock_key', v_lock_key,
          'locked_by', p_locked_by,
          'attempt_id', v_ambiguous.id
        );
      END IF;
    END IF;

    -- Nao existe, insere novo lock
    INSERT INTO public.vehicle_provider_locks (
      lock_key,
      provider,
      operation,
      plate_normalized,
      logical_request_id,
      locked_by,
      locked_at,
      lock_expires_at,
      created_at,
      updated_at
    ) VALUES (
      v_lock_key,
      p_provider,
      p_operation,
      p_plate_normalized,
      p_logical_request_id,
      p_locked_by,
      v_now,
      v_expires,
      v_now,
      v_now
    );

    RETURN jsonb_build_object(
      'acquired', true,
      'recovered_expired', false,
      'lock_key', v_lock_key,
      'locked_by', p_locked_by,
      'lock_expires_at', v_expires
    );
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    -- Corrida de insercao concorrente
    SELECT * INTO v_existing
    FROM public.vehicle_provider_locks
    WHERE lock_key = v_lock_key;

    RETURN jsonb_build_object(
      'acquired', false,
      'reason', 'ACTIVE_LOCK',
      'lock_key', v_lock_key,
      'locked_by', v_existing.locked_by,
      'locked_at', v_existing.locked_at,
      'lock_expires_at', v_existing.lock_expires_at,
      'logical_request_id', v_existing.logical_request_id
    );
END;
$$;

-- Reload postgrest schema
NOTIFY pgrst, 'reload schema';
