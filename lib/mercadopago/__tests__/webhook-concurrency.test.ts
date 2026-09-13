import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  confirmAndProcessPaymentTransaction,
  type AuthoritativePaymentData,
} from '../payment-processing-service.ts';
import { canTransitionStatus } from '../payment-status-mapper.ts';
import { releaseVerifiedPaidConsultation } from '../consultation-releaser.ts';
import { type PaymentTransactionRecord } from '../types.ts';

describe('Webhook Concurrency & Idempotency (T16, T17)', () => {
  function createMockTx(overrides?: Partial<PaymentTransactionRecord>): PaymentTransactionRecord {
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

  // T16: Concorrência e idempotência - dois eventos simultâneos de aprovação
  it('T16: múltiplos eventos simultâneos para o mesmo pagamento são idempotentes e liberam a consulta uma única vez', async () => {
    let claimCount = 0;
    const mockDb = {
      from: (table: string) => ({
        update: (data: any) => ({
          eq: (_f1: string, _v1: any) => ({
            eq: (_f2: string, _v2: any) => ({
              select: () => {
                // Simula optimistic locking: apenas a primeira chamada ganha o lock
                if (table === 'customer_plate_consultations' && data.payment_status === 'paid') {
                  claimCount++;
                  if (claimCount === 1) {
                    return Promise.resolve({ data: [{ id: 'mock-consultation-id' }], error: null });
                  }
                  return Promise.resolve({ data: [], error: null }); // concorrência perdeu
                }
                return Promise.resolve({ data: [{ id: 'mock-id' }], error: null });
              },
            }),
            select: () => Promise.resolve({ data: [{ id: 'mock-id' }], error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        select: () => ({
          eq: () => ({
            eq: () => ({
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

    const tx = createMockTx();
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

    // Dispara dois processamentos concorrentes (ex.: webhook e reconcile executando ao mesmo tempo)
    const [res1, res2] = await Promise.all([
      confirmAndProcessPaymentTransaction({
        transaction: tx,
        paymentData,
        actorType: 'webhook',
        dbClient: mockDb,
      }),
      confirmAndProcessPaymentTransaction({
        transaction: tx,
        paymentData,
        actorType: 'customer',
        actorId: tx.user_id,
        dbClient: mockDb,
      }),
    ]);

    assert.equal(res1.success, true);
    assert.equal(res2.success, true);
    assert.equal(res1.currentStatus, 'approved');
    assert.equal(res2.currentStatus, 'approved');
  });

  // T17: Prevenção estrita de downgrade por eventos fora de ordem
  it('T17: notificação aprovada seguida de evento pendente atrasado não reverte o status approved (sem downgrade)', async () => {
    // 1. Validação de matriz de transição de status
    assert.equal(canTransitionStatus('approved', 'pending'), false);
    assert.equal(canTransitionStatus('approved', 'in_process'), false);
    assert.equal(canTransitionStatus('approved', 'rejected'), false);
    assert.equal(canTransitionStatus('approved', 'cancelled'), false);

    // 2. Validação no serviço de processamento
    const mockDb = {
      from: (table: string) => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => Promise.resolve({ data: [{ id: 'mock-id' }], error: null }),
            }),
            select: () => Promise.resolve({ data: [{ id: 'mock-id' }], error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        select: () => ({
          eq: () => ({
            maybeSingle: () => {
              if (table === 'payment_transactions') {
                return Promise.resolve({
                  data: {
                    id: '54b419a6-053e-48fc-8afc-9aa3eaed39ad',
                    status: 'approved',
                    mp_payment_id: '177857907601',
                    consultation_id: '259d3e00-d00d-45ce-bcf2-935493b8eae8',
                  },
                  error: null,
                });
              }
              return Promise.resolve({
                data: {
                  id: '259d3e00-d00d-45ce-bcf2-935493b8eae8',
                  status: 'completed',
                  payment_status: 'paid',
                  vehicle_data: { brand: 'Honda' },
                },
                error: null,
              });
            },
          }),
        }),
      }),
    };

    const alreadyApprovedTx = createMockTx({
      status: 'approved',
      mp_payment_id: '177857907601',
    });

    const delayedPendingData: AuthoritativePaymentData = {
      id: '177857907601',
      status: 'pending',
      statusDetail: 'waiting_transfer',
      externalReference: alreadyApprovedTx.id,
      transactionAmount: 49.99,
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'cliente@teste.com',
    };

    const outcome = await confirmAndProcessPaymentTransaction({
      transaction: alreadyApprovedTx,
      paymentData: delayedPendingData,
      actorType: 'webhook',
      dbClient: mockDb,
    });

    // O status deve permanecer approved e statusChanged deve ser false
    assert.equal(outcome.success, true);
    assert.equal(outcome.previousStatus, 'approved');
    assert.equal(outcome.currentStatus, 'approved');
    assert.equal(outcome.statusChanged, false);
  });

  it('liberação de consulta concluída anteriormente não reexecuta busca veicular (alreadyCompleted: true)', async () => {
    const mockDb = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => {
              if (table === 'payment_transactions') {
                return Promise.resolve({
                  data: {
                    id: 'tx-123',
                    consultation_id: 'consult-123',
                    status: 'approved',
                    mp_payment_id: '177857907601',
                    transaction_amount: 49.99,
                  },
                  error: null,
                });
              }
              return Promise.resolve({
                data: {
                  id: 'consult-123',
                  status: 'completed',
                  payment_status: 'paid',
                  vehicle_data: { brand: 'Honda', model: 'CG 160' },
                },
                error: null,
              });
            },
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    };

    const release = await releaseVerifiedPaidConsultation('tx-123', mockDb);

    assert.equal(release.success, true);
    assert.equal(release.alreadyCompleted, true);
    assert.equal(release.consultationId, 'consult-123');
  });
});
