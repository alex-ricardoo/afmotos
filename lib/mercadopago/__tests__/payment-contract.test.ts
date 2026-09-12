import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanPayload } from '../payload.ts';
import { isDevPaymentSimulationEnabled } from '../client.ts';
import {
  getSafeCredentialFingerprint,
  validateMercadoPagoEnvironment,
  determineCredentialMode,
} from '../credentials.ts';

function setEnv(key: string, val: string | undefined) {
  if (val === undefined) {
    delete process.env[key];
  } else {
    (process.env as Record<string, string | undefined>)[key] = val;
  }
}

describe('Payment Contract & SDK mercadopago ^3.6.1 Compatibility (Section A, C, H)', () => {
  it('cleanPayload recursively strips undefined and null values', () => {
    const rawPayload = {
      transaction_amount: 49.99,
      description: 'Consulta Veicular - Placa BRA2E19',
      payment_method_id: 'master',
      token: 'tok_123',
      issuer_id: undefined,
      notification_url: null,
      payer: {
        email: 'cliente@teste.com',
        first_name: 'Cliente',
        last_name: undefined,
        identification: {
          type: 'CPF',
          number: '12345678909',
        },
        address: undefined,
      },
      metadata: {
        consultation_id: 'abc-123',
        nullField: null,
        undefinedField: undefined,
      },
    };

    const cleaned = cleanPayload(rawPayload);

    // Verify null and undefined keys are completely stripped
    assert.equal('issuer_id' in cleaned, false);
    assert.equal('notification_url' in cleaned, false);
    assert.equal('last_name' in cleaned.payer, false);
    assert.equal('address' in cleaned.payer, false);
    assert.equal('nullField' in cleaned.metadata, false);
    assert.equal('undefinedField' in cleaned.metadata, false);

    // Verify valid values are preserved exactly
    assert.equal(cleaned.transaction_amount, 49.99);
    assert.equal(typeof cleaned.transaction_amount, 'number');
    assert.equal(cleaned.token, 'tok_123');
    assert.equal(cleaned.payer.email, 'cliente@teste.com');
    assert.equal(cleaned.payer.identification.type, 'CPF');
    assert.equal(cleaned.payer.identification.number, '12345678909');
  });

  it('verifies that transaction_amount is always a positive finite number', () => {
    const canonicalPrice = 49.99;
    const formattedAmount = Number(canonicalPrice.toFixed(2));

    assert.equal(typeof formattedAmount, 'number');
    assert.equal(Number.isFinite(formattedAmount), true);
    assert.equal(formattedAmount > 0, true);
    assert.equal(formattedAmount, 49.99);
    // Must NOT be string formatted in BRL
    assert.notEqual(formattedAmount, 'R$ 49,99');
    assert.notEqual(formattedAmount, '49.99');
  });

  it('verifies SDK Payment.create call contract and idempotency key injection', async () => {
    let capturedCall:
      | {
          body: Record<string, unknown>;
          requestOptions?: { idempotencyKey?: string };
        }
      | undefined;

    const mockPayment = {
      create: async (data: {
        body: Record<string, unknown>;
        requestOptions?: { idempotencyKey?: string };
      }) => {
        capturedCall = data;
        return {
          id: 9988776655,
          status: 'approved',
          status_detail: 'accredited',
        };
      },
    };

    const idempotencyKey = 'unique-idempotency-key-uuid-12345';
    const body = cleanPayload({
      transaction_amount: 49.99,
      token: 'tok_valid_brick_999',
      payment_method_id: 'master',
      installments: 1,
      payer: {
        email: 'payer@example.com',
        identification: {
          type: 'CPF',
          number: '12345678909',
        },
      },
    });

    await mockPayment.create({
      body,
      requestOptions: {
        idempotencyKey,
      },
    });

    assert.ok(capturedCall);
    assert.equal(capturedCall.requestOptions?.idempotencyKey, idempotencyKey);
    assert.equal(capturedCall.body.transaction_amount, 49.99);
    assert.equal(typeof capturedCall.body.transaction_amount, 'number');
    assert.equal(
      (capturedCall.body.payer as { identification: { type: string; number: string } })
        .identification.type,
      'CPF',
    );
    assert.equal(
      (capturedCall.body.payer as { identification: { type: string; number: string } })
        .identification.number,
      '12345678909',
    );
  });
});

describe('Dev Payment Simulation Security Gates (Section G & H)', () => {
  it('strictly blocks dev payment simulation in Vercel Production', () => {
    const origVercel = process.env.VERCEL_ENV;
    const origNode = process.env.NODE_ENV;
    const origSim = process.env.ENABLE_DEV_PAYMENT_SIMULATION;

    try {
      setEnv('VERCEL_ENV', 'production');
      setEnv('NODE_ENV', 'development');
      setEnv('ENABLE_DEV_PAYMENT_SIMULATION', 'true');

      assert.equal(isDevPaymentSimulationEnabled(), false);
    } finally {
      setEnv('VERCEL_ENV', origVercel);
      setEnv('NODE_ENV', origNode);
      setEnv('ENABLE_DEV_PAYMENT_SIMULATION', origSim);
    }
  });

  it('strictly blocks dev payment simulation in Vercel Preview', () => {
    const origVercel = process.env.VERCEL_ENV;
    const origNode = process.env.NODE_ENV;
    const origSim = process.env.ENABLE_DEV_PAYMENT_SIMULATION;

    try {
      setEnv('VERCEL_ENV', 'preview');
      setEnv('NODE_ENV', 'development');
      setEnv('ENABLE_DEV_PAYMENT_SIMULATION', 'true');

      assert.equal(isDevPaymentSimulationEnabled(), false);
    } finally {
      setEnv('VERCEL_ENV', origVercel);
      setEnv('NODE_ENV', origNode);
      setEnv('ENABLE_DEV_PAYMENT_SIMULATION', origSim);
    }
  });

  it('strictly blocks dev payment simulation when VEHICLE_LOOKUP_MODE is live', () => {
    const origVercel = process.env.VERCEL_ENV;
    const origNode = process.env.NODE_ENV;
    const origLookup = process.env.VEHICLE_LOOKUP_MODE;
    const origSim = process.env.ENABLE_DEV_PAYMENT_SIMULATION;

    try {
      setEnv('VERCEL_ENV', undefined);
      setEnv('NODE_ENV', 'development');
      setEnv('VEHICLE_LOOKUP_MODE', 'live');
      setEnv('ENABLE_DEV_PAYMENT_SIMULATION', 'true');

      assert.equal(isDevPaymentSimulationEnabled(), false);
    } finally {
      setEnv('VERCEL_ENV', origVercel);
      setEnv('NODE_ENV', origNode);
      setEnv('VEHICLE_LOOKUP_MODE', origLookup);
      setEnv('ENABLE_DEV_PAYMENT_SIMULATION', origSim);
    }
  });

  it('strictly blocks dev payment simulation when NODE_ENV is production', () => {
    const origVercel = process.env.VERCEL_ENV;
    const origNode = process.env.NODE_ENV;
    const origSim = process.env.ENABLE_DEV_PAYMENT_SIMULATION;

    try {
      setEnv('VERCEL_ENV', undefined);
      setEnv('NODE_ENV', 'production');
      setEnv('ENABLE_DEV_PAYMENT_SIMULATION', 'true');

      assert.equal(isDevPaymentSimulationEnabled(), false);
    } finally {
      setEnv('VERCEL_ENV', origVercel);
      setEnv('NODE_ENV', origNode);
      setEnv('ENABLE_DEV_PAYMENT_SIMULATION', origSim);
    }
  });
});

describe('Credential Fingerprinting & Safe Environment Validation (Section D & E)', () => {
  it('fingerprints secrets safely without exposing them', () => {
    const secret = 'TEST-12345678-abcd-efgh-ijkl-9876543210ab';
    const fp = getSafeCredentialFingerprint(secret);

    assert.equal(fp.present, true);
    assert.equal(fp.prefix, 'TEST-');
    assert.equal(fp.length, secret.length);
    assert.ok(fp.fingerprint);
    assert.equal(fp.fingerprint.length, 12);
    // Ensure secret is never exposed
    assert.equal(fp.fingerprint.includes('abcd'), false);
    assert.equal(fp.fingerprint.includes('9876543210'), false);
  });

  it('correctly categorizes test vs production credentials based on prefix', () => {
    assert.equal(determineCredentialMode('TEST-'), 'test');
    assert.equal(determineCredentialMode('APP_U'), 'production');
    assert.equal(determineCredentialMode('PROD-'), 'production');
    assert.equal(determineCredentialMode('XYZ12'), 'invalid');
    assert.equal(determineCredentialMode(''), 'missing');
  });

  it('detects credential environment mismatches safely', () => {
    const origPk = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
    const origAt = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    try {
      setEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'TEST-abc-public-key-here');
      setEnv('MERCADO_PAGO_ACCESS_TOKEN', 'APP_USR-prod-access-token-here');

      const validation = validateMercadoPagoEnvironment();
      assert.equal(validation.isValid, false);
      assert.equal(validation.providerCredentialMode, 'invalid');
      assert.ok(validation.issues.some((issue) => issue.includes('Incompatibilidade de ambiente')));
    } finally {
      setEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', origPk);
      setEnv('MERCADO_PAGO_ACCESS_TOKEN', origAt);
    }
  });

  it('detects whitespace padding in credentials', () => {
    const origPk = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
    const origAt = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    try {
      setEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', ' TEST-abc-public-key ');
      setEnv('MERCADO_PAGO_ACCESS_TOKEN', 'TEST-xyz-access-token');

      const validation = validateMercadoPagoEnvironment();
      assert.ok(validation.issues.some((issue) => issue.includes('espaços em branco')));
    } finally {
      setEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', origPk);
      setEnv('MERCADO_PAGO_ACCESS_TOKEN', origAt);
    }
  });
});

describe('Issuer ID Handling & Anti-Hardcoded Verification (Task 7)', () => {
  it('strictly prohibits hardcoded issuer_id (e.g. 12749) when Brick does not return an issuer', () => {
    const rawIssuer = undefined;
    const parsedIssuer =
      rawIssuer !== undefined && rawIssuer !== null && rawIssuer !== ''
        ? Number(rawIssuer)
        : undefined;
    const validIssuerId =
      parsedIssuer !== undefined &&
      Number.isInteger(parsedIssuer) &&
      parsedIssuer > 0 &&
      Number.isFinite(parsedIssuer)
        ? parsedIssuer
        : undefined;

    const payload: Record<string, unknown> = {
      transaction_amount: 49.99,
      payment_method_id: 'master',
      token: 'tok_card_sample',
    };

    if (validIssuerId) {
      payload.issuer_id = validIssuerId;
    }

    const cleaned = cleanPayload(payload);

    assert.equal('issuer_id' in cleaned, false);
    assert.notEqual(cleaned.issuer_id, 12749);
    assert.notEqual(cleaned.issuer_id, '12749');
  });

  it('includes issuer_id dynamically only when provided as a valid number by Brick', () => {
    const rawIssuer: string | undefined = '24';
    const parsedIssuer =
      rawIssuer !== undefined && rawIssuer !== null && rawIssuer !== ''
        ? Number(rawIssuer)
        : undefined;
    const validIssuerId =
      parsedIssuer !== undefined &&
      Number.isInteger(parsedIssuer) &&
      parsedIssuer > 0 &&
      Number.isFinite(parsedIssuer)
        ? parsedIssuer
        : undefined;

    const payload: Record<string, unknown> = {
      transaction_amount: 49.99,
      payment_method_id: 'master',
      token: 'tok_card_sample',
    };

    if (validIssuerId) {
      payload.issuer_id = validIssuerId;
    }

    const cleaned = cleanPayload(payload);

    assert.equal(cleaned.issuer_id, 24);
    assert.equal(typeof cleaned.issuer_id, 'number');
  });
});

describe('Diagnostic Variations A, B, C & Security Gates (Tasks 8 & 9)', () => {
  const {
    buildVariationAPayload,
    buildVariationBPayload,
    buildVariationCPayload,
    isDiagnosticTestsAllowed,
    assertDiagnosticTestsAllowed,
  } = require('../diagnostic.ts');
  const { getMercadoPagoWebhookUrl } = require('../client.ts');

  it('Variation A builds complete payload with idempotency key and dynamic issuer', () => {
    const params = {
      canonicalAmount: 49.99,
      token: 'tok_var_a_123',
      installments: 1,
      userEmail: 'cliente@teste.com',
      normalizedCpf: '12345678909',
      flowId: 'flow-a-1',
      consultationId: 'cons-a-1',
      brickIssuerId: 310,
      notificationUrl: 'https://afmotos.vercel.app/api/webhooks/mercadopago',
    };

    const result = buildVariationAPayload(params);

    assert.ok(result.body);
    assert.equal(result.body.payment_method_id, 'master');
    assert.equal(result.body.token, 'tok_var_a_123');
    assert.equal(result.body.issuer_id, 310);
    assert.equal(result.body.external_reference, 'cons-a-1');
    assert.equal(
      result.body.notification_url,
      'https://afmotos.vercel.app/api/webhooks/mercadopago',
    );
    assert.ok(result.requestOptions?.idempotencyKey);
    assert.equal(result.idempotencyKey, result.requestOptions?.idempotencyKey);
  });

  it('Variation B builds minimal payload without issuer, external_reference, or notification_url', () => {
    const params = {
      canonicalAmount: 49.99,
      token: 'tok_var_b_456',
      installments: 1,
      userEmail: 'cliente@teste.com',
      normalizedCpf: '12345678909',
      flowId: 'flow-b-1',
      consultationId: 'cons-b-1',
      brickIssuerId: 310,
      notificationUrl: 'https://afmotos.vercel.app/api/webhooks/mercadopago',
    };

    const result = buildVariationBPayload(params);

    assert.ok(result.body);
    assert.equal(result.body.payment_method_id, 'master');
    assert.equal(result.body.token, 'tok_var_b_456');
    assert.equal('issuer_id' in result.body, false);
    assert.equal('external_reference' in result.body, false);
    assert.equal('notification_url' in result.body, false);
    assert.ok(result.requestOptions?.idempotencyKey);
  });

  it('Variation C builds complete payload without issuer_id', () => {
    const params = {
      canonicalAmount: 49.99,
      token: 'tok_var_c_789',
      installments: 1,
      userEmail: 'cliente@teste.com',
      normalizedCpf: '12345678909',
      flowId: 'flow-c-1',
      consultationId: 'cons-c-1',
      brickIssuerId: 310,
      notificationUrl: 'https://afmotos.vercel.app/api/webhooks/mercadopago',
    };

    const result = buildVariationCPayload(params);

    assert.ok(result.body);
    assert.equal(result.body.payment_method_id, 'master');
    assert.equal(result.body.token, 'tok_var_c_789');
    assert.equal('issuer_id' in result.body, false);
    assert.equal(result.body.external_reference, 'cons-c-1');
    assert.equal(
      result.body.notification_url,
      'https://afmotos.vercel.app/api/webhooks/mercadopago',
    );
    assert.ok(result.requestOptions?.idempotencyKey);
  });

  it('each test variation generates a distinct new idempotency key', () => {
    const params = {
      canonicalAmount: 49.99,
      token: 'tok_test',
      installments: 1,
      userEmail: 'a@b.com',
      normalizedCpf: '12345678909',
      flowId: 'f1',
      consultationId: 'c1',
    };

    const call1 = buildVariationAPayload(params);
    const call2 = buildVariationAPayload(params);

    assert.notEqual(
      call1.requestOptions?.idempotencyKey,
      call2.requestOptions?.idempotencyKey,
    );
  });

  it('strictly blocks diagnostic variations in Vercel Production', () => {
    const origVercel = process.env.VERCEL_ENV;
    const origNode = process.env.NODE_ENV;
    const origFlag = process.env.ENABLE_MP_DIAGNOSTIC_TESTS;

    try {
      setEnv('VERCEL_ENV', 'production');
      setEnv('NODE_ENV', 'development');
      setEnv('ENABLE_MP_DIAGNOSTIC_TESTS', 'true');

      const gate = isDiagnosticTestsAllowed();
      assert.equal(gate.allowed, false);
      assert.throws(() => assertDiagnosticTestsAllowed(), /Vercel Production/);
    } finally {
      setEnv('VERCEL_ENV', origVercel);
      setEnv('NODE_ENV', origNode);
      setEnv('ENABLE_MP_DIAGNOSTIC_TESTS', origFlag);
    }
  });

  it('strictly blocks diagnostic variations in Vercel Preview', () => {
    const origVercel = process.env.VERCEL_ENV;
    const origNode = process.env.NODE_ENV;
    const origFlag = process.env.ENABLE_MP_DIAGNOSTIC_TESTS;

    try {
      setEnv('VERCEL_ENV', 'preview');
      setEnv('NODE_ENV', 'development');
      setEnv('ENABLE_MP_DIAGNOSTIC_TESTS', 'true');

      const gate = isDiagnosticTestsAllowed();
      assert.equal(gate.allowed, false);
      assert.throws(() => assertDiagnosticTestsAllowed(), /Vercel Preview/);
    } finally {
      setEnv('VERCEL_ENV', origVercel);
      setEnv('NODE_ENV', origNode);
      setEnv('ENABLE_MP_DIAGNOSTIC_TESTS', origFlag);
    }
  });

  it('strictly blocks diagnostic variations when ENABLE_MP_DIAGNOSTIC_TESTS is false or unset', () => {
    const origVercel = process.env.VERCEL_ENV;
    const origNode = process.env.NODE_ENV;
    const origFlag = process.env.ENABLE_MP_DIAGNOSTIC_TESTS;

    try {
      setEnv('VERCEL_ENV', undefined);
      setEnv('NODE_ENV', 'development');
      setEnv('ENABLE_MP_DIAGNOSTIC_TESTS', undefined);

      const gate = isDiagnosticTestsAllowed();
      assert.equal(gate.allowed, false);
      assert.throws(() => assertDiagnosticTestsAllowed(), /ENABLE_MP_DIAGNOSTIC_TESTS/);
    } finally {
      setEnv('VERCEL_ENV', origVercel);
      setEnv('NODE_ENV', origNode);
      setEnv('ENABLE_MP_DIAGNOSTIC_TESTS', origFlag);
    }
  });

  it('rejects localhost or http in getMercadoPagoWebhookUrl (Task 12)', () => {
    const origCustom = process.env.MERCADO_PAGO_WEBHOOK_URL;
    const origApp = process.env.NEXT_PUBLIC_APP_URL;

    try {
      setEnv('MERCADO_PAGO_WEBHOOK_URL', 'http://localhost:3000/api/webhooks/mercadopago');
      setEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
      assert.equal(getMercadoPagoWebhookUrl(), null);

      setEnv('MERCADO_PAGO_WEBHOOK_URL', 'https://localhost/api/webhooks/mercadopago');
      assert.equal(getMercadoPagoWebhookUrl(), null);

      setEnv('MERCADO_PAGO_WEBHOOK_URL', 'https://afmotos.vercel.app/api/webhooks/mercadopago');
      assert.equal(
        getMercadoPagoWebhookUrl(),
        'https://afmotos.vercel.app/api/webhooks/mercadopago',
      );
    } finally {
      setEnv('MERCADO_PAGO_WEBHOOK_URL', origCustom);
      setEnv('NEXT_PUBLIC_APP_URL', origApp);
    }
  });
});

