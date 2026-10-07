/**
 * Testes de Integração para Concorrência, Locks e Auditoria de Consulta Veicular
 *
 * REGRAS DE SEGURANÇA:
 * - Executar EXCLUSIVAMENTE em ambiente de Staging, Preview Database ou Branch Supabase.
 * - NUNCA executa em produção.
 * - Requer variáveis SUPABASE_TEST_URL e SUPABASE_TEST_SERVICE_ROLE_KEY.
 *
 * Como executar:
 * npm run test:integration:vehicle-lookup
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client EXCLUSIVAMENTE via variáveis TEST
const supabaseUrl = process.env.SUPABASE_TEST_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const testAdminUserId = process.env.SUPABASE_TEST_ADMIN_USER_ID;

// Proteção estrita contra execução acidental em produção
if (
  supabaseUrl?.includes('production') ||
  process.env.VERCEL_ENV === 'production'
) {
  throw new Error(
    'Testes de integração de consulta veicular não podem executar em produção.',
  );
}

const canRunIntegration =
  Boolean(supabaseUrl) &&
  Boolean(supabaseServiceRoleKey) &&
  Boolean(testAdminUserId) &&
  process.env.NODE_ENV !== 'production';

describe('Integration: Vehicle Lookup Locks & Audit (staging only)', { skip: !canRunIntegration }, () => {
  const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '');

  const testPlate = 'TST0I24';
  const provider = 'apibrasil';
  const operation = 'veiculos-total';
  let activeLockKey: string;
  let activeLogicalRequestId: string;

  before(async () => {
    if (!canRunIntegration) return;

    if (!testAdminUserId) {
      throw new Error(
        'SUPABASE_TEST_ADMIN_USER_ID é obrigatório para executar os testes de integração.',
      );
    }

    // 1. Valida que o usuário de teste existe em auth.users no ambiente de staging
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(testAdminUserId);
    if (userError || !userData?.user) {
      throw new Error(
        `Usuário de teste ${testAdminUserId} não foi encontrado em auth.users no banco de staging.`,
      );
    }

    // 2. Valida que possui perfil de admin ativo em public.admin_profiles
    const { data: adminProfile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('id, is_active')
      .eq('auth_user_id', testAdminUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (profileError || !adminProfile) {
      throw new Error(
        `Usuário de teste ${testAdminUserId} não possui perfil de admin ativo em public.admin_profiles no banco de staging.`,
      );
    }

    // Cleanup any existing locks, attempts or audits for this test plate
    await supabase.from('vehicle_provider_locks').delete().eq('plate_normalized', testPlate);
    await supabase.from('vehicle_provider_attempts').delete().eq('plate_normalized', testPlate);
    await supabase.from('vehicle_provider_manual_reprocess_audit').delete().eq('plate_normalized', testPlate);
  });

  after(async () => {
    if (!canRunIntegration) return;
    // Cleanup after tests
    await supabase.from('vehicle_provider_locks').delete().eq('plate_normalized', testPlate);
    await supabase.from('vehicle_provider_attempts').delete().eq('plate_normalized', testPlate);
    await supabase.from('vehicle_provider_manual_reprocess_audit').delete().eq('plate_normalized', testPlate);
  });

  it('should acquire a new lock successfully', async () => {
    const logicalRequestId = 'req_int_test_1';
    activeLogicalRequestId = logicalRequestId;

    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: provider,
      p_operation: operation,
      p_plate_normalized: testPlate,
      p_locked_by: 'integration-test',
      p_logical_request_id: logicalRequestId,
      p_ttl_seconds: 60,
      p_manual_reprocess_audit_id: null,
    });

    assert.ifError(error);
    assert.ok(data);
    const row = Array.isArray(data) ? data[0] : data;
    assert.equal(row.acquired, true);
    assert.equal(row.recovered_expired, false);
    activeLockKey = row.lock_key;
  });

  it('should deny lock acquisition for a concurrent request with different logical_request_id', async () => {
    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: provider,
      p_operation: operation,
      p_plate_normalized: testPlate,
      p_locked_by: 'integration-test-concurrent',
      p_logical_request_id: 'req_int_test_2',
      p_ttl_seconds: 60,
      p_manual_reprocess_audit_id: null,
    });

    assert.ifError(error);
    assert.ok(data);
    const row = Array.isArray(data) ? data[0] : data;
    assert.equal(row.acquired, false);
    assert.equal(row.lock_key, activeLockKey);
  });

  it('should allow lock acquisition (idempotency) for the same logical_request_id', async () => {
    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: provider,
      p_operation: operation,
      p_plate_normalized: testPlate,
      p_locked_by: 'integration-test',
      p_logical_request_id: activeLogicalRequestId,
      p_ttl_seconds: 60,
      p_manual_reprocess_audit_id: null,
    });

    assert.ifError(error);
    assert.ok(data);
    const row = Array.isArray(data) ? data[0] : data;
    assert.equal(row.acquired, true);
    assert.equal(row.recovered_expired, false);
  });

  it('should create an attempt record with status request_sent', async () => {
    const { data, error } = await supabase
      .from('vehicle_provider_attempts')
      .insert({
        provider,
        operation,
        plate_normalized: testPlate,
        status: 'request_sent',
        logical_request_id: activeLogicalRequestId,
      })
      .select('*')
      .single();

    assert.ifError(error);
    assert.ok(data);
    assert.equal(data.status, 'request_sent');
  });

  it('should prevent recovery of an expired lock if the last attempt is ambiguous and no audit is provided', async () => {
    // 1. Expira o lock manualmente para simular timeout
    const { error: updateError } = await supabase
      .from('vehicle_provider_locks')
      .update({ lock_expires_at: new Date(Date.now() - 10000).toISOString() })
      .eq('lock_key', activeLockKey);
    assert.ifError(updateError);

    // 2. Tenta readquirir sem audit ID
    const newLogicalRequestId = 'req_int_test_3';
    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: provider,
      p_operation: operation,
      p_plate_normalized: testPlate,
      p_locked_by: 'integration-test-3',
      p_logical_request_id: newLogicalRequestId,
      p_ttl_seconds: 60,
      p_manual_reprocess_audit_id: null,
    });

    assert.ifError(error);
    assert.ok(data);
    const row = Array.isArray(data) ? data[0] : data;
    assert.equal(row.acquired, false);
    assert.equal(row.reason, 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED');
  });

  it('should allow expired lock acquisition when a valid manual reprocess audit ID is provided and consume it once', async () => {
    const reprocessLogicalRequestId = 'req_int_test_manual_reprocess_4';

    // 1. Cria registro de auditoria com autorização de admin
    const { data: audit, error: auditError } = await supabase
      .from('vehicle_provider_manual_reprocess_audit')
      .insert({
        actor_id: testAdminUserId,
        actor_uuid: testAdminUserId,
        actor_type: 'admin',
        action: 'manual_reprocess_confirmed',
        provider,
        operation,
        plate_normalized: testPlate,
        reason: 'Reconciliação manual autorizada por teste de integração',
        estimated_cost_cents: 3000,
        acknowledged_risk: true,
        logical_request_id: reprocessLogicalRequestId,
        confirmed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    assert.ifError(auditError);
    assert.ok(audit?.id);

    // 2. Tenta adquirir o lock fornecendo o audit ID
    const { data: lockData, error: lockError } = await supabase.rpc(
      'acquire_vehicle_provider_lock',
      {
        p_provider: provider,
        p_operation: operation,
        p_plate_normalized: testPlate,
        p_locked_by: 'integration-test-admin-reprocess',
        p_logical_request_id: reprocessLogicalRequestId,
        p_ttl_seconds: 60,
        p_manual_reprocess_audit_id: audit.id,
      },
    );

    assert.ifError(lockError);
    const lockRow = Array.isArray(lockData) ? lockData[0] : lockData;
    assert.equal(lockRow.acquired, true);
    assert.equal(lockRow.recovered_expired, true);

    // 3. Verifica se a auditoria foi marcada como consumida (used_at)
    const { data: consumedAudit, error: fetchAuditErr } = await supabase
      .from('vehicle_provider_manual_reprocess_audit')
      .select('used_at, used_by_lock_key, used_by_logical_request_id')
      .eq('id', audit.id)
      .single();

    assert.ifError(fetchAuditErr);
    assert.ok(consumedAudit?.used_at, 'used_at deve ser preenchido');
    assert.equal(consumedAudit?.used_by_logical_request_id, reprocessLogicalRequestId);

    // 4. Garante que o mesmo audit ID NÃO pode ser reutilizado para uma segunda chamada
    // Simula lock expirado novamente
    await supabase
      .from('vehicle_provider_locks')
      .update({ lock_expires_at: new Date(Date.now() - 10000).toISOString() })
      .eq('lock_key', activeLockKey);

    const { data: reuseData, error: reuseError } = await supabase.rpc(
      'acquire_vehicle_provider_lock',
      {
        p_provider: provider,
        p_operation: operation,
        p_plate_normalized: testPlate,
        p_locked_by: 'integration-test-second-attempt',
        p_logical_request_id: 'req_int_test_reuse_5',
        p_ttl_seconds: 60,
        p_manual_reprocess_audit_id: audit.id,
      },
    );

    assert.ifError(reuseError);
    const reuseRow = Array.isArray(reuseData) ? reuseData[0] : reuseData;
    assert.equal(reuseRow.acquired, false, 'Auditoria já consumida deve ser rejeitada');
    assert.equal(reuseRow.reason, 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED');
  });
});
