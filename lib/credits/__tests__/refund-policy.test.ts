/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluatePackageRefundEligibility,
  processPackageRefund,
} from '../../mercadopago/package-refund-service.ts';

describe('User Story 6: Package Refund Policy & Consumption Guard (T030)', () => {
  const orderId = 'order-ref-test-1';

  it('1. Package without consumption (100% intact) is eligible for automatic full revocation', async () => {
    const mockOrder = {
      id: orderId,
      user_id: 'user-1',
      credits_quantity: 5,
      status: 'paid',
      mp_payment_id: 'mp-pay-123',
    };

    const mockPackage = {
      id: 'pkg-1',
      purchase_order_id: orderId,
      credits_granted: 5,
      credits_remaining: 5, // 0 consumidos
      status: 'active',
    };

    const mockDb = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: table === 'credit_package_orders' ? mockOrder : mockPackage,
              error: null,
            }),
            single: async () => ({
              data: table === 'credit_package_orders' ? mockOrder : mockPackage,
              error: null,
            }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        insert: () => Promise.resolve({ error: null }),
      }),
    };

    const eligibility = await evaluatePackageRefundEligibility(orderId, mockDb as any);
    assert.equal(eligibility.eligible, true);
    assert.equal(eligibility.action, 'full_package_revocation');
    assert.equal(eligibility.creditsConsumed, 0);
  });

  it('2. Partially consumed package is blocked from automatic refund and routed to manual_review', async () => {
    const mockOrder = {
      id: orderId,
      user_id: 'user-1',
      credits_quantity: 5,
      status: 'paid',
      mp_payment_id: 'mp-pay-123',
    };

    const mockPackage = {
      id: 'pkg-1',
      purchase_order_id: orderId,
      credits_granted: 5,
      credits_remaining: 3, // 2 consumidos!
      status: 'active',
    };

    let updatedOrderStatus: string | null = null;
    let updatedPackageStatus: string | null = null;

    const mockDb = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: table === 'credit_package_orders' ? mockOrder : mockPackage,
              error: null,
            }),
            single: async () => ({
              data: table === 'credit_package_orders' ? mockOrder : mockPackage,
              error: null,
            }),
          }),
        }),
        update: (values: any) => ({
          eq: () => {
            if (table === 'credit_package_orders') updatedOrderStatus = values.status;
            if (table === 'customer_credit_packages') updatedPackageStatus = values.status;
            return Promise.resolve({ error: null });
          },
        }),
        insert: () => Promise.resolve({ error: null }),
      }),
    };

    const outcome = await processPackageRefund({
      orderId,
      reason: 'Cliente solicitou arrependimento com uso parcial',
      adminUserId: 'admin-1',
      dbClient: mockDb as any,
    });

    assert.equal(outcome.success, false);
    assert.equal(outcome.code, 'REFUND_REQUIRES_MANUAL_REVIEW');
    assert.equal(outcome.consumedCredits, 2);
    assert.equal(outcome.remainingCredits, 3);
    assert.equal(updatedOrderStatus, 'manual_review');
    assert.equal(updatedPackageStatus, 'suspended');
  });

  it('3. Fully consumed package is strictly rejected', async () => {
    const mockOrder = {
      id: orderId,
      user_id: 'user-1',
      credits_quantity: 5,
      status: 'paid',
      mp_payment_id: 'mp-pay-123',
    };

    const mockPackage = {
      id: 'pkg-1',
      purchase_order_id: orderId,
      credits_granted: 5,
      credits_remaining: 0, // 100% consumido!
      status: 'active',
    };

    const mockDb = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: table === 'credit_package_orders' ? mockOrder : mockPackage,
              error: null,
            }),
            single: async () => ({
              data: table === 'credit_package_orders' ? mockOrder : mockPackage,
              error: null,
            }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        insert: () => Promise.resolve({ error: null }),
      }),
    };

    const outcome = await processPackageRefund({
      orderId,
      reason: 'Cliente pede estorno de pacote esgotado',
      adminUserId: 'admin-1',
      dbClient: mockDb as any,
    });

    assert.equal(outcome.success, false);
    assert.equal(outcome.code, 'PACKAGE_FULLY_CONSUMED');
  });
});
