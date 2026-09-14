import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextResponse } from 'next/server';

export interface AdminAuthResult {
  isAuthorized: boolean;
  user?: { id: string; email?: string };
  profile?: { id: string; auth_user_id: string; role: 'admin' | 'super_admin'; name: string };
  errorResponse?: NextResponse;
}

/**
 * Valida se um usuário possui cadastro ativo de administrador no banco
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
 * Valida autorização administrativa para Route Handlers (APIs).
 * Retorna o usuário autenticado ou resposta HTTP 401/403 com código semântico.
 */
export async function authorizeAdminApiRequest(): Promise<AdminAuthResult> {
  try {
    const { createClient } = await import('../supabase/server.ts');
    const { NextResponse } = await import('next/server');

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        isAuthorized: false,
        errorResponse: NextResponse.json(
          { success: false, error: 'Não autenticado.', code: 'UNAUTHORIZED' },
          { status: 401 },
        ),
      };
    }

    const { isAuthorized, profile } = await checkAdminProfileAccess(supabase, user.id);

    if (!isAuthorized || !profile) {
      return {
        isAuthorized: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: 'Acesso restrito a administradores autorizados.',
            code: 'FORBIDDEN',
          },
          { status: 403 },
        ),
      };
    }

    return {
      isAuthorized: true,
      user: { id: user.id, email: user.email },
      profile,
    };
  } catch (err) {
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
