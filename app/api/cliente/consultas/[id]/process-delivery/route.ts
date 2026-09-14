import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createOrGetDeliveryJob,
  createOrGetDeliveryJobForConsultation,
  processEligibleDeliveryJob,
} from '@/lib/vehicle-delivery/delivery-service';
import { logCheckoutProEvent } from '@/lib/mercadopago/observability';

export const dynamic = 'force-dynamic';

// Rate limiter defensivo auxiliar em memória por usuário + consulta (10 segundos)
const lastRequestTimestamps = new Map<string, number>();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const { id: consultationId } = await context.params;

  try {
    // 1. Autenticação do Usuário
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado', message: 'Faça login para processar sua consulta.' },
        { status: 401 },
      );
    }

    const adminDb = createAdminClient();

    // 2. Carrega a consulta e valida propriedade
    const { data: consultation, error: consError } = await adminDb
      .from('customer_plate_consultations')
      .select('*')
      .eq('id', consultationId)
      .maybeSingle();

    if (consError || !consultation) {
      return NextResponse.json(
        { error: 'Não encontrado', message: 'Consulta veicular não encontrada.' },
        { status: 404 },
      );
    }

    if (consultation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Acesso negado', message: 'Esta consulta pertence a outro usuário.' },
        { status: 403 },
      );
    }

    // 3. Se a consulta já estiver concluída com laudo
    if (consultation.status === 'completed' && consultation.vehicle_data) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        delivered: true,
        message: 'Laudo já disponível.',
        data: {
          consultationId: consultation.id,
          status: 'completed',
          paymentStatus: consultation.payment_status,
          deliveryStatus: 'completed',
        },
      });
    }

    // 4. Se a consulta estiver em estado terminal
    if (
      ['failed_permanent', 'refund_pending', 'refunded', 'manual_review'].includes(
        consultation.status,
      )
    ) {
      return NextResponse.json({
        success: false,
        status: consultation.status,
        delivered: false,
        terminal: true,
        message:
          consultation.status === 'refunded'
            ? 'Pagamento estornado integralmente.'
            : consultation.status === 'refund_pending'
              ? 'Estorno solicitado e em andamento.'
              : 'Consulta em análise manual ou finalizada por indisponibilidade técnica.',
      });
    }

    // 5. Validação da transação de pagamento
    const txId = consultation.latest_payment_transaction_id;
    let paymentApproved = false;

    if (txId) {
      const { data: tx } = await adminDb
        .from('payment_transactions')
        .select('id, status')
        .eq('id', txId)
        .maybeSingle();

      if (tx && tx.status === 'approved') {
        paymentApproved = true;
      }
    } else {
      // Busca transação aprovada vinculada à consulta
      const { data: tx } = await adminDb
        .from('payment_transactions')
        .select('id, status')
        .eq('consultation_id', consultation.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tx) {
        paymentApproved = true;
      }
    }

    if (!paymentApproved && consultation.payment_status !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          status: consultation.status,
          message: 'O pagamento da consulta ainda não foi aprovado.',
        },
        { status: 400 },
      );
    }

    // 6. Rate Limiter Auxiliar (1 chamada a cada 10s por usuário+consulta)
    const rateLimitKey = `${user.id}:${consultation.id}`;
    const now = Date.now();
    const lastTime = lastRequestTimestamps.get(rateLimitKey);
    if (lastTime && now - lastTime < 10_000) {
      // Se chamado antes do cooldown de 10s, busca o job atual e retorna sem nova requisição externa
      const { data: currentJob } = await adminDb
        .from('consultation_delivery_jobs')
        .select('*')
        .eq('consultation_id', consultation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        status: currentJob?.status || consultation.status,
        delivered: currentJob?.status === 'completed',
        code: 'rate_limited',
        message: 'Aguarde alguns instantes antes de requisitar novamente.',
        nextRetryAt: currentJob?.next_retry_at,
      });
    }

    lastRequestTimestamps.set(rateLimitKey, now);

    // 7. Garante que o job exista
    const jobRes = txId
      ? await createOrGetDeliveryJob(txId, adminDb)
      : await createOrGetDeliveryJobForConsultation(consultation.id, null, adminDb);

    if (!jobRes.success || !jobRes.job) {
      return NextResponse.json(
        {
          success: false,
          status: 'failed',
          message: 'Falha ao recuperar ou inicializar a fila de entrega.',
          error: jobRes.error,
        },
        { status: 500 },
      );
    }

    // 8. Executa o processamento do job de forma segura e idempotente
    const result = await processEligibleDeliveryJob(jobRes.job.id, 'customer_screen', {
      dbClient: adminDb,
    });

    logCheckoutProEvent('checkout_pro.transaction_updated', {
      consultationId: consultation.id,
      jobId: jobRes.job.id,
      status: result.status,
      durationMs: Date.now() - startTime,
      errorMessage: `[VEHICLE_DELIVERY] Processamento de entrega em tela acionado pelo cliente: status=${result.status}, delivered=${result.delivered}, retryNotDue=${Boolean(result.retryNotDue)}`,
    });

    return NextResponse.json({
      success: result.success,
      status: result.status,
      delivered: result.delivered,
      retryNotDue: result.retryNotDue,
      alreadyLocked: result.alreadyLocked,
      nextRetryAt: result.nextRetryAt,
      remainingSeconds: result.remainingSeconds,
      attemptCount: result.attemptCount,
      maxAttempts: result.maxAttempts,
      message: result.message,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(
      '[POST /api/cliente/consultas/[id]/process-delivery] Erro:',
      errorMsg,
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao processar entrega do laudo veicular.',
      },
      { status: 500 },
    );
  }
}
