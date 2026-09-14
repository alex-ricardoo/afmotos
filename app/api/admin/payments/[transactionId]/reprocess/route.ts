import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeAdminApiRequest } from '@/lib/admin/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  enqueueDeliveryJob,
  executeSingleDeliveryJob,
} from '@/lib/vehicle-delivery/delivery-service';
import { maskId } from '@/lib/mercadopago/observability';

export const dynamic = 'force-dynamic';

const ReprocessRequestSchema = z.object({
  confirmProviderFunded: z.boolean().default(false),
  adminNote: z.string().trim().max(300).optional(),
});

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

  let bodyData: unknown = {};
  try {
    bodyData = await request.json();
  } catch {
    bodyData = {};
  }

  const parseResult = ReprocessRequestSchema.safeParse(bodyData);
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: 'Payload de reprocessamento inválido.', code: 'INVALID_PAYLOAD' },
      { status: 400 },
    );
  }

  const { confirmProviderFunded, adminNote } = parseResult.data;
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
        { success: false, error: 'Transação não encontrada.', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 },
      );
    }

    if (transaction.status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: `Transação não está aprovada (status: ${transaction.status}).`,
          code: 'PAYMENT_NOT_APPROVED',
        },
        { status: 422 },
      );
    }

    const { data: consultation, error: consError } = await adminDb
      .from('customer_plate_consultations')
      .select('*')
      .eq('id', transaction.consultation_id)
      .maybeSingle();

    if (consError || !consultation) {
      return NextResponse.json(
        { success: false, error: 'Consulta não encontrada.', code: 'CONSULTATION_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Se já estiver com laudo concluído e válido, impede reprocessamento
    if (consultation.status === 'completed' && consultation.vehicle_data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Consulta já possui laudo emitido e entregue com sucesso.',
          code: 'ALREADY_COMPLETED',
        },
        { status: 422 },
      );
    }

    // 2. Verifica se há estorno ativo ou confirmado
    const { data: refund } = await adminDb
      .from('payment_refunds')
      .select('id, status')
      .eq('transaction_id', transaction.id)
      .in('status', ['requested', 'pending', 'confirmed'])
      .maybeSingle();

    if (refund) {
      return NextResponse.json(
        {
          success: false,
          error: `Reprocessamento bloqueado: existe estorno em andamento ou confirmado (status: ${refund.status}).`,
          code: 'REPROCESS_BLOCKED_BY_REFUND',
        },
        { status: 422 },
      );
    }

    // 3. Checa o último job de entrega
    const { data: lastJob } = await adminDb
      .from('consultation_delivery_jobs')
      .select('*')
      .eq('consultation_id', consultation.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const isInsufficientCredits =
      lastJob?.last_error_code === 'APIBRASIL_INSUFFICIENT_CREDITS' ||
      lastJob?.last_http_status === 402;

    if (isInsufficientCredits && !confirmProviderFunded) {
      return NextResponse.json(
        {
          success: false,
          error:
            'É obrigatório confirmar que a conta corporativa da API Brasil foi recarregada antes de reprocessar.',
          code: 'PROVIDER_FUNDS_NOT_CONFIRMED',
        },
        { status: 400 },
      );
    }

    if (lastJob?.status === 'processing') {
      return NextResponse.json(
        {
          success: false,
          error: 'Existe um job de entrega em processamento ativo no momento. Aguarde a conclusão.',
          code: 'JOB_CURRENTLY_PROCESSING',
        },
        { status: 409 },
      );
    }

    console.log(
      `[ADMIN_PAYMENTS] admin_payments.delivery_reprocess_started adminUser=${maskId(auth.user.id)} tx=${maskId(transaction.id)} consultation=${maskId(consultation.id)}`,
    );

    // 4. Enfileira o job e executa a tentativa imediata
    const enqueueRes = await enqueueDeliveryJob({
      consultationId: consultation.id,
      transactionId: transaction.id,
      dbClient: adminDb,
    });

    let jobExecutionOutcome = null;

    if (enqueueRes.jobId) {
      const { data: jobRecord } = await adminDb
        .from('consultation_delivery_jobs')
        .select('*')
        .eq('id', enqueueRes.jobId)
        .maybeSingle();

      if (jobRecord) {
        jobExecutionOutcome = await executeSingleDeliveryJob(jobRecord, adminDb);
      }
    }

    // 5. Registra auditoria
    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: transaction.id,
      actor_id: auth.user.id,
      actor_type: 'admin',
      event: 'admin_delivery_reprocessed',
      details: {
        admin_user_id: auth.user.id,
        admin_note: adminNote || null,
        confirmed_funded: confirmProviderFunded,
        outcome_status: jobExecutionOutcome?.status || 'enqueued',
        error: jobExecutionOutcome?.error || null,
      },
    });

    const isSuccess = jobExecutionOutcome?.status === 'completed';

    return NextResponse.json({
      success: isSuccess,
      transactionId: transaction.id,
      consultationId: consultation.id,
      status: jobExecutionOutcome?.status || 'processing',
      message: isSuccess
        ? 'Laudo veicular consultado e disponibilizado com sucesso ao cliente.'
        : 'Reprocessamento iniciado. O resultado foi atualizado na fila operacional.',
      error: jobExecutionOutcome?.error,
    });
  } catch (err) {
    console.error(
      `[ADMIN_PAYMENTS] Erro ao reprocessar entrega da transação ${transactionId}:`,
      err,
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Falha interna durante o reprocessamento da consulta.',
        code: 'REPROCESS_ERROR',
      },
      { status: 500 },
    );
  }
}
