import test from 'node:test';
import assert from 'node:assert/strict';
import { isEligibleForFastRetry, sleep } from '../fast-retry.ts';

// ---------------------------------------------------------------------------
// 1. Eligibility classification
// ---------------------------------------------------------------------------

test('T-FR-01 - APIBRASIL_TIMEOUT (504) on attempt 1 is eligible for fast retry', () => {
  const result = isEligibleForFastRetry(
    new Error('timeout esgotado'),
    504,
    1, // attempt
    1, // maxFastRetries
    () => 0.5, // deterministic random
  );

  assert.equal(result.eligible, true);
  assert.equal(result.classified.failureCode, 'APIBRASIL_TIMEOUT');
  assert.equal(result.classified.failureClass, 'transient');
});

test('T-FR-02 - APIBRASIL_NETWORK_ERROR (ECONNRESET) on attempt 1 is eligible', () => {
  const result = isEligibleForFastRetry(new Error('ECONNRESET'), undefined, 1, 1, () => 0);

  assert.equal(result.eligible, true);
  assert.equal(result.classified.failureCode, 'APIBRASIL_NETWORK_ERROR');
});

test('T-FR-03 - APIBRASIL_SERVER_ERROR (502) on attempt 1 is eligible', () => {
  const result = isEligibleForFastRetry(new Error('HTTP 502'), 502, 1, 1, () => 1);

  assert.equal(result.eligible, true);
  assert.equal(result.classified.failureCode, 'APIBRASIL_SERVER_ERROR');
});

test('T-FR-04 - HTTP 500 on attempt 1 is eligible', () => {
  const result = isEligibleForFastRetry(new Error('Internal Server Error'), 500, 1, 1, () => 0.5);

  assert.equal(result.eligible, true);
  assert.equal(result.classified.failureCode, 'APIBRASIL_SERVER_ERROR');
});

test('T-FR-05 - HTTP 503 on attempt 1 is eligible', () => {
  const result = isEligibleForFastRetry(new Error('Service Unavailable'), 503, 1, 1, () => 0.5);

  assert.equal(result.eligible, true);
  assert.equal(result.classified.failureCode, 'APIBRASIL_SERVER_ERROR');
});

// ---------------------------------------------------------------------------
// 2. Non-eligible failures — should NOT fast-retry
// ---------------------------------------------------------------------------

test('T-FR-06 - HTTP 401 (auth error) is NOT eligible for fast retry', () => {
  const result = isEligibleForFastRetry(new Error('unauthorized'), 401, 1, 1);

  assert.equal(result.eligible, false);
  assert.equal(result.classified.failureClass, 'permanent');
});

test('T-FR-07 - HTTP 403 (forbidden) is NOT eligible for fast retry', () => {
  const result = isEligibleForFastRetry(new Error('forbidden'), 403, 1, 1);

  assert.equal(result.eligible, false);
  assert.equal(result.classified.failureClass, 'permanent');
});

test('T-FR-08 - HTTP 422 (invalid request) is NOT eligible for fast retry', () => {
  const result = isEligibleForFastRetry(new Error('placa inválida'), 422, 1, 1);

  assert.equal(result.eligible, false);
  assert.equal(result.classified.failureClass, 'permanent');
});

test('T-FR-09 - HTTP 400 (bad request) is NOT eligible for fast retry', () => {
  const result = isEligibleForFastRetry(new Error('formato inválido'), 400, 1, 1);

  assert.equal(result.eligible, false);
  assert.equal(result.classified.failureClass, 'permanent');
});

test('T-FR-10 - HTTP 429 (rate limit) is NOT eligible for fast retry (should respect Retry-After)', () => {
  const result = isEligibleForFastRetry(new Error('too many requests'), 429, 1, 1);

  assert.equal(result.eligible, false);
  assert.equal(result.classified.failureCode, 'APIBRASIL_RATE_LIMIT');
  assert.equal(result.classified.failureClass, 'transient');
});

test('T-FR-11 - Insufficient credits (402) is NOT eligible for fast retry', () => {
  const result = isEligibleForFastRetry(new Error('saldo insuficiente'), 402, 1, 1);

  assert.equal(result.eligible, false);
  assert.equal(result.classified.failureClass, 'permanent');
});

test('T-FR-12 - Mock mode in production is NOT eligible for fast retry', () => {
  const result = isEligibleForFastRetry(new Error('mock mode in production'), 500, 1, 1);

  assert.equal(result.eligible, false);
  assert.equal(result.classified.failureClass, 'permanent');
});

// ---------------------------------------------------------------------------
// 3. Attempt exhaustion
// ---------------------------------------------------------------------------

test('T-FR-13 - Attempt 2 (exceeding maxFastRetries=1) is NOT eligible even for transient errors', () => {
  const result = isEligibleForFastRetry(
    new Error('timeout'),
    504,
    2, // attempt 2
    1, // maxFastRetries = 1
    () => 0.5,
  );

  assert.equal(result.eligible, false);
  assert.equal(result.classified.failureCode, 'APIBRASIL_TIMEOUT');
});

test('T-FR-14 - Attempt 1 with maxFastRetries=0 is NOT eligible', () => {
  const result = isEligibleForFastRetry(
    new Error('timeout'),
    504,
    1,
    0, // no retries allowed
  );

  assert.equal(result.eligible, false);
});

// ---------------------------------------------------------------------------
// 4. Backoff range validation
// ---------------------------------------------------------------------------

test('T-FR-15 - Backoff with randomFn=0 produces minimum (350ms)', () => {
  const result = isEligibleForFastRetry(
    new Error('timeout'),
    504,
    1,
    1,
    () => 0, // min random
  );

  assert.equal(result.eligible, true);
  assert.equal(result.backoffMs, 350);
});

test('T-FR-16 - Backoff with randomFn=0.999 produces near-maximum (~749ms)', () => {
  const result = isEligibleForFastRetry(new Error('timeout'), 504, 1, 1, () => 0.999);

  assert.equal(result.eligible, true);
  // 350 + floor(0.999 * 400) = 350 + 399 = 749
  assert.equal(result.backoffMs, 749);
});

test('T-FR-17 - Backoff with randomFn=0.5 produces midpoint (550ms)', () => {
  const result = isEligibleForFastRetry(new Error('timeout'), 504, 1, 1, () => 0.5);

  assert.equal(result.eligible, true);
  // 350 + floor(0.5 * 400) = 350 + 200 = 550
  assert.equal(result.backoffMs, 550);
});

test('T-FR-18 - Backoff is always in range [350, 750]', () => {
  for (let i = 0; i < 100; i++) {
    const r = Math.random();
    const result = isEligibleForFastRetry(new Error('timeout'), 504, 1, 1, () => r);
    assert.ok(result.backoffMs >= 350, `backoff ${result.backoffMs} should be >= 350`);
    assert.ok(result.backoffMs <= 750, `backoff ${result.backoffMs} should be <= 750`);
  }
});

// ---------------------------------------------------------------------------
// 5. Network errors
// ---------------------------------------------------------------------------

test('T-FR-19 - ECONNREFUSED is eligible for fast retry', () => {
  const result = isEligibleForFastRetry(new Error('ECONNREFUSED'), undefined, 1, 1, () => 0.5);

  assert.equal(result.eligible, true);
  assert.equal(result.classified.failureCode, 'APIBRASIL_NETWORK_ERROR');
});

test('T-FR-20 - ETIMEDOUT is eligible for fast retry', () => {
  const result = isEligibleForFastRetry(new Error('ETIMEDOUT'), undefined, 1, 1, () => 0.5);

  assert.equal(result.eligible, true);
  assert.equal(result.classified.failureCode, 'APIBRASIL_NETWORK_ERROR');
});

test('T-FR-21 - fetch failed is eligible for fast retry', () => {
  const result = isEligibleForFastRetry(new Error('fetch failed'), undefined, 1, 1, () => 0.5);

  assert.equal(result.eligible, true);
  assert.equal(result.classified.failureCode, 'APIBRASIL_NETWORK_ERROR');
});

// ---------------------------------------------------------------------------
// 6. AbortError (timeout via AbortController)
// ---------------------------------------------------------------------------

test('T-FR-22 - AbortError is eligible for fast retry', () => {
  const abortErr = new Error('The operation was aborted');
  abortErr.name = 'AbortError';

  const result = isEligibleForFastRetry(abortErr, undefined, 1, 1, () => 0.5);

  // AbortError message doesn't contain 'timeout' but name contains 'aborterror' (lowercase check)
  // The classifier checks lowerMsg.includes('aborterror') — Error.name is checked via message
  // Actually, classifyProviderFailure extracts error.message, not error.name
  // Let's verify what the classifier does with this
  assert.equal(result.classified.failureClass, 'transient');
  assert.equal(result.eligible, true);
});

// ---------------------------------------------------------------------------
// 7. sleep utility
// ---------------------------------------------------------------------------

test('T-FR-23 - sleep resolves after at least the specified duration', async () => {
  const start = Date.now();
  await sleep(50);
  const elapsed = Date.now() - start;
  // Allow some tolerance for timer precision
  assert.ok(elapsed >= 40, `sleep(50) should take at least 40ms, took ${elapsed}ms`);
});

test('T-FR-24 - sleep with 0ms resolves immediately', async () => {
  const start = Date.now();
  await sleep(0);
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 100, `sleep(0) should resolve quickly, took ${elapsed}ms`);
});

// ---------------------------------------------------------------------------
// 8. Unknown errors
// ---------------------------------------------------------------------------

test('T-FR-25 - Unknown error class is NOT eligible for fast retry', () => {
  const result = isEligibleForFastRetry(
    new Error('something completely unexpected'),
    undefined,
    1,
    1,
  );

  assert.equal(result.eligible, false);
  assert.equal(result.classified.failureClass, 'unknown');
});

test('T-FR-26 - JSON parse error (APIBRASIL_INVALID_RESPONSE) is NOT eligible for fast retry', () => {
  const result = isEligibleForFastRetry(
    new Error('resposta inválida - json parse error'),
    undefined,
    1,
    1,
  );

  assert.equal(result.eligible, false);
  assert.equal(result.classified.failureCode, 'APIBRASIL_INVALID_RESPONSE');
});

// ---------------------------------------------------------------------------
// 9. Classified result passthrough
// ---------------------------------------------------------------------------

test('T-FR-27 - Classified result is always returned regardless of eligibility', () => {
  const eligible = isEligibleForFastRetry(new Error('timeout'), 504, 1, 1);
  assert.ok(eligible.classified, 'Should have classified result');
  assert.equal(eligible.classified.failureCode, 'APIBRASIL_TIMEOUT');

  const notEligible = isEligibleForFastRetry(new Error('unauthorized'), 401, 1, 1);
  assert.ok(notEligible.classified, 'Should have classified result even when not eligible');
  assert.equal(notEligible.classified.failureCode, 'APIBRASIL_AUTH_ERROR');
});
