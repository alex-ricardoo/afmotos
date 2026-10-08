-- ============================================================
-- Migration: 20261007090000_create_secure_manual_reprocess_audit_rpc
-- Objetivo: Criar RPC segura SECURITY DEFINER para criação de auditoria
--           de reprocessamento manual veicular por administradores ativos.
--           Elimina inserções diretas via cliente autenticado e blinda RLS.
-- ============================================================

-- 1. Criação da função segura SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_manual_vehicle_reprocess_audit(
  p_previous_attempt_id UUID,
  p_provider TEXT,
  p_operation TEXT,
  p_plate_normalized TEXT,
  p_reason TEXT,
  p_estimated_cost_cents INTEGER,
  p_logical_request_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_uuid UUID := auth.uid();
  v_audit_id UUID;
BEGIN
  -- 1. Rejeitar se não houver usuário autenticado na sessão
  IF v_actor_uuid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  -- 2. Rejeitar se usuário não for administrador ativo
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  -- 3. Exigir motivo com pelo menos 10 caracteres úteis
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'MANUAL_REPROCESS_REASON_REQUIRED';
  END IF;

  -- 4. Validações estritas de parâmetros obrigatórios
  IF p_provider IS NULL OR trim(p_provider) = '' THEN
    RAISE EXCEPTION 'PROVIDER_REQUIRED';
  END IF;

  IF p_operation IS NULL OR trim(p_operation) = '' THEN
    RAISE EXCEPTION 'OPERATION_REQUIRED';
  END IF;

  IF p_plate_normalized IS NULL OR trim(p_plate_normalized) = '' THEN
    RAISE EXCEPTION 'PLATE_REQUIRED';
  END IF;

  IF p_logical_request_id IS NULL OR trim(p_logical_request_id) = '' THEN
    RAISE EXCEPTION 'LOGICAL_REQUEST_ID_REQUIRED';
  END IF;

  IF p_estimated_cost_cents IS NULL OR p_estimated_cost_cents < 0 THEN
    RAISE EXCEPTION 'INVALID_ESTIMATED_COST';
  END IF;

  -- 5. Inserir auditoria controlada (caller não pode manipular actor_id, risk ou used_at)
  INSERT INTO public.vehicle_provider_manual_reprocess_audit (
    actor_id,
    actor_uuid,
    actor_type,
    action,
    previous_attempt_id,
    provider,
    operation,
    plate_normalized,
    reason,
    estimated_cost_cents,
    acknowledged_risk,
    logical_request_id,
    confirmed_at
  ) VALUES (
    v_actor_uuid::text,
    v_actor_uuid,
    'admin',
    'manual_reprocess_confirmed',
    p_previous_attempt_id,
    p_provider,
    p_operation,
    p_plate_normalized,
    trim(p_reason),
    p_estimated_cost_cents,
    true,
    p_logical_request_id,
    clock_timestamp()
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- 2. Privilégios explícitos da função: revogar PUBLIC/anon, conceder a authenticated e service_role
REVOKE ALL ON FUNCTION public.create_manual_vehicle_reprocess_audit(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  TEXT
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.create_manual_vehicle_reprocess_audit(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  TEXT
) FROM anon;

GRANT EXECUTE ON FUNCTION public.create_manual_vehicle_reprocess_audit(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  TEXT
) TO authenticated, service_role;

-- 3. Ajuste de RLS da tabela vehicle_provider_manual_reprocess_audit
-- Remover policy de INSERT direta que permitia inserção direta por service_role ou confusa
DROP POLICY IF EXISTS "Service role can insert reprocess audit"
  ON public.vehicle_provider_manual_reprocess_audit;

-- Revogar INSERT, UPDATE, DELETE direto de clientes anon e authenticated
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON TABLE public.vehicle_provider_manual_reprocess_audit
  FROM anon, authenticated;

-- Garantir privilégio de SELECT para usuários autenticados (regido pela policy de RLS) e service_role
GRANT SELECT ON TABLE public.vehicle_provider_manual_reprocess_audit TO authenticated, service_role;

-- Manter SELECT restrito exclusivamente a administradores ativos
DROP POLICY IF EXISTS "Admins can view reprocess audit"
  ON public.vehicle_provider_manual_reprocess_audit;

CREATE POLICY "Admins can view reprocess audit"
  ON public.vehicle_provider_manual_reprocess_audit FOR SELECT
  USING (public.is_admin());

-- 4. Notificar PostgREST para recarregar o cache de schema
NOTIFY pgrst, 'reload schema';
