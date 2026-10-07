import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  executeVehiclePlateLookup,
  ConsultationInProgressError,
  ChargeStatusUnknownError,
  InsufficientBalanceError,
  ProviderUnavailableError,
} from '../service.ts';
import {
  acquireDistributedProviderLock,
  releaseDistributedProviderLock,
  createProviderAttemptRecord,
  updateProviderAttemptRecord,
} from '../lock-service.ts';
import { logProviderEvent, redactSensitiveInfo } from '../provider-logger.ts';
import type { VehicleConsultationRecord } from '../types.ts';

// In-memory simulation of Supabase state for distributed lock & audit attempts
interface SimulatedDb {
  locks: Map<string, {
    lock_key: string;
    provider: string;
    operation: string;
    plate_normalized: string;
    locked_at: string;
    lock_expires_at: string;
    locked_by: string;
    logical_request_id: string;
  }>;
  attempts: Array<Record<string, any>>;
  consultations: Array<VehicleConsultationRecord>;
  loggedEvents: Array<Record<string, any>>;
}

function createSimulatedDb(): SimulatedDb {
  return {
    locks: new Map(),
    attempts: [],
    consultations: [],
    loggedEvents: [],
  };
}

function createSimulatedSupabase(db: SimulatedDb) {
  return {
    rpc: async (fn: string, params: Record<string, any>) => {
      const now = new Date();

      if (fn === 'acquire_vehicle_provider_lock') {
        const lockKey = `${params.p_provider}:${params.p_operation}:${params.p_plate_normalized}`;
        const existing = db.locks.get(lockKey);
        const ttlMs = (params.p_ttl_seconds || 150) * 1000;
        const newExpiresAt = new Date(now.getTime() + ttlMs).toISOString();

        if (existing) {
          const isExpired = new Date(existing.lock_expires_at).getTime() <= now.getTime();
          if (!isExpired) {
            // Lock is active and held by another request
            return {
              data: [{
                acquired: false,
                lock_key: lockKey,
                locked_by: existing.locked_by,
                lock_expires_at: existing.lock_expires_at,
                recovered_expired: false,
              }],
              error: null,
            };
          }
          // Expired lock: take over
          const updatedLock = {
            lock_key: lockKey,
            provider: params.p_provider,
            operation: params.p_operation,
            plate_normalized: params.p_plate_normalized,
            locked_at: now.toISOString(),
            lock_expires_at: newExpiresAt,
            locked_by: params.p_locked_by,
            logical_request_id: params.p_logical_request_id,
          };
          db.locks.set(lockKey, updatedLock);
          return {
            data: [{
              acquired: true,
              lock_key: lockKey,
              locked_by: params.p_locked_by,
              lock_expires_at: newExpiresAt,
              recovered_expired: true,
            }],
            error: null,
          };
        }

        // New lock
        const newLock = {
          lock_key: lockKey,
          provider: params.p_provider,
          operation: params.p_operation,
          plate_normalized: params.p_plate_normalized,
          locked_at: now.toISOString(),
          lock_expires_at: newExpiresAt,
          locked_by: params.p_locked_by,
          logical_request_id: params.p_logical_request_id,
        };
        db.locks.set(lockKey, newLock);
        return {
          data: [{
            acquired: true,
            lock_key: lockKey,
            locked_by: params.p_locked_by,
            lock_expires_at: newExpiresAt,
            recovered_expired: false,
          }],
          error: null,
        };
      }

      if (fn === 'release_vehicle_provider_lock') {
        const lockKey = params.p_lock_key;
        const existing = db.locks.get(lockKey);
        if (existing && existing.locked_by === params.p_locked_by) {
          db.locks.delete(lockKey);
          return { data: true, error: null };
        }
        return { data: false, error: null };
      }

      if (fn === 'renew_vehicle_provider_lock') {
        const lockKey = params.p_lock_key;
        const existing = db.locks.get(lockKey);
        if (existing && existing.locked_by === params.p_locked_by) {
          const ttlMs = (params.p_ttl_seconds || 180) * 1000;
          existing.lock_expires_at = new Date(now.getTime() + ttlMs).toISOString();
          return {
            data: [{
              renewed: true,
              lock_key: lockKey,
              locked_by: params.p_locked_by,
              new_expires_at: existing.lock_expires_at,
            }],
            error: null,
          };
        }
        return {
          data: [{
            renewed: false,
            lock_key: lockKey,
            locked_by: params.p_locked_by,
            reason: 'LOCK_NOT_HELD_OR_EXPIRED',
          }],
          error: null,
        };
      }

      if (fn === 'check_ambiguous_provider_attempt') {
        const found = db.attempts.find(
          (a) =>
            a.provider === params.p_provider &&
            a.operation === params.p_operation &&
            a.plate_normalized === params.p_plate_normalized &&
            ['request_sent', 'response_received', 'charge_status_unknown', 'manual_review'].includes(a.status)
        );
        if (found) {
          return {
            data: [{
              has_ambiguous_attempt: true,
              attempt_id: found.id,
              status: found.status,
              charge_status: found.charge_status,
              logical_request_id: found.logical_request_id,
              physical_request_id: found.physical_request_id,
              created_at: found.created_at,
            }],
            error: null,
          };
        }
        return {
          data: [{ has_ambiguous_attempt: false }],
          error: null,
        };
      }

      if (fn === 'audit_manual_vehicle_lookup_reprocess') {
        return {
          data: [{ id: 'audit-' + Math.random().toString(36).substring(2, 9) }],
          error: null,
        };
      }

      return { data: null, error: { message: `Unknown RPC function: ${fn}` } };
    },

    from: (tableName: string) => {
      if (tableName === 'vehicle_provider_attempts') {
        return {
          insert: (payload: any) => {
            const row = {
              ...payload,
              id: 'attempt-' + Math.random().toString(36).substring(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            db.attempts.push(row);
            return {
              select: () => ({
                single: async () => ({ data: row, error: null }),
                maybeSingle: async () => ({ data: row, error: null }),
              }),
            };
          },
          update: (payload: any) => {
            let targetId: string | null = null;
            const builder: any = {
              eq: (col: string, val: any) => {
                if (col === 'id') targetId = val;
                return builder;
              },
            };
            // Return promise-like or thenable
            builder.then = (resolve: any) => {
              const item = db.attempts.find((a) => a.id === targetId);
              if (item) {
                Object.assign(item, payload, { updated_at: new Date().toISOString() });
              }
              resolve({ data: item, error: null });
            };
            return builder;
          },
          select: () => {
            let filtered = [...db.attempts];
            const builder: any = {
              eq: (col: string, val: any) => {
                filtered = filtered.filter((r) => r[col] === val);
                return builder;
              },
              order: () => builder,
              limit: (n: number) => {
                filtered = filtered.slice(0, n);
                return builder;
              },
              maybeSingle: async () => ({ data: filtered[0] || null, error: null }),
              single: async () => ({ data: filtered[0] || null, error: null }),
            };
            return builder;
          },
        };
      }

      if (tableName === 'vehicle_plate_consultations' || tableName === 'vehicle_consultations') {
        return {
          select: () => {
            let filtered = [...db.consultations];
            const builder: any = {
              eq: (col: string, val: any) => {
                filtered = filtered.filter((r: any) => r[col] === val);
                return builder;
              },
              in: (col: string, vals: any[]) => {
                filtered = filtered.filter((r: any) => vals.includes(r[col]));
                return builder;
              },
              order: () => builder,
              limit: (n: number) => {
                filtered = filtered.slice(0, n);
                return builder;
              },
              maybeSingle: async () => ({ data: filtered[0] || null, error: null }),
              single: async () => ({ data: filtered[0] || null, error: null }),
            };
            return builder;
          },
          insert: (payload: any) => {
            const row = {
              ...payload,
              id: 'consultation-' + Math.random().toString(36).substring(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            db.consultations.push(row);
            return {
              select: () => ({
                single: async () => ({ data: row, error: null }),
                maybeSingle: async () => ({ data: row, error: null }),
              }),
            };
          },
        };
      }

      const genericBuilder: any = {
        eq: () => genericBuilder,
        in: () => genericBuilder,
        order: () => genericBuilder,
        limit: () => genericBuilder,
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: null, error: null }),
      };

      return {
        select: () => genericBuilder,
        insert: () => ({
          select: () => ({
            single: async () => ({ data: {}, error: null }),
            maybeSingle: async () => ({ data: {}, error: null }),
          }),
        }),
      };
    },
  } as any;
}

describe('Mandatory Concurrency, Lock and Single-Attempt Suite (API Brasil)', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.VEHICLE_LOOKUP_MODE = 'live';
    process.env.APIBRASIL_TOKEN = 'secret-token-123456';
    process.env.APIBRASIL_REQUEST_TIMEOUT_MS = '120000';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  // Test 1: Duplo clique gera exatamente uma chamada HTTP externa
  it('1. Duplo clique gera exatamente uma chamada HTTP externa', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);
    let fetchCount = 0;

    globalThis.fetch = (async () => {
      fetchCount++;
      // Simulate 50ms latency
      await new Promise((resolve) => setTimeout(resolve, 50));
      return new Response(
        JSON.stringify({
          error: false,
          dados: { placa: 'PFX3G38', marca: 'HONDA', modelo: 'XRE 300' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    // Simulate rapid double click (concurrent execution)
    const call1 = executeVehiclePlateLookup(
      { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'admin-1', source: 'admin_panel' },
      supabase
    );
    const call2 = executeVehiclePlateLookup(
      { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'admin-1', source: 'admin_panel' },
      supabase
    );

    const results = await Promise.allSettled([call1, call2]);

    assert.equal(fetchCount, 1, 'Exatamente uma chamada HTTP deve ser disparada');

    // One call succeeds, the other is blocked by lock with ConsultationInProgressError
    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.equal(succeeded.length, 1);
    assert.equal(rejected.length, 1);
    assert.ok(
      (rejected[0] as PromiseRejectedResult).reason instanceof ConsultationInProgressError
    );
  });

  // Test 2: Duas requisições simultâneas em instâncias diferentes geram exatamente uma chamada
  it('2. Duas requisições simultâneas em instâncias diferentes geram exatamente uma chamada', async () => {
    const db = createSimulatedDb();
    const supabaseInst1 = createSimulatedSupabase(db);
    const supabaseInst2 = createSimulatedSupabase(db);
    let httpCalls = 0;

    globalThis.fetch = (async () => {
      httpCalls++;
      await new Promise((resolve) => setTimeout(resolve, 60));
      return new Response(
        JSON.stringify({
          error: false,
          dados: { placa: 'ABC1D23', marca: 'YAMAHA', modelo: 'FAZER 250' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    const [res1, res2] = await Promise.allSettled([
      executeVehiclePlateLookup(
        { plate: 'ABC1D23', confirmedPlate: 'ABC1D23', userId: 'usr-inst-1', deploymentId: 'dpl-vercel-1' },
        supabaseInst1
      ),
      executeVehiclePlateLookup(
        { plate: 'ABC1D23', confirmedPlate: 'ABC1D23', userId: 'usr-inst-2', deploymentId: 'dpl-vercel-2' },
        supabaseInst2
      ),
    ]);

    assert.equal(httpCalls, 1, 'Deve haver estritamente 1 chamada física HTTP');
    const rejected = [res1, res2].filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].reason.statusCode, 409);
    assert.equal(rejected[0].reason.name, 'ConsultationInProgressError');
  });

  // Test 3: Cron concorrente não gera chamada duplicada
  it('3. Cron concorrente não gera chamada duplicada', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);
    let httpCalls = 0;

    globalThis.fetch = (async () => {
      httpCalls++;
      await new Promise((resolve) => setTimeout(resolve, 80));
      return new Response(
        JSON.stringify({
          error: false,
          dados: { placa: 'PFX3G38', marca: 'HONDA', modelo: 'CG 160' },
        }),
        { status: 200 }
      );
    }) as any;

    // Call from customer flow / admin flow starts
    const userCall = executeVehiclePlateLookup(
      { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'usr-1', source: 'customer_flow' },
      supabase
    );

    // Cron job triggers 10ms later
    await new Promise((r) => setTimeout(r, 10));
    const cronCall = executeVehiclePlateLookup(
      { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'cron-worker', source: 'cron' },
      supabase
    );

    const [userRes, cronRes] = await Promise.allSettled([userCall, cronCall]);

    assert.equal(httpCalls, 1, 'Cron não deve duplicar chamada à API Brasil');
    assert.equal(userRes.status, 'fulfilled');
    assert.equal(cronRes.status, 'rejected');
    assert.ok((cronRes as PromiseRejectedResult).reason instanceof ConsultationInProgressError);
  });

  // Test 4: Timeout após request_sent cria charge_status_unknown e zero retries
  it('4. Timeout após request_sent cria charge_status_unknown e zero retries', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);
    let attemptsCount = 0;

    globalThis.fetch = (async (_url: string, opts: any) => {
      attemptsCount++;
      // Simulate timeout abort
      const err = new Error('The operation was aborted due to timeout');
      err.name = 'AbortError';
      throw err;
    }) as any;

    await assert.rejects(
      async () => {
        await executeVehiclePlateLookup(
          { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'usr-1' },
          supabase
        );
      },
      (err: any) => {
        assert.ok(err instanceof ChargeStatusUnknownError);
        assert.equal(err.name, 'ChargeStatusUnknownError');
        return true;
      }
    );

    assert.equal(attemptsCount, 1, 'Deve realizar estritamente 1 tentativa (zero retries automáticos)');

    // Verify audit attempt table status
    const attempt = db.attempts.find((a) => a.plate_normalized === 'PFX3G38');
    assert.ok(attempt, 'Registro de tentativa deve existir na tabela de auditoria');
    assert.equal(attempt.status, 'charge_status_unknown');
    assert.equal(attempt.charge_status, 'unknown');
    assert.ok(attempt.request_sent_at, 'request_sent_at deve ter sido preenchido antes do request');
  });

  // Test 5: HTTP 402 gera zero retries
  it('5. HTTP 402 gera zero retries', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);
    let attemptsCount = 0;

    globalThis.fetch = (async () => {
      attemptsCount++;
      return new Response(
        JSON.stringify({
          error: true,
          codigo: '402',
          mensagem: 'Saldo insuficiente na conta API Brasil',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    await assert.rejects(
      async () => {
        await executeVehiclePlateLookup(
          { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'usr-1' },
          supabase
        );
      },
      (err: any) => {
        assert.ok(err instanceof InsufficientBalanceError);
        return true;
      }
    );

    assert.equal(attemptsCount, 1, 'HTTP 402 deve ter exatamente 1 tentativa e zero retries');
    const attempt = db.attempts.find((a) => a.plate_normalized === 'PFX3G38');
    assert.ok(attempt);
    assert.equal(attempt.status, 'failed');
    assert.equal(attempt.charge_status, 'not_incurred');
  });

  // Test 6: HTTP 429 gera zero retries automáticos
  it('6. HTTP 429 gera zero retries automáticos', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);
    let attemptsCount = 0;

    globalThis.fetch = (async () => {
      attemptsCount++;
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Too Many Requests',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    await assert.rejects(
      async () => {
        await executeVehiclePlateLookup(
          { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'usr-1' },
          supabase
        );
      },
      (err: any) => {
        assert.ok(
          err instanceof ProviderUnavailableError || err instanceof ChargeStatusUnknownError,
        );
        assert.equal(err.attempts, 1);
        return true;
      }
    );

    assert.equal(attemptsCount, 1, 'HTTP 429 deve parar na 1ª tentativa');
  });

  // Test 7: Erro 5xx gera zero retry se a confirmação de não processamento não existir
  it('7. Erro 5xx gera zero retry se a confirmação de não processamento não existir', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);
    let attemptsCount = 0;

    globalThis.fetch = (async () => {
      attemptsCount++;
      return new Response(
        'Gateway Timeout from Upstream DETRAN / SENATRAN',
        { status: 504, headers: { 'Content-Type': 'text/plain' } }
      );
    }) as any;

    await assert.rejects(
      async () => {
        await executeVehiclePlateLookup(
          { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'usr-1' },
          supabase
        );
      },
      (err: any) => {
        assert.ok(err instanceof ChargeStatusUnknownError || err instanceof ProviderUnavailableError);
        return true;
      }
    );

    assert.equal(attemptsCount, 1, '5xx upstream deve ter exatamente 1 chamada externa (zero retries)');
  });

  // Test 8: Novo reprocessamento exige confirmação explícita
  it('8. Novo reprocessamento exige confirmação explícita', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);
    let attemptsCount = 0;

    // Populate a previous completed consultation in cache
    db.consultations.push({
      id: 'prev-consultation-1',
      plate_normalized: 'PFX3G38',
      plate_display: 'PFX-3G38',
      consultation_type: 'veiculos-total',
      provider: 'apibrasil',
      raw_response: { error: false, dados: { placa: 'PFX3G38', marca: 'HONDA' } },
      response_schema_version: '1.0',
      status: 'COMPLETED',
      provider_status_code: 200,
      provider_error: false,
      provider_message: null,
      mode: 'live',
      is_mock: false,
      is_chargeable: true,
      charged_amount: 30,
      provider_balance_before: null,
      provider_balance_after: null,
      provider_tax: null,
      vehicle_type: 'MOTOCICLO',
      brand: 'HONDA',
      model: 'CG 160 FAN',
      vehicle_description: 'CG 160',
      year_manufacture: 2022,
      year_model: 2023,
      color: 'VERMELHA',
      state: 'PE',
      city: 'RECIFE',
      chassis_masked: '9C2******1234',
      renavam_masked: '*******5678',
      risk_level: 'LOW',
      risk_index: 0,
      has_active_theft_robbery: false,
      has_judicial_restriction: false,
      has_financial_restriction: false,
      has_active_gravamen: false,
      has_auction_record: false,
      has_accident_indication: false,
      has_debts: false,
      debts_total_amount: 0,
      confirmation_at: new Date().toISOString(),
      confirmed_by: 'admin-1',
      confirmation_plate: 'PFX3G38',
      confirmation_message_version: 'v1.0',
      motorcycle_id: null,
      sell_request_id: null,
      consignment_id: null,
      lead_id: null,
      consulted_at: new Date().toISOString(),
      consulted_by: 'admin-1',
      pdf_generated_at: null,
      pdf_generation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    globalThis.fetch = (async () => {
      attemptsCount++;
      return new Response(
        JSON.stringify({
          error: false,
          dados: { placa: 'PFX3G38', marca: 'HONDA', modelo: 'CG 160' },
        }),
        { status: 200 }
      );
    }) as any;

    // Attempt 1: Regular query without manual reprocess confirmation -> hits local cache
    const regularResult = await executeVehiclePlateLookup(
      { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'admin-1' },
      supabase
    );
    assert.equal(regularResult.isCacheHit, true);
    assert.equal(attemptsCount, 0, 'Sem confirmação explícita de reprocessamento, usa cache local');

    // Attempt 2: Explicitly confirmed manual reprocess -> executes new live paid fetch
    const reprocessResult = await executeVehiclePlateLookup(
      {
        plate: 'PFX3G38',
        confirmedPlate: 'PFX3G38',
        userId: 'admin-1',
        isManualReprocess: true,
        confirmedManualReprocess: true,
        forceRefresh: true,
      },
      supabase
    );
    assert.equal(reprocessResult.success, true);
    assert.equal(reprocessResult.isCacheHit, false);
    assert.equal(attemptsCount, 1, 'Com confirmação explícita, nova chamada externa é realizada');
  });

  // Test 9: Lock expira de modo seguro após 150 s
  it('9. Lock expira de modo seguro após 150 s', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);

    // Simulate an orphaned lock expired 10 seconds ago
    const pastExpiresAt = new Date(Date.now() - 10000).toISOString();
    db.locks.set('apibrasil:veiculos-total:PFX3G38', {
      lock_key: 'apibrasil:veiculos-total:PFX3G38',
      provider: 'apibrasil',
      operation: 'veiculos-total',
      plate_normalized: 'PFX3G38',
      locked_at: new Date(Date.now() - 160000).toISOString(),
      lock_expires_at: pastExpiresAt,
      locked_by: 'dead-worker-1',
      logical_request_id: 'dead-req-1',
    });

    // Acquire lock with new request
    const lockResult = await acquireDistributedProviderLock(
      {
        provider: 'apibrasil',
        operation: 'veiculos-total',
        plateNormalized: 'PFX3G38',
        lockedBy: 'fresh-worker-2',
        logicalRequestId: 'fresh-req-2',
        ttlSeconds: 150,
        source: 'cron',
        timeoutMs: 120000,
      },
      supabase
    );

    assert.equal(lockResult.acquired, true);
    assert.equal(lockResult.recoveredExpired, true, 'Deve recuperar com sucesso o lock expirado');
    assert.equal(lockResult.lockedBy, 'fresh-worker-2');
  });

  // Test 10: Retorno bem-sucedido libera lock e persiste resposta
  it('10. Retorno bem-sucedido libera lock e persiste resposta', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);

    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          error: false,
          dados: {
            placa: 'PFX3G38',
            marca: 'HONDA',
            modelo: 'CG 160 TITAN',
            ano: '2023',
            cor: 'AZUL',
            municipio: 'RECIFE',
            uf: 'PE',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    const res = await executeVehiclePlateLookup(
      { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'admin-1' },
      supabase
    );

    assert.equal(res.success, true);
    assert.equal(res.record.plate_normalized, 'PFX3G38');

    // Verify lock is released in finally
    const remainingLock = db.locks.get('apibrasil:veiculos-total:PFX3G38');
    assert.equal(remainingLock, undefined, 'Lock deve ter sido liberado no encerramento com sucesso');

    // Verify attempt is marked succeeded with cost
    const attempt = db.attempts.find((a) => a.plate_normalized === 'PFX3G38');
    assert.ok(attempt);
    assert.equal(attempt.status, 'succeeded');
    assert.equal(attempt.charge_status, 'incurred');
    assert.equal(attempt.http_status, 200);
  });

  // Test 11: Aba anônima/admin não altera o comportamento de idempotência
  it('11. Aba anônima/admin não altera o comportamento de idempotência', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);
    let httpCalls = 0;

    globalThis.fetch = (async () => {
      httpCalls++;
      await new Promise((r) => setTimeout(r, 60));
      return new Response(
        JSON.stringify({ error: false, dados: { placa: 'PFX3G38', marca: 'HONDA' } }),
        { status: 200 }
      );
    }) as any;

    // Call 1 from anonymous / guest user
    const anonCall = executeVehiclePlateLookup(
      { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'guest-session-abc', source: 'customer_flow' },
      supabase
    );

    // Call 2 from authenticated admin tab for same plate
    const adminCall = executeVehiclePlateLookup(
      { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'admin-super-user', source: 'admin_panel' },
      supabase
    );

    const [anonRes, adminRes] = await Promise.allSettled([anonCall, adminCall]);

    assert.equal(httpCalls, 1, 'Mesma placa normalizada compartilha o mesmo lock independente de perfil de usuário');
    const rejected = [anonRes, adminRes].filter((r) => r.status === 'rejected');
    assert.equal(rejected.length, 1);
    assert.ok((rejected[0] as PromiseRejectedResult).reason instanceof ConsultationInProgressError);
  });

  // Test 12: Logs e banco permitem reconstruir a sequência completa de uma consulta
  it('12. Logs e banco permitem reconstruir a sequência completa de uma consulta', async () => {
    const db = createSimulatedDb();
    const supabase = createSimulatedSupabase(db);

    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({ error: false, dados: { placa: 'PFX3G38', marca: 'HONDA' } }),
        { status: 200 }
      );
    }) as any;

    await executeVehiclePlateLookup(
      { plate: 'PFX3G38', confirmedPlate: 'PFX3G38', userId: 'admin-1' },
      supabase
    );

    const attempt = db.attempts.find((a) => a.plate_normalized === 'PFX3G38');
    assert.ok(attempt);
    assert.ok(attempt.id);
    assert.ok(attempt.logical_request_id);
    assert.ok(attempt.physical_request_id);
    assert.ok(attempt.request_started_at);
    assert.ok(attempt.request_sent_at);
    assert.ok(attempt.response_received_at);
    assert.ok(attempt.finished_at);
    assert.equal(attempt.attempt_number, 1);
    assert.equal(attempt.timeout_ms, 120000);
  });

  // Test 13: Nenhum segredo aparece em logs ou na tabela de auditoria
  it('13. Nenhum segredo aparece em logs ou na tabela de auditoria', () => {
    const rawPayloadWithSecrets = {
      Authorization: 'Bearer super-secret-token-123456',
      token: 'secret-apibrasil-jwt',
      cookie: 'sb-auth-token=xyz',
      cpf: '123.456.789-00',
      chassi: '9BWZZZ377VT004251',
      renavam: '00123456789',
      placa: 'PFX3G38',
      tipo: 'veiculos-total',
    };

    const redacted = redactSensitiveInfo(rawPayloadWithSecrets);

    assert.equal(redacted.Authorization, '[REDACTED]');
    assert.equal(redacted.token, '[REDACTED]');
    assert.equal(redacted.cookie, '[REDACTED]');
    assert.equal(redacted.cpf, '[REDACTED]');
    assert.equal(redacted.chassi, '[REDACTED]');
    assert.equal(redacted.renavam, '[REDACTED]');
    assert.equal(redacted.placa, 'PFX3G38');
  });
});
