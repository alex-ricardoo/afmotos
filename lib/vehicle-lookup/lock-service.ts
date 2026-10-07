import type { SupabaseClient } from '@supabase/supabase-js';
import { logProviderEvent, type ProviderSource } from './provider-logger.ts';

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

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
  forceBypass?: boolean;
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

export interface LockRenewResult {
  renewed: boolean;
  lockKey: string;
  lockedBy?: string;
  newExpiresAt?: string;
  reason?: string;
}

export interface AmbiguousAttemptCheckResult {
  hasAmbiguousAttempt: boolean;
  attemptId?: string;
  status?: string;
  chargeStatus?: string;
  logicalRequestId?: string;
  physicalRequestId?: string;
}

// ---------------------------------------------------------------------------
// Error Classes
// ---------------------------------------------------------------------------

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
  public readonly attempts: number = 1;

  constructor(message: string, plate: string, physicalRequestId: string, logicalRequestId: string) {
    super(message);
    this.name = 'ChargeStatusUnknownError';
    this.plate = plate;
    this.physicalRequestId = physicalRequestId;
    this.logicalRequestId = logicalRequestId;
  }
}

/**
 * BLOQUEADOR 1: Erro fechado quando a RPC de lock não está disponível.
 * Se a RPC falhar, NUNCA se deve usar fallback não atômico.
 * A chamada à API Brasil é IMPEDIDA.
 */
export class ProviderLockUnavailableError extends Error {
  public readonly code = 'LOCK_UNAVAILABLE';
  public readonly statusCode = 503;

  constructor(message?: string) {
    super(
      message ||
        'O serviço de lock distribuído não está disponível. A consulta à API Brasil foi impedida para evitar cobrança duplicada.',
    );
    this.name = 'ProviderLockUnavailableError';
  }
}

/**
 * BLOQUEADOR 4: Erro quando a persistência local falha após resposta
 * bem-sucedida do provedor.
 */
export class ProviderPersistenceAfterSuccessError extends Error {
  public readonly code = 'DATABASE_PERSISTENCE_FAILED_AFTER_PROVIDER_SUCCESS';
  public readonly statusCode = 503;

  constructor(message?: string) {
    super(
      message ||
        'Os dados da consulta veicular foram recebidos com sucesso, porém houve falha ao salvar no banco de dados. Para evitar cobrança duplicada, a retentativa automática foi bloqueada. É necessário reprocessamento manual.',
    );
    this.name = 'ProviderPersistenceAfterSuccessError';
  }
}

/**
 * BLOQUEADOR 5 & 7: Erro quando existe tentativa ambígua recente
 * que impede nova consulta automática.
 */
export class AmbiguousAttemptGuardError extends Error {
  public readonly code = 'CHARGE_STATUS_UNKNOWN_RECONCILIATION_REQUIRED';
  public readonly statusCode = 409;
  public readonly previousAttemptId?: string;

  constructor(plate: string, previousAttemptId?: string) {
    super(
      `Existe uma tentativa recente com cobrança desconhecida para a placa ${plate}. É necessária reconciliação manual antes de nova consulta.`,
    );
    this.name = 'AmbiguousAttemptGuardError';
    this.previousAttemptId = previousAttemptId;
  }
}

// ---------------------------------------------------------------------------
// Lock Acquisition — BLOQUEADOR 1: Sem fallback não atômico em produção
// ---------------------------------------------------------------------------

/**
 * Atomically acquires a distributed database lock via Supabase RPC.
 *
 * BLOQUEADOR 1: Se a RPC falhar por qualquer motivo, lança
 * ProviderLockUnavailableError. NUNCA usa fallback de SELECT+INSERT/UPDATE
 * direto no caminho de produção.
 */
export async function acquireDistributedProviderLock(
  params: LockAcquireParams,
  supabase: SupabaseClient,
): Promise<LockAcquireResult> {
  const ttlSeconds = params.ttlSeconds ?? 180;
  const lockKey = `${params.provider}:${params.operation}:${params.plateNormalized}`;

  try {
    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: params.provider,
      p_operation: params.operation,
      p_plate_normalized: params.plateNormalized,
      p_logical_request_id: params.logicalRequestId,
      p_locked_by: params.lockedBy,
      p_ttl_seconds: ttlSeconds,
      p_force_bypass: Boolean(params.forceBypass),
    });

    if (error) {
      // BLOQUEADOR 1: RPC falhou — NÃO usar fallback.
      // Registrar e lançar erro fechado.
      logProviderEvent({
        event: 'provider_lock_unavailable',
        provider: params.provider,
        operation: params.operation,
        placa_normalizada: params.plateNormalized,
        logical_request_id: params.logicalRequestId,
        physical_request_id: params.lockedBy,
        attempt_number: 1,
        timeout_ms: params.timeoutMs,
        duration_ms: 0,
        status: 'blocked',
        charge_status: 'not_sent',
        deployment_id: process.env.VERCEL_DEPLOYMENT_ID || null,
        origem: params.source,
        extra: {
          rpc_error_code: error.code,
          rpc_error_message: error.message,
        },
      });

      throw new ProviderLockUnavailableError(
        `Falha na RPC de lock distribuído (${error.code}). Chamada à API Brasil impedida.`,
      );
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
    // Se já é um ProviderLockUnavailableError, re-lançar
    if (err instanceof ProviderLockUnavailableError) {
      throw err;
    }

    // BLOQUEADOR 1: Exceção inesperada — NÃO usar fallback.
    logProviderEvent({
      event: 'provider_lock_unavailable',
      provider: params.provider,
      operation: params.operation,
      placa_normalizada: params.plateNormalized,
      logical_request_id: params.logicalRequestId,
      physical_request_id: params.lockedBy,
      attempt_number: 1,
      timeout_ms: params.timeoutMs,
      duration_ms: 0,
      status: 'blocked',
      charge_status: 'not_sent',
      deployment_id: process.env.VERCEL_DEPLOYMENT_ID || null,
      origem: params.source,
      extra: {
        exception_type: err instanceof Error ? err.name : 'unknown',
        exception_message: err instanceof Error ? err.message : String(err),
      },
    });

    throw new ProviderLockUnavailableError(
      'Exceção inesperada ao adquirir lock distribuído. Chamada à API Brasil impedida.',
    );
  }
}

// ---------------------------------------------------------------------------
// Lock Release — sem fallback direto em produção
// ---------------------------------------------------------------------------

/**
 * Releases the distributed lock only if held by the current owner (lockedBy).
 * Se a RPC falhar, o lock expirará naturalmente pelo TTL. Não usar fallback direto.
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

    // Em produção, se a RPC falhar, o lock vai expirar pelo TTL.
    // Não usar fallback de DELETE direto — seria não atômico.
    console.warn(
      '[DistributedLock] Falha ao liberar lock via RPC. O lock expirará por TTL.',
      error?.message,
    );
    return false;
  } catch (err) {
    console.warn('[DistributedLock] Exceção ao liberar lock. O lock expirará por TTL.', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Lock Renewal — BLOQUEADOR 5: Renovação controlada de lease
// ---------------------------------------------------------------------------

/**
 * Renews the lock lease via RPC.
 * Only succeeds if the caller still holds the lock and it hasn't expired.
 */
export async function renewDistributedProviderLock(
  lockKey: string,
  lockedBy: string,
  ttlSeconds: number,
  supabase: SupabaseClient,
): Promise<LockRenewResult> {
  if (!supabase || typeof supabase.rpc !== 'function') {
    return {
      renewed: true,
      lockKey,
      lockedBy,
      newExpiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };
  }

  try {
    const { data, error } = await supabase.rpc('renew_vehicle_provider_lock', {
      p_lock_key: lockKey,
      p_locked_by: lockedBy,
      p_ttl_seconds: ttlSeconds,
    });

    if (error) {
      return {
        renewed: false,
        lockKey,
        reason: `RPC error: ${error.code}`,
      };
    }

    const row = Array.isArray(data) ? data[0] : data;
    const res = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;

    return {
      renewed: Boolean(res?.renewed),
      lockKey,
      newExpiresAt: typeof res?.new_expires_at === 'string' ? res.new_expires_at : undefined,
      reason: typeof res?.reason === 'string' ? res.reason : undefined,
    };
  } catch (err) {
    return {
      renewed: false,
      lockKey,
      reason: err instanceof Error ? err.message : 'unknown',
    };
  }
}

// ---------------------------------------------------------------------------
// Ambiguous Attempt Guard — BLOQUEADOR 5 & 7
// ---------------------------------------------------------------------------

/**
 * Checks if there's a recent ambiguous attempt that should block automatic
 * reprocessing. Uses the RPC for atomic, consistent check.
 */
export async function checkAmbiguousProviderAttempt(
  provider: string,
  operation: string,
  plateNormalized: string,
  supabase: SupabaseClient,
): Promise<AmbiguousAttemptCheckResult> {
  if (!supabase || typeof supabase.rpc !== 'function') {
    return { hasAmbiguousAttempt: false };
  }

  try {
    const { data, error } = await supabase.rpc('check_ambiguous_provider_attempt', {
      p_provider: provider,
      p_operation: operation,
      p_plate_normalized: plateNormalized,
    });

    if (error) {
      // Em caso de falha na RPC de verificação, ser conservador: bloquear
      console.warn('[AmbiguousAttemptGuard] Falha na RPC de verificação. Bloqueando por segurança.');
      return { hasAmbiguousAttempt: true };
    }

    const row = Array.isArray(data) ? data[0] : data;
    const res = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;

    return {
      hasAmbiguousAttempt: Boolean(res?.has_ambiguous_attempt),
      attemptId: typeof res?.attempt_id === 'string' ? res.attempt_id : undefined,
      status: typeof res?.status === 'string' ? res.status : undefined,
      chargeStatus: typeof res?.charge_status === 'string' ? res.charge_status : undefined,
      logicalRequestId:
        typeof res?.logical_request_id === 'string' ? res.logical_request_id : undefined,
      physicalRequestId:
        typeof res?.physical_request_id === 'string' ? res.physical_request_id : undefined,
    };
  } catch (err) {
    console.warn('[AmbiguousAttemptGuard] Exceção na verificação. Bloqueando por segurança.', err);
    return { hasAmbiguousAttempt: true };
  }
}

// ---------------------------------------------------------------------------
// Attempt Record CRUD
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Manual Reprocess Audit — BLOQUEADOR 7
// ---------------------------------------------------------------------------

export interface ManualReprocessAuditParams {
  actorId: string;
  actorType?: 'admin' | 'system';
  previousAttemptId?: string | null;
  provider: string;
  operation: string;
  plateNormalized: string;
  reason: string;
  estimatedCostCents?: number;
  acknowledgedRisk: boolean;
  logicalRequestId: string;
}

/**
 * Persists a manual reprocess confirmation audit record BEFORE any new call.
 */
export async function createManualReprocessAuditRecord(
  params: ManualReprocessAuditParams,
  supabase: SupabaseClient,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('vehicle_provider_manual_reprocess_audit')
      .insert({
        actor_id: params.actorId,
        actor_type: params.actorType || 'admin',
        action: 'manual_reprocess_confirmed',
        previous_attempt_id: params.previousAttemptId || null,
        provider: params.provider,
        operation: params.operation,
        plate_normalized: params.plateNormalized,
        reason: params.reason,
        estimated_cost_cents: params.estimatedCostCents ?? 3000,
        acknowledged_risk: params.acknowledgedRisk,
        logical_request_id: params.logicalRequestId,
        confirmed_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.warn('[createManualReprocessAuditRecord] Falha ao gravar auditoria:', error.message);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.warn('[createManualReprocessAuditRecord] Exceção ao gravar auditoria:', err);
    return null;
  }
}
