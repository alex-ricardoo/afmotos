import {
  classifyProviderFailure,
  type ClassifiedProviderFailure,
} from '../vehicle-delivery/failure-classifier.ts';

/**
 * Codes from the failure classifier that are eligible for an immediate
 * synchronous retry within the same execution context.
 *
 * Excludes APIBRASIL_RATE_LIMIT — the provider asks us to wait (Retry-After),
 * so an immediate retry would be counterproductive and potentially block the IP.
 */
const FAST_RETRYABLE_CODES = new Set([
  'APIBRASIL_TIMEOUT',
  'APIBRASIL_NETWORK_ERROR',
  'APIBRASIL_SERVER_ERROR',
]);

/**
 * Minimum base backoff before a fast retry (ms).
 */
const FAST_RETRY_BACKOFF_BASE_MS = 350;

/**
 * Maximum jitter added on top of base backoff (ms).
 * Effective backoff range: [350, 750] ms.
 */
const FAST_RETRY_JITTER_MAX_MS = 400;

export interface FastRetryEligibility {
  eligible: boolean;
  backoffMs: number;
  classified: ClassifiedProviderFailure;
}

/**
 * Determines whether a provider failure is eligible for an immediate
 * synchronous retry and computes the backoff delay.
 *
 * @param error     The caught error from the provider call.
 * @param httpStatus  Optional HTTP status code from the response.
 * @param attemptNumber  The attempt that just failed (1-indexed).
 * @param maxFastRetries  Maximum number of fast retries allowed (default 1).
 * @param randomFn  Injectable random function for deterministic testing.
 */
export function isEligibleForFastRetry(
  error: unknown,
  httpStatus?: number | null,
  attemptNumber: number = 1,
  maxFastRetries: number = 1,
  randomFn: () => number = Math.random,
): FastRetryEligibility {
  const classified = classifyProviderFailure(error, httpStatus);

  // Already exhausted fast retries
  if (attemptNumber > maxFastRetries) {
    return { eligible: false, backoffMs: 0, classified };
  }

  // Only transient errors with specific codes qualify
  if (!FAST_RETRYABLE_CODES.has(classified.failureCode)) {
    return { eligible: false, backoffMs: 0, classified };
  }

  const jitter = Math.floor(randomFn() * FAST_RETRY_JITTER_MAX_MS);
  const backoffMs = FAST_RETRY_BACKOFF_BASE_MS + jitter;

  return { eligible: true, backoffMs, classified };
}

/**
 * Awaitable sleep with jitter, suitable for inter-attempt backoff.
 * Uses a real setTimeout internally — NOT a busy-wait.
 *
 * @param ms  Duration to sleep in milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
