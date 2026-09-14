import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/admin/admin-auth';
import { getAdminPaymentDetails } from '@/lib/admin/payments-service';
import { maskId } from '@/lib/mercadopago/observability';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ transactionId: string }> },
) {
  const auth = await authorizeAdminApiRequest();
  if (!auth.isAuthorized || !auth.user) {
    return auth.errorResponse!;
  }

  const { transactionId } = await context.params;
  if (!transactionId) {
    return NextResponse.json(
      { success: false, error: 'ID da transação não fornecido.' },
      { status: 400 },
    );
  }

  try {
    const details = await getAdminPaymentDetails(transactionId);
    if (!details) {
      return NextResponse.json(
        { success: false, error: 'Transação não localizada.', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 },
      );
    }

    console.log(
      `[ADMIN_PAYMENTS] admin_payments.details_opened adminUser=${maskId(auth.user.id)} transactionId=${maskId(transactionId)}`,
    );

    return NextResponse.json({
      success: true,
      data: details,
    });
  } catch (err) {
    console.error(`[ADMIN_PAYMENTS] Erro ao carregar detalhes da transação ${transactionId}:`, err);
    return NextResponse.json(
      {
        success: false,
        error: 'Falha interna ao obter detalhes da transação.',
        code: 'TRANSACTION_DETAILS_ERROR',
      },
      { status: 500 },
    );
  }
}
