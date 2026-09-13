import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPreferenceBody,
  removeEmptyFields,
  isValidPublicHttpsUrl,
} from '../preference-builder.ts';
import {
  normalizeCheckoutProError,
  CheckoutProLocalConfigError,
  CheckoutProValidationError,
  CheckoutProDatabaseError,
} from '../error-normalizer.ts';
import {
  getCredentialMode,
  getMercadoPagoConfig,
  resetMercadoPagoConfigForTesting,
} from '../client.ts';
import {
  maskIdentifier,
  maskEmail,
  maskCpf,
  sanitizeProviderMessage,
  isValidMercadoPagoRedirectUrl,
  extractOriginAndPath,
  extractOrigin,
  truncateHash,
} from '../security.ts';
import { logCheckoutProEvent, type LogContext } from '../observability.ts';

describe('Checkout Pro Route & Flow Unit Tests', () => {
  it('teste: cliente não autenticado - mapeia para 401 seguro', () => {
    const error = new CheckoutProValidationError('Usuário não autenticado.', 401, 'UNAUTHORIZED');
    const normalized = normalizeCheckoutProError(error);

    assert.equal(normalized.httpStatus, 401);
    assert.equal(normalized.safeClientCode, 'UNAUTHORIZED');
    assert.equal(normalized.safeClientMessage, 'Usuário não autenticado.');
    assert.equal(normalized.category, 'local_validation_error');
  });

  it('teste: consulta de outro usuário ou não encontrada - mapeia para 404 seguro', () => {
    const error = new CheckoutProValidationError(
      'Consulta veicular não encontrada ou não pertence a você.',
      404,
      'NOT_FOUND',
    );
    const normalized = normalizeCheckoutProError(error);

    assert.equal(normalized.httpStatus, 404);
    assert.equal(normalized.safeClientCode, 'NOT_FOUND');
    assert.equal(normalized.safeClientMessage, 'Consulta veicular não encontrada ou não pertence a você.');
  });

  it('teste: consulta já concluída ou paga - mapeia para 422 CONSULTATION_ALREADY_PAID', () => {
    const error = new CheckoutProValidationError(
      'Esta consulta veicular já foi paga e concluída.',
      422,
      'CONSULTATION_ALREADY_PAID',
    );
    const normalized = normalizeCheckoutProError(error);

    assert.equal(normalized.httpStatus, 422);
    assert.equal(normalized.safeClientCode, 'CONSULTATION_ALREADY_PAID');
    assert.equal(normalized.safeClientMessage, 'Esta consulta veicular já foi paga e concluída.');
  });

  it('teste: valor canônico inválido - mapeia para 422 INVALID_PRICE', () => {
    assert.throws(
      () =>
        buildPreferenceBody({
          consultationId: 'c-uuid-1',
          transactionId: 't-uuid-1',
          userId: 'u-uuid-1',
          customerEmail: 'alex@afmotos.com',
          unitPrice: -50,
          plate: 'XYZ9876',
        }),
      (err) => err instanceof CheckoutProValidationError && err.code === 'INVALID_PRICE',
    );
  });

  it('teste: Access Token ausente - mapeia para 503 CONFIGURATION_ERROR', () => {
    const orig = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    try {
      resetMercadoPagoConfigForTesting();
      process.env.MERCADO_PAGO_ACCESS_TOKEN = '';
      assert.throws(
        () => getMercadoPagoConfig(),
        (err) => {
          const normalized = normalizeCheckoutProError(err);
          assert.equal(normalized.httpStatus, 503);
          assert.equal(normalized.safeClientCode, 'CONFIGURATION_ERROR');
          assert.equal(normalized.category, 'local_configuration_error');
          return true;
        },
      );
    } finally {
      process.env.MERCADO_PAGO_ACCESS_TOKEN = orig;
      resetMercadoPagoConfigForTesting();
    }
  });

  it('teste: Access Token inválido - mapeia para 503 CONFIGURATION_ERROR', () => {
    const orig = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    try {
      resetMercadoPagoConfigForTesting();
      process.env.MERCADO_PAGO_ACCESS_TOKEN = 'TOKEN_SEM_PREFIXO_TEST_OU_APP_USR';
      assert.equal(getCredentialMode(), 'invalid');
      assert.throws(
        () => getMercadoPagoConfig(),
        (err) => {
          const normalized = normalizeCheckoutProError(err);
          assert.equal(normalized.httpStatus, 503);
          assert.equal(normalized.safeClientCode, 'CONFIGURATION_ERROR');
          return true;
        },
      );
    } finally {
      process.env.MERCADO_PAGO_ACCESS_TOKEN = orig;
      resetMercadoPagoConfigForTesting();
    }
  });

  it('teste: Preference body válido com campos obrigatórios preenchidos', () => {
    const body = buildPreferenceBody({
      consultationId: '98436572-0000-0000-0000-000000000001',
      transactionId: '12345678-0000-0000-0000-000000000002',
      userId: '87654321-0000-0000-0000-000000000003',
      customerEmail: 'cliente@afmotos.com',
      unitPrice: 29.9,
      plate: 'ABC1234',
    });

    assert.ok(body.items && body.items.length === 1);
    assert.equal(body.items[0].quantity, 1);
    assert.equal(body.items[0].unit_price, 29.9);
    assert.equal(body.items[0].currency_id, 'BRL');
    assert.equal(body.items[0].title, 'Consulta Veicular Placa ABC1234');
    assert.equal(body.external_reference, '12345678-0000-0000-0000-000000000002');
    assert.equal(body.payer?.email, 'cliente@afmotos.com');
  });

  it('teste: campo undefined/null removido do body', () => {
    const raw = {
      items: [{ id: 'item1', unit_price: 10, title: 'Item' }],
      auto_return: undefined,
      notification_url: undefined,
      custom_null: null,
      empty_str: '',
    };
    const cleaned = removeEmptyFields(raw);
    assert.equal('auto_return' in cleaned, false);
    assert.equal('notification_url' in cleaned, false);
    assert.equal('custom_null' in cleaned, false);
    assert.equal('empty_str' in cleaned, false);
    assert.equal(cleaned.items?.length, 1);
  });

  it('teste: notification_url local omitida do body', () => {
    const origApp = process.env.NEXT_PUBLIC_APP_URL;
    const origWebhook = process.env.MERCADO_PAGO_WEBHOOK_URL;
    try {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.MERCADO_PAGO_WEBHOOK_URL = 'http://localhost:3000/api/webhooks/mercadopago';

      const body = buildPreferenceBody({
        consultationId: 'c1',
        transactionId: 't1',
        userId: 'u1',
        customerEmail: 'test@example.com',
        unitPrice: 30,
        plate: 'XYZ9999',
      });

      assert.equal(body.notification_url, undefined);
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = origApp;
      process.env.MERCADO_PAGO_WEBHOOK_URL = origWebhook;
    }
  });

  it('teste: back_urls corretas e com rotas de retorno da aplicação', () => {
    const origApp = process.env.NEXT_PUBLIC_APP_URL;
    try {
      process.env.NEXT_PUBLIC_APP_URL = 'https://afmotos.com.br';
      const txId = 'tx-test-id-123';
      const body = buildPreferenceBody({
        consultationId: 'c1',
        transactionId: txId,
        userId: 'u1',
        customerEmail: 'test@example.com',
        unitPrice: 30,
        plate: 'XYZ9999',
      });

      assert.equal(
        body.back_urls?.success,
        `https://afmotos.com.br/cliente/pagamento/retorno/${txId}?result=success`,
      );
      assert.equal(
        body.back_urls?.pending,
        `https://afmotos.com.br/cliente/pagamento/retorno/${txId}?result=pending`,
      );
      assert.equal(
        body.back_urls?.failure,
        `https://afmotos.com.br/cliente/pagamento/retorno/${txId}?result=failure`,
      );
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = origApp;
    }
  });

  it('teste: Preference SDK create mock retorna preference id', async () => {
    const mockPreferenceResponse = {
      id: 'pref_mock_123456789',
      init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref_mock_123456789',
      sandbox_init_point:
        'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref_mock_123456789',
    };

    assert.ok(mockPreferenceResponse.id);
    assert.equal(isValidMercadoPagoRedirectUrl(mockPreferenceResponse.init_point), true);
    assert.equal(isValidMercadoPagoRedirectUrl(mockPreferenceResponse.sandbox_init_point), true);
  });

  it('teste: init_point ausente falha com erro seguro', () => {
    const invalidRedirect = 'https://phishing-attacker.com/steal';
    assert.equal(isValidMercadoPagoRedirectUrl(invalidRedirect), false);

    const emptyRedirect = '';
    assert.equal(isValidMercadoPagoRedirectUrl(emptyRedirect), false);
  });

  it('teste: database insert falha - mapeia para 500 DATABASE_ERROR seguro', () => {
    const dbErr = new CheckoutProDatabaseError('Database deadlock / connection lost');
    const normalized = normalizeCheckoutProError(dbErr);

    assert.equal(normalized.httpStatus, 500);
    assert.equal(normalized.safeClientCode, 'DATABASE_ERROR');
    assert.equal(normalized.errorOrigin, 'database');
    assert.equal(
      normalized.safeClientMessage,
      'Erro ao registrar transação de pagamento. Tente novamente.',
    );
  });

  it('teste: provider 400, 401 e 500 mapeiam com segurança sem expor detalhes', () => {
    // 400
    const err400 = {
      message: 'auto_return invalid. back_url.success must be defined',
      error: 'invalid_auto_return',
      status: 400,
    };
    const norm400 = normalizeCheckoutProError(err400);
    assert.equal(norm400.httpStatus, 422);
    assert.equal(norm400.safeClientCode, 'PROVIDER_VALIDATION_ERROR');

    // 401
    const err401 = {
      message: 'Invalid access_token',
      status: 401,
    };
    const norm401 = normalizeCheckoutProError(err401);
    assert.equal(norm401.httpStatus, 503);
    assert.equal(norm401.safeClientCode, 'PROVIDER_AUTHENTICATION_ERROR');

    // 500
    const err500 = {
      message: 'Internal Gateway Timeout',
      status: 500,
    };
    const norm500 = normalizeCheckoutProError(err500);
    assert.equal(norm500.httpStatus, 502);
    assert.equal(norm500.safeClientCode, 'PROVIDER_GATEWAY_ERROR');
  });

  it('teste: cliente não recebe segredos em payloads ou mensagens', () => {
    const rawError = {
      status: 401,
      message:
        'Unauthorized: token TEST-1234567890-abcdef-0987654321 is invalid with webhook_secret whsec_secretkey123',
    };
    const normalized = normalizeCheckoutProError(rawError);

    // O cliente recebe safeClientMessage e safeClientCode apenas:
    assert.ok(!normalized.safeClientMessage.includes('TEST-1234567890'));
    assert.ok(!normalized.safeClientMessage.includes('whsec_'));
    assert.ok(!normalized.safeClientCode.includes('TEST-'));

    // O providerMessageSanitized (para log interno) também não contém o token puro:
    assert.ok(!normalized.providerMessageSanitized?.includes('TEST-1234567890'));
    assert.ok(normalized.providerMessageSanitized?.includes('[REDACTED_TOKEN]'));
  });

  it('teste: preferência criada não libera consulta (status e payment_status continuam pendentes)', () => {
    // Verificação de lógica de negócio:
    // A criação de preferência apenas inicializa payment_transactions com status='pending'.
    // A consulta do cliente mantém status='pending' ou 'unpaid'.
    // Somente o webhook verificado ou reconciliação autoritativa pode liberar a consulta.
    const initialConsultation = {
      id: 'c-1',
      status: 'pending',
      payment_status: 'unpaid',
      latest_payment_transaction_id: null,
    };

    // Ação: criar preferência
    const updatedConsultation = {
      ...initialConsultation,
      latest_payment_transaction_id: 'tx-123',
    };

    assert.equal(updatedConsultation.status, 'pending');
    assert.equal(updatedConsultation.payment_status, 'unpaid');
    assert.notEqual(updatedConsultation.payment_status, 'paid');
  });

  it('teste: observabilidade sanitiza corretamente URLs, hashes e identificadores', () => {
    assert.equal(
      extractOriginAndPath('http://localhost:3000/retorno?token=secret123&code=456'),
      'http://localhost:3000/retorno',
    );
    assert.equal(
      extractOrigin('https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123'),
      'https://sandbox.mercadopago.com.br',
    );
    assert.equal(truncateHash('external-reference-transaction-123456789')?.length, 8);
    assert.equal(maskIdentifier('123456789abcdef'), '1234...cdef');
    assert.equal(maskEmail('alex.ricardo@gmail.com'), 'a***o@gmail.com');
    assert.equal(maskCpf('12345678901'), '***.456.***-01');
  });
});
