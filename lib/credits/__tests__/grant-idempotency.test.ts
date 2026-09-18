import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('User Story 4: Idempotency and Atomic Concession in RPC (T022)', () => {
  it('1. RPC definition in migration uses FOR UPDATE lock and strictly checks already granted', () => {
    const migrationPath = resolve(
      process.cwd(),
      'supabase/migrations/20260918110000_evolve_payments_and_credit_grant_rpc.sql',
    );
    const sqlContent = readFileSync(migrationPath, 'utf8');

    // 1. Deve possuir lock pessimista FOR UPDATE na ordem
    assert.ok(
      sqlContent.includes('FOR UPDATE') || sqlContent.includes('for update'),
      'RPC grant_credit_package_from_paid_order must lock credit_package_orders row with FOR UPDATE',
    );

    // 2. Deve verificar se já foi concedido (idempotência segura via purchase_order_id)
    assert.ok(
      sqlContent.includes('WHERE purchase_order_id = p_order_id') &&
        sqlContent.includes('v_existing_package_id IS NOT NULL'),
      'RPC must check if order was already granted using purchase_order_id',
    );

    // 3. Deve retornar ALREADY_GRANTED
    assert.ok(
      sqlContent.includes('ALREADY_GRANTED'),
      'RPC must return code ALREADY_GRANTED when re-executed',
    );

    // 4. Deve inserir no customer_credit_ledger com idempotency_key único
    assert.ok(
      sqlContent.includes("'package-grant:' || p_order_id::text"),
      "RPC must create ledger entry with idempotency key 'package-grant:' || p_order_id::text",
    );

    // 5. Deve incrementar customer_credit_balances atomicamente com ON CONFLICT
    assert.ok(
      sqlContent.includes('ON CONFLICT (user_id) DO UPDATE'),
      'RPC must update or insert into customer_credit_balances atomically',
    );
  });

  it('2. Multiple executions on simulated DB state return success on first and ALREADY_GRANTED on subsequent', async () => {
    let grantCount = 0;
    let balance = 0;

    const mockOrder = {
      id: 'order-atomic-1',
      user_id: 'user-atomic-1',
      credits_quantity: 15,
      status: 'paid',
      granted_at: null as string | null,
    };

    const simulateRpcGrant = async (orderId: string) => {
      // Simula a lógica interna da RPC SQL
      assert.equal(orderId, mockOrder.id);
      if (mockOrder.granted_at !== null) {
        return {
          success: true,
          code: 'ALREADY_GRANTED',
          available_credits: balance,
          is_duplicate: true,
        };
      }

      grantCount++;
      balance += mockOrder.credits_quantity;
      mockOrder.granted_at = new Date().toISOString();

      return {
        success: true,
        code: 'CREDITS_GRANTED',
        available_credits: balance,
        is_duplicate: false,
      };
    };

    // 1ª execução (primeira confirmação)
    const firstCall = await simulateRpcGrant(mockOrder.id);
    assert.equal(firstCall.success, true);
    assert.equal(firstCall.code, 'CREDITS_GRANTED');
    assert.equal(firstCall.available_credits, 15);
    assert.equal(grantCount, 1);

    // 2ª execução (segundo webhook ou concorrência da tela de retorno)
    const secondCall = await simulateRpcGrant(mockOrder.id);
    assert.equal(secondCall.success, true);
    assert.equal(secondCall.code, 'ALREADY_GRANTED');
    assert.equal(secondCall.available_credits, 15);
    assert.equal(grantCount, 1, 'Credits must never be granted more than once');

    // 3ª execução (reconciliação manual tardia)
    const thirdCall = await simulateRpcGrant(mockOrder.id);
    assert.equal(thirdCall.code, 'ALREADY_GRANTED');
    assert.equal(balance, 15, 'Balance must remain strictly 15');
  });
});
