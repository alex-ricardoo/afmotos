import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  grantCreditsToUser,
  revokeCreditsFromUser,
  getUserCreditBalance,
  reserveConsultationCredit,
  releaseConsultationCredit,
  consumeConsultationCredit,
} from '../credit-service.ts';

describe('B2B Credit Packages & Service Logic', () => {
  it('should reject grant with invalid amount <= 0', async () => {
    const result = await grantCreditsToUser({
      userId: 'test-user-id',
      amount: 0,
      adminId: 'test-admin-id',
    });

    assert.equal(result.success, false);
    assert.match(result.error || '', /maior que zero/);
  });

  it('should reject revoke with invalid amount <= 0', async () => {
    const result = await revokeCreditsFromUser({
      userId: 'test-user-id',
      amount: -5,
      adminId: 'test-admin-id',
    });

    assert.equal(result.success, false);
    assert.match(result.error || '', /maior que zero/);
  });

  it('should query available_credits when getting user balance', async () => {
    const fakeDb = {
      from: (table: string) => ({
        select: (col: string) => ({
          eq: (key: string, val: string) => ({
            maybeSingle: async () => {
              if (table === 'customer_credit_balances' && col === 'available_credits') {
                return { data: { available_credits: 7 }, error: null };
              }
              return { data: null, error: null };
            },
          }),
        }),
      }),
    };

    const balance = await getUserCreditBalance('user-uuid-123', fakeDb as any);
    assert.equal(balance, 7);
  });

  it('should return 0 available credits when balance record does not exist', async () => {
    const fakeDb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    };

    const balance = await getUserCreditBalance('user-uuid-empty', fakeDb as any);
    assert.equal(balance, 0);
  });

  it('should invoke grant_credit_package RPC and map result successfully', async () => {
    const fakeDb = {
      rpc: async (fn: string, params: any) => {
        assert.equal(fn, 'grant_credit_package');
        assert.equal(params.p_credits_granted, 5);
        assert.equal(params.p_package_type, 'manual_negotiated');
        return {
          data: {
            success: true,
            code: 'GRANT_SUCCESS',
            message_safe: 'Pacote concedido com sucesso.',
            package_id: 'pkg-123',
            available_credits: 5,
            reserved_credits: 0,
            consumed_credits: 0,
          },
          error: null,
        };
      },
    };

    const result = await grantCreditsToUser({
      userId: 'user-abc',
      amount: 5,
      adminId: 'admin-xyz',
      dbClient: fakeDb,
    });

    assert.equal(result.success, true);
    assert.equal(result.packageId, 'pkg-123');
    assert.equal(result.availableCredits, 5);
  });

  it('should invoke reserve_credit_for_consultation RPC with consultation id and idempotency key', async () => {
    let capturedParams: any = null;
    const fakeDb = {
      rpc: async (fn: string, params: any) => {
        assert.equal(fn, 'reserve_credit_for_consultation');
        capturedParams = params;
        return {
          data: {
            success: true,
            code: 'CREDIT_RESERVED',
            reservation_id: 'res-999',
          },
          error: null,
        };
      },
    };

    const success = await reserveConsultationCredit('user-1', 'consultation-10', fakeDb as any);
    assert.equal(success, true);
    assert.equal(capturedParams.p_consultation_id, 'consultation-10');
    assert.equal(capturedParams.p_override_user_id, 'user-1');
    assert.match(capturedParams.p_idempotency_key, /^res_consultation-10$/);
  });

  it('should invoke consume_reserved_credit RPC and block mock in production', async () => {
    const fakeDb = {
      rpc: async (fn: string, params: any) => {
        assert.equal(fn, 'consume_reserved_credit');
        if (params.p_environment === 'production' && params.p_is_mock_delivery) {
          return {
            data: {
              success: false,
              code: 'MOCK_IN_PRODUCTION_BLOCKED',
              message_safe: 'Mock delivery cannot consume real credits.',
            },
            error: null,
          };
        }
        return {
          data: {
            success: true,
            code: 'CONSUME_SUCCESS',
          },
          error: null,
        };
      },
    };

    const prodMockResult = await consumeConsultationCredit('cons-mock', true, 'production', fakeDb as any);
    assert.equal(prodMockResult, false);

    const prodLiveResult = await consumeConsultationCredit('cons-live', false, 'production', fakeDb as any);
    assert.equal(prodLiveResult, true);
  });

  it('should invoke release_reserved_credit RPC on delivery failure', async () => {
    let capturedParams: any = null;
    const fakeDb = {
      rpc: async (fn: string, params: any) => {
        assert.equal(fn, 'release_reserved_credit');
        capturedParams = params;
        return {
          data: {
            success: true,
            code: 'RELEASE_SUCCESS',
          },
          error: null,
        };
      },
    };

    const success = await releaseConsultationCredit('user-1', 'cons-fail', fakeDb as any);
    assert.equal(success, true);
    assert.equal(capturedParams.p_consultation_id, 'cons-fail');
    assert.equal(capturedParams.p_reason_code, 'DELIVERY_FAILED_PERMANENT');
  });
});
