-- ============================================================
-- Migration: 20261007020000_create_vehicle_provider_locks_and_attempts
-- Description: Distributed locking and audit attempts table for API Brasil
--              "Veiculos Total" to eliminate duplicate billable queries.
-- ============================================================

-- 1. Table: vehicle_provider_locks
-- Distributed mutex across serverless instances keyed by provider:operation:plate_normalized
CREATE TABLE IF NOT EXISTS public.vehicle_provider_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'apibrasil',
  operation TEXT NOT NULL DEFAULT 'veiculos-total',
  plate_normalized TEXT NOT NULL,
  logical_request_id TEXT NOT NULL,
  locked_by TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  lock_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_provider_locks_plate
  ON public.vehicle_provider_locks (plate_normalized);

CREATE INDEX IF NOT EXISTS idx_vehicle_provider_locks_expires
  ON public.vehicle_provider_locks (lock_expires_at);

-- 2. Stored Procedure: Atomic Lock Acquisition with Controlled Expiration Recovery
CREATE OR REPLACE FUNCTION public.acquire_vehicle_provider_lock(
  p_provider TEXT,
  p_operation TEXT,
  p_plate_normalized TEXT,
  p_logical_request_id TEXT,
  p_locked_by TEXT,
  p_ttl_seconds INTEGER DEFAULT 150
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3. Stored Procedure: Atomic Lock Release (Only by Correct Owner)
CREATE OR REPLACE FUNCTION public.release_vehicle_provider_lock(
  p_lock_key TEXT,
  p_locked_by TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 4. Table: vehicle_provider_attempts
-- Physical attempt audit table recorded BEFORE external request dispatch
CREATE TABLE IF NOT EXISTS public.vehicle_provider_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NULL REFERENCES public.vehicle_plate_consultations(id) ON DELETE SET NULL,
  customer_consultation_id UUID NULL REFERENCES public.customer_plate_consultations(id) ON DELETE SET NULL,
  delivery_job_id UUID NULL REFERENCES public.consultation_delivery_jobs(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'apibrasil',
  operation TEXT NOT NULL DEFAULT 'veiculos-total',
  plate_normalized TEXT NOT NULL,
  logical_request_id TEXT NOT NULL,
  physical_request_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (
    status IN (
      'created',
      'locked',
      'request_sent',
      'response_received',
      'succeeded',
      'failed',
      'timed_out',
      'charge_status_unknown',
      'deduplicated',
      'blocked',
      'manual_review'
    )
  ),
  charge_status TEXT NOT NULL CHECK (
    charge_status IN (
      'not_sent',
      'not_incurred',
      'incurred',
      'unknown',
      'refunded',
      'disputed'
    )
  ),
  request_started_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  request_sent_at TIMESTAMPTZ NULL,
  response_received_at TIMESTAMPTZ NULL,
  finished_at TIMESTAMPTZ NULL,
  duration_ms INTEGER NULL,
  timeout_ms INTEGER NOT NULL,
  http_status INTEGER NULL,
  provider_error_code TEXT NULL,
  provider_message_safe TEXT NULL,
  provider_request_reference TEXT NULL,
  estimated_cost_cents INTEGER NULL,
  actual_cost_cents INTEGER NULL,
  environment TEXT NOT NULL,
  deployment_id TEXT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_provider_attempts_plate
  ON public.vehicle_provider_attempts (plate_normalized);

CREATE INDEX IF NOT EXISTS idx_provider_attempts_logical_req
  ON public.vehicle_provider_attempts (logical_request_id);

CREATE INDEX IF NOT EXISTS idx_provider_attempts_idempotency
  ON public.vehicle_provider_attempts (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_provider_attempts_status
  ON public.vehicle_provider_attempts (status);

CREATE INDEX IF NOT EXISTS idx_provider_attempts_charge_status
  ON public.vehicle_provider_attempts (charge_status);

-- 5. Expand delivery job status constraints to allow manual_review and charge_status_unknown if needed
ALTER TABLE public.consultation_delivery_jobs
  DROP CONSTRAINT IF EXISTS consultation_delivery_jobs_status_check;

ALTER TABLE public.consultation_delivery_jobs
  ADD CONSTRAINT consultation_delivery_jobs_status_check
  CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'retry_scheduled',
    'failed_permanent',
    'manual_review',
    'charge_status_unknown'
  ));

-- 6. Row Level Security
ALTER TABLE public.vehicle_provider_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_provider_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view provider locks" ON public.vehicle_provider_locks;
CREATE POLICY "Admins can view provider locks"
  ON public.vehicle_provider_locks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.auth_user_id = auth.uid()
        AND admin_profiles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view provider attempts" ON public.vehicle_provider_attempts;
CREATE POLICY "Admins can view provider attempts"
  ON public.vehicle_provider_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.auth_user_id = auth.uid()
        AND admin_profiles.is_active = true
    )
  );
