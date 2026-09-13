import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isTestMode,
  getCredentialMode,
  getMercadoPagoConfig,
  resetMercadoPagoConfigForTesting,
} from '../client.ts';
import { isValidMercadoPagoRedirectUrl } from '../security.ts';
import {
  buildPreferenceBody,
  removeEmptyFields,
  isValidPublicHttpsUrl,
} from '../preference-builder.ts';
import {
  CheckoutProLocalConfigError,
  CheckoutProValidationError,
} from '../error-normalizer.ts';

describe('Mercado Pago Preference Builder & Configuration', () => {
  it('correctly determines credential mode and test flag from environment', () => {
    const originalMode = process.env.MERCADO_PAGO_CHECKOUT_MODE;
    const originalToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    try {
      process.env.MERCADO_PAGO_CHECKOUT_MODE = 'test';
      process.env.MERCADO_PAGO_ACCESS_TOKEN = 'TEST-123456';
      assert.equal(isTestMode(), true);
      assert.equal(getCredentialMode(), 'test');

      process.env.MERCADO_PAGO_CHECKOUT_MODE = 'production';
      process.env.MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-123456';
      assert.equal(isTestMode(), false);
      assert.equal(getCredentialMode(), 'production');

      process.env.MERCADO_PAGO_ACCESS_TOKEN = 'INVALID_TOKEN';
      assert.equal(getCredentialMode(), 'invalid');
    } finally {
      process.env.MERCADO_PAGO_CHECKOUT_MODE = originalMode;
      process.env.MERCADO_PAGO_ACCESS_TOKEN = originalToken;
      resetMercadoPagoConfigForTesting();
    }
  });

  it('fails safely when MERCADO_PAGO_ACCESS_TOKEN is missing or invalid', () => {
    const originalToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    try {
      resetMercadoPagoConfigForTesting();
      process.env.MERCADO_PAGO_ACCESS_TOKEN = '';
      assert.throws(
        () => getMercadoPagoConfig(),
        (err) => err instanceof CheckoutProLocalConfigError,
      );

      resetMercadoPagoConfigForTesting();
      process.env.MERCADO_PAGO_ACCESS_TOKEN = 'invalid_token_without_prefix';
      assert.throws(
        () => getMercadoPagoConfig(),
        (err) => err instanceof CheckoutProLocalConfigError,
      );
    } finally {
      process.env.MERCADO_PAGO_ACCESS_TOKEN = originalToken;
      resetMercadoPagoConfigForTesting();
    }
  });

  it('validates Checkout Pro init_point and sandbox_init_point URLs', () => {
    const prodInitPoint = 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=987654321';
    const sandboxInitPoint =
      'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=987654321';

    assert.equal(isValidMercadoPagoRedirectUrl(prodInitPoint), true);
    assert.equal(isValidMercadoPagoRedirectUrl(sandboxInitPoint), true);
    assert.equal(isValidMercadoPagoRedirectUrl('https://evil-phishing.com/checkout'), false);
    assert.equal(isValidMercadoPagoRedirectUrl('http://www.mercadopago.com.br'), false);
  });

  it('correctly filters public vs local webhook URLs', () => {
    assert.equal(isValidPublicHttpsUrl('https://api.afmotos.com.br/api/webhooks/mercadopago'), true);
    assert.equal(isValidPublicHttpsUrl('http://localhost:3000/api/webhooks/mercadopago'), false);
    assert.equal(isValidPublicHttpsUrl('https://localhost:3000/api/webhooks/mercadopago'), false);
    assert.equal(isValidPublicHttpsUrl('https://127.0.0.1:3000/api/webhooks/mercadopago'), false);
    assert.equal(isValidPublicHttpsUrl(undefined), false);
  });

  it('removes undefined, null, and empty string fields cleanly', () => {
    const dirty = {
      keep: 'yes',
      empty: '',
      undef: undefined,
      nil: null,
      nested: {
        keepNested: 123,
        removeNested: null,
      },
      emptyNested: {
        emptyInside: '',
      },
    };

    const cleaned = removeEmptyFields(dirty);
    assert.deepEqual(cleaned, {
      keep: 'yes',
      nested: {
        keepNested: 123,
      },
    });
  });

  it('builds valid preference body with auto_return omitted on localhost/HTTP', () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const originalWebhook = process.env.MERCADO_PAGO_WEBHOOK_URL;

    try {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.MERCADO_PAGO_WEBHOOK_URL = '';

      const body = buildPreferenceBody({
        consultationId: 'c1234567-0000-0000-0000-000000000001',
        transactionId: 't1234567-0000-0000-0000-000000000002',
        userId: 'u1234567-0000-0000-0000-000000000003',
        customerEmail: 'customer@afmotos.com',
        unitPrice: 49.9,
        plate: 'ABC1D23',
      });

      // Validations:
      assert.equal(body.items?.length, 1);
      assert.equal(body.items?.[0]?.quantity, 1);
      assert.equal(body.items?.[0]?.unit_price, 49.9);
      assert.equal(body.items?.[0]?.currency_id, 'BRL');
      assert.equal(body.items?.[0]?.title, 'Consulta Veicular Placa ABC1D23');
      assert.equal(body.external_reference, 't1234567-0000-0000-0000-000000000002');
      assert.deepEqual(body.metadata, {
        transaction_id: 't1234567-0000-0000-0000-000000000002',
        consultation_id: 'c1234567-0000-0000-0000-000000000001',
        user_id: 'u1234567-0000-0000-0000-000000000003',
        product: 'vehicle_consultation',
      });
      assert.equal(
        body.back_urls?.success,
        'http://localhost:3000/cliente/pagamento/retorno/t1234567-0000-0000-0000-000000000002?result=success',
      );
      // auto_return must be undefined on localhost HTTP to avoid MP 400 error!
      assert.equal(body.auto_return, undefined);
      // notification_url must be undefined because localhost is not public HTTPS
      assert.equal(body.notification_url, undefined);
      assert.deepEqual(body.payment_methods, { installments: 12 });
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
      process.env.MERCADO_PAGO_WEBHOOK_URL = originalWebhook;
    }
  });

  it('includes auto_return: "approved" and notification_url when environment is HTTPS', () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const originalWebhook = process.env.MERCADO_PAGO_WEBHOOK_URL;

    try {
      process.env.NEXT_PUBLIC_APP_URL = 'https://afmotos.com.br';
      process.env.MERCADO_PAGO_WEBHOOK_URL = 'https://api.afmotos.com.br/api/webhooks/mercadopago';

      const body = buildPreferenceBody({
        consultationId: 'c1234567-0000-0000-0000-000000000001',
        transactionId: 't1234567-0000-0000-0000-000000000002',
        userId: 'u1234567-0000-0000-0000-000000000003',
        customerEmail: 'customer@afmotos.com',
        unitPrice: 35.0,
        plate: 'BRA2E19',
      });

      assert.equal(body.auto_return, 'approved');
      assert.equal(body.notification_url, 'https://api.afmotos.com.br/api/webhooks/mercadopago');
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
      process.env.MERCADO_PAGO_WEBHOOK_URL = originalWebhook;
    }
  });

  it('rejects invalid canonical price or empty plate with validation error', () => {
    assert.throws(
      () =>
        buildPreferenceBody({
          consultationId: 'c1',
          transactionId: 't1',
          userId: 'u1',
          customerEmail: 'test@example.com',
          unitPrice: -10,
          plate: 'ABC1234',
        }),
      (err) => err instanceof CheckoutProValidationError && err.code === 'INVALID_PRICE',
    );

    assert.throws(
      () =>
        buildPreferenceBody({
          consultationId: 'c1',
          transactionId: 't1',
          userId: 'u1',
          customerEmail: 'test@example.com',
          unitPrice: 29.9,
          plate: '   ',
        }),
      (err) => err instanceof CheckoutProValidationError && err.code === 'INVALID_PLATE',
    );
  });
});
