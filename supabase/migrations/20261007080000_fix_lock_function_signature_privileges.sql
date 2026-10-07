-- ============================================================
-- Migration: 20261007080000_fix_lock_function_signature_privileges
-- Objetivo: Corrigir privilégios da função de lock com 7 parâmetros
--           e garantir privilégios explícitos para todas as RPCs
--           de concorrência e guarda (REVOKE PUBLIC/anon, GRANT authenticated/service_role).
-- ============================================================

-- 1. Assinatura atual de 7 parâmetros de acquire_vehicle_provider_lock
REVOKE ALL ON FUNCTION public.acquire_vehicle_provider_lock(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  UUID
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.acquire_vehicle_provider_lock(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  UUID
) FROM anon;

GRANT EXECUTE ON FUNCTION public.acquire_vehicle_provider_lock(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  UUID
) TO authenticated, service_role;

-- 2. Confirmar privilégios para release_vehicle_provider_lock(TEXT, TEXT)
REVOKE ALL ON FUNCTION public.release_vehicle_provider_lock(
  TEXT,
  TEXT
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.release_vehicle_provider_lock(
  TEXT,
  TEXT
) FROM anon;

GRANT EXECUTE ON FUNCTION public.release_vehicle_provider_lock(
  TEXT,
  TEXT
) TO authenticated, service_role;

-- 3. Confirmar privilégios para renew_vehicle_provider_lock(TEXT, TEXT, INTEGER)
REVOKE ALL ON FUNCTION public.renew_vehicle_provider_lock(
  TEXT,
  TEXT,
  INTEGER
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.renew_vehicle_provider_lock(
  TEXT,
  TEXT,
  INTEGER
) FROM anon;

GRANT EXECUTE ON FUNCTION public.renew_vehicle_provider_lock(
  TEXT,
  TEXT,
  INTEGER
) TO authenticated, service_role;

-- 4. Confirmar privilégios para check_ambiguous_provider_attempt(TEXT, TEXT, TEXT)
REVOKE ALL ON FUNCTION public.check_ambiguous_provider_attempt(
  TEXT,
  TEXT,
  TEXT
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.check_ambiguous_provider_attempt(
  TEXT,
  TEXT,
  TEXT
) FROM anon;

GRANT EXECUTE ON FUNCTION public.check_ambiguous_provider_attempt(
  TEXT,
  TEXT,
  TEXT
) TO authenticated, service_role;

-- 5. Query de documentação e validação de privilégios reais
-- Pode ser executada no SQL Editor do Supabase para verificar conformidade:
/*
SELECT
  routine_schema,
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN (
    'acquire_vehicle_provider_lock',
    'release_vehicle_provider_lock',
    'renew_vehicle_provider_lock',
    'check_ambiguous_provider_attempt'
  )
ORDER BY routine_name, grantee, privilege_type;
*/

-- 6. Notificar PostgREST para recarregar o cache de schema
NOTIFY pgrst, 'reload schema';
