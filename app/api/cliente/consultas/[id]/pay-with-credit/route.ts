import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { reserveConsultationCredit, releaseConsultationCredit } from '@/lib/credits/credit-service';
import {
  enqueueDeliveryJob,
  executeSingleDeliveryJob,
} from '@/lib/vehicle-delivery/delivery-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: consultationId } = await context.params;

    // 1. Autenticar usuário
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const adminDb = createAdminClient();

    // 2. Validar Consulta e Ownership
    const { data: consultation, error: consError } = await adminDb
      .from('customer_plate_consultations')
      .select('id, user_id, status, payment_coverage_type, credit_status, credit_reservation_id')
      .eq('id', consultationId)
      .maybeSingle();

    if (consError || !consultation) {
      return NextResponse.json({ error: 'Consulta não encontrada.' }, { status: 404 });
    }

    if (consultation.user_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    if (consultation.status !== 'pending') {
      return NextResponse.json(
        { error: `Consulta com status inválido para pagamento: ${consultation.status}` },
        { status: 400 },
      );
    }

    // 3. Mutex: Confirmar que não há transação aprovada ou em processo no Mercado Pago
    const { data: existingTx } = await adminDb
      .from('payment_transactions')
      .select('id, status')
      .eq('consultation_id', consultationId)
      .in('status', ['approved', 'in_process'])
      .limit(1)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json(
        {
          error:
            'Esta consulta já possui transação de pagamento aprovada ou em processamento no Mercado Pago.',
        },
        { status: 409 },
      );
    }

    // 4. Reservar 1 crédito atomicamente via RPC
    const reserveResult = await reserveConsultationCredit(user.id, consultationId, adminDb);
    if (!reserveResult.success) {
      return NextResponse.json(
        {
          success: false,
          code: reserveResult.code || 'CREDIT_RESERVATION_FAILED',
          error:
            reserveResult.error ||
            'Não foi possível reservar seu crédito agora. Nenhum crédito foi consumido. Tente novamente em alguns instantes.',
        },
        { status: 400 },
      );
    }

    // 5. Criar delivery job de forma idempotente (SEM criar payment_transactions)
    const enqueueResult = await enqueueDeliveryJob({
      consultationId,
      transactionId: null,
      dbClient: adminDb,
    });

    if (!enqueueResult.success && !enqueueResult.alreadyExists) {
      console.error('[PAY-WITH-CREDIT] Erro ao enfileirar job de entrega:', enqueueResult.error);
      // Rollback defensivo: libera a reserva para não prender o crédito do usuário
      await releaseConsultationCredit(user.id, consultationId, adminDb);

      return NextResponse.json(
        {
          success: false,
          code: 'DELIVERY_JOB_CREATION_FAILED',
          error:
            'Não foi possível iniciar o processamento da consulta. Seu crédito foi preservado e liberado.',
        },
        { status: 500 },
      );
    }

    // 6. Execução Imediata (Tentativa #1) em background/inline
    try {
      const { data: jobRecord } = await adminDb
        .from('consultation_delivery_jobs')
        .select('*')
        .eq('id', enqueueResult.jobId)
        .maybeSingle();

      if (jobRecord && (jobRecord.status === 'pending' || jobRecord.status === 'retry_scheduled')) {
        await executeSingleDeliveryJob(jobRecord, adminDb);
      }
    } catch (execErr) {
      console.warn(
        '[PAY-WITH-CREDIT] Tentativa imediata em background encontrou pendência, job continuará na fila:',
        execErr,
      );
    }

    // 7. Retorno Canônico
    return NextResponse.json(
      {
        success: true,
        paymentCoverageType: 'platform_credit',
        creditStatus: 'reserved',
        consultationId,
        reservationId: reserveResult.reservationId || consultation.credit_reservation_id,
        status: 'processing',
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error('[PAY-WITH-CREDIT] Erro não tratado:', error);
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        error:
          'Erro interno ao processar uso do crédito. Seu saldo foi verificado e mantido em segurança.',
      },
      { status: 500 },
    );
  }
}
