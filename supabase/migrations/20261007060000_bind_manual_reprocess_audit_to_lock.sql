-- ============================================================
-- Migration: 20261007060000_bind_manual_reprocess_audit_to_lock
-- Objetivo: Vincular auditoria de reprocessamento manual atomicamente
--           ao lock distribuido, eliminando bypass por booleano (p_force_bypass).
-- ============================================================

-- 1. Adicionar colunas de consumo unico a tabela de auditoria
ALTER TABLE public.vehicle_provider_manual_reprocess_audit
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS used_by_lock_key TEXT NULL,
  ADD COLUMN IF NOT EXISTS used_by_logical_request_id TEXT NULL;

-- 2. Criar indice parcial para validacao rapida de auditorias nao consumidas
CREATE INDEX IF NOT EXISTS idx_manual_reprocess_audit_validation
ON public.vehicle_provider_manual_reprocess_audit (
  provider,
  operation,
  plate_normalized,
  confirmed_at DESC
)
WHERE used_at IS NULL;

-- 3. Remover assinaturas legadas com p_force_bypass
DROP FUNCTION IF EXISTS public.acquire_vehicle_provider_lock(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS public.acquire_vehicle_provider_lock(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.acquire_vehicle_provider_lock(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, UUID);

-- 4. Criar funcao segura que exige e consome atomicamente a auditoria
CREATE OR REPLACE FUNCTION public.acquire_vehicle_provider_lock(
  p_provider TEXT,
  p_operation TEXT,
  p_plate_normalized TEXT,
  p_logical_request_id TEXT,
  p_locked_by TEXT,
  p_ttl_seconds INTEGER DEFAULT 180,
  p_manual_reprocess_audit_id UUID DEFAULT NULL
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
  v_audit RECORD;
BEGIN
  -- Tenta lock pessimista se a linha ja existir
  SELECT * INTO v_existing
  FROM public.vehicle_provider_locks
  WHERE lock_key = v_lock_key
  FOR UPDATE;

  IF FOUND THEN
    -- Verifica se o lock ainda esta ativo
    IF v_existing.lock_expires_at > v_now THEN
      -- Se for o mesmo logical_request_id, permite reentrada idempotente
      IF v_existing.logical_request_id = p_logical_request_id THEN
        RETURN jsonb_build_object(
          'acquired', true,
          'lock_key', v_lock_key,
          'locked_by', v_existing.locked_by,
          'locked_at', v_existing.locked_at,
          'lock_expires_at', v_existing.lock_expires_at,
          'logical_request_id', v_existing.logical_request_id,
          'idempotent_reentry', true
        );
      END IF;

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
      -- Lock expirou: checar se ha tentativa ambigua nas ultimas 24h
      SELECT id, charge_status, status INTO v_ambiguous
      FROM public.vehicle_provider_attempts
      WHERE provider = p_provider
        AND operation = p_operation
        AND plate_normalized = p_plate_normalized
        AND created_at > (v_now - interval '24 hours')
        AND (
          charge_status = 'unknown'
          OR status IN ('request_sent', 'response_received', 'charge_status_unknown', 'manual_review')
        )
      ORDER BY created_at DESC
      LIMIT 1;

      IF FOUND THEN
        -- Bloquear por padrao caso nao haja auditoria fornecida
        IF p_manual_reprocess_audit_id IS NULL THEN
          RETURN jsonb_build_object(
            'acquired', false,
            'reason', 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED',
            'lock_key', v_lock_key,
            'locked_by', v_existing.locked_by,
            'attempt_id', v_ambiguous.id
          );
        END IF;

        -- Validar auditoria com bloqueio FOR UPDATE
        SELECT * INTO v_audit
        FROM public.vehicle_provider_manual_reprocess_audit
        WHERE id = p_manual_reprocess_audit_id
        FOR UPDATE;

        IF NOT FOUND THEN
          RETURN jsonb_build_object(
            'acquired', false,
            'reason', 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED',
            'lock_key', v_lock_key,
            'error_detail', 'AUDIT_NOT_FOUND'
          );
        END IF;

        -- Validacoes estritas de autorizacao e escopo
        IF v_audit.actor_type <> 'admin'
           OR (v_audit.actor_id IS NULL AND (CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_provider_manual_reprocess_audit' AND column_name='actor_uuid') THEN v_audit.actor_uuid IS NULL ELSE false END))
           OR v_audit.acknowledged_risk IS NOT TRUE
           OR v_audit.provider <> p_provider
           OR v_audit.operation <> p_operation
           OR v_audit.plate_normalized <> p_plate_normalized
           OR v_audit.confirmed_at < (v_now - interval '2 hours')
           OR v_audit.used_at IS NOT NULL
        THEN
          RETURN jsonb_build_object(
            'acquired', false,
            'reason', 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED',
            'lock_key', v_lock_key,
            'error_detail', 'AUDIT_VALIDATION_FAILED'
          );
        END IF;

        -- Consumo atomico unico da auditoria
        UPDATE public.vehicle_provider_manual_reprocess_audit
        SET
          used_at = v_now,
          used_by_lock_key = v_lock_key,
          used_by_logical_request_id = p_logical_request_id
        WHERE id = v_audit.id;
      ELSE
        -- Sem tentativa ambigua: se auditId foi fornecido, consumi-lo atomicamente
        IF p_manual_reprocess_audit_id IS NOT NULL THEN
          SELECT * INTO v_audit
          FROM public.vehicle_provider_manual_reprocess_audit
          WHERE id = p_manual_reprocess_audit_id
          FOR UPDATE;

          IF NOT FOUND OR v_audit.used_at IS NOT NULL OR v_audit.actor_type <> 'admin' THEN
            RETURN jsonb_build_object(
              'acquired', false,
              'reason', 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED',
              'lock_key', v_lock_key,
              'error_detail', 'AUDIT_INVALID_OR_CONSUMED'
            );
          END IF;

          UPDATE public.vehicle_provider_manual_reprocess_audit
          SET
            used_at = v_now,
            used_by_lock_key = v_lock_key,
            used_by_logical_request_id = p_logical_request_id
          WHERE id = v_audit.id;
        END IF;
      END IF;

      -- Recuperacao do lock expirado
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
        'lock_expires_at', v_expires,
        'logical_request_id', p_logical_request_id
      );
    END IF;
  ELSE
    -- Linha de lock inexistente: verificar tentativa ambigua pre-existente
    SELECT id, charge_status, status INTO v_ambiguous
    FROM public.vehicle_provider_attempts
    WHERE provider = p_provider
      AND operation = p_operation
      AND plate_normalized = p_plate_normalized
      AND created_at > (v_now - interval '24 hours')
      AND (
        charge_status = 'unknown'
        OR status IN ('request_sent', 'response_received', 'charge_status_unknown', 'manual_review')
      )
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      IF p_manual_reprocess_audit_id IS NULL THEN
        RETURN jsonb_build_object(
          'acquired', false,
          'reason', 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED',
          'lock_key', v_lock_key,
          'locked_by', p_locked_by,
          'attempt_id', v_ambiguous.id
        );
      END IF;

      SELECT * INTO v_audit
      FROM public.vehicle_provider_manual_reprocess_audit
      WHERE id = p_manual_reprocess_audit_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RETURN jsonb_build_object(
          'acquired', false,
          'reason', 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED',
          'lock_key', v_lock_key,
          'error_detail', 'AUDIT_NOT_FOUND'
        );
      END IF;

      IF v_audit.actor_type <> 'admin'
         OR (v_audit.actor_id IS NULL AND (CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_provider_manual_reprocess_audit' AND column_name='actor_uuid') THEN v_audit.actor_uuid IS NULL ELSE false END))
         OR v_audit.acknowledged_risk IS NOT TRUE
         OR v_audit.provider <> p_provider
         OR v_audit.operation <> p_operation
         OR v_audit.plate_normalized <> p_plate_normalized
         OR v_audit.confirmed_at < (v_now - interval '2 hours')
         OR v_audit.used_at IS NOT NULL
      THEN
        RETURN jsonb_build_object(
          'acquired', false,
          'reason', 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED',
          'lock_key', v_lock_key,
          'error_detail', 'AUDIT_VALIDATION_FAILED'
        );
      END IF;

      UPDATE public.vehicle_provider_manual_reprocess_audit
      SET
        used_at = v_now,
        used_by_lock_key = v_lock_key,
        used_by_logical_request_id = p_logical_request_id
      WHERE id = v_audit.id;
    ELSE
      IF p_manual_reprocess_audit_id IS NOT NULL THEN
        SELECT * INTO v_audit
        FROM public.vehicle_provider_manual_reprocess_audit
        WHERE id = p_manual_reprocess_audit_id
        FOR UPDATE;

        IF NOT FOUND OR v_audit.used_at IS NOT NULL OR v_audit.actor_type <> 'admin' THEN
          RETURN jsonb_build_object(
            'acquired', false,
            'reason', 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED',
            'lock_key', v_lock_key,
            'error_detail', 'AUDIT_INVALID_OR_CONSUMED'
          );
        END IF;

        UPDATE public.vehicle_provider_manual_reprocess_audit
        SET
          used_at = v_now,
          used_by_lock_key = v_lock_key,
          used_by_logical_request_id = p_logical_request_id
        WHERE id = v_audit.id;
      END IF;
    END IF;

    -- Inserir novo lock
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
      'lock_expires_at', v_expires,
      'logical_request_id', p_logical_request_id
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.acquire_vehicle_provider_lock(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, UUID) TO service_role;
