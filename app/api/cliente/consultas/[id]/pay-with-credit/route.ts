import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { reserveConsultationCredit } from '@/lib/credits/credit-service';
import { releaseVerifiedPaidConsultation } from '@/lib/mercadopago/consultation-releaser';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: consultationId } = await context.params;

    // 1. Auth
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const adminDb = createAdminClient();

    // 2. Validate Consultation
    const { data: consultation, error: consError } = await adminDb
      .from('customer_plate_consultations')
      .select('id, user_id, status')
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

    // 3. Reserve Credit (Atomic)
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

    // 4. Create Pseudo Transaction
    const transactionId = crypto.randomUUID();
    const { error: txError } = await adminDb.from('payment_transactions').insert({
      id: transactionId,
      consultation_id: consultationId,
      user_id: user.id,
      status: 'approved',
      payment_method_id: 'credit',
      payment_type_id: 'credit',
      transaction_amount: 0,
      currency_id: 'BRL',
      mp_payment_id: `credit_${consultationId}`,
    });

    if (txError) {
      console.error('[PAY-WITH-CREDIT] Erro ao criar transação pseudo-pagamento:', txError);
      return NextResponse.json(
        { success: false, error: 'Erro ao registrar pagamento com crédito.' },
        { status: 500 },
      );
    }

    // Atualiza status da consulta para evitar inconsistências antes de lançar na fila
    await adminDb
      .from('customer_plate_consultations')
      .update({
        payment_coverage_type: 'credit',
      })
      .eq('id', consultationId);

    // 5. Release Consultation (Triggers Delivery)
    const releaseResult = await releaseVerifiedPaidConsultation(transactionId, adminDb);

    if (!releaseResult.success) {
      console.error('[PAY-WITH-CREDIT] Erro ao liberar consulta com crédito:', releaseResult.error);
      return NextResponse.json(
        { success: false, error: 'Erro ao despachar o laudo veicular.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: 'Pago com sucesso usando 1 crédito.' },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error('[PAY-WITH-CREDIT] Erro não tratado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar pagamento com crédito.' },
      { status: 500 },
    );
  }
}
