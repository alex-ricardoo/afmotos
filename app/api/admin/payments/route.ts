import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/admin/admin-auth';
import { getAdminPaymentsList, getAdminPaymentSummary } from '@/lib/admin/payments-service';
import { maskId } from '@/lib/mercadopago/observability';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authorizeAdminApiRequest();
  if (!auth.isAuthorized || !auth.user) {
    return auth.errorResponse!;
  }

  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  const search = searchParams.get('search') || undefined;
  const purpose = searchParams.get('purpose') || undefined;
  const status = searchParams.get('status') || undefined;
  const deliveryStatus = searchParams.get('deliveryStatus') || undefined;
  const refundStatus = searchParams.get('refundStatus') || undefined;
  const attentionOnly = searchParams.get('attentionOnly') === 'true';
  const insufficientCreditsOnly = searchParams.get('insufficientCreditsOnly') === 'true';
  const approvedWithoutReportOnly = searchParams.get('approvedWithoutReportOnly') === 'true';
  const pendingRefundsOnly = searchParams.get('pendingRefundsOnly') === 'true';
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const startTime = Date.now();

  try {
    const [summary, listResult] = await Promise.all([
      getAdminPaymentSummary(),
      getAdminPaymentsList({
        page,
        pageSize,
        search,
        purpose,
        status,
        deliveryStatus,
        refundStatus,
        attentionOnly,
        insufficientCreditsOnly,
        approvedWithoutReportOnly,
        pendingRefundsOnly,
        startDate,
        endDate,
      }),
    ]);

    console.log(
      `[ADMIN_PAYMENTS] admin_payments.list_viewed adminUser=${maskId(auth.user.id)} totalItems=${listResult.totalItems} page=${page} durationMs=${Date.now() - startTime}`,
    );

    return NextResponse.json({
      success: true,
      summary,
      pagination: {
        page: listResult.page,
        pageSize: listResult.pageSize,
        totalItems: listResult.totalItems,
        totalPages: listResult.totalPages,
      },
      items: listResult.items,
    });
  } catch (err) {
    console.error('[ADMIN_PAYMENTS] Erro ao carregar listagem administrativa:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Falha interna ao processar consulta de pagamentos.',
        code: 'PAYMENTS_QUERY_ERROR',
      },
      { status: 500 },
    );
  }
}
