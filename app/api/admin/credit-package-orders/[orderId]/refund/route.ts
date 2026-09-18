import { NextRequest, NextResponse } from 'next/server';
import { requireActiveAdmin, AdminAuthorizationError } from '@/lib/admin/admin-auth';
import { processPackageRefund } from '@/lib/mercadopago/package-refund-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  let admin;
  try {
    admin = await requireActiveAdmin();
  } catch (err) {
    if (err instanceof AdminAuthorizationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro de autorização.', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  try {
    const { orderId } = await context.params;
    let body: { reason?: string; idempotencyKey?: string } = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const reason = body.reason?.trim() || 'Estorno administrativo de pacote de créditos';
    const idempotencyKey = body.idempotencyKey?.trim() || `refund:${orderId}:${Date.now()}`;

    const outcome = await processPackageRefund({
      orderId,
      reason,
      adminUserId: admin.userId,
      idempotencyKey,
    });

    if (!outcome.success && outcome.code === 'REFUND_REQUIRES_MANUAL_REVIEW') {
      return NextResponse.json(
        {
          success: false,
          code: outcome.code,
          error: outcome.error,
          consumedCredits: outcome.consumedCredits,
          remainingCredits: outcome.remainingCredits,
        },
        { status: 422 },
      );
    }

    if (!outcome.success) {
      return NextResponse.json(
        { success: false, code: outcome.code || 'REFUND_FAILED', error: outcome.error },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      refunded: true,
      action: outcome.action,
      creditsRevoked: outcome.creditsRevoked,
      orderId: outcome.orderId,
      mpRefundId: outcome.mpRefundId,
      message: outcome.message,
    });
  } catch (error: unknown) {
    console.error('[POST /api/admin/credit-package-orders/[orderId]/refund] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao processar estorno.',
      },
      { status: 500 },
    );
  }
}
