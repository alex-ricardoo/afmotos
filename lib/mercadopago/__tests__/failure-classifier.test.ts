import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyProviderFailure } from '../../vehicle-delivery/failure-classifier.ts';
import { InsufficientBalanceError, InvalidTokenError } from '../../vehicle-lookup/service.ts';

describe('Provider Failure Classifier', () => {
  it('classifies InsufficientBalanceError as permanent with APIBRASIL_INSUFFICIENT_CREDITS', () => {
    const error = new InsufficientBalanceError('Você não possui saldo suficiente para realizar essa consulta.');
    const result = classifyProviderFailure(error);

    assert.equal(result.failureClass, 'permanent');
    assert.equal(result.failureCode, 'APIBRASIL_INSUFFICIENT_CREDITS');
    assert.equal(result.isInsufficientCredits, true);
    assert.match(result.errorMessageSafe, /saldo ou crédito insuficiente/i);
  });

  it('classifies string containing saldo/recarregue as permanent', () => {
    const result = classifyProviderFailure('Erro da API Brasil: saldo insuficiente, recarregue agora', 402);

    assert.equal(result.failureClass, 'permanent');
    assert.equal(result.failureCode, 'APIBRASIL_INSUFFICIENT_CREDITS');
    assert.equal(result.isInsufficientCredits, true);
  });

  it('classifies InvalidTokenError and 401/403 as permanent with APIBRASIL_AUTH_ERROR', () => {
    const err = new InvalidTokenError();
    const result = classifyProviderFailure(err, 401);

    assert.equal(result.failureClass, 'permanent');
    assert.equal(result.failureCode, 'APIBRASIL_AUTH_ERROR');
    assert.equal(result.isInsufficientCredits, false);
    assert.match(result.errorMessageSafe, /credencial ou autorização/i);
  });

  it('classifies mock mode in production as permanent with APIBRASIL_MOCK_MODE_IN_PRODUCTION', () => {
    const result = classifyProviderFailure('MOCK MODE IN PRODUCTION DETECTED');

    assert.equal(result.failureClass, 'permanent');
    assert.equal(result.failureCode, 'APIBRASIL_MOCK_MODE_IN_PRODUCTION');
    assert.match(result.errorMessageSafe, /modo simulado/i);
  });

  it('classifies network errors and connection drops as transient', () => {
    const result = classifyProviderFailure(new Error('fetch failed: ECONNRESET'));

    assert.equal(result.failureClass, 'transient');
    assert.equal(result.failureCode, 'APIBRASIL_NETWORK_ERROR');
  });

  it('classifies timeouts as transient with APIBRASIL_TIMEOUT', () => {
    const result = classifyProviderFailure(new Error('A consulta na API Brasil excedeu o tempo limite de 120 segundos.'));

    assert.equal(result.failureClass, 'transient');
    assert.equal(result.failureCode, 'APIBRASIL_TIMEOUT');
  });

  it('classifies HTTP 429 as transient and parses Retry-After header', () => {
    const result = classifyProviderFailure('Rate limited', 429, '45');

    assert.equal(result.failureClass, 'transient');
    assert.equal(result.failureCode, 'APIBRASIL_RATE_LIMIT');
    assert.equal(result.retryAfterSeconds, 45);
  });

  it('classifies HTTP 500, 502, 503 as transient', () => {
    const result500 = classifyProviderFailure('Internal error', 500);
    const result502 = classifyProviderFailure('Bad gateway', 502);
    const result503 = classifyProviderFailure('Service unavailable', 503);

    assert.equal(result500.failureClass, 'transient');
    assert.equal(result500.failureCode, 'APIBRASIL_SERVER_ERROR');
    assert.equal(result502.failureClass, 'transient');
    assert.equal(result503.failureClass, 'transient');
  });

  it('sanitizes messages and never leaks secrets or raw token strings', () => {
    const sensitiveError = new Error('Invalid token Bearer secret_live_token_xyz123 on endpoint');
    const result = classifyProviderFailure(sensitiveError, 401);

    assert.equal(result.errorMessageSafe.includes('secret_live_token_xyz123'), false);
    assert.equal(result.errorMessageSafe.includes('Bearer'), false);
  });
});
