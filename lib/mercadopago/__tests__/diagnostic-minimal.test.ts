import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMinimalCardPaymentForDiagnostics,
  isMinimalDiagnosticAllowed,
  type MercadoPagoPaymentResponse,
} from '../diagnostic.ts';

function setEnv(key: string, val: string | undefined) {
  if (val === undefined) {
    delete process.env[key];
  } else {
    (process.env as Record<string, string | undefined>)[key] = val;
  }
}

describe('Diagnostic Minimal Card Payment Security Gates & Mode (Section B & H)', () => {
  it('blocks diagnostic execution when VERCEL_ENV is production', () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNodeEnv = process.env.NODE_ENV;
    const origFlag = process.env.ENABLE_MP_MINIMAL_DIAGNOSTIC;

    try {
      setEnv('VERCEL_ENV', 'production');
      setEnv('NODE_ENV', 'development');
      setEnv('ENABLE_MP_MINIMAL_DIAGNOSTIC', 'true');

      const gate = isMinimalDiagnosticAllowed();
      assert.equal(gate.allowed, false);
      assert.match(gate.reason || '', /Vercel Production/);
    } finally {
      setEnv('VERCEL_ENV', origVercelEnv);
      setEnv('NODE_ENV', origNodeEnv);
      setEnv('ENABLE_MP_MINIMAL_DIAGNOSTIC', origFlag);
    }
  });

  it('blocks diagnostic execution when VERCEL_ENV is preview', () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNodeEnv = process.env.NODE_ENV;
    const origFlag = process.env.ENABLE_MP_MINIMAL_DIAGNOSTIC;

    try {
      setEnv('VERCEL_ENV', 'preview');
      setEnv('NODE_ENV', 'development');
      setEnv('ENABLE_MP_MINIMAL_DIAGNOSTIC', 'true');

      const gate = isMinimalDiagnosticAllowed();
      assert.equal(gate.allowed, false);
      assert.match(gate.reason || '', /Vercel Preview/);
    } finally {
      setEnv('VERCEL_ENV', origVercelEnv);
      setEnv('NODE_ENV', origNodeEnv);
      setEnv('ENABLE_MP_MINIMAL_DIAGNOSTIC', origFlag);
    }
  });

  it('blocks diagnostic execution without ENABLE_MP_MINIMAL_DIAGNOSTIC=true', () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNodeEnv = process.env.NODE_ENV;
    const origFlag = process.env.ENABLE_MP_MINIMAL_DIAGNOSTIC;

    try {
      setEnv('VERCEL_ENV', undefined);
      setEnv('NODE_ENV', 'development');
      setEnv('ENABLE_MP_MINIMAL_DIAGNOSTIC', 'false');

      const gate = isMinimalDiagnosticAllowed();
      assert.equal(gate.allowed, false);
      assert.match(gate.reason || '', /ENABLE_MP_MINIMAL_DIAGNOSTIC/);
    } finally {
      setEnv('VERCEL_ENV', origVercelEnv);
      setEnv('NODE_ENV', origNodeEnv);
      setEnv('ENABLE_MP_MINIMAL_DIAGNOSTIC', origFlag);
    }
  });

  it('calls paymentClient.create with strictly minimal body when allowed in local dev', async () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNodeEnv = process.env.NODE_ENV;
    const origFlag = process.env.ENABLE_MP_MINIMAL_DIAGNOSTIC;

    try {
      setEnv('VERCEL_ENV', undefined);
      setEnv('NODE_ENV', 'development');
      setEnv('ENABLE_MP_MINIMAL_DIAGNOSTIC', 'true');

      let capturedArg: { body: Record<string, unknown>; requestOptions?: unknown } | undefined;

      const mockPaymentClient = {
        create: async (arg: { body: Record<string, unknown>; requestOptions?: unknown }) => {
          capturedArg = arg;
          return {
            id: 1234567890,
            status: 'approved',
            status_detail: 'accredited',
            payment_type_id: 'credit_card',
          } as unknown as MercadoPagoPaymentResponse;
        },
      };

      const result = await createMinimalCardPaymentForDiagnostics({
        paymentClient: mockPaymentClient,
        canonicalAmount: 49.99,
        token: 'tok_test_card_123',
        installments: 1,
        paymentMethodId: 'master',
        userEmail: 'cliente@teste.com',
        normalizedCpf: '19119119100',
        flowId: 'test-flow-uuid',
        consultationId: '123e4567-e89b-12d3-a456-426614174000',
      });

      assert.equal(result.success, true);
      assert.equal(result.mpPayment?.id, 1234567890);

      const sentArg = capturedArg;
      assert.ok(sentArg);

      // Verify requestOptions is completely omitted
      assert.equal(sentArg.requestOptions, undefined);

      // Verify body fields: strictly minimal
      const body = sentArg.body;
      assert.equal(body.transaction_amount, 49.99);
      assert.equal(body.token, 'tok_test_card_123');
      assert.equal(body.installments, 1);
      assert.equal(body.payment_method_id, 'master');

      const payer = body.payer as { email: string; identification: { type: string; number: string } };
      assert.equal(payer.email, 'cliente@teste.com');
      assert.equal(payer.identification.type, 'CPF');
      assert.equal(payer.identification.number, '19119119100');

      // Verify optional fields are NOT present
      assert.equal(body.issuer_id, undefined);
      assert.equal(body.external_reference, undefined);
      assert.equal(body.description, undefined);
      assert.equal(body.notification_url, undefined);
      assert.equal(body.metadata, undefined);
      assert.equal(body.binary_mode, undefined);
      assert.equal(body.statement_descriptor, undefined);
      assert.equal(body.additional_info, undefined);
    } finally {
      setEnv('VERCEL_ENV', origVercelEnv);
      setEnv('NODE_ENV', origNodeEnv);
      setEnv('ENABLE_MP_MINIMAL_DIAGNOSTIC', origFlag);
    }
  });

  it('safely captures provider 500 error without throwing', async () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNodeEnv = process.env.NODE_ENV;
    const origFlag = process.env.ENABLE_MP_MINIMAL_DIAGNOSTIC;

    try {
      setEnv('VERCEL_ENV', undefined);
      setEnv('NODE_ENV', 'development');
      setEnv('ENABLE_MP_MINIMAL_DIAGNOSTIC', 'true');

      const error500 = new Error('internal_error') as Error & { status?: number };
      error500.status = 500;

      const mockPaymentClient = {
        create: async () => {
          throw error500;
        },
      };

      const result = await createMinimalCardPaymentForDiagnostics({
        paymentClient: mockPaymentClient,
        canonicalAmount: 49.99,
        token: 'tok_test_card_123',
        installments: 1,
        paymentMethodId: 'master',
        userEmail: 'cliente@teste.com',
        normalizedCpf: '19119119100',
        flowId: 'test-flow-uuid',
        consultationId: '123e4567-e89b-12d3-a456-426614174000',
      });

      assert.equal(result.success, false);
      const recordedErr = result.error as { status?: number } | undefined;
      assert.equal(recordedErr?.status, 500);
      assert.ok(result.durationMs >= 0);
    } finally {
      setEnv('VERCEL_ENV', origVercelEnv);
      setEnv('NODE_ENV', origNodeEnv);
      setEnv('ENABLE_MP_MINIMAL_DIAGNOSTIC', origFlag);
    }
  });
});
