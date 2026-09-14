import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/admin/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { reconcileSingleRefund } from '@/lib/mercadopago/refund-service';
import { maskId } from '@/lib/mercadopago/observability';

export const dynamic = 'force-dynamic';

export async function POST(
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

  const adminDb = createAdminClient();

  try {
    // 1. Localiza a transação
    const { data: transaction, error: txError } = await adminDb
      .from('payment_transactions')
      .select('id, consultation_id, mp_payment_id, status, refund_status')
      .eq('id', transactionId)
      .maybeSingle();

    if (txError || !transaction) {
      return NextResponse.json(
        { success: false, error: 'Transação não encontrada.', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 },
      );
    }

    // 2. Localiza o registro de estorno associado
    const { data: refund, error: rfError } = await adminDb
      .from('payment_refunds')
      .select('id, status, provider_payment_id')
      .eq('transaction_id', transaction.id)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (rfError || !refund) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum registro de estorno encontrado para esta transação.',
          code: 'REFUND_NOT_FOUND',
        },
        { status: 404 },
      );
    }

    console.log(
      `[ADMIN_PAYMENTS] admin_payments.refund_reconcile_started adminUser=${maskId(auth.user.id)} tx=${maskId(transaction.id)} refundId=${maskId(refund.id)}`,
    );

    // 3. Executa reconciliação oficial
    const outcome = await reconcileSingleRefund(refund.id, adminDb);

    // 4. Registra auditoria
    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: transaction.consultation_id,
      transaction_id: transaction.id,
      actor_id: auth.user.id,
      actor_type: 'admin',
      event: 'admin_refund_reconciled',
      details: {
        admin_user_id: auth.user.id,
        refund_id: refund.id,
        outcome_status: outcome.status,
        mp_refund_id: outcome.mpRefundId || null,
        success: outcome.success,
      },
    });

    console.log(
      `[ADMIN_PAYMENTS] admin_payments.refund_reconciled adminUser=${maskId(auth.user.id)} tx=${maskId(transaction.id)} status=${outcome.status}`,
    );

    return NextResponse.json({
      success: outcome.success,
      transactionId: transaction.id,
      refundId: refund.id,
      providerRefundId: outcome.mpRefundId || null,
      status: outcome.status,
      reconciled: outcome.status === 'confirmed',
      message:
        outcome.status === 'confirmed'
          ? 'Estorno confirmado com sucesso junto ao Mercado Pago.'
          : 'Estorno continua em análise ou processamento pelo gateway.',
      error: outcome.error,
    });
  } catch (err) {
    console.error(
      `[ADMIN_PAYMENTS] Erro ao reconciliar estorno da transação ${transactionId}:`,
      err,
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Falha interna ao reconciliar estorno.',
        code: 'REFUND_RECONCILE_ERROR',
      },
      { status: 500 },
    );
  }
}
