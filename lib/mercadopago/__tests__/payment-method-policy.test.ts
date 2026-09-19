import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AF_MOTOS_ALLOWED_PAYMENT_METHODS,
  AF_MOTOS_EXCLUDED_PAYMENT_TYPES,
  AF_MOTOS_EXCLUDED_PAYMENT_METHODS,
  buildCheckoutPaymentMethodsPolicy,
  isBoletoPayment,
} from '../payment-method-policy.ts';
import { buildPreferenceBody } from '../preference-builder.ts';
import { buildPackagePreferenceBody } from '../package-preference-builder.ts';
import type { CreditPackageOrder, CreditPackageOffer } from '../../credits/types.ts';

describe('AF Motos Centralized Payment Method Policy', () => {
  it('1. garante que a política centralizada exclui o tipo boleto/ticket', () => {
    assert.equal(AF_MOTOS_ALLOWED_PAYMENT_METHODS.boleto, false);
    assert.ok(AF_MOTOS_EXCLUDED_PAYMENT_TYPES.includes('ticket'));
  });

  it('2. garante que PIX continua permitido', () => {
    assert.equal(AF_MOTOS_ALLOWED_PAYMENT_METHODS.pix, true);
    assert.equal(AF_MOTOS_EXCLUDED_PAYMENT_TYPES.includes('bank_transfer' as any), false);
    assert.equal(isBoletoPayment('bank_transfer', 'pix'), false);
  });

  it('3. garante que Cartão de Crédito continua permitido', () => {
    assert.equal(AF_MOTOS_ALLOWED_PAYMENT_METHODS.creditCard, true);
    assert.equal(AF_MOTOS_EXCLUDED_PAYMENT_TYPES.includes('credit_card' as any), false);
    assert.equal(isBoletoPayment('credit_card', 'master'), false);
    assert.equal(isBoletoPayment('credit_card', 'visa'), false);
  });

  it('4. garante que Cartão de Débito continua permitido', () => {
    assert.equal(AF_MOTOS_ALLOWED_PAYMENT_METHODS.debitCard, true);
    assert.equal(AF_MOTOS_EXCLUDED_PAYMENT_TYPES.includes('debit_card' as any), false);
    assert.equal(isBoletoPayment('debit_card', 'debvisa'), false);
  });

  it('5. garante que Saldo Mercado Pago não é excluído e continua permitido', () => {
    assert.equal(AF_MOTOS_ALLOWED_PAYMENT_METHODS.mercadoPagoBalance, true);
    assert.equal(AF_MOTOS_EXCLUDED_PAYMENT_TYPES.includes('account_money' as any), false);
    assert.equal(isBoletoPayment('account_money', 'account_money'), false);
  });

  it('6. buildCheckoutPaymentMethodsPolicy gera a estrutura correta para o SDK do Mercado Pago', () => {
    const config = buildCheckoutPaymentMethodsPolicy(12);
    assert.equal(config.installments, 12);
    assert.deepEqual(config.excluded_payment_types, [{ id: 'ticket' }]);
    assert.deepEqual(config.excluded_payment_methods, [
      { id: 'bolbradesco' },
      { id: 'pec' },
      { id: 'rapipago' },
      { id: 'pagofacil' },
    ]);
  });

  it('7. Consulta individual constrói preferência com exclusão de boleto no server-side', () => {
    const preference = buildPreferenceBody({
      consultationId: 'c1234567-0000-0000-0000-000000000001',
      transactionId: 't1234567-0000-0000-0000-000000000002',
      userId: 'u1234567-0000-0000-0000-000000000003',
      customerEmail: 'cliente@afmotos.com',
      unitPrice: 49.9,
      plate: 'BRA2E19',
    });

    assert.ok(preference.payment_methods);
    assert.equal(preference.payment_methods.installments, 12);
    assert.deepEqual(preference.payment_methods.excluded_payment_types, [{ id: 'ticket' }]);
    assert.deepEqual(preference.payment_methods.excluded_payment_methods, [
      { id: 'bolbradesco' },
      { id: 'pec' },
      { id: 'rapipago' },
      { id: 'pagofacil' },
    ]);
  });

  it('8. Pacote de créditos constrói preferência com exclusão de boleto no server-side', () => {
    const mockOrder: CreditPackageOrder = {
      id: 'order-uuid-123',
      user_id: 'user-uuid-456',
      offer_id: 'offer-uuid-789',
      offer_name_snapshot: 'Pacote Pro (10 Consultas)',
      quantity: 1,
      credits_quantity: 10,
      price_cents: 35000,
      unit_price_cents: 35000,
      discount_cents: 0,
      currency: 'BRL',
      status: 'pending',
      external_reference: 'pkg-123',
      idempotency_key: 'idemp-123',
      mp_preference_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockOffer: CreditPackageOffer = {
      id: 'offer-uuid-789',
      name: 'Pacote Pro (10 Consultas)',
      slug: 'pacote-pro',
      description: 'Pacote intermediário',
      package_type: 'standard',
      credits_quantity: 10,
      price_cents: 35000,
      currency: 'BRL',
      discount_percent: 30,
      display_order: 1,
      is_active: true,
      is_featured: true,
      contact_only: false,
      requires_whatsapp: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const preference = buildPackagePreferenceBody({
      order: mockOrder,
      offer: mockOffer,
      customerEmail: 'empresa@afmotos.com',
    });

    assert.ok(preference.payment_methods);
    assert.equal(preference.payment_methods.installments, 12);
    assert.deepEqual(preference.payment_methods.excluded_payment_types, [{ id: 'ticket' }]);
    assert.deepEqual(preference.payment_methods.excluded_payment_methods, [
      { id: 'bolbradesco' },
      { id: 'pec' },
      { id: 'rapipago' },
      { id: 'pagofacil' },
    ]);
  });

  it('9. isBoletoPayment identifica corretamente meios de ticket e offline', () => {
    assert.equal(isBoletoPayment('ticket', null), true);
    assert.equal(isBoletoPayment('ticket', 'bolbradesco'), true);
    assert.equal(isBoletoPayment(null, 'bolbradesco'), true);
    assert.equal(isBoletoPayment(null, 'pec'), true);
    assert.equal(isBoletoPayment(null, 'rapipago'), true);
    assert.equal(isBoletoPayment(null, 'pagofacil'), true);
    assert.equal(isBoletoPayment('boleto', null), true);

    // Meios legítimos retornam falso
    assert.equal(isBoletoPayment('bank_transfer', 'pix'), false);
    assert.equal(isBoletoPayment('credit_card', 'master'), false);
    assert.equal(isBoletoPayment('credit_card', 'visa'), false);
    assert.equal(isBoletoPayment('debit_card', 'debvisa'), false);
    assert.equal(isBoletoPayment('account_money', 'account_money'), false);
  });

  it('10. transações históricas com ticket/boleto são identificáveis sem alteração do dado', () => {
    const historicalRecord = {
      id: 'tx-historic-001',
      payment_type_id: 'ticket',
      payment_method_id: 'bolbradesco',
      status: 'approved',
    };

    assert.equal(isBoletoPayment(historicalRecord.payment_type_id, historicalRecord.payment_method_id), true);
    // Preserva o valor original para leitura retroativa
    assert.equal(historicalRecord.payment_type_id, 'ticket');
  });
});
