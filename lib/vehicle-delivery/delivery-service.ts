import { createAdminClient } from '../supabase/admin.ts';
import { findExistingConsultation, executeVehiclePlateLookup } from '../vehicle-lookup/service.ts';
import { getVehicleLookupConfig } from '../vehicle-lookup/config.ts';
import { classifyProviderFailure } from './failure-classifier.ts';
import { initiateRefundForFailedDelivery } from '../mercadopago/refund-service.ts';
import { maskId } from '../mercadopago/observability.ts';
import {
  type ConsultationDeliveryJobRecord,
  type DeliveryJobStatus,
  type ProviderFailureClass,
} from '../mercadopago/types.ts';
import {
  isCacheEntryEligibleForPaidProduction,
  type RuntimeEnvironment,
} from './cache-eligibility.ts';

export interface EnqueueDeliveryJobParams {
  consultationId: string;
  transactionId: string;
  dbClient?: unknown;
}

export interface EnqueueDeliveryJobResult {
  success: boolean;
  jobId: string;
  alreadyExists: boolean;
  status: DeliveryJobStatus;
  error?: string;
}

export interface ProcessBatchOptions {
  workerId?: string;
  batchSize?: number;
  lockDurationSeconds?: number;
  dbClient?: unknown;
}

export interface ProcessBatchResult {
  claimedCount: number;
  completedCount: number;
  retriedCount: number;
  failedCount: number;
  durationMs: number;
}

/**
 * Calcula o próximo timestamp de retentativa com backoff exponencial e jitter.
 */
export function calculateNextRetryTimestamp(
  attemptCount: number,
  retryAfterSeconds?: number | null,
): string {
  const now = Date.now();

  if (retryAfterSeconds && retryAfterSeconds > 0) {
    const jitter = Math.floor(Math.random() * 10);
    return new Date(now + (retryAfterSeconds + jitter) * 1000).toISOString();
  }

  // Política: tentativa 2 = 60s, tentativa 3 = 300s (5m), tentativa 4 = 900s (15m), tentativa 5 = 1800s (30m)
  let baseDelaySeconds = 60;
  let jitterMaxSeconds = 15;

  if (attemptCount === 2) {
    baseDelaySeconds = 60; // 1 minuto
    jitterMaxSeconds = 15;
  } else if (attemptCount === 3) {
    baseDelaySeconds = 300; // 5 minutos
    jitterMaxSeconds = 30;
  } else if (attemptCount === 4) {
    baseDelaySeconds = 900; // 15 minutos
    jitterMaxSeconds = 60;
  } else {
    baseDelaySeconds = 1800; // 30 minutos
    jitterMaxSeconds = 60;
  }

  const jitter = Math.floor(Math.random() * jitterMaxSeconds);
  const totalDelayMs = (baseDelaySeconds + jitter) * 1000;

  return new Date(now + totalDelayMs).toISOString();
}

/**
 * Emite log estruturado padronizado para a fila de entrega.
 */
function logVehicleDeliveryEvent(
  eventName: string,
  data: Record<string, unknown>,
  level: 'info' | 'warn' | 'error' = 'info',
): void {
  const payload = {
    tag: '[VEHICLE_DELIVERY]',
    event: `vehicle_delivery.${eventName}`,
    timestamp: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    ...data,
  };

  const json = JSON.stringify(payload);
  if (level === 'error') {
    console.error(json);
  } else if (level === 'warn') {
    console.warn(json);
  } else {
    console.log(json);
  }
}

/**
 * Enfileira de forma atômica e idempotente um job de entrega de laudo veicular
 * após a aprovação do pagamento.
 */
export async function enqueueDeliveryJob({
  consultationId,
  transactionId,
  dbClient,
}: EnqueueDeliveryJobParams): Promise<EnqueueDeliveryJobResult> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  // 1. Verifica se já existe job ativo
  const { data: existingJob } = await adminDb
    .from('consultation_delivery_jobs')
    .select('id, status')
    .eq('consultation_id', consultationId)
    .in('status', ['pending', 'processing', 'retry_scheduled'])
    .maybeSingle();

  if (existingJob) {
    return {
      success: true,
      jobId: existingJob.id,
      alreadyExists: true,
      status: existingJob.status as DeliveryJobStatus,
    };
  }

  // 2. Insere novo job com status pending
  const { data: newJob, error: insertError } = await adminDb
    .from('consultation_delivery_jobs')
    .insert({
      consultation_id: consultationId,
      transaction_id: transactionId,
      job_type: 'vehicle_report_delivery',
      status: 'pending',
      attempt_count: 0,
      max_attempts: 5,
      next_retry_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertError || !newJob) {
    // Se colidiu por corrida concorrente, recupera o job ativo
    const { data: collided } = await adminDb
      .from('consultation_delivery_jobs')
      .select('id, status')
      .eq('consultation_id', consultationId)
      .maybeSingle();

    if (collided) {
      return {
        success: true,
        jobId: collided.id,
        alreadyExists: true,
        status: collided.status as DeliveryJobStatus,
      };
    }

    return {
      success: false,
      jobId: '',
      alreadyExists: false,
      status: 'pending',
      error: insertError?.message || 'Falha ao criar job de entrega',
    };
  }

  // 3. Atualiza a consulta do cliente para 'paid'
  await adminDb
    .from('customer_plate_consultations')
    .update({
      payment_status: 'paid',
      status: 'paid',
      payment_date: new Date().toISOString(),
      latest_payment_transaction_id: transactionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', consultationId);

  // 4. Log e Auditoria
  logVehicleDeliveryEvent('job_created', {
    jobIdMasked: maskId(newJob.id),
    consultationIdMasked: maskId(consultationId),
    transactionIdMasked: maskId(transactionId),
  });

  await adminDb.from('consultation_audit_logs').insert({
    consultation_id: consultationId,
    transaction_id: transactionId,
    actor_type: 'system',
    event: 'delivery_job_created',
    details: {
      job_id: newJob.id,
    },
  });

  return {
    success: true,
    jobId: newJob.id,
    alreadyExists: false,
    status: 'pending',
  };
}

/**
 * Executa um único job de entrega aplicando cache-first, chamada live segura,
 * retry com backoff e disparo de estorno em caso de falha definitiva.
 */
export async function executeSingleDeliveryJob(
  job: ConsultationDeliveryJobRecord,
  dbClient?: unknown,
): Promise<{ success: boolean; status: DeliveryJobStatus; error?: string }> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();
  const startTime = Date.now();

  logVehicleDeliveryEvent('job_claimed', {
    jobIdMasked: maskId(job.id),
    consultationIdMasked: maskId(job.consultation_id),
    attempt: job.attempt_count,
    maxAttempts: job.max_attempts,
  });

  // 1. Carrega a consulta veicular
  const { data: consultation, error: consError } = await adminDb
    .from('customer_plate_consultations')
    .select('*')
    .eq('id', job.consultation_id)
    .maybeSingle();

  if (consError || !consultation) {
    const errorMsg = 'Consulta veicular vinculada ao job não encontrada.';
    await adminDb
      .from('consultation_delivery_jobs')
      .update({
        status: 'failed_permanent',
        last_error_code: 'CONSULTATION_NOT_FOUND',
        last_error_message_safe: errorMsg,
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return { success: false, status: 'failed_permanent', error: errorMsg };
  }

  // Se já concluída com dados, apenas finaliza o job com sucesso
  if (consultation.status === 'completed' && consultation.vehicle_data) {
    await adminDb
      .from('consultation_delivery_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return { success: true, status: 'completed' };
  }

  const plateToLookup = consultation.plate_normalized || consultation.plate;
  const runtimeEnvironment: RuntimeEnvironment =
    process.env.VERCEL_ENV === 'production'
      ? 'production'
      : process.env.VERCEL_ENV === 'preview'
        ? 'preview'
        : 'development';

  logVehicleDeliveryEvent('cache_lookup_started', {
    jobIdMasked: maskId(job.id),
    consultationIdMasked: maskId(consultation.id),
    plateMasked: maskId(plateToLookup),
    runtimeEnvironment,
  });

  // 2. RB-02: Cache-First Check with Strict Paid Production Eligibility
  let cacheHit = false;
  try {
    const cached = await findExistingConsultation(plateToLookup, adminDb, {
      requireLiveOnly: runtimeEnvironment === 'production',
    });

    if (cached) {
      const eligibility = isCacheEntryEligibleForPaidProduction({
        runtimeEnvironment,
        cacheRecord: cached,
        isPaidTransaction: true,
      });

      if (eligibility.eligible) {
        cacheHit = true;
        logVehicleDeliveryEvent('cache_hit', {
          jobIdMasked: maskId(job.id),
          consultationIdMasked: maskId(consultation.id),
          plateMasked: maskId(plateToLookup),
          sourceConsultationId: cached.id,
          provider: cached.provider,
          isMock: cached.is_mock,
        });

        const nowIso = new Date().toISOString();

        await adminDb
          .from('customer_plate_consultations')
          .update({
            vehicle_data: cached.raw_response,
            source_consultation_id: cached.id,
            status: 'completed',
            processed_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', consultation.id);

        await adminDb
          .from('consultation_delivery_jobs')
          .update({
            status: 'completed',
            completed_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', job.id);

        await adminDb.from('consultation_audit_logs').insert({
          consultation_id: consultation.id,
          transaction_id: job.transaction_id,
          actor_type: 'system',
          event: 'delivery_cache_hit',
          details: {
            job_id: job.id,
            source_consultation_id: cached.id,
            provider: cached.provider,
            is_mock: cached.is_mock,
            duration_ms: Date.now() - startTime,
          },
        });

        return { success: true, status: 'completed' };
      } else {
        // Cache found but rejected (e.g., MOCK_CACHE_IN_PRODUCTION)
        logVehicleDeliveryEvent(
          'cache_rejected',
          {
            jobIdMasked: maskId(job.id),
            consultationIdMasked: maskId(consultation.id),
            transactionIdMasked: maskId(job.transaction_id),
            cacheConsultationIdMasked: maskId(cached.id),
            reasonCode: eligibility.reasonCode || 'MOCK_CACHE_IN_PRODUCTION',
            nextAction: eligibility.nextAction,
            provider: cached.provider,
            source: cached.mode,
            isMock: cached.is_mock,
            runtimeEnvironment,
          },
          'warn',
        );

        await adminDb.from('consultation_audit_logs').insert({
          consultation_id: consultation.id,
          transaction_id: job.transaction_id,
          actor_type: 'system',
          event: 'cache_mock_rejected_in_production',
          details: {
            job_id: job.id,
            source_cache_id: cached.id,
            reason_code: eligibility.reasonCode,
            next_action: eligibility.nextAction,
            is_mock: cached.is_mock,
            source: cached.mode,
            provider: cached.provider,
            runtime_environment: runtimeEnvironment,
            duration_ms: Date.now() - startTime,
          },
        });
      }
    }
  } catch (cacheErr) {
    console.warn(
      '[executeSingleDeliveryJob] Erro ao verificar cache, prosseguindo para live:',
      cacheErr,
    );
  }

  // 3. Cache Miss (ou Cache Rejeitado): Preparação para chamada LIVE
  if (!cacheHit) {
    logVehicleDeliveryEvent('cache_miss', {
      jobIdMasked: maskId(job.id),
      consultationIdMasked: maskId(consultation.id),
      plateMasked: maskId(plateToLookup),
    });
  }

  const config = getVehicleLookupConfig();
  const isProd = process.env.VERCEL_ENV === 'production';

  // RB-03: Guarda de segurança de modo mock em produção
  if (isProd && config.mode === 'mock') {
    logVehicleDeliveryEvent(
      'mock_result_blocked',
      {
        jobIdMasked: maskId(job.id),
        consultationIdMasked: maskId(consultation.id),
        transactionIdMasked: maskId(job.transaction_id),
        reason: 'MOCK_MODE_IN_PRODUCTION',
      },
      'error',
    );

    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: job.transaction_id,
      actor_type: 'system',
      event: 'mock_result_blocked',
      details: {
        job_id: job.id,
        reason: 'MOCK_MODE_IN_PRODUCTION',
      },
    });

    const classified = classifyProviderFailure('MOCK_MODE_IN_PRODUCTION');
    return await handleJobPermanentFailure(
      job,
      consultation,
      classified.failureCode,
      classified.errorMessageSafe,
      500,
      classified.failureClass,
      adminDb,
    );
  }

  // Guarda de token ausente em produção live
  if (config.mode === 'live' && !config.apiBrasilToken) {
    const classified = classifyProviderFailure('Token da API Brasil não configurado');
    return await handleJobPermanentFailure(
      job,
      consultation,
      classified.failureCode,
      classified.errorMessageSafe,
      500,
      classified.failureClass,
      adminDb,
    );
  }

  // 4. Executa a chamada à API Brasil
  logVehicleDeliveryEvent('provider_request_started', {
    jobIdMasked: maskId(job.id),
    consultationIdMasked: maskId(consultation.id),
    provider: 'apibrasil',
    attempt: job.attempt_count,
  });

  await adminDb.from('consultation_audit_logs').insert({
    consultation_id: consultation.id,
    transaction_id: job.transaction_id,
    actor_type: 'system',
    event: 'live_provider_attempt_started',
    details: {
      job_id: job.id,
      attempt: job.attempt_count,
    },
  });

  try {
    const lookupResult = await executeVehiclePlateLookup(
      {
        plate: plateToLookup,
        userId: consultation.user_id,
        confirmedPlate: plateToLookup,
        requireLiveOnly: isProd,
      },
      adminDb,
    );

    if (lookupResult.success && lookupResult.record) {
      // Bloqueio rigoroso em produção se vier mock por qualquer motivo anômalo
      if (isProd && lookupResult.record.is_mock) {
        logVehicleDeliveryEvent(
          'mock_result_blocked',
          {
            jobIdMasked: maskId(job.id),
            consultationIdMasked: maskId(consultation.id),
            transactionIdMasked: maskId(job.transaction_id),
            reason: 'MOCK_RECORD_RETURNED_IN_PRODUCTION',
          },
          'error',
        );

        await adminDb.from('consultation_audit_logs').insert({
          consultation_id: consultation.id,
          transaction_id: job.transaction_id,
          actor_type: 'system',
          event: 'mock_result_blocked',
          details: {
            job_id: job.id,
            reason: 'MOCK_RECORD_RETURNED_IN_PRODUCTION',
          },
        });

        const classified = classifyProviderFailure('MOCK_MODE_IN_PRODUCTION');
        return await handleJobPermanentFailure(
          job,
          consultation,
          classified.failureCode,
          classified.errorMessageSafe,
          500,
          classified.failureClass,
          adminDb,
        );
      }

      logVehicleDeliveryEvent('provider_response_received', {
        jobIdMasked: maskId(job.id),
        consultationIdMasked: maskId(consultation.id),
        provider: 'apibrasil',
        attempt: job.attempt_count,
        isMock: lookupResult.record.is_mock,
      });

      const nowIso = new Date().toISOString();

      await adminDb
        .from('customer_plate_consultations')
        .update({
          vehicle_data: lookupResult.record.raw_response,
          source_consultation_id: lookupResult.record.id,
          status: 'completed',
          processed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', consultation.id);

      await adminDb
        .from('consultation_delivery_jobs')
        .update({
          status: 'completed',
          completed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', job.id);

      logVehicleDeliveryEvent('completed', {
        jobIdMasked: maskId(job.id),
        consultationIdMasked: maskId(consultation.id),
        durationMs: Date.now() - startTime,
        attempt: job.attempt_count,
      });

      await adminDb.from('consultation_audit_logs').insert({
        consultation_id: consultation.id,
        transaction_id: job.transaction_id,
        actor_type: 'system',
        event: 'live_provider_success',
        details: {
          job_id: job.id,
          attempt: job.attempt_count,
          duration_ms: Date.now() - startTime,
          vpc_id: lookupResult.record.id,
          is_mock: lookupResult.record.is_mock,
        },
      });

      return { success: true, status: 'completed' };
    } else {
      throw new Error(lookupResult.message || 'Falha desconhecida na API Brasil.');
    }
  } catch (err: unknown) {
    const classified = classifyProviderFailure(err);

    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: job.transaction_id,
      actor_type: 'system',
      event: 'live_provider_failed',
      details: {
        job_id: job.id,
        attempt: job.attempt_count,
        failure_code: classified.failureCode,
        failure_class: classified.failureClass,
        http_status: classified.httpStatus,
      },
    });

    logVehicleDeliveryEvent(
      'provider_request_failed',
      {
        jobIdMasked: maskId(job.id),
        consultationIdMasked: maskId(consultation.id),
        failureClass: classified.failureClass,
        failureCode: classified.failureCode,
        httpStatus: classified.httpStatus,
        attempt: job.attempt_count,
        maxAttempts: job.max_attempts,
      },
      'warn',
    );

    // 5. Avalia se é falha transitória elegível a retry
    const isRetryable =
      (classified.failureClass === 'transient' ||
        (classified.failureClass === 'unknown' && job.attempt_count < 3)) &&
      job.attempt_count < job.max_attempts;

    if (isRetryable) {
      const nextRetryAt = calculateNextRetryTimestamp(
        job.attempt_count,
        classified.retryAfterSeconds,
      );

      await adminDb
        .from('consultation_delivery_jobs')
        .update({
          status: 'retry_scheduled',
          last_error_code: classified.failureCode,
          last_error_message_safe: classified.errorMessageSafe,
          last_http_status: classified.httpStatus,
          last_failure_class: classified.failureClass,
          next_retry_at: nextRetryAt,
          locked_at: null,
          locked_by: null,
          lock_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      await adminDb
        .from('customer_plate_consultations')
        .update({
          status: 'retry_scheduled',
          lookup_error_message: classified.errorMessageSafe,
          updated_at: new Date().toISOString(),
        })
        .eq('id', consultation.id);

      logVehicleDeliveryEvent('retry_scheduled', {
        jobIdMasked: maskId(job.id),
        consultationIdMasked: maskId(consultation.id),
        nextRetryAt,
        attempt: job.attempt_count,
      });

      await adminDb.from('consultation_audit_logs').insert({
        consultation_id: consultation.id,
        transaction_id: job.transaction_id,
        actor_type: 'system',
        event: 'apibrasil_retry_scheduled',
        details: {
          job_id: job.id,
          failure_code: classified.failureCode,
          next_retry_at: nextRetryAt,
          attempt: job.attempt_count,
        },
      });

      return { success: false, status: 'retry_scheduled', error: classified.errorMessageSafe };
    }

    // 6. Falha Permanente ou Esgotamento de Tentativas
    return await handleJobPermanentFailure(
      job,
      consultation,
      classified.failureCode,
      classified.errorMessageSafe,
      classified.httpStatus,
      classified.failureClass,
      adminDb,
      classified.isInsufficientCredits,
    );
  }
}

/**
 * Trata o encerramento por falha permanente: marca job e consulta, alerta suporte se necessário
 * e dispara o processo de estorno seguro no Mercado Pago.
 */
async function handleJobPermanentFailure(
  job: ConsultationDeliveryJobRecord,
  consultation: { id: string; user_id?: string; status?: string },
  failureCode: string,
  errorMessageSafe: string,
  httpStatus: number | null,
  failureClass: ProviderFailureClass,
  adminDb: ReturnType<typeof createAdminClient>,
  isInsufficientCredits = false,
): Promise<{ success: boolean; status: DeliveryJobStatus; error: string }> {
  const nowIso = new Date().toISOString();

  await adminDb
    .from('consultation_delivery_jobs')
    .update({
      status: 'failed_permanent',
      last_error_code: failureCode,
      last_error_message_safe: errorMessageSafe,
      last_http_status: httpStatus,
      last_failure_class: failureClass,
      failed_at: nowIso,
      locked_at: null,
      locked_by: null,
      lock_expires_at: null,
      updated_at: nowIso,
    })
    .eq('id', job.id);

  await adminDb
    .from('customer_plate_consultations')
    .update({
      status: 'failed_permanent',
      lookup_error_message: errorMessageSafe,
      updated_at: nowIso,
    })
    .eq('id', consultation.id);

  logVehicleDeliveryEvent(
    'failed_permanent',
    {
      jobIdMasked: maskId(job.id),
      consultationIdMasked: maskId(consultation.id),
      failureCode,
      isInsufficientCredits,
    },
    'error',
  );

  // Alerta explícito de suporte se faltar saldo
  if (isInsufficientCredits) {
    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: job.transaction_id,
      actor_type: 'system',
      event: 'support_attention_required',
      details: {
        job_id: job.id,
        alert: 'Ação necessária: recarregar saldo da API Brasil.',
        failure_code: failureCode,
      },
    });
  }

  // Disparo automático do estorno total no Mercado Pago
  try {
    await initiateRefundForFailedDelivery({
      transactionId: job.transaction_id,
      consultationId: consultation.id,
      reasonCode: failureCode,
      reasonSafe: errorMessageSafe,
      dbClient: adminDb,
    });
  } catch (refundErr) {
    console.error('[handleJobPermanentFailure] Erro ao disparar estorno automático:', refundErr);
  }

  return { success: false, status: 'failed_permanent', error: errorMessageSafe };
}

/**
 * Worker Batch Processor: Reivindica e processa jobs pendentes utilizando RPC Postgres.
 */
export async function claimAndProcessDeliveryJobs(
  options: ProcessBatchOptions = {},
): Promise<ProcessBatchResult> {
  const adminDb = (options.dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();
  const startTime = Date.now();
  const workerId = options.workerId || `worker-${crypto.randomUUID()}`;
  const batchSize = options.batchSize || 5;
  const lockDurationSeconds = options.lockDurationSeconds || 300;

  let claimedJobs: ConsultationDeliveryJobRecord[] = [];

  try {
    const { data: jobs, error: rpcError } = await adminDb.rpc('claim_next_delivery_jobs', {
      p_worker_id: workerId,
      p_batch_size: batchSize,
      p_lock_duration_seconds: lockDurationSeconds,
    });

    if (rpcError) {
      console.warn(
        '[claimAndProcessDeliveryJobs] RPC claim_next_delivery_jobs falhou, usando fallback direto:',
        rpcError,
      );
      // Fallback gracioso com update direto se RPC não existir no ambiente
      const { data: directJobs } = await adminDb
        .from('consultation_delivery_jobs')
        .select('*')
        .in('status', ['pending', 'retry_scheduled'])
        .lte('next_retry_at', new Date().toISOString())
        .order('next_retry_at', { ascending: true })
        .limit(batchSize);

      claimedJobs = (directJobs as ConsultationDeliveryJobRecord[]) || [];
    } else {
      claimedJobs = (jobs as ConsultationDeliveryJobRecord[]) || [];
    }
  } catch (err) {
    console.error('[claimAndProcessDeliveryJobs] Falha ao claimar jobs:', err);
    return {
      claimedCount: 0,
      completedCount: 0,
      retriedCount: 0,
      failedCount: 0,
      durationMs: Date.now() - startTime,
    };
  }

  let completedCount = 0;
  let retriedCount = 0;
  let failedCount = 0;

  for (const job of claimedJobs) {
    const outcome = await executeSingleDeliveryJob(job, adminDb);
    if (outcome.status === 'completed') {
      completedCount++;
    } else if (outcome.status === 'retry_scheduled') {
      retriedCount++;
    } else if (outcome.status === 'failed_permanent') {
      failedCount++;
    }
  }

  return {
    claimedCount: claimedJobs.length,
    completedCount,
    retriedCount,
    failedCount,
    durationMs: Date.now() - startTime,
  };
}

export type DeliveryActor = 'webhook' | 'reconcile' | 'customer_screen' | 'admin' | 'system';

export interface ProcessEligibleDeliveryJobResult {
  success: boolean;
  status: DeliveryJobStatus;
  delivered: boolean;
  retryNotDue?: boolean;
  alreadyLocked?: boolean;
  nextRetryAt?: string | null;
  remainingSeconds?: number;
  attemptCount?: number;
  maxAttempts?: number;
  message: string;
  error?: string;
}

/**
 * Cria ou recupera de forma idempotente o job de entrega associado a uma transação aprovada.
 */
export async function createOrGetDeliveryJob(
  transactionId: string,
  customDb?: unknown,
): Promise<{ success: boolean; job?: ConsultationDeliveryJobRecord; error?: string }> {
  const adminDb = (customDb as ReturnType<typeof createAdminClient>) || createAdminClient();

  const { data: transaction, error: txError } = await adminDb
    .from('payment_transactions')
    .select('id, consultation_id, status')
    .eq('id', transactionId)
    .maybeSingle();

  if (txError || !transaction) {
    return { success: false, error: 'Transação não encontrada.' };
  }

  const enqueueRes = await enqueueDeliveryJob({
    consultationId: transaction.consultation_id,
    transactionId: transaction.id,
    dbClient: adminDb,
  });

  if (!enqueueRes.success && !enqueueRes.alreadyExists) {
    return { success: false, error: enqueueRes.error || 'Falha ao enfileirar job.' };
  }

  const { data: job } = await adminDb
    .from('consultation_delivery_jobs')
    .select('*')
    .eq('id', enqueueRes.jobId)
    .maybeSingle();

  return { success: true, job: job as ConsultationDeliveryJobRecord };
}

/**
 * Processa com segurança um job elegível, respeitando next_retry_at, locks atômicos e concorrência.
 * Usado pelo endpoint do cliente em tela, ações administrativas e reconciliações.
 */
export async function processEligibleDeliveryJob(
  jobId: string,
  actor: DeliveryActor,
  options?: { force?: boolean; dbClient?: unknown },
): Promise<ProcessEligibleDeliveryJobResult> {
  const adminDb =
    (options?.dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  // 1. Carrega o job
  const { data: job, error: jobError } = await adminDb
    .from('consultation_delivery_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (jobError || !job) {
    return {
      success: false,
      status: 'pending',
      delivered: false,
      message: 'Job de entrega não encontrado.',
      error: jobError?.message,
    };
  }

  // Se já concluído
  if (job.status === 'completed') {
    return {
      success: true,
      status: 'completed',
      delivered: true,
      message: 'Laudo já entregue com sucesso.',
    };
  }

  // Se estado terminal
  if (['failed_permanent', 'cancelled'].includes(job.status)) {
    return {
      success: false,
      status: job.status as DeliveryJobStatus,
      delivered: false,
      message: 'Job em estado terminal definitivo.',
    };
  }

  const now = Date.now();

  // 2. Verifica elegibilidade de horário se em retry_scheduled
  if (job.status === 'retry_scheduled' && job.next_retry_at && !options?.force) {
    const nextRetryTime = new Date(job.next_retry_at).getTime();
    if (nextRetryTime > now) {
      const remainingSeconds = Math.ceil((nextRetryTime - now) / 1000);
      logVehicleDeliveryEvent('retry_not_due', {
        jobIdMasked: maskId(job.id),
        actor,
        remainingSeconds,
        nextRetryAt: job.next_retry_at,
      });

      return {
        success: true,
        status: 'retry_scheduled',
        delivered: false,
        retryNotDue: true,
        nextRetryAt: job.next_retry_at,
        remainingSeconds,
        attemptCount: job.attempt_count,
        maxAttempts: job.max_attempts,
        message: 'Aguardando horário programado para nova tentativa.',
      };
    }
  }

  // 3. Concorrência e Lock Atômico
  if (job.locked_at && job.lock_expires_at) {
    const lockExpires = new Date(job.lock_expires_at).getTime();
    if (lockExpires > now && job.status === 'processing') {
      logVehicleDeliveryEvent('job_claim_rejected', {
        jobIdMasked: maskId(job.id),
        actor,
        lockedBy: job.locked_by,
      });

      return {
        success: true,
        status: 'processing',
        delivered: false,
        alreadyLocked: true,
        message: 'Consulta já está sendo processada por outra requisição.',
      };
    }
  }

  // Adquire lock e incrementa tentativa
  const newAttempt = (job.attempt_count || 0) + 1;
  const lockExpiresAt = new Date(now + 300_000).toISOString(); // 5 minutos de lease

  const { data: lockedJob, error: lockError } = await adminDb
    .from('consultation_delivery_jobs')
    .update({
      status: 'processing',
      attempt_count: newAttempt,
      locked_at: new Date(now).toISOString(),
      locked_by: actor,
      lock_expires_at: lockExpiresAt,
      last_attempt_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    })
    .eq('id', job.id)
    .select('*')
    .single();

  if (lockError || !lockedJob) {
    return {
      success: false,
      status: job.status as DeliveryJobStatus,
      delivered: false,
      message: 'Falha ao adquirir lock do job para execução.',
      error: lockError?.message,
    };
  }

  // 4. Executa a entrega
  const outcome = await executeSingleDeliveryJob(
    lockedJob as ConsultationDeliveryJobRecord,
    adminDb,
  );

  return {
    success: outcome.success,
    status: outcome.status,
    delivered: outcome.status === 'completed',
    attemptCount: newAttempt,
    maxAttempts: job.max_attempts,
    message:
      outcome.status === 'completed'
        ? 'Laudo veicular entregue com sucesso.'
        : outcome.status === 'retry_scheduled'
          ? 'Instabilidade temporária detectada. Nova tentativa programada.'
          : 'Não foi possível concluir a entrega do laudo; estorno acionado.',
    error: outcome.error,
  };
}
