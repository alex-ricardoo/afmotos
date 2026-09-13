import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCheckoutProError,
  CheckoutProLocalConfigError,
  CheckoutProValidationError,
  CheckoutProDatabaseError,
} from '../error-normalizer.ts';
import { sanitizeProviderMessage } from '../security.ts';

describe('Checkout Pro Error Normalizer', () => {
  it('normalizes local configuration errors to HTTP 503 without leaking secrets', () => {
    const error = new CheckoutProLocalConfigError(
      'MERCADO_PAGO_ACCESS_TOKEN TEST-12345678-abcd-ef01-2345-67890abcdef0 não configurado.',
    );
    const normalized = normalizeCheckoutProError(error);

    assert.equal(normalized.category, 'local_configuration_error');
    assert.equal(normalized.httpStatus, 503);
    assert.equal(normalized.errorOrigin, 'local');
    assert.equal(normalized.safeClientCode, 'CONFIGURATION_ERROR');
    assert.equal(
      normalized.safeClientMessage,
      'Serviço de pagamento temporariamente indisponível. Tente novamente mais tarde.',
    );
    assert.ok(!normalized.providerMessageSanitized?.includes('TEST-12345678'));
    assert.ok(normalized.providerMessageSanitized?.includes('[REDACTED_TOKEN]'));
  });

  it('normalizes validation errors with appropriate safe HTTP status and codes', () => {
    const error = new CheckoutProValidationError('Consulta veicular não encontrada.', 404, 'NOT_FOUND');
    const normalized = normalizeCheckoutProError(error);

    assert.equal(normalized.category, 'local_validation_error');
    assert.equal(normalized.httpStatus, 404);
    assert.equal(normalized.safeClientCode, 'NOT_FOUND');
    assert.equal(normalized.safeClientMessage, 'Consulta veicular não encontrada.');
  });

  it('normalizes database errors to HTTP 500 with generic client message', () => {
    const error = new CheckoutProDatabaseError('relation "payment_transactions" does not exist');
    const normalized = normalizeCheckoutProError(error);

    assert.equal(normalized.category, 'local_database_error');
    assert.equal(normalized.httpStatus, 500);
    assert.equal(normalized.errorOrigin, 'database');
    assert.equal(normalized.safeClientCode, 'DATABASE_ERROR');
    assert.equal(
      normalized.safeClientMessage,
      'Erro ao registrar transação de pagamento. Tente novamente.',
    );
  });

  it('normalizes Mercado Pago provider HTTP 400 (e.g. invalid_auto_return) to HTTP 422', () => {
    const mpError = {
      message: 'auto_return invalid. back_url.success must be defined',
      error: 'invalid_auto_return',
      status: 400,
      cause: null,
    };
    const normalized = normalizeCheckoutProError(mpError);

    assert.equal(normalized.category, 'provider_http_error');
    assert.equal(normalized.httpStatus, 422);
    assert.equal(normalized.providerHttpStatus, 400);
    assert.equal(normalized.errorName, 'invalid_auto_return');
    assert.equal(normalized.errorOrigin, 'mercadopago_api');
    assert.equal(normalized.safeClientCode, 'PROVIDER_VALIDATION_ERROR');
    assert.equal(
      normalized.safeClientMessage,
      'Não foi possível iniciar o checkout com os parâmetros fornecidos.',
    );
  });

  it('normalizes Mercado Pago provider HTTP 401/403 to HTTP 503', () => {
    const mpAuthError = {
      message: 'Unauthorized use of access token TEST-secret-token',
      error: 'unauthorized',
      status: 401,
      cause: [{ code: 100, description: 'Invalid token' }],
    };
    const normalized = normalizeCheckoutProError(mpAuthError);

    assert.equal(normalized.category, 'provider_http_error');
    assert.equal(normalized.httpStatus, 503);
    assert.equal(normalized.providerHttpStatus, 401);
    assert.equal(normalized.causeCount, 1);
    assert.equal(normalized.safeClientCode, 'PROVIDER_AUTHENTICATION_ERROR');
    assert.ok(!normalized.providerMessageSanitized?.includes('TEST-secret-token'));
  });

  it('normalizes Mercado Pago provider HTTP 500/503 to HTTP 502', () => {
    const mpGatewayError = {
      message: 'Internal server error from payment gateway',
      status: 500,
    };
    const normalized = normalizeCheckoutProError(mpGatewayError);

    assert.equal(normalized.category, 'provider_http_error');
    assert.equal(normalized.httpStatus, 502);
    assert.equal(normalized.providerHttpStatus, 500);
    assert.equal(normalized.safeClientCode, 'PROVIDER_GATEWAY_ERROR');
  });

  it('normalizes network errors (fetch failed / ECONNREFUSED) to HTTP 502', () => {
    const netError = new TypeError('fetch failed');
    const normalized = normalizeCheckoutProError(netError);

    assert.equal(normalized.category, 'network_error');
    assert.equal(normalized.httpStatus, 502);
    assert.equal(normalized.errorOrigin, 'network');
    assert.equal(normalized.safeClientCode, 'NETWORK_ERROR');
    assert.equal(
      normalized.safeClientMessage,
      'Falha de conexão com o provedor de pagamentos. Tente novamente.',
    );
  });

  it('sanitizes tokens, bearer headers, and emails in provider messages', () => {
    const sensitive =
      'Error with token TEST-1234567890-abcdef and user admin@afmotos.com with Bearer sec_tok_998877';
    const sanitized = sanitizeProviderMessage(sensitive);

    assert.ok(!sanitized.includes('TEST-1234567890-abcdef'));
    assert.ok(!sanitized.includes('admin@afmotos.com'));
    assert.ok(!sanitized.includes('sec_tok_998877'));
    assert.ok(sanitized.includes('[REDACTED_TOKEN]'));
    assert.ok(sanitized.includes('[REDACTED_EMAIL]'));
    assert.ok(sanitized.includes('Bearer [REDACTED]'));
  });
});
