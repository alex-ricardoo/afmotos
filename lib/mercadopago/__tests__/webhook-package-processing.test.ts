import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  confirmAndProcessPaymentTransaction,
  type AuthoritativePaymentData,
} from '../payment-processing-service.ts';
import { type PaymentTransactionRecord } from '../types.ts';

describe('Credit Package Payment Confirmation & RPC Granting', () => {
  function createMockPackageTransaction(
    overrides?: Partial<PaymentTransactionRecord>,
  ): PaymentTransactionRecord {
    return {
      id: 'tx-pkg-1234-5678',
      consultation_id: null,
      user_id: 'usr-buyer-9999',
      mp_preference_id: 'pref-mp-123456',
      mp_payment_id: null,
      status: 'pending',
      status_detail: null,
      transaction_amount: 1.0,
      payment_method_id: null,
      payment_type_id: null,
      net_received_amount: null,
      installments: 1,
      payer_email: null,
      idempotency_key: 'idem-pkg-123',
      failure_code: null,
      failure_message_safe: null,
      refund_status: 'none',
      refund_amount: null,
      refunded_at: null,
      mp_refund_id: null,
      raw_response: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      purpose: 'credit_package',
      credit_package_order_id: 'ord-pkg-de58e94b',
      ...overrides,
    };
  }

  function createMockDb(options?: {
    rpcResult?: { data: unknown; error: unknown };
    orderUpdateError?: unknown;
  }) {
    const rpcCalls: Array<{ fnName: string; params: unknown }> = [];
    const updates: Array<{ table: string; data: unknown }> = [];

    const db = {
      from: (table: string) => ({
        update: (data: unknown) => {
          updates.push({ table, data });
          return {
            eq: (_field: string, _val: unknown) => ({
              eq: (_f2: string, _v2: unknown) => ({
                select: () => Promise.resolve({ data: [{ id: 'mock-id' }], error: null }),
              }),
              select: () => Promise.resolve({ data: [{ id: 'mock-id' }], error: null }),
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
            then: (resolve: (val: unknown) => void) => {
              if (table === 'credit_package_orders' && options?.orderUpdateError) {
                resolve({ data: null, error: options.orderUpdateError });
              } else {
                resolve({ data: null, error: null });
              }
            },
          };
        },
        insert: (_data: unknown) => Promise.resolve({ data: null, error: null }),
        select: (_cols?: string) => ({
          eq: (_field: string, _val: unknown) => ({
            eq: (_f2: string, _v2: unknown) => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      rpc: (fnName: string, params: unknown) => {
        rpcCalls.push({ fnName, params });
        if (options?.rpcResult) {
          return Promise.resolve(options.rpcResult);
        }
        return Promise.resolve({
          data: { success: true, code: 'GRANTED', message: 'Créditos concedidos com sucesso' },
          error: null,
        });
      },
      _calls: {
        rpcCalls,
        updates,
      },
    };

    return db;
  }

  it('confirma pagamento de pacote, atualiza pedido para paid e invoca RPC de concessão atômica', async () => {
    const tx = createMockPackageTransaction();
    const dbClient = createMockDb();
    const paymentData: AuthoritativePaymentData = {
      id: 'mp-pay-99887766',
      status: 'approved',
      statusDetail: 'accredited',
      externalReference: tx.credit_package_order_id!,
      transactionAmount: 1.0,
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'comprador@pacote.com',
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: tx,
      paymentData,
      actorType: 'webhook',
      dbClient,
    });

    assert.equal(result.success, true);
    assert.equal(result.currentStatus, 'approved');
    assert.equal(result.packageGranted, true);

    // Verifica chamada RPC
    assert.equal(dbClient._calls.rpcCalls.length, 1);
    assert.equal(dbClient._calls.rpcCalls[0].fnName, 'grant_credit_package_from_paid_order');
    assert.deepEqual(dbClient._calls.rpcCalls[0].params, {
      p_order_id: tx.credit_package_order_id,
    });

    // Verifica que a ordem de pacote foi atualizada com status 'paid' e mp_payment_id
    const orderUpdate = dbClient._calls.updates.find((u) => u.table === 'credit_package_orders');
    assert.ok(orderUpdate, 'Deveria ter atualizado credit_package_orders');
    assert.equal((orderUpdate.data as any).status, 'paid');
    assert.equal((orderUpdate.data as any).mp_payment_id, 'mp-pay-99887766');
    assert.ok((orderUpdate.data as any).paid_at);
  });

  it('aceita externalReference tanto apontando para transaction.id quanto para credit_package_order_id', async () => {
    const tx = createMockPackageTransaction();
    const dbClient = createMockDb();
    const paymentData: AuthoritativePaymentData = {
      id: 'mp-pay-55443322',
      status: 'approved',
      statusDetail: 'accredited',
      externalReference: tx.id, // Reference é o ID da transação
      transactionAmount: 1.0,
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'comprador@pacote.com',
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: tx,
      paymentData,
      actorType: 'webhook',
      dbClient,
    });

    assert.equal(result.success, true);
    assert.equal(result.packageGranted, true);
  });

  it('rejeita confirmação de pacote se o valor monetário divergir do valor da transação', async () => {
    const tx = createMockPackageTransaction({ transaction_amount: 50.0 });
    const dbClient = createMockDb();
    const paymentData: AuthoritativePaymentData = {
      id: 'mp-pay-divergent',
      status: 'approved',
      statusDetail: 'accredited',
      externalReference: tx.id,
      transactionAmount: 1.0, // Divergente (R$ 1,00 vs R$ 50,00)
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'comprador@pacote.com',
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: tx,
      paymentData,
      actorType: 'webhook',
      dbClient,
    });

    assert.equal(result.success, false);
    assert.match(result.message || '', /Valor monetário divergente/i);
    assert.equal(dbClient._calls.rpcCalls.length, 0, 'RPC não deve ser chamada com valor divergente');
  });

  it('não concede créditos caso a RPC retorne success = false ou erro no banco', async () => {
    const tx = createMockPackageTransaction();
    const dbClient = createMockDb({
      rpcResult: {
        data: { success: false, code: 'ORDER_NOT_FOUND', message: 'Pedido não encontrado' },
        error: null,
      },
    });
    const paymentData: AuthoritativePaymentData = {
      id: 'mp-pay-failed-grant',
      status: 'approved',
      statusDetail: 'accredited',
      externalReference: tx.id,
      transactionAmount: 1.0,
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'comprador@pacote.com',
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: tx,
      paymentData,
      actorType: 'webhook',
      dbClient,
    });

    assert.equal(result.success, false);
    assert.equal(result.packageGranted, false);
    assert.match(result.message || '', /Pedido não encontrado/i);
  });

  it('marca credit_package_orders como refunded quando o pagamento é estornado', async () => {
    const tx = createMockPackageTransaction({
      status: 'approved',
      mp_payment_id: 'mp-pay-refund-test',
    });
    const dbClient = createMockDb();
    const paymentData: AuthoritativePaymentData = {
      id: 'mp-pay-refund-test',
      status: 'refunded',
      statusDetail: 'refunded',
      externalReference: tx.id,
      transactionAmount: 1.0,
      paymentMethodId: 'pix',
      paymentTypeId: 'bank_transfer',
      payerEmail: 'comprador@pacote.com',
    };

    const result = await confirmAndProcessPaymentTransaction({
      transaction: tx,
      paymentData,
      actorType: 'webhook',
      dbClient,
    });

    assert.equal(result.success, true);
    assert.equal(result.currentStatus, 'refunded');

    const orderRefundUpdate = dbClient._calls.updates.find(
      (u) => u.table === 'credit_package_orders',
    );
    assert.ok(orderRefundUpdate, 'Deveria ter atualizado credit_package_orders');
    assert.equal((orderRefundUpdate.data as any).status, 'refunded');
  });
});
