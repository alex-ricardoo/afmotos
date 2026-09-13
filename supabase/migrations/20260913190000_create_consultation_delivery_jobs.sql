-- ============================================================
-- Migration: 20260913190000_create_consultation_delivery_jobs
-- Description: Create persistent queue table, partial indexes,
--              RLS policies, and atomic claim RPC for vehicle report delivery.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.consultation_delivery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.customer_plate_consultations(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'vehicle_report_delivery',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'retry_scheduled', 'failed_permanent')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ NULL,
  locked_by TEXT NULL,
  lock_expires_at TIMESTAMPTZ NULL,
  provider TEXT NOT NULL DEFAULT 'apibrasil',
  last_error_code TEXT NULL,
  last_error_message_safe TEXT NULL,
  last_http_status INTEGER NULL,
  last_failure_class TEXT NULL CHECK (last_failure_class IS NULL OR last_failure_class IN ('transient', 'permanent', 'unknown')),
  last_attempt_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  failed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante no máximo 1 job ativo por consulta
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_delivery_job_per_consultation
  ON public.consultation_delivery_jobs (consultation_id)
  WHERE (status IN ('pending', 'processing', 'retry_scheduled'));

-- Índices de busca para worker/cron
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_polling
  ON public.consultation_delivery_jobs (status, next_retry_at)
  WHERE (status IN ('pending', 'retry_scheduled'));

CREATE INDEX IF NOT EXISTS idx_delivery_jobs_locked
  ON public.consultation_delivery_jobs (locked_at)
  WHERE (status = 'processing');

CREATE INDEX IF NOT EXISTS idx_delivery_jobs_transaction
  ON public.consultation_delivery_jobs (transaction_id);

-- Trigger de updated_at automático
DROP TRIGGER IF EXISTS update_consultation_delivery_jobs_updated_at ON public.consultation_delivery_jobs;
CREATE TRIGGER update_consultation_delivery_jobs_updated_at
  BEFORE UPDATE ON public.consultation_delivery_jobs
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Habilita Row Level Security (RLS)
ALTER TABLE public.consultation_delivery_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view delivery jobs" ON public.consultation_delivery_jobs;
CREATE POLICY "Admins can view delivery jobs"
  ON public.consultation_delivery_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.is_active = true
    )
  );

-- Stored Procedure: Atomic Job Claim (Lock Pessimista Concorrente)
CREATE OR REPLACE FUNCTION public.claim_next_delivery_jobs(
  p_worker_id TEXT,
  p_batch_size INTEGER DEFAULT 5,
  p_lock_duration_seconds INTEGER DEFAULT 300
)
RETURNS SETOF public.consultation_delivery_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_expires TIMESTAMPTZ := v_now + (p_lock_duration_seconds || ' seconds')::interval;
BEGIN
  RETURN QUERY
  WITH claimable AS (
    SELECT id
    FROM public.consultation_delivery_jobs
    WHERE
      (
        (status IN ('pending', 'retry_scheduled') AND next_retry_at <= v_now)
        OR
        (status = 'processing' AND lock_expires_at < v_now) -- Recupera job abandonado por lease expirado
      )
    ORDER BY next_retry_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.consultation_delivery_jobs j
  SET
    status = 'processing',
    locked_at = v_now,
    locked_by = p_worker_id,
    lock_expires_at = v_expires,
    last_attempt_at = v_now,
    attempt_count = j.attempt_count + 1,
    updated_at = v_now
  FROM claimable
  WHERE j.id = claimable.id
  RETURNING j.*;
END;
$$;
