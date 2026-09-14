import { NextRequest, NextResponse } from 'next/server';
import { requireActiveAdmin, AdminAuthorizationError } from '@/lib/admin/admin-auth';
import { verifyConsultationRecoveryState } from '@/lib/credits/verify-recovery';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ consultationId: string }> },
) {
  let admin;
  try {
    admin = await requireActiveAdmin();
  } catch (err) {
    if (err instanceof AdminAuthorizationError) {
      return NextResponse.json(
        {
          success: false,
          error: err.message,
          code: err.code === 'UNAUTHENTICATED' ? 'UNAUTHORIZED' : 'FORBIDDEN',
        },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro de autorização.', code: 'INTERNAL_AUTH_ERROR' },
      { status: 500 },
    );
  }

  try {
    const { consultationId } = await context.params;

    if (!consultationId) {
      return NextResponse.json(
        { success: false, error: 'Identificador de consulta inválido.' },
        { status: 400 },
      );
    }

    const state = await verifyConsultationRecoveryState(consultationId, undefined, admin.supabase);

    return NextResponse.json(
      {
        success: true,
        consultationId,
        diagnostics: state,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error('[ADMIN_CREDIT_DIAGNOSTICS] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao consultar diagnóstico.',
      },
      { status: 500 },
    );
  }
}
