import { createAdminClient } from '../supabase/admin.ts';
import { executeSingleDeliveryJob, enqueueDeliveryJob } from './delivery-service.ts';
import { isMockRawResponsePayload } from './cache-eligibility.ts';
import { maskId } from '../mercadopago/observability.ts';
import { type ConsultationDeliveryJobRecord } from '../mercadopago/types.ts';

interface MinimalTransaction {
  id: string;
  status: string;
  mp_payment_id?: string | null;
  consultation_id?: string;
}

interface MinimalVpc {
  id: string;
  is_mock?: boolean | null;
  mode?: string | null;
  status?: string;
}

export interface ReprocessOptions {
  transactionId?: string;
  consultationId?: string;
  customDb?: unknown;
}

export interface ReprocessResult {
  success: boolean;
  consultationId: string;
  transactionId: string;
  status: string;
  actionTaken: 'LIVE_LOOKUP_SUCCEEDED' | 'REFUND_INITIATED' | 'ALREADY_LIVE' | 'NO_OP';
  newVpcId?: string;
  message?: string;
  error?: string;
}

/**
 * Safe, idempotent reprocessing of a paid consultation that mistakenly received
 * a mock fixture in production.
 *
 * 1. Verifies approved Mercado Pago payment.
 * 2. Identifies if the current result is indeed mock.
 * 3. Safely unlinks the mock from customer_plate_consultations without destroying historical logs.
 * 4. Triggers live delivery job to query API Brasil.
 * 5. Saves authentic live data or executes idempotent refund if permanent failure occurs.
 * 6. Records full audit log.
 */
export async function reprocessMockedPaidConsultation(
  options: ReprocessOptions,
): Promise<ReprocessResult> {
  const adminDb = (options.customDb as ReturnType<typeof createAdminClient>) || createAdminClient();

  // 1. Resolve Transaction & Consultation
  let transactionRecord: MinimalTransaction | null = null;

  if (options.transactionId) {
    const { data: tx, error: txErr } = await adminDb
      .from('payment_transactions')
      .select('*')
      .eq('id', options.transactionId)
      .maybeSingle();

    if (txErr || !tx) {
      return {
        success: false,
        consultationId: options.consultationId || '',
        transactionId: options.transactionId,
        status: 'error',
        actionTaken: 'NO_OP',
        error: `Transação não encontrada: ${txErr?.message || options.transactionId}`,
      };
    }
    transactionRecord = tx;
  }

  const targetConsultationId = options.consultationId || transactionRecord?.consultation_id;
  if (!targetConsultationId) {
    return {
      success: false,
      consultationId: '',
      transactionId: transactionRecord?.id || '',
      status: 'error',
      actionTaken: 'NO_OP',
      error: 'ID da consulta não informado e não encontrado na transação.',
    };
  }

  const { data: cpc, error: cpcErr } = await adminDb
    .from('customer_plate_consultations')
    .select('*')
    .eq('id', targetConsultationId)
    .maybeSingle();

  if (cpcErr || !cpc) {
    return {
      success: false,
      consultationId: targetConsultationId,
      transactionId: transactionRecord?.id || '',
      status: 'error',
      actionTaken: 'NO_OP',
      error: `Consulta veicular não encontrada: ${cpcErr?.message || targetConsultationId}`,
    };
  }
  const targetConsultation = cpc;

  let activeTransaction: MinimalTransaction | null = transactionRecord;
  if (!activeTransaction) {
    const txId = targetConsultation.latest_payment_transaction_id;
    if (txId) {
      const { data: tx } = await adminDb
        .from('payment_transactions')
        .select('*')
        .eq('id', txId)
        .maybeSingle();
      activeTransaction = tx;
    }
  }

  // 2. Validate Payment
  if (!activeTransaction || activeTransaction.status !== 'approved') {
    return {
      success: false,
      consultationId: targetConsultation.id,
      transactionId: activeTransaction?.id || '',
      status: 'unapproved_payment',
      actionTaken: 'NO_OP',
      error: `Pagamento não está aprovado (status: ${activeTransaction?.status || 'desconhecido'}).`,
    };
  }

  if (!activeTransaction.mp_payment_id) {
    return {
      success: false,
      consultationId: targetConsultation.id,
      transactionId: activeTransaction.id,
      status: 'missing_mp_payment_id',
      actionTaken: 'NO_OP',
      error: 'Transação não possui mp_payment_id oficial.',
    };
  }

  const finalTransaction = activeTransaction;

  // 3. Verify if current result is mock
  let isMock = false;
  let sourceVpc: MinimalVpc | null = null;

  if (targetConsultation.source_consultation_id) {
    const { data: vpc } = await adminDb
      .from('vehicle_plate_consultations')
      .select('*')
      .eq('id', targetConsultation.source_consultation_id)
      .maybeSingle();

    sourceVpc = vpc;
    if (vpc && (vpc.is_mock === true || vpc.mode === 'mock')) {
      isMock = true;
    }
  }

  if (!isMock && isMockRawResponsePayload(targetConsultation.vehicle_data)) {
    isMock = true;
  }

  if (!isMock && sourceVpc && sourceVpc.is_mock === false && sourceVpc.mode === 'live') {
    return {
      success: true,
      consultationId: targetConsultation.id,
      transactionId: finalTransaction.id,
      status: targetConsultation.status,
      actionTaken: 'ALREADY_LIVE',
      message: 'A consulta já possui laudo oficial live autêntico.',
    };
  }

  const nowIso = new Date().toISOString();

  // 4. Audit Start of Reprocessing
  await adminDb.from('consultation_audit_logs').insert({
    consultation_id: targetConsultation.id,
    transaction_id: finalTransaction.id,
    actor_type: 'system',
    event: 'reprocess_started',
    details: {
      transaction_id_masked: maskId(finalTransaction.id),
      previous_source_id: sourceVpc?.id || null,
      was_mock: isMock,
    },
  });

  // 5. Safely Unlink Mock Data
  await adminDb
    .from('customer_plate_consultations')
    .update({
      vehicle_data: null,
      source_consultation_id: null,
      status: 'processing',
      updated_at: nowIso,
    })
    .eq('id', targetConsultation.id);

  await adminDb.from('consultation_audit_logs').insert({
    consultation_id: targetConsultation.id,
    transaction_id: finalTransaction.id,
    actor_type: 'system',
    event: 'reprocess_mock_unlinked',
    details: {
      previous_source_id: sourceVpc?.id || null,
      unlinked_at: nowIso,
    },
  });

  // 6. Reset or Enqueue Delivery Job
  const { data: existingJob } = await adminDb
    .from('consultation_delivery_jobs')
    .select('*')
    .eq('consultation_id', targetConsultation.id)
    .maybeSingle();

  let jobToRun: ConsultationDeliveryJobRecord | null = null;

  if (existingJob) {
    const { data: resetJob } = await adminDb
      .from('consultation_delivery_jobs')
      .update({
        status: 'pending',
        attempt_count: 0,
        next_retry_at: nowIso,
        locked_at: null,
        locked_by: null,
        lock_expires_at: null,
        last_error_code: null,
        last_error_message_safe: null,
        last_attempt_at: null,
        completed_at: null,
        failed_at: null,
        updated_at: nowIso,
      })
      .eq('id', existingJob.id)
      .select('*')
      .single();

    jobToRun = resetJob;
  } else {
    const enq = await enqueueDeliveryJob({
      consultationId: targetConsultation.id,
      transactionId: finalTransaction.id,
      dbClient: adminDb,
    });

    if (enq.success && enq.jobId) {
      const { data: newJob } = await adminDb
        .from('consultation_delivery_jobs')
        .select('*')
        .eq('id', enq.jobId)
        .maybeSingle();
      jobToRun = newJob;
    }
  }

  if (!jobToRun) {
    return {
      success: false,
      consultationId: targetConsultation.id,
      transactionId: finalTransaction.id,
      status: 'job_creation_failed',
      actionTaken: 'NO_OP',
      error: 'Não foi possível preparar o job de entrega para reprocessamento.',
    };
  }

  // 7. Execute Live Delivery
  const outcome = await executeSingleDeliveryJob(jobToRun, adminDb);

  if (outcome.status === 'completed') {
    const { data: updatedCpc } = await adminDb
      .from('customer_plate_consultations')
      .select('source_consultation_id')
      .eq('id', targetConsultation.id)
      .maybeSingle();

    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: targetConsultation.id,
      transaction_id: finalTransaction.id,
      actor_type: 'system',
      event: 'reprocess_live_provider_succeeded',
      details: {
        new_source_id: updatedCpc?.source_consultation_id || null,
        completed_at: new Date().toISOString(),
      },
    });

    return {
      success: true,
      consultationId: targetConsultation.id,
      transactionId: finalTransaction.id,
      status: 'completed',
      actionTaken: 'LIVE_LOOKUP_SUCCEEDED',
      newVpcId: updatedCpc?.source_consultation_id,
      message: 'Consulta reprocessada com sucesso via API Brasil live.',
    };
  }

  if (outcome.status === 'failed_permanent') {
    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: targetConsultation.id,
      transaction_id: finalTransaction.id,
      actor_type: 'system',
      event: 'reprocess_refund_initiated',
      details: {
        error: outcome.error || 'Falha definitiva na busca ao vivo.',
      },
    });

    return {
      success: false,
      consultationId: targetConsultation.id,
      transactionId: finalTransaction.id,
      status: 'failed_permanent',
      actionTaken: 'REFUND_INITIATED',
      error: outcome.error || 'Falha na busca live. Estorno automático disparado.',
    };
  }

  return {
    success: true,
    consultationId: targetConsultation.id,
    transactionId: finalTransaction.id,
    status: outcome.status,
    actionTaken: 'NO_OP',
    message: `Job em estado intermediário: ${outcome.status}`,
  };
}
