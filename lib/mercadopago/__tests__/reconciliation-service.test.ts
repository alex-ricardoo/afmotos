import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  confirmAndProcessPaymentTransaction,
  type AuthoritativePaymentData,
} from '../payment-processing-service.ts';
import { type PaymentTransactionRecord } from '../types.ts';

describe('Payment Confirmation & Reconciliation Service', () => {
  function createMockDb() {
    return {
      from: (table: string) => ({
        update: (_data: unknown) => ({
          eq: (_field: string, _val: unknown) => ({
            eq: (_f2: string, _v2: unknown) => ({
              select: () => Promise.resolve({ data: [{ id: 'mock-claimed-id' }], error: null }),
            }),
            select: () => Promise.resolve({ data: [{ id: 'mock-id' }], error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: (_data: unknown) => Promise.resolve({ data: null, error: null }),
        select: (_cols?: string) => ({
          eq: (_field: string, _val: unknown) => ({
            eq: (_f2: string, _v2: unknown) => ({
              maybeSingle: () => {
                if (table === 'payment_transactions') {
                  return Promise.resolve({
                    data: {
                      id: '54b419a6-053e-48fc-8afc-9aa3eaed39ad',
                      consultation_id: '259d3e00-d00d-45ce-bcf2-935493b8eae8',
                      status: 'approved',
                      mp_payment_id: '177857907601',
                    },
                    error: null,
                  });
                }
                return Promise.resolve({
                  data: {
                    id: '259d3e00-d00d-45ce-bcf2-935493b8eae8',
                    status: 'completed',
                    payment_status: 'unpaid',
                    vehicle_data: { brand: 'Honda' },
                  },
                  error: null,
                });
              },
            }),
            maybeSingle: () => {
              if (table === 'payment_transactions') {
                return Promise.resolve({
                  data: {
                    id: '54b419a6-053e-48fc-8afc-9aa3eaed39ad',
                    consultation_id: '259d3e00-d00d-45ce-bcf2-935493b8eae8',
                    status: 'approved',
                    mp_payment_id: '177857907601',
                  },
                  error: null,
                });
              }
              return Promise.resolve({
                data: {
                  id: '259d3e00-d00d-45ce-bcf2-935493b8eae8',
                  status: 'completed',
                  payment_status: 'unpaid',
                  vehicle_data: { brand: 'Honda' },
                },
                error: null,
              });
            },
          }),
        }),
      }),
    };
  }

  function createMockTransaction(overrides?: Partial<PaymentTransactionRecord>): PaymentTransactionRecord {
    return {
      id: '54b419a6-053e-48fc-8afc-9aa3eaed39ad',
      consultation_id: '259d3e00-d00d-45ce-bcf2-935493b8eae8',
      user_id: 'user-uuid-123456',
      mp_preference_id: 'pref-123',
      mp_payment_id: null,
      status: 'pending',
      status_detail: null,
      payment_method_id: null,
      payment_type_id: null,
      transaction_amount: 49.99,
      net_received_amount: null,
      installments: 1,
      payer_email: null,
      idempotency_key: 'idem-123',
      failure_code: null,
      failure_message_safe: null,
      refund_status: 'none',
      refund_amount: null,
      refunded_at: null,
      mp_refund_id: null,
      raw_response: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  // T18: Reconciliação / Confirmação de pagamento aprovado
  it('T18: confirma pagamento aprovado correspondente e permite desbloqueio do laudo', async () => {
    const tx = createMockTransaction();
    const dbClient = createMockDb();
    const paymentData: AuthoritativePaymentData = {
      id: '177857907601',
      status: 'approved',
      statusDetail: 'accredited',
      externalReference: tx.id,
      transactionAmount: 49.99,
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'cliente@teste.com',
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: tx,
      paymentData,
      actorType: 'customer',
      actorId: tx.user_id,
      dbClient,
    });

    assert.equal(result.success, true);
    assert.equal(result.currentStatus, 'approved');
  });

  // T19: Reconciliação com pagamento ainda pendente
  it('T19: preserva status pendente sem desbloquear o laudo se o pagamento ainda não foi compensado', async () => {
    const tx = createMockTransaction();
    const dbClient = createMockDb();
    const paymentData: AuthoritativePaymentData = {
      id: '177857907601',
      status: 'pending',
      statusDetail: 'waiting_transfer',
      externalReference: tx.id,
      transactionAmount: 49.99,
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'cliente@teste.com',
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: tx,
      paymentData,
      actorType: 'customer',
      actorId: tx.user_id,
      dbClient,
    });

    assert.equal(result.success, true);
    assert.equal(result.currentStatus, 'pending');
    assert.equal(result.reportUnlocked, false);
  });

  // T20: Rejeita quando external_reference for divergente
  it('T20: rejeita confirmação quando a referência externa do provedor não bater com a transação interna', async () => {
    const tx = createMockTransaction();
    const dbClient = createMockDb();
    const paymentData: AuthoritativePaymentData = {
      id: '177857907601',
      status: 'approved',
      statusDetail: 'accredited',
      externalReference: 'outro-uuid-diferente',
      transactionAmount: 49.99,
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'cliente@teste.com',
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: tx,
      paymentData,
      actorType: 'customer',
      actorId: tx.user_id,
      dbClient,
    });

    assert.equal(result.success, false);
    assert.match(result.error || '', /diverge/i);
  });

  // Rejeita divergência de valores monetários (em centavos)
  it('rejeita confirmação quando o valor do pagamento divergir do valor no banco', async () => {
    const tx = createMockTransaction({ transaction_amount: 49.99 });
    const dbClient = createMockDb();
    const paymentData: AuthoritativePaymentData = {
      id: '177857907601',
      status: 'approved',
      statusDetail: 'accredited',
      externalReference: tx.id,
      transactionAmount: 10.0,
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'cliente@teste.com',
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: tx,
      paymentData,
      actorType: 'customer',
      actorId: tx.user_id,
      dbClient,
    });

    assert.equal(result.success, false);
    assert.match(result.message || '', /Valor monetário divergente/i);
  });

  // Proteção estrita contra downgrade de approved
  it('impede downgrade de transação previamente aprovada para pendente', async () => {
    const tx = createMockTransaction({ status: 'approved', mp_payment_id: '177857907601' });
    const dbClient = createMockDb();
    const paymentData: AuthoritativePaymentData = {
      id: '177857907601',
      status: 'pending',
      statusDetail: 'waiting_transfer',
      externalReference: tx.id,
      transactionAmount: 49.99,
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'cliente@teste.com',
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: tx,
      paymentData,
      actorType: 'webhook',
      dbClient,
    });

    assert.equal(result.success, true);
    assert.equal(result.currentStatus, 'approved');
    assert.equal(result.statusChanged, false);
  });
});
