import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCheckoutProUrls,
  sanitizeAndValidateCandidateUrl,
  isLoopbackOrLocal,
} from '../checkout-pro-urls.ts';
import {
  CheckoutProUrlResolutionError,
  normalizeCheckoutProError,
} from '../error-normalizer.ts';
import { buildPreferenceBody } from '../preference-builder.ts';
import { logCheckoutProEvent, type LogContext } from '../observability.ts';

describe('Checkout Pro URL Resolver & Production Safety', () => {
  const originalEnv = { ...process.env };

  function restoreEnv() {
    process.env = { ...originalEnv };
  }

  it('Production + localhost => falha fechada com CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL', () => {
    try {
      process.env.MERCADO_PAGO_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

      assert.throws(
        () =>
          resolveCheckoutProUrls({
            transactionId: 'tx-test-123',
            environmentOverride: 'production',
          }),
        (err: unknown) => {
          assert.ok(err instanceof CheckoutProUrlResolutionError);
          assert.equal(err.reasonCode, 'CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL');
          return true;
        },
      );
    } finally {
      restoreEnv();
    }
  });

  it('Production + HTTP inseguro => falha fechada com CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL', () => {
    try {
      process.env.MERCADO_PAGO_APP_URL = 'http://afmotos.vercel.app';
      delete process.env.NEXT_PUBLIC_APP_URL;

      assert.throws(
        () =>
          resolveCheckoutProUrls({
            transactionId: 'tx-test-123',
            environmentOverride: 'production',
          }),
        (err: unknown) => {
          assert.ok(err instanceof CheckoutProUrlResolutionError);
          assert.equal(err.reasonCode, 'CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL');
          return true;
        },
      );
    } finally {
      restoreEnv();
    }
  });

  it('Production + HTTPS afmotos => gera 3 back_urls HTTPS e deriva webhook público quando ausente', () => {
    try {
      process.env.MERCADO_PAGO_APP_URL = 'https://afmotos.vercel.app';
      delete process.env.MERCADO_PAGO_WEBHOOK_URL;

      const resolved = resolveCheckoutProUrls({
        transactionId: 'tx-prod-999',
        environmentOverride: 'production',
      });

      assert.equal(resolved.appUrl, 'https://afmotos.vercel.app');
      assert.equal(resolved.appUrlOrigin, 'https://afmotos.vercel.app');
      assert.equal(resolved.backUrlScheme, 'https');
      assert.equal(resolved.backUrlHost, 'afmotos.vercel.app');
      assert.equal(
        resolved.backUrls.success,
        'https://afmotos.vercel.app/cliente/pagamento/retorno/tx-prod-999?result=success',
      );
      assert.equal(
        resolved.backUrls.pending,
        'https://afmotos.vercel.app/cliente/pagamento/retorno/tx-prod-999?result=pending',
      );
      assert.equal(
        resolved.backUrls.failure,
        'https://afmotos.vercel.app/cliente/pagamento/retorno/tx-prod-999?result=failure',
      );
      assert.equal(resolved.autoReturnConfigured, true);
      assert.equal(resolved.autoReturn, 'approved');

      // Derivação automática segura do webhook em produção
      assert.equal(resolved.notificationUrlPresent, true);
      assert.equal(
        resolved.notificationUrl,
        'https://afmotos.vercel.app/api/webhooks/mercadopago',
      );
      assert.equal(resolved.notificationUrlOrigin, 'https://afmotos.vercel.app');
    } finally {
      restoreEnv();
    }
  });

  it('Production + webhook inválido (HTTP ou localhost) => falha fechada com CHECKOUT_PRO_INVALID_PRODUCTION_WEBHOOK_URL', () => {
    try {
      process.env.MERCADO_PAGO_APP_URL = 'https://afmotos.vercel.app';
      process.env.MERCADO_PAGO_WEBHOOK_URL = 'http://localhost:3000/api/webhooks/mercadopago';

      assert.throws(
        () =>
          resolveCheckoutProUrls({
            transactionId: 'tx-prod-999',
            environmentOverride: 'production',
          }),
        (err: unknown) => {
          assert.ok(err instanceof CheckoutProUrlResolutionError);
          assert.equal(err.reasonCode, 'CHECKOUT_PRO_INVALID_PRODUCTION_WEBHOOK_URL');
          return true;
        },
      );
    } finally {
      restoreEnv();
    }
  });

  it('Development + localhost => permite back_urls locais e omite auto_return', () => {
    try {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      delete process.env.MERCADO_PAGO_APP_URL;
      delete process.env.MERCADO_PAGO_WEBHOOK_URL;

      const resolved = resolveCheckoutProUrls({
        transactionId: 'tx-local-111',
        environmentOverride: 'development',
      });

      assert.equal(resolved.appUrl, 'http://localhost:3000');
      assert.equal(resolved.backUrlScheme, 'http');
      assert.equal(resolved.autoReturnConfigured, false);
      assert.equal(resolved.autoReturn, undefined);
      assert.equal(resolved.notificationUrlPresent, false);
      assert.equal(resolved.notificationUrl, undefined);
    } finally {
      restoreEnv();
    }
  });

  it('Preview + localhost => falha fechada com CHECKOUT_PRO_INVALID_PREVIEW_URL', () => {
    try {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      delete process.env.MERCADO_PAGO_APP_URL;

      assert.throws(
        () =>
          resolveCheckoutProUrls({
            transactionId: 'tx-prev-111',
            environmentOverride: 'preview',
          }),
        (err: unknown) => {
          assert.ok(err instanceof CheckoutProUrlResolutionError);
          assert.equal(err.reasonCode, 'CHECKOUT_PRO_INVALID_PREVIEW_URL');
          return true;
        },
      );
    } finally {
      restoreEnv();
    }
  });

  it('Preview com credenciais de produção APP_USR => falha fechada sem permissão explícita', () => {
    try {
      process.env.NEXT_PUBLIC_APP_URL = 'https://afmotos-preview.vercel.app';
      process.env.MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-987654321';

      assert.throws(
        () =>
          resolveCheckoutProUrls({
            transactionId: 'tx-prev-111',
            environmentOverride: 'preview',
          }),
        (err: unknown) => {
          assert.ok(err instanceof CheckoutProUrlResolutionError);
          assert.equal(err.reasonCode, 'CHECKOUT_PRO_INVALID_PREVIEW_URL');
          return true;
        },
      );
    } finally {
      restoreEnv();
    }
  });

  it('URL com query params ou hash => rejeita com erro', () => {
    assert.throws(() => sanitizeAndValidateCandidateUrl('https://afmotos.vercel.app?utm=123'));
    assert.throws(() => sanitizeAndValidateCandidateUrl('https://afmotos.vercel.app#checkout'));
  });

  it('URL com whitespace => normaliza e sanitiza adequadamente', () => {
    const url = sanitizeAndValidateCandidateUrl('   https://afmotos.vercel.app/   ');
    assert.equal(url.origin, 'https://afmotos.vercel.app');
  });

  it('identifica corretamente hosts de loopback e IP local', () => {
    assert.equal(isLoopbackOrLocal('localhost'), true);
    assert.equal(isLoopbackOrLocal('127.0.0.1'), true);
    assert.equal(isLoopbackOrLocal('127.0.0.99'), true);
    assert.equal(isLoopbackOrLocal('::1'), true);
    assert.equal(isLoopbackOrLocal('0.0.0.0'), true);
    assert.equal(isLoopbackOrLocal('dev.localhost'), true);
    assert.equal(isLoopbackOrLocal('afmotos.vercel.app'), false);
    assert.equal(isLoopbackOrLocal('afmotos.com.br'), false);
  });

  it('buildPreferenceBody falha fechado antes de criar preference se URLs de Production forem inválidas', () => {
    try {
      process.env.MERCADO_PAGO_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      assert.throws(
        () =>
          buildPreferenceBody(
            {
              consultationId: 'c1',
              transactionId: 't1',
              userId: 'u1',
              customerEmail: 'test@example.com',
              unitPrice: 29.9,
              plate: 'ABC1D23',
            },
            { environmentOverride: 'production' },
          ),
        (err: unknown) => {
          assert.ok(err instanceof CheckoutProUrlResolutionError);
          assert.equal(err.reasonCode, 'CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL');
          return true;
        },
      );
    } finally {
      restoreEnv();
    }
  });

  it('normaliza CheckoutProUrlResolutionError para HTTP 503 com código CONFIGURATION_ERROR e sem vazar URLs', () => {
    const err = new CheckoutProUrlResolutionError(
      'URL base de Production inválida: http://localhost:3000',
      'CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL',
    );
    const normalized = normalizeCheckoutProError(err);

    assert.equal(normalized.httpStatus, 503);
    assert.equal(normalized.safeClientCode, 'CONFIGURATION_ERROR');
    assert.equal(normalized.errorName, 'CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL');
    assert.equal(normalized.errorOrigin, 'local');
    assert.equal(
      normalized.safeClientMessage,
      'Serviço de pagamento temporariamente indisponível. Tente novamente mais tarde.',
    );
  });

  it('observabilidade sanitizada de checkout_pro.urls_resolved não expõe path com transaction ID nem query', () => {
    let loggedJson = '';
    const originalLog = console.log;
    console.log = (msg: string) => {
      loggedJson = msg;
    };

    try {
      logCheckoutProEvent('checkout_pro.urls_resolved', {
        flowId: 'flow-123',
        consultationId: 'consultation-456',
        appUrlOrigin: 'https://afmotos.vercel.app',
        backUrlScheme: 'https',
        backUrlHost: 'afmotos.vercel.app',
        notificationUrlPresent: true,
        notificationUrlOrigin: 'https://afmotos.vercel.app',
        autoReturnConfigured: true,
        environment: 'production',
      });

      assert.ok(loggedJson.includes('checkout_pro.urls_resolved'));
      assert.ok(loggedJson.includes('https://afmotos.vercel.app'));
      assert.ok(loggedJson.includes('"backUrlScheme":"https"'));
      assert.ok(loggedJson.includes('"autoReturnConfigured":true'));
      // Nunca deve conter paths com IDs ou query strings
      assert.ok(!loggedJson.includes('/cliente/pagamento/retorno'));
      assert.ok(!loggedJson.includes('?result=success'));
      assert.ok(!loggedJson.includes('transactionId'));
    } finally {
      console.log = originalLog;
    }
  });
});
