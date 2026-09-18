/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { confirmAndProcessPaymentTransaction } from '../../mercadopago/payment-processing-service.ts';
import { buildPackagePreferenceBody } from '../../mercadopago/package-preference-builder.ts';
import type { CreditPackageOrder, CreditPackageOffer } from '../types.ts';

describe('Package Checkout Flow Integration & Isolation (T009)', () => {
  const mockOffer: CreditPackageOffer = {
    id: 'offer-starter-5',
    name: 'Pacote Inicial (5 Consultas)',
    slug: 'pacote-inicial-5',
    package_type: 'standard',
    credits_quantity: 5,
    price_cents: 18950,
    currency: 'BRL',
    reference_individual_price_cents: 3990,
    discount_percent: 5,
    badge: 'Autônomo',
    tagline: 'Ideal para quem compra ou vende veículos com frequência moderada.',
    perks: ['5 consultas veiculares completas'],
    contact_only: false,
    requires_whatsapp: false,
    highlight: false,
    is_featured: false,
    sort_order: 1,
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockOrder: CreditPackageOrder = {
    id: 'order-1234-uuid',
    user_id: 'user-5678-uuid',
    offer_id: mockOffer.id,
    offer_name_snapshot: mockOffer.name,
    quantity: 1,
    credits_quantity: mockOffer.credits_quantity,
    price_cents: mockOffer.price_cents,
    currency: 'BRL',
    unit_price_cents: 3790,
    reference_individual_price_cents: 3990,
    discount_cents: 1000,
    discount_percent: 5,
    status: 'pending',
    payment_transaction_id: 'tx-9999-uuid',
    external_reference: 'order-1234-uuid',
    idempotency_key: 'idem-key-abc',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('1. Package Preference Builder generates valid Mercado Pago payload with order snapshot', () => {
    const preference = buildPackagePreferenceBody({
      order: mockOrder,
      offer: mockOffer,
      customerEmail: 'cliente@exemplo.com',
    });

    assert.equal(preference.external_reference, 'order-1234-uuid');
    assert.equal(preference.items.length, 1);
    assert.equal(preference.items[0].unit_price, 189.5);
    assert.equal(preference.items[0].currency_id, 'BRL');
    assert.equal(preference.metadata?.purpose, 'credit_package');
    assert.equal(preference.metadata?.order_id, 'order-1234-uuid');
  });

  it('2. confirmAndProcessPaymentTransaction processes approved package payment and calls grant_credit_package_from_paid_order', async () => {
    let rpcCalledWith: any = null;
    let orderUpdatedWith: any = null;
    let txUpdatedWith: any = null;
    let auditLogInserted: any = null;

    const mockDb = {
      from: (table: string) => {
        if (table === 'payment_transactions') {
          return {
            update: (values: any) => ({
              eq: (field: string, val: string) => {
                txUpdatedWith = { field, val, values };
                return Promise.resolve({ error: null });
              },
            }),
          };
        }
        if (table === 'credit_package_orders') {
          return {
            update: (values: any) => ({
              eq: (field: string, val: string) => {
                orderUpdatedWith = { field, val, values };
                return Promise.resolve({ error: null });
              },
            }),
          };
        }
        if (table === 'consultation_audit_logs') {
          return {
            insert: (values: any) => {
              auditLogInserted = values;
              return Promise.resolve({ error: null });
            },
          };
        }
        return {
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          insert: () => Promise.resolve({ error: null }),
        };
      },
      rpc: async (fn: string, params: any) => {
        if (fn === 'grant_credit_package_from_paid_order') {
          rpcCalledWith = params;
          return { data: { success: true, code: 'CREDITS_GRANTED' }, error: null };
        }
        return { data: null, error: null };
      },
    };

    const mockTransaction = {
      id: 'tx-9999-uuid',
      consultation_id: null,
      purpose: 'credit_package',
      credit_package_order_id: 'order-1234-uuid',
      user_id: 'user-5678-uuid',
      status: 'pending',
      transaction_amount: 189.5,
      mp_payment_id: null,
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: mockTransaction as any,
      paymentData: {
        id: 'mp-pay-8888',
        status: 'approved',
        statusDetail: 'accredited',
        externalReference: 'order-1234-uuid',
        transactionAmount: 189.5,
        paymentMethodId: 'pix',
        paymentTypeId: 'bank_transfer',
        payerEmail: 'cliente@exemplo.com',
      },
      actorType: 'webhook',
      flowId: 'test-flow-uuid',
      dbClient: mockDb as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.currentStatus, 'approved');
    assert.equal(result.packageGranted, true);
    assert.equal(result.reportUnlocked, false);

    // Verificações de persistência
    assert.ok(txUpdatedWith, 'Payment transaction must be updated');
    assert.equal(txUpdatedWith.values.status, 'approved');
    assert.equal(txUpdatedWith.values.mp_payment_id, 'mp-pay-8888');

    assert.ok(orderUpdatedWith, 'Order must be updated');
    assert.equal(orderUpdatedWith.values.status, 'paid');
    assert.equal(orderUpdatedWith.values.mp_payment_id, 'mp-pay-8888');

    assert.ok(rpcCalledWith, 'RPC grant_credit_package_from_paid_order must be called');
    assert.equal(rpcCalledWith.p_order_id, 'order-1234-uuid');

    assert.ok(auditLogInserted, 'Audit log must be recorded');
    assert.equal(auditLogInserted.event, 'credit_package_payment_confirmed');
    assert.equal(auditLogInserted.transaction_id, 'tx-9999-uuid');
    assert.equal(auditLogInserted.details.order_id, 'order-1234-uuid');
  });

  it('3. Rejects payment confirmation when amount diverges from canonical price', async () => {
    const mockTransaction = {
      id: 'tx-9999-uuid',
      consultation_id: null,
      purpose: 'credit_package',
      credit_package_order_id: 'order-1234-uuid',
      user_id: 'user-5678-uuid',
      status: 'pending',
      transaction_amount: 189.5,
      mp_payment_id: null,
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: mockTransaction as any,
      paymentData: {
        id: 'mp-pay-8888',
        status: 'approved',
        statusDetail: 'accredited',
        externalReference: 'order-1234-uuid',
        transactionAmount: 10.0, // Preço divergente
        paymentMethodId: 'pix',
        paymentTypeId: 'bank_transfer',
        payerEmail: 'cliente@exemplo.com',
      },
      actorType: 'webhook',
      flowId: 'test-flow-uuid',
      dbClient: {} as any,
    });

    assert.equal(result.success, false);
    assert.equal(result.message, 'Valor monetário divergente.');
  });
});
