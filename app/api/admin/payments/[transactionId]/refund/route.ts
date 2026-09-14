import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeAdminApiRequest } from '@/lib/admin/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  evaluateRefundEligibility,
  initiateRefundForFailedDelivery,
} from '@/lib/mercadopago/refund-service';
import { maskId } from '@/lib/mercadopago/observability';

export const dynamic = 'force-dynamic';

export const AdminRefundReasonEnum = z.enum([
  'APIBRASIL_INSUFFICIENT_CREDITS',
  'APIBRASIL_AUTH_ERROR',
  'APIBRASIL_CONFIGURATION_ERROR',
  'APIBRASIL_RETRIES_EXHAUSTED',
  'APIBRASIL_PROVIDER_UNAVAILABLE',
  'LAUDO_NAO_ENTREGAVEL',
  'DECISAO_MANUAL_SUPORTE',
  'OUTRO',
]);

const AdminRefundRequestSchema = z
  .object({
    reasonCode: AdminRefundReasonEnum,
    adminNote: z.string().trim().max(500).optional(),
    confirmationText: z.literal('ESTORNAR', {
      message: 'A confirmação deve ser exatamente a palavra ESTORNAR em maiúsculas.',
    }),
  })
  .refine(
    (data) => {
      if (data.reasonCode === 'OUTRO') {
        return Boolean(data.adminNote && data.adminNote.length >= 10);
      }
      return true;
    },
    {
      message:
        'A nota administrativa é obrigatória (mínimo 10 caracteres) quando o motivo for OUTRO.',
      path: ['adminNote'],
    },
  );

export async function POST(
  request: NextRequest,
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

  let bodyData: unknown;
  try {
    bodyData = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Payload JSON inválido.' }, { status: 400 });
  }

  const parseResult = AdminRefundRequestSchema.safeParse(bodyData);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues?.[0]?.message || 'Dados de requisição inválidos.';
    return NextResponse.json(
      { success: false, error: errorMsg, code: 'INVALID_REFUND_PAYLOAD' },
      { status: 400 },
    );
  }

  const { reasonCode, adminNote } = parseResult.data;
  const adminDb = createAdminClient();

  try {
    // 1. Carrega a transação e a consulta
    const { data: transaction, error: txError } = await adminDb
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .maybeSingle();

    if (txError || !transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transação de pagamento não encontrada.',
          code: 'TRANSACTION_NOT_FOUND',
        },
        { status: 404 },
      );
    }

    const { data: consultation, error: consError } = await adminDb
      .from('customer_plate_consultations')
      .select('*')
      .eq('id', transaction.consultation_id)
      .maybeSingle();

    if (consError || !consultation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Consulta vinculada não encontrada.',
          code: 'CONSULTATION_NOT_FOUND',
        },
        { status: 404 },
      );
    }

    // 2. Avalia elegibilidade estrita
    const { data: existingRefund } = await adminDb
      .from('payment_refunds')
      .select('*')
      .eq('transaction_id', transaction.id)
      .in('status', ['requested', 'pending', 'confirmed'])
      .maybeSingle();

    const eligibility = evaluateRefundEligibility({
      transaction,
      consultation,
      existingRefund,
      reasonCode,
    });

    if (!eligibility.eligible) {
      console.warn(
        `[ADMIN_PAYMENTS] admin_payments.refund_request_rejected adminUser=${maskId(auth.user.id)} tx=${maskId(transaction.id)} reason=${eligibility.reason}`,
      );
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason || 'Transação inelegível para estorno.',
          code: 'REFUND_INELIGIBLE',
        },
        { status: 422 },
      );
    }

    const reasonSafe = `[ADMIN_ACTION] ${reasonCode}${adminNote ? `: ${adminNote}` : ''}`;

    // 3. Dispara o estorno oficial idempotente no Mercado Pago
    const refundResult = await initiateRefundForFailedDelivery({
      transactionId: transaction.id,
      consultationId: consultation.id,
      reasonCode,
      reasonSafe,
      dbClient: adminDb,
    });

    // 4. Registra auditoria com actor = admin
    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: transaction.id,
      actor_id: auth.user.id,
      actor_type: 'admin',
      event: 'admin_refund_requested',
      details: {
        admin_user_id: auth.user.id,
        reason_code: reasonCode,
        admin_note: adminNote || null,
        refund_id: refundResult.refundId,
        refund_status: refundResult.status,
        provider_refund_id: refundResult.providerRefundId || null,
        already_processed: refundResult.alreadyProcessed,
      },
    });

    console.log(
      `[ADMIN_PAYMENTS] admin_payments.refund_requested adminUser=${maskId(auth.user.id)} tx=${maskId(transaction.id)} refundId=${maskId(refundResult.refundId)} status=${refundResult.status}`,
    );

    return NextResponse.json({
      success: refundResult.success,
      transactionId: transaction.id,
      refundId: refundResult.refundId,
      providerRefundId: refundResult.providerRefundId || null,
      status: refundResult.status,
      alreadyProcessed: refundResult.alreadyProcessed,
      message: refundResult.message,
      error: refundResult.error,
    });
  } catch (err) {
    console.error(`[ADMIN_PAYMENTS] Erro fatal ao estornar transação ${transactionId}:`, err);
    return NextResponse.json(
      {
        success: false,
        error: 'Falha interna durante o processamento do estorno.',
        code: 'REFUND_PROCESSING_ERROR',
      },
      { status: 500 },
    );
  }
}
