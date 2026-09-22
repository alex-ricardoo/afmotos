import { NextRequest, NextResponse } from 'next/server';
import { requireActiveAdmin, AdminAuthorizationError } from '@/lib/admin/admin-auth';
import {
  evaluatePackageRefundEligibility,
  processPackageRefund,
} from '@/lib/mercadopago/package-refund-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    await requireActiveAdmin();
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
    const eligibility = await evaluatePackageRefundEligibility(orderId);

    return NextResponse.json({
      success: true,
      eligibility,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao avaliar elegibilidade de estorno.';
    return NextResponse.json(
      { success: false, error: message, code: 'REFUND_ELIGIBILITY_ERROR' },
      { status: 500 },
    );
  }
}

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
      // Body vazio ou não JSON
    }

    const reason = body.reason || 'Estorno manual solicitado via Central Administrativa';
    const idempotencyKey = body.idempotencyKey || `admin-pkg-refund-${orderId}-${Date.now()}`;

    const result = await processPackageRefund({
      orderId,
      reason,
      adminUserId: admin.userId,
      idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || result.message,
          code: result.code || 'REFUND_FAILED',
          result,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Estorno de pacote processado com sucesso.',
      result,
    });
  } catch (err: unknown) {
    console.error('[ADMIN_PACKAGE_REFUND] Erro ao estornar pacote:', err);
    const message = err instanceof Error ? err.message : 'Falha ao processar estorno de pacote.';
    return NextResponse.json(
      { success: false, error: message, code: 'REFUND_PROCESSING_ERROR' },
      { status: 500 },
    );
  }
}
