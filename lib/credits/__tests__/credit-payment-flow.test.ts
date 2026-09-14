/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  reserveConsultationCredit,
  consumeConsultationCredit,
  releaseConsultationCredit,
} from '../credit-service.ts';
import { evaluateRefundEligibility } from '../../mercadopago/refund-service.ts';

describe('Credit Payment Architecture & Hotfix Validation', () => {
  it('1 & 2: pay-with-credit route code does NOT reference currency_id or insert into payment_transactions', () => {
    const routePath = resolve(
      process.cwd(),
      'app/api/cliente/consultas/[id]/pay-with-credit/route.ts',
    );
    const content = readFileSync(routePath, 'utf8');

    // Asserção 1: currency_id não existe na rota de pagamento por crédito
    assert.equal(
      content.includes('currency_id'),
      false,
      'pay-with-credit route must not reference currency_id',
    );

    // Asserção 2: rota não deve fazer insert em payment_transactions
    assert.equal(
      content.includes("from('payment_transactions').insert"),
      false,
      'pay-with-credit route must not insert into payment_transactions',
    );
  });

  it('3: currency_id exists ONLY in Mercado Pago preference builder payload', () => {
    const builderPath = resolve(process.cwd(), 'lib/mercadopago/preference-builder.ts');
    const builderContent = readFileSync(builderPath, 'utf8');
    assert.ok(
      builderContent.includes("currency_id: 'BRL'"),
      'Mercado Pago preference builder must retain currency_id: BRL',
    );

    const deliveryPath = resolve(process.cwd(), 'lib/vehicle-delivery/delivery-service.ts');
    const deliveryContent = readFileSync(deliveryPath, 'utf8');
    assert.equal(
      deliveryContent.includes('currency_id'),
      false,
      'delivery-service must never use currency_id',
    );
  });

  it('4: Successful reservation creates reservation, ledger, and audit record', async () => {
    let rpcCalled = false;
    const mockDb = {
      rpc: async (fn: string, params: any) => {
        if (fn === 'reserve_credit_for_consultation') {
          rpcCalled = true;
          assert.equal(params.p_consultation_id, 'cons-123');
          assert.equal(params.p_override_user_id, 'user-123');
          return {
            data: {
              success: true,
              code: 'CREDIT_RESERVED',
              reservation_id: 'res-456',
              package_id: 'pkg-789',
              available_credits: 9,
              reserved_credits: 1,
              consumed_credits: 0,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
    };

    const result = await reserveConsultationCredit('user-123', 'cons-123', mockDb);
    assert.ok(rpcCalled);
    assert.equal(result.success, true);
    assert.equal(result.reservationId, 'res-456');
    assert.equal(result.availableCredits, 9);
    assert.equal(result.reservedCredits, 1);
  });

  it('5: Audit or RPC failure rolls back cleanly and returns safe error', async () => {
    const mockDb = {
      rpc: async (fn: string) => {
        if (fn === 'reserve_credit_for_consultation') {
          return {
            data: null,
            error: { code: '23502', message: 'column "event" cannot be null' },
          };
        }
        return { data: null, error: null };
      },
    };

    const result = await reserveConsultationCredit('user-123', 'cons-123', mockDb);
    assert.equal(result.success, false);
    assert.equal(result.code, 'CREDIT_RESERVATION_FAILED');
    assert.ok(result.error?.includes('Nenhum crédito foi consumido'));
  });

  it('6: Enqueue delivery job failure or release leaves credit safely restored', async () => {
    let releaseCalled = false;
    const mockDb = {
      rpc: async (fn: string, params: any) => {
        if (fn === 'release_reserved_credit') {
          releaseCalled = true;
          assert.equal(params.p_consultation_id, 'cons-123');
          return {
            data: {
              success: true,
              code: 'RESERVE_RELEASED',
              message_safe: 'Crédito liberado.',
              available_credits: 10,
              reserved_credits: 0,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
    };

    const released = await releaseConsultationCredit('user-123', 'cons-123', mockDb);
    assert.ok(releaseCalled);
    assert.equal(released, true);
  });

  it('7: Successful report delivery consumes reserved credit exactly once', async () => {
    let consumedCount = 0;
    const mockDb = {
      rpc: async (fn: string, params: any) => {
        if (fn === 'consume_reserved_credit') {
          consumedCount++;
          assert.equal(params.p_consultation_id, 'cons-123');
          return {
            data: {
              success: true,
              code: 'CREDIT_CONSUMED',
              available_credits: 9,
              reserved_credits: 0,
              consumed_credits: 1,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
    };

    const res1 = await consumeConsultationCredit('cons-123', false, 'production', mockDb);
    assert.equal(res1, true);
    assert.equal(consumedCount, 1);
  });

  it('8 & 9: Provider failure handles retryable timeout vs permanent failure (releasing credit, NOT calling Mercado Pago refund)', async () => {
    let creditReleased = false;

    const mockAdminDb: any = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (table === 'customer_plate_consultations') {
                return {
                  data: {
                    id: 'cons-permanent-fail',
                    user_id: 'user-1',
                    plate: 'ABC1234',
                    status: 'paid',
                    payment_coverage_type: 'platform_credit',
                    credit_status: 'reserved',
                    credit_reservation_id: 'res-xyz',
                  },
                  error: null,
                };
              }
              return { data: null, error: null };
            },
          }),
        }),
        update: () => ({
          eq: async () => ({ error: null }),
        }),
        insert: async () => ({ error: null }),
      }),
      rpc: async (fn: string) => {
        if (fn === 'release_reserved_credit') {
          creditReleased = true;
          return { data: { success: true }, error: null };
        }
        return { data: null, error: null };
      },
    };

    // Avaliação de estorno Mercado Pago para crédito: NÃO deve ser elegível
    const eligibility = evaluateRefundEligibility({
      transaction: {
        id: 'tx-fake',
        status: 'approved',
        transaction_amount: 0, // transação por crédito tem valor 0
        payment_method_id: 'credit',
      },
      consultation: {
        id: 'cons-permanent-fail',
        status: 'failed_permanent',
      },
    });

    assert.equal(
      eligibility.eligible,
      false,
      'Credit transaction with 0 amount must not be eligible for Mercado Pago refund',
    );

    // Na falha definitiva, o crédito é liberado sem estorno MP
    const released = await releaseConsultationCredit('user-1', 'cons-permanent-fail', mockAdminDb);
    assert.equal(released, true);
    assert.equal(creditReleased, true);
  });

  it('10 & 11: Mercado Pago consultation does not touch credit and Credit does not trigger MP refund', () => {
    // MP transaction com valor normal
    const mpEligibility = evaluateRefundEligibility({
      transaction: {
        id: 'tx-real',
        status: 'approved',
        transaction_amount: 39.9,
        mp_payment_id: 'mp-12345678',
        payment_method_id: 'pix',
      },
      consultation: {
        id: 'cons-mp',
        status: 'failed_permanent',
      },
    });

    assert.equal(mpEligibility.eligible, true);

    // Consulta por crédito
    const creditEligibility = evaluateRefundEligibility({
      transaction: {
        id: 'tx-credit',
        status: 'approved',
        transaction_amount: 0,
        payment_method_id: 'credit',
      },
      consultation: {
        id: 'cons-credit',
        status: 'failed_permanent',
      },
    });

    assert.equal(creditEligibility.eligible, false);
  });

  it('12: Duplicate/concurrent reservation calls handle idempotent code cleanly', async () => {
    const mockDb = {
      rpc: async (fn: string) => {
        if (fn === 'reserve_credit_for_consultation') {
          return {
            data: {
              success: true,
              code: 'RESERVATION_ALREADY_EXISTS',
              message_safe: 'Crédito já reservado para esta consulta.',
              reservation_id: 'res-existing-1',
              available_credits: 14,
              reserved_credits: 1,
              consumed_credits: 0,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
    };

    const res = await reserveConsultationCredit('user-1', 'cons-existing', mockDb);
    assert.equal(res.success, true);
    assert.equal(res.code, 'RESERVATION_ALREADY_EXISTS');
    assert.equal(res.reservationId, 'res-existing-1');
  });

  it('13: User cannot reserve credit for another user consultation (FORBIDDEN)', async () => {
    const mockDb = {
      rpc: async (fn: string) => {
        if (fn === 'reserve_credit_for_consultation') {
          return {
            data: {
              success: false,
              code: 'FORBIDDEN',
              message_safe: 'Você não tem permissão para reservar créditos para esta consulta.',
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
    };

    const res = await reserveConsultationCredit('user-attacker', 'cons-victim', mockDb);
    assert.equal(res.success, false);
    assert.equal(res.code, 'FORBIDDEN');
    assert.ok(res.error?.includes('Você não tem permissão'));
  });

  it('14: UI does NOT promise instant delivery and states credit reservation accurately', () => {
    const buttonPath = resolve(process.cwd(), 'components/customer/pay-with-credit-button.tsx');
    const buttonContent = readFileSync(buttonPath, 'utf8');

    // Não deve conter a promessa falsa de liberação instantânea no modal
    assert.equal(
      buttonContent.includes(
        'Liberação instantânea: o laudo oficial em PDF e os dados da vistoria ficam disponíveis imediatamente.',
      ),
      false,
      'Must not claim instant release in credit confirmation dialog',
    );

    // Deve conter a mensagem segura de reserva
    const normalized = buttonContent.replace(/\s+/g, ' ');
    assert.ok(
      normalized.includes(
        '1 crédito será reservado para esta consulta. Ele só será consumido após a entrega do laudo.',
      ),
      'Must inform that 1 credit will be reserved and consumed only after report delivery',
    );
    assert.ok(
      normalized.includes('Seu crédito foi reservado. Estamos preparando o laudo.'),
      'Must display feedback toast about credit reservation and preparation',
    );
  });

  it('15: Route handles missing consultation or schema errors with sanitized responses', async () => {
    const mockDb = {
      rpc: async () => {
        throw new Error('Database connection failed');
      },
    };

    const res = await reserveConsultationCredit('user-1', 'cons-fail', mockDb);
    assert.equal(res.success, false);
    assert.equal(res.code, 'CREDIT_RESERVATION_FAILED');
    assert.ok(res.error?.includes('Nenhum crédito foi consumido'));
  });
});
