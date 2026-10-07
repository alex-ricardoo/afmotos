import type { SupabaseClient } from '@supabase/supabase-js';
import { logProviderEvent, type ProviderSource } from './provider-logger.ts';

export type AttemptStatus =
  | 'created'
  | 'locked'
  | 'request_sent'
  | 'response_received'
  | 'succeeded'
  | 'failed'
  | 'timed_out'
  | 'charge_status_unknown'
  | 'deduplicated'
  | 'blocked'
  | 'manual_review';

export type ChargeStatus =
  | 'not_sent'
  | 'not_incurred'
  | 'incurred'
  | 'unknown'
  | 'refunded'
  | 'disputed';

export interface LockAcquireParams {
  provider: string;
  operation: string;
  plateNormalized: string;
  logicalRequestId: string;
  lockedBy: string; // physicalRequestId
  ttlSeconds?: number;
  source: ProviderSource;
  timeoutMs: number;
}

export interface LockAcquireResult {
  acquired: boolean;
  reason?: string;
  lockKey: string;
  lockedBy?: string;
  lockedAt?: string;
  lockExpiresAt?: string;
  recoveredExpired?: boolean;
}

export class ConsultationInProgressError extends Error {
  public readonly statusCode = 409;
  public readonly code = 'CONSULTATION_IN_PROGRESS';
  public readonly lockKey: string;
  public readonly plate: string;

  constructor(plate: string, lockKey: string) {
    super(
      'Já existe uma consulta em andamento para esta placa. Para evitar cobrança duplicada, aguarde a conclusão.',
    );
    this.name = 'ConsultationInProgressError';
    this.plate = plate;
    this.lockKey = lockKey;
  }
}

export class ChargeStatusUnknownError extends Error {
  public readonly code = 'CHARGE_STATUS_UNKNOWN';
  public readonly physicalRequestId: string;
  public readonly logicalRequestId: string;
  public readonly plate: string;

  constructor(message: string, plate: string, physicalRequestId: string, logicalRequestId: string) {
    super(message);
    this.name = 'ChargeStatusUnknownError';
    this.plate = plate;
    this.physicalRequestId = physicalRequestId;
    this.logicalRequestId = logicalRequestId;
  }
}

/**
 * Atomically acquires a distributed database lock in Supabase.
 */
export async function acquireDistributedProviderLock(
  params: LockAcquireParams,
  supabase: SupabaseClient,
): Promise<LockAcquireResult> {
  const ttlSeconds = params.ttlSeconds ?? 150;
  const lockKey = `${params.provider}:${params.operation}:${params.plateNormalized}`;

  try {
    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: params.provider,
      p_operation: params.operation,
      p_plate_normalized: params.plateNormalized,
      p_logical_request_id: params.logicalRequestId,
      p_locked_by: params.lockedBy,
      p_ttl_seconds: ttlSeconds,
    });

    if (error) {
      console.warn('[DistributedLock] Erro ao chamar RPC acquire_vehicle_provider_lock:', error);
      // Fallback transacional direto se a RPC não estiver disponível (e.g., em testes locais isolados)
      return await acquireLockDirectTableFallback(params, supabase, ttlSeconds, lockKey);
    }

    const row = Array.isArray(data) ? data[0] : data;
    const res = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
    const acquired = Boolean(res?.acquired);

    return {
      acquired,
      reason: typeof res?.reason === 'string' ? res.reason : undefined,
      lockKey: typeof res?.lock_key === 'string' ? res.lock_key : lockKey,
      lockedBy: typeof res?.locked_by === 'string' ? res.locked_by : undefined,
      lockedAt: typeof res?.locked_at === 'string' ? res.locked_at : undefined,
      lockExpiresAt: typeof res?.lock_expires_at === 'string' ? res.lock_expires_at : undefined,
      recoveredExpired: Boolean(res?.recovered_expired),
    };
  } catch (err: unknown) {
    console.warn('[DistributedLock] Exceção ao tentar adquirir lock:', err);
    return await acquireLockDirectTableFallback(params, supabase, ttlSeconds, lockKey);
  }
}

/**
 * Direct table manipulation fallback for acquiring the lock.
 */
async function acquireLockDirectTableFallback(
  params: LockAcquireParams,
  supabase: SupabaseClient,
  ttlSeconds: number,
  lockKey: string,
): Promise<LockAcquireResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  // Check if existing lock is active
  const { data: existing } = await supabase
    .from('vehicle_provider_locks')
    .select('*')
    .eq('lock_key', lockKey)
    .maybeSingle();

  if (existing) {
    const existingExpires = new Date(existing.lock_expires_at);
    if (existingExpires > now) {
      return {
        acquired: false,
        reason: 'ACTIVE_LOCK',
        lockKey,
        lockedBy: existing.locked_by,
        lockedAt: existing.locked_at,
        lockExpiresAt: existing.lock_expires_at,
      };
    }

    // Expired lock recovery
    const { error: updateErr } = await supabase
      .from('vehicle_provider_locks')
      .update({
        logical_request_id: params.logicalRequestId,
        locked_by: params.lockedBy,
        locked_at: now.toISOString(),
        lock_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('lock_key', lockKey);

    if (updateErr) {
      return { acquired: false, reason: 'UPDATE_FAILED', lockKey };
    }

    return {
      acquired: true,
      recoveredExpired: true,
      lockKey,
      lockedBy: params.lockedBy,
      lockExpiresAt: expiresAt.toISOString(),
    };
  }

  // Insert new lock
  const { error: insertErr } = await supabase.from('vehicle_provider_locks').insert({
    lock_key: lockKey,
    provider: params.provider,
    operation: params.operation,
    plate_normalized: params.plateNormalized,
    logical_request_id: params.logicalRequestId,
    locked_by: params.lockedBy,
    locked_at: now.toISOString(),
    lock_expires_at: expiresAt.toISOString(),
  });

  if (insertErr) {
    return { acquired: false, reason: 'CONCURRENT_INSERT', lockKey };
  }

  return {
    acquired: true,
    recoveredExpired: false,
    lockKey,
    lockedBy: params.lockedBy,
    lockExpiresAt: expiresAt.toISOString(),
  };
}

/**
 * Releases the distributed lock only if held by the current owner (lockedBy).
 */
export async function releaseDistributedProviderLock(
  lockKey: string,
  lockedBy: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('release_vehicle_provider_lock', {
      p_lock_key: lockKey,
      p_locked_by: lockedBy,
    });

    if (!error && typeof data === 'boolean') {
      return data;
    }

    // Direct fallback
    const { error: deleteErr } = await supabase
      .from('vehicle_provider_locks')
      .delete()
      .eq('lock_key', lockKey)
      .eq('locked_by', lockedBy);

    return !deleteErr;
  } catch (err) {
    console.warn('[DistributedLock] Falha ao liberar lock:', err);
    return false;
  }
}

export interface CreateAttemptRecordParams {
  id?: string;
  consultationId?: string | null;
  customerConsultationId?: string | null;
  deliveryJobId?: string | null;
  provider: string;
  operation: string;
  plateNormalized: string;
  logicalRequestId: string;
  physicalRequestId: string;
  idempotencyKey: string;
  attemptNumber?: number;
  status: AttemptStatus;
  chargeStatus: ChargeStatus;
  timeoutMs: number;
  environment: string;
  deploymentId?: string | null;
  source: ProviderSource;
  estimatedCostCents?: number | null;
}

/**
 * Persists an attempt record in vehicle_provider_attempts before network activity.
 */
export async function createProviderAttemptRecord(
  params: CreateAttemptRecordParams,
  supabase: SupabaseClient,
): Promise<string> {
  const nowIso = new Date().toISOString();
  const payload = {
    ...(params.id ? { id: params.id } : {}),
    consultation_id: params.consultationId || null,
    customer_consultation_id: params.customerConsultationId || null,
    delivery_job_id: params.deliveryJobId || null,
    provider: params.provider,
    operation: params.operation,
    plate_normalized: params.plateNormalized,
    logical_request_id: params.logicalRequestId,
    physical_request_id: params.physicalRequestId,
    idempotency_key: params.idempotencyKey,
    attempt_number: params.attemptNumber ?? 1,
    status: params.status,
    charge_status: params.chargeStatus,
    request_started_at: nowIso,
    timeout_ms: params.timeoutMs,
    estimated_cost_cents: params.estimatedCostCents ?? 3000,
    environment: params.environment,
    deployment_id: params.deploymentId || null,
    source: params.source,
    created_at: nowIso,
    updated_at: nowIso,
  };

  try {
    const { data, error } = await supabase
      .from('vehicle_provider_attempts')
      .insert(payload)
      .select('id')
      .maybeSingle();

    if (error) {
      console.warn('[createProviderAttemptRecord] Falha ao gravar tentativa de auditoria:', error.message);
      return params.id || params.physicalRequestId;
    }
    return data?.id || params.id || params.physicalRequestId;
  } catch (err) {
    console.warn('[createProviderAttemptRecord] Exceção ao gravar tentativa:', err);
    return params.id || params.physicalRequestId;
  }
}

export interface UpdateAttemptRecordParams {
  id?: string;
  physicalRequestId: string;
  consultationId?: string | null;
  status?: AttemptStatus;
  chargeStatus?: ChargeStatus;
  requestSentAt?: string | null;
  responseReceivedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  httpStatus?: number | null;
  providerErrorCode?: string | null;
  providerMessageSafe?: string | null;
  providerRequestReference?: string | null;
  actualCostCents?: number | null;
}

/**
 * Updates a previously recorded attempt in vehicle_provider_attempts.
 */
export async function updateProviderAttemptRecord(
  params: UpdateAttemptRecordParams,
  supabase: SupabaseClient,
): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (params.consultationId !== undefined) updatePayload.consultation_id = params.consultationId;
  if (params.status !== undefined) updatePayload.status = params.status;
  if (params.chargeStatus !== undefined) updatePayload.charge_status = params.chargeStatus;
  if (params.requestSentAt !== undefined) updatePayload.request_sent_at = params.requestSentAt;
  if (params.responseReceivedAt !== undefined)
    updatePayload.response_received_at = params.responseReceivedAt;
  if (params.finishedAt !== undefined) updatePayload.finished_at = params.finishedAt;
  if (params.durationMs !== undefined) updatePayload.duration_ms = params.durationMs;
  if (params.httpStatus !== undefined) updatePayload.http_status = params.httpStatus;
  if (params.providerErrorCode !== undefined)
    updatePayload.provider_error_code = params.providerErrorCode;
  if (params.providerMessageSafe !== undefined)
    updatePayload.provider_message_safe = params.providerMessageSafe;
  if (params.providerRequestReference !== undefined)
    updatePayload.provider_request_reference = params.providerRequestReference;
  if (params.actualCostCents !== undefined)
    updatePayload.actual_cost_cents = params.actualCostCents;

  try {
    const query = supabase.from('vehicle_provider_attempts').update(updatePayload);
    if (params.id) {
      await query.eq('id', params.id);
    } else {
      await query.eq('physical_request_id', params.physicalRequestId);
    }
  } catch (err) {
    console.warn('[updateProviderAttemptRecord] Falha ao atualizar auditoria:', err);
  }
}
