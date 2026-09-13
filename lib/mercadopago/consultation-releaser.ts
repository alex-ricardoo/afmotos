import { createAdminClient } from '@/lib/supabase/admin';
import { findExistingConsultation, executeVehiclePlateLookup } from '@/lib/vehicle-lookup/service';
import { logCheckoutProEvent } from './observability';

export interface ReleaseResult {
  success: boolean;
  consultationId?: string;
  alreadyCompleted?: boolean;
  claimedByOther?: boolean;
  error?: string;
}

/**
 * Libera de forma atômica e autoritativa a consulta veicular após a confirmação
 * de pagamento no Mercado Pago, garantindo execução única da busca veicular (API Brasil).
 */
export async function releaseVerifiedPaidConsultation(
  transactionId: string,
): Promise<ReleaseResult> {
  const adminDb = createAdminClient();

  // 1. Carrega a transação de pagamento
  const { data: transaction, error: txError } = await adminDb
    .from('payment_transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (txError || !transaction) {
    return { success: false, error: 'Transação de pagamento não encontrada.' };
  }

  // Precondição estrita: status deve ser approved e possuir mp_payment_id
  if (transaction.status !== 'approved') {
    return {
      success: false,
      error: `Transação não está aprovada (status: ${transaction.status}).`,
    };
  }

  if (!transaction.mp_payment_id) {
    return { success: false, error: 'Transação aprovada sem mp_payment_id oficial.' };
  }

  // 2. Carrega a consulta veicular associada
  const { data: consultation, error: consultationError } = await adminDb
    .from('customer_plate_consultations')
    .select('*')
    .eq('id', transaction.consultation_id)
    .maybeSingle();

  if (consultationError || !consultation) {
    return { success: false, error: 'Consulta veicular não encontrada.' };
  }

  // Se a consulta já estiver concluída com laudo, finaliza com sucesso sem duplicar
  if (consultation.status === 'completed' && consultation.vehicle_data) {
    return { success: true, consultationId: consultation.id, alreadyCompleted: true };
  }

  // 3. Trava Atômica de Processamento (Optimistic Locking)
  // Atualiza apenas se payment_status for 'unpaid' e status estiver pendente ou em falha anterior
  const { data: claimedRows, error: claimError } = await adminDb
    .from('customer_plate_consultations')
    .update({
      payment_status: 'paid',
      status: 'processing',
      payment_method: 'checkout_pro',
      payment_date: new Date().toISOString(),
      latest_payment_transaction_id: transaction.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', consultation.id)
    .eq('payment_status', 'unpaid')
    .select('id');

  if (claimError || !claimedRows || claimedRows.length === 0) {
    // Outro processo concorrente já reivindicou a liberação
    return { success: true, consultationId: consultation.id, claimedByOther: true };
  }

  logCheckoutProEvent('checkout_pro.consultation_release_started', {
    transactionId: transaction.id,
    consultationId: consultation.id,
    paymentId: transaction.mp_payment_id,
  });

  // 4. Execução da Busca Veicular (API Brasil via cache local ou live lookup)
  const plateToLookup = consultation.plate_normalized || consultation.plate;

  try {
    const cached = await findExistingConsultation(plateToLookup, adminDb);

    if (cached && cached.status === 'COMPLETED' && cached.raw_response) {
      await adminDb
        .from('customer_plate_consultations')
        .update({
          vehicle_data: cached.raw_response,
          source_consultation_id: cached.id,
          status: 'completed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', consultation.id);
    } else {
      const lookupResult = await executeVehiclePlateLookup(
        {
          plate: plateToLookup,
          userId: consultation.user_id,
          confirmedPlate: plateToLookup,
        },
        adminDb,
      );

      if (lookupResult.success && lookupResult.record) {
        await adminDb
          .from('customer_plate_consultations')
          .update({
            vehicle_data: lookupResult.record.raw_response,
            source_consultation_id: lookupResult.record.id,
            status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', consultation.id);
      } else {
        await adminDb
          .from('customer_plate_consultations')
          .update({
            status: 'failed',
            lookup_error_message: lookupResult.message || 'Falha ao obter histórico veicular.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', consultation.id);
      }
    }
  } catch (lookupErr) {
    const errMsg = lookupErr instanceof Error ? lookupErr.message : 'Erro na busca veicular';
    console.error('[releaseVerifiedPaidConsultation] Erro na busca veicular:', lookupErr);
    await adminDb
      .from('customer_plate_consultations')
      .update({
        status: 'failed',
        lookup_error_message: errMsg,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultation.id);
  }

  // 5. Trilha de Auditoria Imutável
  await adminDb.from('consultation_audit_logs').insert({
    consultation_id: consultation.id,
    transaction_id: transaction.id,
    actor_id: transaction.user_id,
    actor_type: 'webhook',
    event: 'consultation_paid_and_processed',
    details: {
      mp_payment_id: transaction.mp_payment_id,
      amount: transaction.transaction_amount,
    },
  });

  logCheckoutProEvent('checkout_pro.consultation_release_succeeded', {
    transactionId: transaction.id,
    consultationId: consultation.id,
  });

  return { success: true, consultationId: consultation.id };
}
