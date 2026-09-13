import { createAdminClient } from '../supabase/admin.ts';
import { findExistingConsultation, executeVehiclePlateLookup } from '../vehicle-lookup/service.ts';
import { logCheckoutProEvent } from './observability.ts';

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
  customDb?: unknown,
): Promise<ReleaseResult> {
  const adminDb = (customDb as ReturnType<typeof createAdminClient>) || createAdminClient();

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

  logCheckoutProEvent('checkout_pro.consultation_release_started', {
    transactionId: transaction.id,
    consultationId: consultation.id,
    paymentId: transaction.mp_payment_id,
  });

  // 3. Enfileiramento Persistido e Idempotente do Job de Entrega (RB-05)
  const { enqueueDeliveryJob, executeSingleDeliveryJob } = await import('@/lib/vehicle-delivery/delivery-service');

  const enqueueResult = await enqueueDeliveryJob({
    consultationId: consultation.id,
    transactionId: transaction.id,
    dbClient: adminDb,
  });

  if (!enqueueResult.success && !enqueueResult.alreadyExists) {
    return {
      success: false,
      consultationId: consultation.id,
      error: enqueueResult.error || 'Falha ao enfileirar job de entrega.',
    };
  }

  // 4. Execução Imediata (Tentativa #1)
  try {
    const { data: jobRecord } = await adminDb
      .from('consultation_delivery_jobs')
      .select('*')
      .eq('id', enqueueResult.jobId)
      .maybeSingle();

    if (jobRecord && (jobRecord.status === 'pending' || jobRecord.status === 'retry_scheduled')) {
      const outcome = await executeSingleDeliveryJob(jobRecord, adminDb);

      if (outcome.status === 'completed') {
        logCheckoutProEvent('checkout_pro.consultation_release_succeeded', {
          transactionId: transaction.id,
          consultationId: consultation.id,
        });
        return { success: true, consultationId: consultation.id };
      }

      if (outcome.status === 'retry_scheduled') {
        // Enfileirado para próximo ciclo de retry
        return { success: true, consultationId: consultation.id };
      }

      // Falha permanente com estorno disparado
      return {
        success: false,
        consultationId: consultation.id,
        error: outcome.error || 'Entrega falhou de forma definitiva.',
      };
    }
  } catch (execErr) {
    console.error('[releaseVerifiedPaidConsultation] Erro na tentativa imediata do job:', execErr);
  }

  return { success: true, consultationId: consultation.id };
}
