import { NextRequest, NextResponse } from 'next/server';
import { requireActiveAdmin, AdminAuthorizationError } from '@/lib/admin/admin-auth';
import { grantCreditsToUser, revokeCreditsFromUser } from '@/lib/credits/credit-service';

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { userId, amount, action, description } = body;

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos. Informe userId e amount > 0.' },
        { status: 400 },
      );
    }

    if (action === 'revoke') {
      const result = await revokeCreditsFromUser({
        userId,
        amount: Number(amount),
        adminId: admin.userId,
        description: description || 'Créditos removidos administrativamente',
        dbClient: admin.supabase,
      });
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } else {
      const result = await grantCreditsToUser({
        userId,
        amount: Number(amount),
        adminId: admin.userId,
        description: description || 'Créditos adicionados administrativamente',
        dbClient: admin.supabase,
      });
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
  } catch (error) {
    console.error('[ADMIN_CREDITS] Erro ao processar créditos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar créditos.' },
      { status: 500 },
    );
  }
}
