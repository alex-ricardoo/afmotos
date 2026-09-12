import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPaymentBrickConfig,
  normalizeEntityType,
  isValidMercadoPagoPublicKey,
} from '../brick-config.ts';

describe('Payment Brick Deterministic Configuration & Anti-Warning Gates (Tasks B, C, D, E)', () => {
  it('Tarefa B: garante que a configuração do Brick NÃO contém fontFamily em nenhum nível', () => {
    const config = buildPaymentBrickConfig({
      amount: 49.99,
      payerEmail: 'cliente@exemplo.com',
      entityType: 'individual',
    });

    const serialized = JSON.stringify(config);
    assert.equal(
      serialized.includes('fontFamily'),
      false,
      "Configuração não pode conter a chave 'fontFamily'",
    );

    // Deep object inspection
    const customVars = config.customization.visual.style.customVariables as Record<string, unknown>;
    assert.equal(customVars.fontFamily, undefined);
  });

  it('Tarefa C: garante que a inicialização não contém preferenceId nem mercadoPago em paymentMethods', () => {
    const config = buildPaymentBrickConfig({
      amount: 49.99,
      payerEmail: 'cliente@exemplo.com',
    });

    const initObj = config.initialization as Record<string, unknown>;
    assert.equal(initObj.preferenceId, undefined);
    assert.equal(initObj.preference_id, undefined);

    const methods = config.customization.paymentMethods as Record<string, unknown>;
    assert.equal(methods.mercadoPago, undefined);
    assert.equal(methods.creditCard, 'all');
    assert.equal(methods.bankTransfer, 'all');
    assert.equal(methods.ticket, 'all');
  });

  it('Tarefa D: normaliza estritamente entityType para individual ou association e rejeita valores inválidos', () => {
    assert.equal(normalizeEntityType('individual'), 'individual');
    assert.equal(normalizeEntityType('association'), 'association');

    // Reject and fallback on invalid types
    assert.equal(normalizeEntityType(undefined), 'individual');
    assert.equal(normalizeEntityType(null), 'individual');
    assert.equal(normalizeEntityType(''), 'individual');
    assert.equal(normalizeEntityType('PF'), 'individual');
    assert.equal(normalizeEntityType('PJ'), 'individual');
    assert.equal(normalizeEntityType('person'), 'individual');
    assert.equal(normalizeEntityType('company'), 'individual');
    assert.equal(normalizeEntityType('customer'), 'individual');
    assert.equal(normalizeEntityType(123), 'individual');

    const config = buildPaymentBrickConfig({
      amount: 49.99,
      payerEmail: 'cliente@exemplo.com',
      entityType: 'PJ', // invalid input from profile/form
    });

    assert.equal(config.initialization.payer.entityType, 'individual');
  });

  it('Tarefa E: validação de Public Key com prefixo TEST- ou APP_USR- e sem espaços', () => {
    assert.equal(isValidMercadoPagoPublicKey('TEST-12345678-abcd-ef01-2345-6789abcdef01'), true);
    assert.equal(isValidMercadoPagoPublicKey('APP_USR-12345678-abcd-ef01-2345-6789abcdef01'), true);

    // Rejects
    assert.equal(isValidMercadoPagoPublicKey(''), false);
    assert.equal(isValidMercadoPagoPublicKey('   '), false);
    assert.equal(isValidMercadoPagoPublicKey(undefined), false);
    assert.equal(isValidMercadoPagoPublicKey(null), false);
    assert.equal(isValidMercadoPagoPublicKey('TEST- 12345'), false); // contains space
    assert.equal(isValidMercadoPagoPublicKey(' TEST-12345'), false); // leading space
    assert.equal(isValidMercadoPagoPublicKey('TEST-12345 '), false); // trailing space
    assert.equal(isValidMercadoPagoPublicKey('INVALID-KEY-123'), false);
    assert.equal(isValidMercadoPagoPublicKey('pk_live_123456'), false);
  });

  it('Tarefa E: rejeita montagem de configuração com amount zero ou negativo', () => {
    assert.throws(() => {
      buildPaymentBrickConfig({
        amount: 0,
        payerEmail: 'cliente@exemplo.com',
      });
    }, /Payment Brick amount must be a positive number/);

    assert.throws(() => {
      buildPaymentBrickConfig({
        amount: -49.99,
        payerEmail: 'cliente@exemplo.com',
      });
    }, /Payment Brick amount must be a positive number/);
  });
});
