import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/admin/admin-auth';
import { grantCreditsToUser, revokeCreditsFromUser } from '@/lib/credits/credit-service';

export async function POST(request: NextRequest) {
  const auth = await authorizeAdminApiRequest();
  if (!auth.isAuthorized || !auth.user) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const { userId, amount, action, description } = body;

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos. Informe userId e amount > 0.' },
        { status: 400 }
      );
    }

    if (action === 'revoke') {
      const result = await revokeCreditsFromUser({
        userId,
        amount: Number(amount),
        adminId: auth.user.id,
        description: description || 'Créditos removidos administrativamente',
      });
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } else {
      const result = await grantCreditsToUser({
        userId,
        amount: Number(amount),
        adminId: auth.user.id,
        description: description || 'Créditos adicionados administrativamente',
      });
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
  } catch (error) {
    console.error('[ADMIN_CREDITS] Erro ao processar créditos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar créditos.' },
      { status: 500 }
    );
  }
}
