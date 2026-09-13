/**
 * Pure and deterministic cache eligibility rules for vehicle deliveries.
 * Protects paid production deliveries from receiving simulated/mock cache records.
 */

export type RuntimeEnvironment = 'production' | 'preview' | 'development' | 'test';

export interface CacheEligibilityCandidate {
  id?: string;
  status: string;
  is_mock?: boolean | null;
  mode?: string | null;
  provider?: string | null;
  raw_response?: Record<string, unknown> | null;
  consulted_at?: string | null;
}

export type CacheRejectionReasonCode =
  | 'MOCK_CACHE_IN_PRODUCTION'
  | 'UNKNOWN_CACHE_ORIGIN'
  | 'INVALID_PROVIDER'
  | 'INCOMPLETE_RESULT'
  | 'EXPIRED_CACHE'
  | 'STATUS_NOT_COMPLETED'
  | 'NO_RECORD';

export interface CacheEligibilityResult {
  eligible: boolean;
  reasonCode?: CacheRejectionReasonCode;
  nextAction: 'CALL_LIVE_PROVIDER' | 'USE_CACHE' | 'MANUAL_REVIEW';
}

export interface CacheEligibilityParams {
  runtimeEnvironment: RuntimeEnvironment;
  cacheRecord: CacheEligibilityCandidate | null | undefined;
  isPaidTransaction?: boolean;
  ttlSeconds?: number;
}

/**
 * Checks if a given raw_response payload contains traces of simulated/mock fixtures.
 */
export function isMockRawResponsePayload(
  payload: Record<string, unknown> | null | undefined,
): boolean {
  if (!payload || typeof payload !== 'object') return false;

  const msg = String(payload.message || '').toLowerCase();
  if (msg.includes('consulta simulada') || msg.includes('mock fallback')) {
    return true;
  }

  if (payload.is_mock === true || payload.isMock === true) {
    return true;
  }

  const d = (payload.data || payload.dados || {}) as Record<string, unknown>;
  const marca = String(d.marca || d.brand || '').toLowerCase();
  const modelo = String(d.modelo || d.model || '').toLowerCase();

  if (
    marca.includes('marca fict') ||
    modelo.includes('conceito flex') ||
    modelo.includes('modelo demo')
  ) {
    return true;
  }

  return false;
}

/**
 * Pure function: determines if a cached consultation record is strictly eligible
 * to be reused for a customer delivery in paid production.
 */
export function isCacheEntryEligibleForPaidProduction({
  runtimeEnvironment,
  cacheRecord,
  isPaidTransaction = false,
  ttlSeconds,
}: CacheEligibilityParams): CacheEligibilityResult {
  if (!cacheRecord) {
    return {
      eligible: false,
      reasonCode: 'NO_RECORD',
      nextAction: 'CALL_LIVE_PROVIDER',
    };
  }

  // 1. Status must be COMPLETED
  if (cacheRecord.status !== 'COMPLETED') {
    return {
      eligible: false,
      reasonCode: 'STATUS_NOT_COMPLETED',
      nextAction: 'CALL_LIVE_PROVIDER',
    };
  }

  // 2. Raw response must exist and not be empty
  if (
    !cacheRecord.raw_response ||
    typeof cacheRecord.raw_response !== 'object' ||
    Object.keys(cacheRecord.raw_response).length === 0
  ) {
    return {
      eligible: false,
      reasonCode: 'INCOMPLETE_RESULT',
      nextAction: 'CALL_LIVE_PROVIDER',
    };
  }

  const isStrictPaidOrProduction = runtimeEnvironment === 'production' || isPaidTransaction;

  if (isStrictPaidOrProduction) {
    // 3. Reject explicit mock flags
    if (cacheRecord.is_mock === true || cacheRecord.mode === 'mock') {
      return {
        eligible: false,
        reasonCode: 'MOCK_CACHE_IN_PRODUCTION',
        nextAction: 'CALL_LIVE_PROVIDER',
      };
    }

    // 4. Reject mock provider
    if (cacheRecord.provider && cacheRecord.provider.toLowerCase() === 'mock') {
      return {
        eligible: false,
        reasonCode: 'INVALID_PROVIDER',
        nextAction: 'CALL_LIVE_PROVIDER',
      };
    }

    // 5. Must have explicit known origin: is_mock must be strictly false and mode must be 'live'
    if (cacheRecord.is_mock === null || cacheRecord.is_mock === undefined || !cacheRecord.mode) {
      return {
        eligible: false,
        reasonCode: 'UNKNOWN_CACHE_ORIGIN',
        nextAction: 'CALL_LIVE_PROVIDER',
      };
    }

    // 6. Must be supported provider (apibrasil)
    if (cacheRecord.provider && cacheRecord.provider.toLowerCase() !== 'apibrasil') {
      return {
        eligible: false,
        reasonCode: 'INVALID_PROVIDER',
        nextAction: 'CALL_LIVE_PROVIDER',
      };
    }

    // 7. Reject fixture payloads pretending to be live
    if (isMockRawResponsePayload(cacheRecord.raw_response)) {
      return {
        eligible: false,
        reasonCode: 'MOCK_CACHE_IN_PRODUCTION',
        nextAction: 'CALL_LIVE_PROVIDER',
      };
    }
  }

  // 8. TTL check if configured
  if (ttlSeconds && cacheRecord.consulted_at) {
    const consultedTime = new Date(cacheRecord.consulted_at).getTime();
    if (!isNaN(consultedTime)) {
      const ageMs = Date.now() - consultedTime;
      if (ageMs > ttlSeconds * 1000) {
        return {
          eligible: false,
          reasonCode: 'EXPIRED_CACHE',
          nextAction: 'CALL_LIVE_PROVIDER',
        };
      }
    }
  }

  return {
    eligible: true,
    nextAction: 'USE_CACHE',
  };
}
