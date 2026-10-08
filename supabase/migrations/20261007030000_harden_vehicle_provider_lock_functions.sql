-- ============================================================
-- Migration: 20261007030000_harden_vehicle_provider_lock_functions
-- Bloqueadores 2 e 3: SECURITY DEFINER com search_path vazio
--                     e privilégios explícitos (revoke PUBLIC).
-- ============================================================
-- Rollback seguro:
--   Recriar as funções SEM SET search_path = '' (versão anterior
--   na migration 20261007020000) e conceder EXECUTE a PUBLIC novamente.
-- ============================================================

-- 1. Recriar acquire_vehicle_provider_lock com search_path fixo
CREATE OR REPLACE FUNCTION public.acquire_vehicle_provider_lock(
  p_provider TEXT,
  p_operation TEXT,
  p_plate_normalized TEXT,
  p_logical_request_id TEXT,
  p_locked_by TEXT,
  p_ttl_seconds INTEGER DEFAULT 180
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
BEGIN
  -- Tenta lock pessimista se a linha já existir
  SELECT * INTO v_existing
  FROM public.vehicle_provider_locks
  WHERE lock_key = v_lock_key
  FOR UPDATE;

  IF FOUND THEN
    -- Verifica se o lock ainda está ativo
    IF v_existing.lock_expires_at > v_now THEN
      -- Lock ativo mantido por outra execução
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
      -- Lock expirou: recuperação controlada de lease abandonado
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
    -- Não existe, insere novo lock
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
    -- Corrida de inserção concorrente
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

-- 2. Recriar release_vehicle_provider_lock com search_path fixo
CREATE OR REPLACE FUNCTION public.release_vehicle_provider_lock(
  p_lock_key TEXT,
  p_locked_by TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.vehicle_provider_locks
  WHERE lock_key = p_lock_key
    AND locked_by = p_locked_by;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

-- 3. Privilégios explícitos: revogar PUBLIC, conceder apenas authenticated e service_role
REVOKE ALL ON FUNCTION public.acquire_vehicle_provider_lock(
  TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.release_vehicle_provider_lock(
  TEXT, TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.acquire_vehicle_provider_lock(
  TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER
) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.release_vehicle_provider_lock(
  TEXT, TEXT
) TO authenticated, service_role;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
