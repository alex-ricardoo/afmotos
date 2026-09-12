import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMinimalCardPaymentForDiagnostics,
  type MercadoPagoPaymentResponse,
} from '../diagnostic.ts';

describe('Diagnostic Minimal Card Payment Mode (US1 / Bugfix)', () => {
  it('calls paymentClient.create with strictly minimal body (no issuer, no description, no requestOptions)', async () => {
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
  });

  it('safely captures provider 500 error without throwing', async () => {
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
  });
});
