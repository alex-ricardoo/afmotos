import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processPaymentRouteSchema } from '../schemas.ts';

describe('Process Payment Route Schema & Transport Security (Feature 027)', () => {
  it('deve aceitar payload válido com token, CPF de 11 dígitos e consultationId UUID', () => {
    const validPayload = {
      consultationId: '26f22f28-1f47-4773-bd14-f0814af16de9',
      token: '95a6b0c2a8c084f7b4931a0b33b934c9',
      paymentMethodId: 'master',
      issuerId: '25',
      installments: 1,
      payer: {
        identification: {
          type: 'CPF',
          number: '123.456.789-09',
        },
      },
      clientObservability: {
        tokenCreatedAt: Date.now(),
        tokenHashTruncated: '95a6b0c2',
        submitAttemptNumber: 1,
      },
    };

    const result = processPaymentRouteSchema.safeParse(validPayload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.payer.identification.number, '12345678909');
      assert.equal(result.data.payer.identification.type, 'CPF');
      assert.equal(result.data.issuerId, 25);
      assert.equal(result.data.installments, 1);
    }
  });

  it('deve rejeitar quando o consultationId não for um UUID válido', () => {
    const invalidPayload = {
      consultationId: 'invalid-id-123',
      token: '95a6b0c2a8c084f7b4931a0b33b934c9',
      paymentMethodId: 'master',
      payer: {
        identification: {
          number: '12345678909',
        },
      },
    };

    const result = processPaymentRouteSchema.safeParse(invalidPayload);
    assert.equal(result.success, false);
  });

  it('deve rejeitar quando o token estiver ausente ou vazio', () => {
    const invalidPayload = {
      consultationId: '26f22f28-1f47-4773-bd14-f0814af16de9',
      token: '',
      paymentMethodId: 'master',
      payer: {
        identification: {
          number: '12345678909',
        },
      },
    };

    const result = processPaymentRouteSchema.safeParse(invalidPayload);
    assert.equal(result.success, false);
  });

  it('deve rejeitar quando o CPF não contiver exatamente 11 dígitos numéricos', () => {
    const invalidPayload = {
      consultationId: '26f22f28-1f47-4773-bd14-f0814af16de9',
      token: '95a6b0c2a8c084f7b4931a0b33b934c9',
      paymentMethodId: 'master',
      payer: {
        identification: {
          number: '12345',
        },
      },
    };

    const result = processPaymentRouteSchema.safeParse(invalidPayload);
    assert.equal(result.success, false);
  });

  it('deve omitir issuerId quando for inválido, negativo ou não numérico', () => {
    const payloadWithInvalidIssuer = {
      consultationId: '26f22f28-1f47-4773-bd14-f0814af16de9',
      token: '95a6b0c2a8c084f7b4931a0b33b934c9',
      paymentMethodId: 'master',
      issuerId: '-10',
      payer: {
        identification: {
          number: '12345678909',
        },
      },
    };

    const result = processPaymentRouteSchema.safeParse(payloadWithInvalidIssuer);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.issuerId, undefined);
    }
  });

  it('deve ignorar campos não autorizados como amount e status injetados no cliente', () => {
    const payloadWithInjectedAmount = {
      consultationId: '26f22f28-1f47-4773-bd14-f0814af16de9',
      token: '95a6b0c2a8c084f7b4931a0b33b934c9',
      paymentMethodId: 'master',
      amount: 0.01,
      status: 'approved',
      payer: {
        identification: {
          number: '12345678909',
        },
      },
    };

    const result = processPaymentRouteSchema.safeParse(payloadWithInjectedAmount);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal((result.data as Record<string, unknown>).amount, undefined);
      assert.equal((result.data as Record<string, unknown>).status, undefined);
    }
  });
});
