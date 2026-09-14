import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextResponse } from 'next/server';

export interface AdminAuthResult {
  isAuthorized: boolean;
  user?: { id: string; email?: string };
  profile?: { id: string; auth_user_id: string; role: 'admin' | 'super_admin'; name: string };
  errorResponse?: NextResponse;
}

export interface ActiveAdminContext {
  userId: string;
  adminProfileId: string;
  role: 'admin' | 'super_admin';
  name?: string;
  supabase: SupabaseClient;
}

export class AdminAuthorizationError extends Error {
  public code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'INTERNAL_ERROR';
  public statusCode: number;

  constructor(code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'INTERNAL_ERROR', message?: string) {
    super(
      message ||
        (code === 'UNAUTHENTICATED'
          ? 'Não autenticado.'
          : code === 'FORBIDDEN'
            ? 'Acesso restrito a administradores autorizados.'
            : 'Erro interno de autorização.'),
    );
    this.name = 'AdminAuthorizationError';
    this.code = code;
    this.statusCode = code === 'UNAUTHENTICATED' ? 401 : code === 'FORBIDDEN' ? 403 : 500;
  }
}

/**
 * Mask identifier for structured logging without leaking PII or full tokens.
 */
export function maskId(id?: string | null): string {
  if (!id) return 'anonymous';
  if (id.length <= 8) return '***';
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

/**
 * Structured security logging for credit package admin events.
 * Strict rules: No JWTs, cookies, raw tokens, full emails in production, or client PII.
 */
export function logCreditAdminAuthEvent(
  event:
    | 'credit_package.admin_authorization_checked'
    | 'credit_package.admin_authorization_denied'
    | 'credit_package.admin_authorization_granted',
  details: {
    actorUserIdMasked?: string;
    adminProfileIdMasked?: string;
    role?: string;
    isActive?: boolean;
    result: 'authorized' | 'denied';
    reasonCode: string;
  },
): void {
  console.info(
    JSON.stringify({
      tag: '[CREDIT_PACKAGES]',
      event,
      actorUserIdMasked: details.actorUserIdMasked || 'unknown',
      adminProfileIdMasked: details.adminProfileIdMasked || 'unknown',
      role: details.role || 'none',
      isActive: details.isActive ?? false,
      result: details.result,
      reasonCode: details.reasonCode,
      timestamp: new Date().toISOString(),
    }),
  );
}

/**
 * Valida se um usuário possui cadastro ativo de administrador no banco.
 * Garante que admin_profiles.auth_user_id = auth.uid() e is_active = true.
 */
export async function checkAdminProfileAccess(
  supabaseClient: SupabaseClient,
  authUserId?: string | null,
): Promise<{ isAuthorized: boolean; profile?: AdminAuthResult['profile'] }> {
  if (!authUserId) return { isAuthorized: false };

  const { data: adminProfile, error } = await supabaseClient
    .from('admin_profiles')
    .select('id, auth_user_id, role, name, is_active')
    .eq('auth_user_id', authUserId)
    .eq('is_active', true)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (error || !adminProfile) {
    return { isAuthorized: false };
  }

  return { isAuthorized: true, profile: adminProfile as AdminAuthResult['profile'] };
}

/**
 * Centralized server helper to enforce active admin permissions.
 *
 * Flow:
 * 1. Obtains Supabase client bound to incoming request session/cookies.
 * 2. Fetches user with supabase.auth.getUser(). If missing, throws AdminAuthorizationError('UNAUTHENTICATED').
 * 3. Queries public.admin_profiles with:
 *    .eq('auth_user_id', user.id)
 *    .eq('is_active', true)
 *    .in('role', ['admin', 'super_admin'])
 * 4. If not found or inactive, throws AdminAuthorizationError('FORBIDDEN').
 * 5. Logs structured security events without leaking sensitive credentials.
 */
export async function requireActiveAdmin(
  customClient?: SupabaseClient,
): Promise<ActiveAdminContext> {
  let supabase: SupabaseClient;
  if (customClient) {
    supabase = customClient;
  } else {
    const { createClient } = await import('../supabase/server.ts');
    supabase = await createClient();
  }

  logCreditAdminAuthEvent('credit_package.admin_authorization_checked', {
    result: 'denied',
    reasonCode: 'CHECK_INITIATED',
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logCreditAdminAuthEvent('credit_package.admin_authorization_denied', {
      result: 'denied',
      reasonCode: 'UNAUTHENTICATED',
    });
    throw new AdminAuthorizationError('UNAUTHENTICATED');
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from('admin_profiles')
    .select('id, auth_user_id, role, name, is_active')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (adminError || !adminProfile) {
    logCreditAdminAuthEvent('credit_package.admin_authorization_denied', {
      actorUserIdMasked: maskId(user.id),
      result: 'denied',
      reasonCode: adminError ? 'QUERY_ERROR' : 'FORBIDDEN_NOT_ACTIVE_ADMIN',
    });
    throw new AdminAuthorizationError('FORBIDDEN');
  }

  logCreditAdminAuthEvent('credit_package.admin_authorization_granted', {
    actorUserIdMasked: maskId(user.id),
    adminProfileIdMasked: maskId(adminProfile.id),
    role: adminProfile.role,
    isActive: adminProfile.is_active,
    result: 'authorized',
    reasonCode: 'ACTIVE_ADMIN_VERIFIED',
  });

  return {
    userId: user.id,
    adminProfileId: adminProfile.id,
    role: adminProfile.role as 'admin' | 'super_admin',
    name: adminProfile.name,
    supabase,
  };
}

/**
 * Valida autorização administrativa para Route Handlers (APIs).
 * Retorna o usuário autenticado ou resposta HTTP 401/403 com código semântico.
 */
export async function authorizeAdminApiRequest(
  customClient?: SupabaseClient,
): Promise<AdminAuthResult> {
  try {
    const admin = await requireActiveAdmin(customClient);
    return {
      isAuthorized: true,
      user: { id: admin.userId },
      profile: {
        id: admin.adminProfileId,
        auth_user_id: admin.userId,
        role: admin.role,
        name: admin.name || '',
      },
    };
  } catch (err) {
    if (err instanceof AdminAuthorizationError) {
      const { NextResponse } = await import('next/server');
      return {
        isAuthorized: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: err.message,
            code: err.code === 'UNAUTHENTICATED' ? 'UNAUTHORIZED' : 'FORBIDDEN',
          },
          { status: err.statusCode },
        ),
      };
    }

    console.error('[ADMIN_AUTH] Erro ao validar credencial administrativa:', err);
    const { NextResponse } = await import('next/server');
    return {
      isAuthorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Erro interno de autorização.', code: 'INTERNAL_AUTH_ERROR' },
        { status: 500 },
      ),
    };
  }
}
