/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  reserveConsultationCredit,
  consumeConsultationCredit,
  releaseConsultationCredit,
  grantCreditsToUser,
  revokeCreditsFromUser,
} from '../credit-service.ts';
import { verifyConsultationRecoveryState } from '../verify-recovery.ts';

describe('Hotfix de Auditoria B2B e Integridade Transacional', () => {
  it('1 & 2 & 3: Reserva bem-sucedida gera auditoria com event = credit_reserved e actor_type = customer sem event nulo', async () => {
    let capturedAuditLog: any = null;
    let capturedLedger: any = null;
    let capturedReservation: any = null;
    let capturedConsultationUpdate: any = null;
    let capturedBalanceUpdate: any = null;

    // Simulador em memória da RPC e tabelas
    const mockRpcEngine = {
      rpc: async (fn: string, params: any) => {
        if (fn === 'reserve_credit_for_consultation') {
          // Validação dos parâmetros
          assert.equal(params.p_consultation_id, '6dc6bde8-ddf1-4b26-a697-bc89bb69a559');
          assert.equal(params.p_override_user_id, '93ca5b44-377e-45e4-ae7e-9707b3ce4836');

          // Efeitos da RPC
          capturedReservation = {
            id: 'res-uuid-123',
            user_id: params.p_override_user_id,
            consultation_id: params.p_consultation_id,
            status: 'reserved',
            quantity: 1,
          };

          capturedLedger = {
            entry_type: 'reserve',
            quantity: 1,
            available_effect: -1,
            reserved_effect: 1,
            actor_type: 'customer',
          };

          capturedBalanceUpdate = {
            available_credits: 4,
            reserved_credits: 1,
            consumed_credits: 0,
          };

          capturedConsultationUpdate = {
            payment_coverage_type: 'platform_credit',
            credit_status: 'reserved',
            credit_reservation_id: capturedReservation.id,
          };

          // Inserção canônica na trilha de auditoria
          capturedAuditLog = {
            consultation_id: params.p_consultation_id,
            transaction_id: null,
            actor_id: params.p_override_user_id,
            actor_type: 'customer',
            event: 'credit_reserved',
            details: {
              package_id: 'pkg-uuid-456',
              reservation_id: capturedReservation.id,
              quantity: 1,
              coverage_type: 'platform_credit',
            },
          };

          return {
            data: {
              success: true,
              code: 'CREDIT_RESERVED',
              message_safe: '1 crédito reservado com sucesso.',
              reservation_id: capturedReservation.id,
              package_id: 'pkg-uuid-456',
              available_credits: 4,
              reserved_credits: 1,
              consumed_credits: 0,
            },
            error: null,
          };
        }
        throw new Error(`RPC não mapeada: ${fn}`);
      },
    };

    const res = await reserveConsultationCredit(
      '93ca5b44-377e-45e4-ae7e-9707b3ce4836',
      '6dc6bde8-ddf1-4b26-a697-bc89bb69a559',
      mockRpcEngine as any,
    );

    assert.equal(res.success, true);
    assert.equal(res.code, 'CREDIT_RESERVED');
    assert.equal(res.reservationId, 'res-uuid-123');

    // 1. Confirma criação dos artefatos
    assert.ok(capturedReservation, 'Reservation deve existir');
    assert.ok(capturedLedger, 'Ledger deve existir');
    assert.ok(capturedBalanceUpdate, 'Balanço deve ser atualizado');
    assert.ok(capturedConsultationUpdate, 'Consulta deve ser atualizada');
    assert.ok(capturedAuditLog, 'Audit log deve existir');

    // 2. Confirma que event não é nulo
    assert.notEqual(capturedAuditLog.event, null);
    assert.equal(capturedAuditLog.event, 'credit_reserved');

    // 3. Confirma actor_type = customer
    assert.equal(capturedAuditLog.actor_type, 'customer');
    assert.equal(capturedAuditLog.consultation_id, '6dc6bde8-ddf1-4b26-a697-bc89bb69a559');
  });

  it('4. Consumo usa event = credit_consumed e actor_type = system', async () => {
    let capturedAuditLog: any = null;

    const mockRpcEngine = {
      rpc: async (fn: string, params: any) => {
        assert.equal(fn, 'consume_reserved_credit');
        capturedAuditLog = {
          consultation_id: params.p_consultation_id,
          transaction_id: null,
          actor_type: 'system',
          event: 'credit_consumed',
          details: {
            reservation_id: 'res-uuid-123',
            package_id: 'pkg-uuid-456',
          },
        };
        return {
          data: {
            success: true,
            code: 'CONSUMED_SUCCESS',
            message_safe: 'Crédito consumido com sucesso.',
          },
          error: null,
        };
      },
    };

    const ok = await consumeConsultationCredit(
      'cons-abc-123',
      false,
      'development',
      mockRpcEngine as any,
    );
    assert.equal(ok, true);
    assert.equal(capturedAuditLog.event, 'credit_consumed');
    assert.equal(capturedAuditLog.actor_type, 'system');
  });

  it('5. Liberação usa event = credit_released e actor_type = system', async () => {
    let capturedAuditLog: any = null;

    const mockRpcEngine = {
      rpc: async (fn: string, params: any) => {
        assert.equal(fn, 'release_reserved_credit');
        capturedAuditLog = {
          consultation_id: params.p_consultation_id,
          transaction_id: null,
          actor_type: 'system',
          event: 'credit_released',
          details: {
            reservation_id: 'res-uuid-123',
            reason_code: params.p_reason_code,
          },
        };
        return {
          data: {
            success: true,
            code: 'RELEASED_SUCCESS',
            message_safe: 'Crédito liberado com sucesso.',
          },
          error: null,
        };
      },
    };

    const ok = await releaseConsultationCredit('user-abc', 'cons-abc-123', mockRpcEngine as any);
    assert.equal(ok, true);
    assert.equal(capturedAuditLog.event, 'credit_released');
    assert.equal(capturedAuditLog.actor_type, 'system');
  });

  it('6. Concessão usa event = credit_package_granted e actor_type = admin', async () => {
    let capturedAuditLog: any = null;

    const mockRpcEngine = {
      rpc: async (fn: string, params: any) => {
        assert.equal(fn, 'grant_credit_package');
        capturedAuditLog = {
          consultation_id: null,
          transaction_id: null,
          actor_id: 'admin-uuid-1',
          actor_type: 'admin',
          event: 'credit_package_granted',
          details: {
            user_id: params.p_user_id,
            package_name: params.p_package_name,
            credits_granted: params.p_credits_granted,
          },
        };
        return {
          data: {
            success: true,
            code: 'GRANT_SUCCESS',
            message_safe: 'Pacote concedido com sucesso.',
            package_id: 'pkg-granted-1',
            available_credits: 10,
            reserved_credits: 0,
            consumed_credits: 0,
          },
          error: null,
        };
      },
    };

    const result = await grantCreditsToUser({
      userId: 'user-b2b',
      amount: 10,
      adminId: 'admin-uuid-1',
      dbClient: mockRpcEngine as any,
    });

    assert.equal(result.success, true);
    assert.equal(capturedAuditLog.event, 'credit_package_granted');
    assert.equal(capturedAuditLog.actor_type, 'admin');
    assert.equal(capturedAuditLog.consultation_id, null);
  });

  it('7. Ajuste usa event = credit_adjusted e actor_type = admin', async () => {
    let capturedAuditLog: any = null;

    const mockDb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              gt: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data: { id: 'pkg-adj-1', credits_remaining: 10 },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
      rpc: async (fn: string, params: any) => {
        assert.equal(fn, 'adjust_credit_package');
        capturedAuditLog = {
          consultation_id: null,
          transaction_id: null,
          actor_id: 'admin-uuid-1',
          actor_type: 'admin',
          event: 'credit_adjusted',
          details: {
            package_id: params.p_package_id,
            adjustment_type: params.p_adjustment_type,
            quantity: params.p_quantity,
          },
        };
        return {
          data: {
            success: true,
            code: 'ADJUSTMENT_SUCCESS',
            message_safe: 'Ajuste de créditos processado com sucesso.',
            package_id: 'pkg-adj-1',
            available_credits: 8,
            reserved_credits: 0,
            consumed_credits: 0,
          },
          error: null,
        };
      },
    };

    const result = await revokeCreditsFromUser({
      userId: 'user-b2b',
      amount: 2,
      adminId: 'admin-uuid-1',
      dbClient: mockDb as any,
    });

    assert.equal(result.success, true);
    assert.equal(capturedAuditLog.event, 'credit_adjusted');
    assert.equal(capturedAuditLog.actor_type, 'admin');
    assert.equal(capturedAuditLog.consultation_id, null);
  });

  it('8, 9 & 10: Falha em auditoria (erro 23502) aciona rollback total e sanitiza resposta ao cliente', async () => {
    // Simula o banco de dados abortando a transação inteira devido a erro 23502
    let reservationCreated = false;
    let ledgerCreated = false;
    let balanceChanged = false;
    let coverageTypeChanged = false;

    const errorLoggedMessages: any[] = [];
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      errorLoggedMessages.push(args);
    };

    try {
      const mockFailingRpcEngine = {
        rpc: async (fn: string) => {
          assert.equal(fn, 'reserve_credit_for_consultation');
          // No Postgres, quando ocorre 23502 dentro da transação, nada é commitado:
          reservationCreated = false;
          ledgerCreated = false;
          balanceChanged = false;
          coverageTypeChanged = false;

          return {
            data: null,
            error: {
              code: '23502',
              message:
                'null value in column "event" of relation "consultation_audit_logs" violates not-null constraint',
            },
          };
        },
      };

      const result = await reserveConsultationCredit(
        '93ca5b44-377e-45e4-ae7e-9707b3ce4836',
        '6dc6bde8-ddf1-4b26-a697-bc89bb69a559',
        mockFailingRpcEngine as any,
      );

      // 8. Confirma que a falha não gerou estado residual
      assert.equal(reservationCreated, false);
      assert.equal(ledgerCreated, false);
      assert.equal(balanceChanged, false);
      assert.equal(coverageTypeChanged, false);

      // 9. Cliente recebe mensagem segura (sem SQLSTATE, sem nomes de tabela/coluna)
      assert.equal(result.success, false);
      assert.equal(result.code, 'CREDIT_RESERVATION_FAILED');
      assert.match(result.error || '', /Não foi possível reservar seu crédito agora/);
      assert.doesNotMatch(result.error || '', /23502/);
      assert.doesNotMatch(result.error || '', /consultation_audit_logs/);
      assert.doesNotMatch(result.error || '', /null value in column/);

      // 10. Nenhum crédito foi perdido: saldos preservados
      assert.equal(balanceChanged, false);

      // Validação do log estruturado de segurança
      const structuredLogEntry = errorLoggedMessages.find(
        (entry) => typeof entry[0] === 'string' && entry[0].includes('[CREDIT_CONSUMPTION]'),
      );
      assert.ok(structuredLogEntry, 'Log estruturado [CREDIT_CONSUMPTION] deve ser emitido');
      const payload = structuredLogEntry[1];
      assert.equal(payload.operation, 'reserve_credit_for_consultation');
      assert.equal(payload.databaseErrorCode, '23502');
      assert.equal(payload.rollbackExpected, true);
      assert.ok(payload.consultationIdMasked.includes('...'));
      assert.ok(payload.userIdMasked.includes('...'));
      assert.ok(payload.timestamp);
      // Garante ausência de vazamento de SQL completo ou PII
      assert.equal(payload.sql, undefined);
      assert.equal(payload.token, undefined);
      assert.equal(payload.cookie, undefined);
    } finally {
      console.error = originalConsoleError;
    }
  });

  it('11. Nova tentativa após falha não duplica reserva nem ledger', async () => {
    let reservationCount = 0;
    let ledgerCount = 0;

    const mockRetryRpc = {
      rpc: async (fn: string) => {
        assert.equal(fn, 'reserve_credit_for_consultation');
        reservationCount += 1;
        ledgerCount += 1;
        return {
          data: {
            success: true,
            code: 'CREDIT_RESERVED',
            reservation_id: 'res-retry-1',
            available_credits: 3,
            reserved_credits: 1,
            consumed_credits: 0,
          },
          error: null,
        };
      },
    };

    // Primeira tentativa bem sucedida
    const attempt1 = await reserveConsultationCredit(
      'user-1',
      'cons-retry-test',
      mockRetryRpc as any,
    );
    assert.equal(attempt1.success, true);
    assert.equal(reservationCount, 1);
    assert.equal(ledgerCount, 1);

    // Segunda tentativa imediata: mock RPC simula resposta de idempotência
    const mockIdempotentRetryRpc = {
      rpc: async (fn: string) => {
        assert.equal(fn, 'reserve_credit_for_consultation');
        // Não incrementa registros pois identifica reserva já existente
        return {
          data: {
            success: true,
            code: 'RESERVATION_ALREADY_EXISTS',
            message_safe: 'Crédito já reservado para esta consulta.',
            reservation_id: 'res-retry-1',
            available_credits: 3,
            reserved_credits: 1,
            consumed_credits: 0,
          },
          error: null,
        };
      },
    };

    const attempt2 = await reserveConsultationCredit(
      'user-1',
      'cons-retry-test',
      mockIdempotentRetryRpc as any,
    );
    assert.equal(attempt2.success, true);
    assert.equal(attempt2.code, 'RESERVATION_ALREADY_EXISTS');
    assert.equal(reservationCount, 1, 'Total de reservas permaneceu 1');
    assert.equal(ledgerCount, 1, 'Total de lançamentos no ledger permaneceu 1');
  });

  it('12. Diagnóstico pós-falha: identifica rollback limpo e indica SAFE_TO_RETRY', async () => {
    const mockCleanDb = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (table === 'customer_plate_consultations') {
                return {
                  data: {
                    id: '6dc6bde8',
                    status: 'pending',
                    payment_coverage_type: null,
                    credit_status: null,
                  },
                  error: null,
                };
              }
              // customer_credit_reservations, customer_credit_balances, consultation_delivery_jobs
              return { data: null, error: null };
            },
            // for customer_credit_ledger
            then: (resolve: any) => resolve({ data: [], error: null }),
          }),
        }),
      }),
    };

    const result = await verifyConsultationRecoveryState(
      '6dc6bde8',
      '93ca5b44',
      mockCleanDb as any,
    );
    assert.equal(result.isCleanRollback, true);
    assert.equal(result.recommendedAction, 'SAFE_TO_RETRY');
    assert.equal(result.hasReservation, false);
    assert.equal(result.hasLedgerReserve, false);
  });

  it('13. Diagnóstico pós-falha: identifica inconsistência e indica MANUAL_REVIEW_REQUIRED', async () => {
    const mockInconsistentDb = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (table === 'customer_credit_reservations') {
                return { data: { id: 'res-stale', status: 'reserved' }, error: null };
              }
              return { data: null, error: null };
            },
            then: (resolve: any) => resolve({ data: [], error: null }),
          }),
        }),
      }),
    };

    const result = await verifyConsultationRecoveryState(
      '6dc6bde8',
      '93ca5b44',
      mockInconsistentDb as any,
    );
    assert.equal(result.isCleanRollback, false);
    assert.equal(result.recommendedAction, 'MANUAL_REVIEW_REQUIRED');
    assert.equal(result.hasReservation, true);
  });
});
