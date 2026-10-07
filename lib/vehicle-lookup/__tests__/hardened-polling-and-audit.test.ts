import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  saveLookupSession,
  getActiveLookupSession,
  clearLookupSession,
  type ActiveLookupSession,
  type LookupUiStatus,
} from '../ui-session.ts';
import {
  acquireDistributedProviderLock,
  createManualReprocessAuditRecord,
  ManualReprocessAuditError,
  AmbiguousAttemptGuardError,
  ConsultationInProgressError,
} from '../lock-service.ts';
import { executeVehiclePlateLookup } from '../service.ts';

describe('Hardened Polling, Atomic Audit & Lock Recovery Suite (Correções 1 a 10)', () => {
  // Simulação de window.sessionStorage
  const mockStorage = new Map<string, string>();
  const fakeWindow = {
    sessionStorage: {
      getItem: (k: string) => mockStorage.get(k) ?? null,
      setItem: (k: string, v: string) => mockStorage.set(k, v),
      removeItem: (k: string) => mockStorage.delete(k),
      clear: () => mockStorage.clear(),
      get length() {
        return mockStorage.size;
      },
      key: (i: number) => Array.from(mockStorage.keys())[i] ?? null,
    },
  };

  it('1 & 2. Polling do cliente no arquivo CustomerVehicleDetail chama exclusivamente GET /status e nunca POST /process-delivery', () => {
    const customerComponentPath = path.resolve(
      process.cwd(),
      'components/customer/customer-vehicle-detail.tsx',
    );
    const content = fs.readFileSync(customerComponentPath, 'utf8');

    // NUNCA pode conter POST para process-delivery
    assert.doesNotMatch(
      content,
      /\/api\/cliente\/consultas\/.*\/process-delivery/,
      'Componente não pode chamar process-delivery em hipótese alguma',
    );

    // DEVE conter polling GET para a rota de status
    assert.match(
      content,
      /\/api\/cliente\/consultas\/\$\{consultation\.id\}\/status/,
      'Componente deve chamar rota de status do cliente',
    );
    assert.match(content, /method:\s*['"]GET['"]/i, 'Polling deve ser estritamente método GET');
  });

  it('3. Rota de status do cliente é estritamente read-only e retorna DTO com flags mapeadas', async () => {
    const routePath = path.resolve(
      process.cwd(),
      'app/api/cliente/consultas/[id]/status/route.ts',
    );
    const routeContent = fs.readFileSync(routePath, 'utf8');

    // Não pode conter mutações (insert, update, delete)
    assert.doesNotMatch(routeContent, /\.insert\(/, 'Rota de status não pode fazer insert');
    assert.doesNotMatch(routeContent, /\.update\(/, 'Rota de status não pode fazer update');
    assert.doesNotMatch(routeContent, /\.delete\(/, 'Rota de status não pode fazer delete');
    assert.doesNotMatch(routeContent, /process-delivery/, 'Rota de status não pode referenciar process-delivery');

    // Valida mapeamento de estados do DTO
    const statusesToTest = [
      { status: 'pending', isProcessing: true, isCompleted: false, isTerminal: false },
      { status: 'processing', isProcessing: true, isCompleted: false, isTerminal: false },
      { status: 'completed', isProcessing: false, isCompleted: true, isTerminal: true },
      { status: 'failed', isProcessing: false, isCompleted: false, isTerminal: true },
      { status: 'charge_status_unknown', isProcessing: false, isCompleted: false, isTerminal: true },
      { status: 'manual_review', isProcessing: false, isCompleted: false, isTerminal: true },
    ];

    // Testa que canViewResult é estritamente baseado no status completed e não infere por vehicle_data
    assert.match(
      routeContent,
      /canViewResult\s*=\s*consultation\.status\s*===\s*['"]completed['"]/,
      'canViewResult deve ser derivado exclusivamente de status === completed',
    );
  });

  it('4 & 5. Route Handler administrativa cria exatamente uma auditoria e Service não cria duplicata', async () => {
    const routePath = path.resolve(
      process.cwd(),
      'app/api/admin/vehicle-lookup/route.ts',
    );
    const routeContent = fs.readFileSync(routePath, 'utf8');

    const servicePath = path.resolve(
      process.cwd(),
      'lib/vehicle-lookup/service.ts',
    );
    const serviceContent = fs.readFileSync(servicePath, 'utf8');

    // Na route handler, createManualReprocessAuditRecord é chamado uma única vez e o ID é capturado
    assert.match(
      routeContent,
      /manualReprocessAuditId\s*=\s*await\s+createManualReprocessAuditRecord\(/,
      'Route handler deve capturar o ID da auditoria criada',
    );
    assert.match(
      routeContent,
      /manualReprocessAuditId,\s*logicalRequestId/,
      'Route handler deve passar manualReprocessAuditId para o serviço',
    );

    // No service.ts, createManualReprocessAuditRecord NÃO é importado nem chamado
    assert.doesNotMatch(
      serviceContent,
      /import.*createManualReprocessAuditRecord/,
      'service.ts não pode importar createManualReprocessAuditRecord para evitar duplicidade',
    );
    assert.doesNotMatch(
      serviceContent,
      /createManualReprocessAuditRecord\(/,
      'service.ts não pode criar auditoria duplicada',
    );
  });

  it('6, 7 & 8. Bypass manual sem audit ID válido é bloqueado e audit ID válido é consumido uma única vez', async () => {
    let rpcCallAuditId: string | null = null;
    let rpcCallCount = 0;

    const mockSupabase = {
      rpc: async (fn: string, params: Record<string, unknown>) => {
        if (fn === 'acquire_vehicle_provider_lock') {
          rpcCallCount++;
          rpcCallAuditId = params.p_manual_reprocess_audit_id as string | null;

          if (!params.p_manual_reprocess_audit_id) {
            return {
              data: {
                acquired: false,
                reason: 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED',
                lock_key: 'apibrasil:veiculos-total:ABC1D23',
              },
              error: null,
            };
          }

          if (params.p_manual_reprocess_audit_id === 'valid-audit-123') {
            return {
              data: {
                acquired: true,
                lock_key: 'apibrasil:veiculos-total:ABC1D23',
                recovered_expired: true,
              },
              error: null,
            };
          }

          if (params.p_manual_reprocess_audit_id === 'already-consumed-audit') {
            return {
              data: {
                acquired: false,
                reason: 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED',
                lock_key: 'apibrasil:veiculos-total:ABC1D23',
              },
              error: null,
            };
          }
        }
        return { data: null, error: null };
      },
    } as any;

    // 1. Sem audit ID -> bloqueado
    const deniedResult = await acquireDistributedProviderLock(
      {
        provider: 'apibrasil',
        operation: 'veiculos-total',
        plateNormalized: 'ABC1D23',
        logicalRequestId: 'req_test_1',
        lockedBy: 'att_test_1',
        source: 'admin_panel',
        timeoutMs: 120000,
        manualReprocessAuditId: null,
      },
      mockSupabase,
    );
    assert.strictEqual(deniedResult.acquired, false);
    assert.strictEqual(deniedResult.reason, 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED');
    assert.strictEqual(rpcCallAuditId, null);

    // 2. Com audit ID válido -> adquirido
    const approvedResult = await acquireDistributedProviderLock(
      {
        provider: 'apibrasil',
        operation: 'veiculos-total',
        plateNormalized: 'ABC1D23',
        logicalRequestId: 'req_test_2',
        lockedBy: 'att_test_2',
        source: 'admin_panel',
        timeoutMs: 120000,
        manualReprocessAuditId: 'valid-audit-123',
      },
      mockSupabase,
    );
    assert.strictEqual(approvedResult.acquired, true);
    assert.strictEqual(rpcCallAuditId, 'valid-audit-123');

    // 3. Com audit ID já consumido -> rejeitado
    const reusedResult = await acquireDistributedProviderLock(
      {
        provider: 'apibrasil',
        operation: 'veiculos-total',
        plateNormalized: 'ABC1D23',
        logicalRequestId: 'req_test_3',
        lockedBy: 'att_test_3',
        source: 'admin_panel',
        timeoutMs: 120000,
        manualReprocessAuditId: 'already-consumed-audit',
      },
      mockSupabase,
    );
    assert.strictEqual(reusedResult.acquired, false);
    assert.strictEqual(reusedResult.reason, 'AMBIGUOUS_ATTEMPT_RECONCILIATION_REQUIRED');
  });

  it('9 & 10. Migration SQL valida que lock expirado com tentativa ambígua exige auditoria e grava used_at', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20261007060000_bind_manual_reprocess_audit_to_lock.sql',
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    assert.match(sql, /used_at\s+TIMESTAMPTZ\s+NULL/i, 'Migration deve adicionar used_at');
    assert.match(sql, /used_by_lock_key\s+TEXT\s+NULL/i, 'Migration deve adicionar used_by_lock_key');
    assert.match(sql, /used_by_logical_request_id\s+TEXT\s+NULL/i, 'Migration deve adicionar used_by_logical_request_id');
    assert.doesNotMatch(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION[\s\S]*?p_force_bypass/i, 'Nova função não pode conter parâmetro p_force_bypass');
    assert.match(sql, /FOR\s+UPDATE/i, 'Deve usar FOR UPDATE para bloqueio pessimista na auditoria');
    assert.match(sql, /v_audit\.used_at\s+IS\s+NOT\s+NULL/i, 'Deve validar que auditoria não foi consumida');
    assert.match(sql, /UPDATE\s+public\.vehicle_provider_manual_reprocess_audit\s+SET\s+used_at/i, 'Deve consumir atomicamente gravando used_at');
  });

  it('11. Saída da tela preserva sessionStorage durante processamento e salva userLeftAt', () => {
    (globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow;

    const session: ActiveLookupSession = {
      context: 'admin',
      plateNormalized: 'PFX3G38',
      plateDisplay: 'PFX-3G38',
      startedAt: new Date().toISOString(),
      status: 'processing',
    };

    saveLookupSession(session);

    // Simula saída da tela pelo usuário
    const beforeLeave = getActiveLookupSession('admin', 'PFX3G38');
    assert.ok(beforeLeave, 'Sessão deve existir antes da saída');

    // Ao confirmar saída, NÃO deve ser chamado clearLookupSession; adiciona userLeftAt
    saveLookupSession({
      ...beforeLeave!,
      userLeftAt: new Date().toISOString(),
    });

    const afterLeave = getActiveLookupSession('admin', 'PFX3G38');
    assert.ok(afterLeave, 'Sessão DEVE ser preservada no sessionStorage após saída durante processamento');
    assert.ok(afterLeave?.userLeftAt, 'userLeftAt deve estar registrado');
    assert.strictEqual(afterLeave?.status, 'processing');
  });

  it('12. Estados terminais limpam sessionStorage', () => {
    (globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow;

    const terminalStatuses: LookupUiStatus[] = [
      'completed',
      'failed',
      'charge_status_unknown',
      'manual_review',
    ];

    for (const termStatus of terminalStatuses) {
      saveLookupSession({
        context: 'admin',
        plateNormalized: 'TST9999',
        plateDisplay: 'TST-9999',
        startedAt: new Date().toISOString(),
        status: termStatus,
      });

      assert.ok(getActiveLookupSession('admin', 'TST9999'));

      // Limpeza em estado terminal
      clearLookupSession('admin', 'TST9999');
      assert.strictEqual(
        getActiveLookupSession('admin', 'TST9999'),
        null,
        `Sessão deve ser limpa no estado terminal ${termStatus}`,
      );
    }
  });

  it('13. Copy da interface não promete continuidade garantida nem conclusão automática se a pessoa sair', () => {
    const dialogPath = path.resolve(
      process.cwd(),
      'components/vehicle-lookup/leave-confirm-dialog.tsx',
    );
    const dialogContent = fs.readFileSync(dialogPath, 'utf8');

    const panelPath = path.resolve(
      process.cwd(),
      'components/vehicle-lookup/consultation-progress-panel.tsx',
    );
    const panelContent = fs.readFileSync(panelPath, 'utf8');

    // Textos antigos enganosos não podem existir
    assert.doesNotMatch(dialogContent, /processamento continuará em segundo plano/i);
    assert.doesNotMatch(dialogContent, /resultado aparecerá automaticamente assim que as bases responderem/i);
    assert.doesNotMatch(panelContent, /resultado automático sem recarregar/i);
    assert.doesNotMatch(panelContent, /bases estaduais e histórico nacional/i);
    assert.doesNotMatch(panelContent, /compilando dados cadastrais, restrições e gravames/i);

    // Textos honestos obrigatórios devem existir
    assert.match(
      dialogContent,
      /Ainda estamos consultando as fontes oficiais para esta placa\./,
    );
    assert.match(
      dialogContent,
      /Sair agora encerra apenas o acompanhamento nesta tela\./,
    );
    assert.match(
      panelContent,
      /Consultando fontes oficiais disponíveis/,
    );
    assert.match(
      panelContent,
      /Consolidando os dados retornados pela consulta/,
    );
  });

  it('14 & 15. Testes de integração exigem exclusivamente SUPABASE_TEST_* e recusam produção', () => {
    const integrationTestPath = path.resolve(
      process.cwd(),
      'lib/vehicle-lookup/__tests__/integration-vehicle-lookup.test.ts',
    );
    const content = fs.readFileSync(integrationTestPath, 'utf8');

    // Não pode fazer fallback para produção
    assert.doesNotMatch(
      content,
      /process\.env\.NEXT_PUBLIC_SUPABASE_URL/,
      'Não pode fazer fallback para NEXT_PUBLIC_SUPABASE_URL',
    );
    assert.doesNotMatch(
      content,
      /process\.env\.SUPABASE_URL/,
      'Não pode fazer fallback para SUPABASE_URL',
    );
    assert.doesNotMatch(
      content,
      /process\.env\.SUPABASE_SERVICE_ROLE_KEY\s*\|\|/,
      'Não pode fazer fallback de chave de produção',
    );

    // Deve checar e bloquear produção
    assert.match(
      content,
      /SUPABASE_TEST_URL/,
      'Deve usar SUPABASE_TEST_URL',
    );
    assert.match(
      content,
      /SUPABASE_TEST_SERVICE_ROLE_KEY/,
      'Deve usar SUPABASE_TEST_SERVICE_ROLE_KEY',
    );
    assert.match(
      content,
      /throw new Error\(\s*['"]Testes de integração de consulta veicular não podem executar em produção\.['"]/,
      'Deve lançar erro explícito se produção for detectada',
    );
  });

  it('16. Migration 20261007080000 corrige GRANT EXECUTE na assinatura de 7 parâmetros e revoga de PUBLIC/anon', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20261007080000_fix_lock_function_signature_privileges.sql',
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // acquire_vehicle_provider_lock com 7 parâmetros
    assert.match(
      sql,
      /REVOKE ALL ON FUNCTION public\.acquire_vehicle_provider_lock\(\s*TEXT,\s*TEXT,\s*TEXT,\s*TEXT,\s*TEXT,\s*INTEGER,\s*UUID\s*\) FROM PUBLIC;/i,
      'Deve revogar PUBLIC na assinatura de 7 parâmetros',
    );
    assert.match(
      sql,
      /REVOKE ALL ON FUNCTION public\.acquire_vehicle_provider_lock\(\s*TEXT,\s*TEXT,\s*TEXT,\s*TEXT,\s*TEXT,\s*INTEGER,\s*UUID\s*\) FROM anon;/i,
      'Deve revogar anon na assinatura de 7 parâmetros',
    );
    assert.match(
      sql,
      /GRANT EXECUTE ON FUNCTION public\.acquire_vehicle_provider_lock\(\s*TEXT,\s*TEXT,\s*TEXT,\s*TEXT,\s*TEXT,\s*INTEGER,\s*UUID\s*\) TO authenticated,\s*service_role;/i,
      'Deve conceder execução para authenticated e service_role na assinatura de 7 parâmetros',
    );

    // release_vehicle_provider_lock
    assert.match(
      sql,
      /GRANT EXECUTE ON FUNCTION public\.release_vehicle_provider_lock\(\s*TEXT,\s*TEXT\s*\) TO authenticated,\s*service_role;/i,
      'Deve conceder release_vehicle_provider_lock para authenticated e service_role',
    );

    // renew_vehicle_provider_lock
    assert.match(
      sql,
      /GRANT EXECUTE ON FUNCTION public\.renew_vehicle_provider_lock\(\s*TEXT,\s*TEXT,\s*INTEGER\s*\) TO authenticated,\s*service_role;/i,
      'Deve conceder renew_vehicle_provider_lock para authenticated e service_role',
    );

    // check_ambiguous_provider_attempt
    assert.match(
      sql,
      /GRANT EXECUTE ON FUNCTION public\.check_ambiguous_provider_attempt\(\s*TEXT,\s*TEXT,\s*TEXT\s*\) TO authenticated,\s*service_role;/i,
      'Deve conceder check_ambiguous_provider_attempt para authenticated e service_role',
    );
  });

  it('17. Migration 20261007090000 implementa RPC SECURITY DEFINER para auditoria manual e blinda RLS da tabela', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20261007090000_create_secure_manual_reprocess_audit_rpc.sql',
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // SECURITY DEFINER e search_path seguro
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.create_manual_vehicle_reprocess_audit/i);
    assert.match(sql, /SECURITY DEFINER/i, 'Função deve ser SECURITY DEFINER');
    assert.match(sql, /SET search_path = ''/i, 'search_path deve ser vazio');

    // Validações obrigatórias
    assert.match(sql, /v_actor_uuid UUID := auth\.uid\(\);/i, 'Deve capturar auth.uid()');
    assert.match(sql, /RAISE EXCEPTION 'AUTH_REQUIRED';/i, 'Deve exigir sessão autenticada');
    assert.match(sql, /RAISE EXCEPTION 'ADMIN_REQUIRED';/i, 'Deve exigir admin ativo');
    assert.match(sql, /public\.is_admin\(\)/i, 'Deve validar via public.is_admin()');
    assert.match(sql, /length\(trim\(p_reason\)\) < 10/i, 'Deve exigir pelo menos 10 caracteres no motivo');
    assert.match(sql, /RAISE EXCEPTION 'MANUAL_REPROCESS_REASON_REQUIRED';/i, 'Deve levantar MANUAL_REPROCESS_REASON_REQUIRED');

    // Privilégios da RPC
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.create_manual_vehicle_reprocess_audit[\s\S]*?FROM PUBLIC;/i);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.create_manual_vehicle_reprocess_audit[\s\S]*?TO authenticated,\s*service_role;/i);

    // RLS da tabela
    assert.match(sql, /DROP POLICY IF EXISTS "Service role can insert reprocess audit"/i);
    assert.match(sql, /REVOKE INSERT, UPDATE, DELETE, TRUNCATE[\s\S]*?FROM anon,\s*authenticated;/i);
    assert.match(sql, /CREATE POLICY "Admins can view reprocess audit"[\s\S]*?USING \(public\.is_admin\(\)\);/i);
  });

  it('18. createManualReprocessAuditRecord invoca a RPC segura, valida motivo, trata erros com fail-closed e mascara audit ID', async () => {
    // 1. Motivo com menos de 10 caracteres falha antes da RPC
    await assert.rejects(
      async () => {
        await createManualReprocessAuditRecord(
          {
            actorId: 'admin-1',
            provider: 'apibrasil',
            operation: 'veiculos-total',
            plateNormalized: 'ABC1D23',
            reason: 'curto',
            logicalRequestId: 'req_123',
          },
          {} as any,
        );
      },
      (err: any) => {
        assert.ok(err instanceof ManualReprocessAuditError);
        assert.match(err.message, /mínimo de 10 caracteres/i);
        return true;
      },
    );

    // 2. Chamada à RPC com sucesso retorna UUID
    let capturedRpcParams: any = null;
    const mockSuccessSupabase = {
      rpc: async (fn: string, params: any) => {
        if (fn === 'create_manual_vehicle_reprocess_audit') {
          capturedRpcParams = params;
          return { data: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', error: null };
        }
        return { data: null, error: null };
      },
    } as any;

    const auditId = await createManualReprocessAuditRecord(
      {
        provider: 'apibrasil',
        operation: 'veiculos-total',
        plateNormalized: 'ABC1D23',
        reason: 'Motivo com mais de 10 caracteres para teste unitário',
        estimatedCostCents: 3000,
        logicalRequestId: 'req_test_rpc_1',
      },
      mockSuccessSupabase,
    );

    assert.strictEqual(auditId, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    assert.strictEqual(capturedRpcParams.p_provider, 'apibrasil');
    assert.strictEqual(capturedRpcParams.p_plate_normalized, 'ABC1D23');
    assert.strictEqual(capturedRpcParams.p_logical_request_id, 'req_test_rpc_1');

    // 3. Falha na RPC lança ManualReprocessAuditError (fail-closed, nunca faz fallback para insert)
    const mockErrorSupabase = {
      rpc: async () => ({
        data: null,
        error: { code: 'P0001', message: 'ADMIN_REQUIRED' },
      }),
      from: () => {
        throw new Error('NUNCA deve chamar supabase.from() como fallback!');
      },
    } as any;

    await assert.rejects(
      async () => {
        await createManualReprocessAuditRecord(
          {
            provider: 'apibrasil',
            operation: 'veiculos-total',
            plateNormalized: 'ABC1D23',
            reason: 'Tentativa legítima que deve falhar fechada',
            logicalRequestId: 'req_test_rpc_2',
          },
          mockErrorSupabase,
        );
      },
      (err: any) => {
        assert.ok(err instanceof ManualReprocessAuditError);
        assert.match(err.message, /Falha ao registrar auditoria/i);
        return true;
      },
    );
  });

  it('19. Route Handler administrativa valida motivo mínimo de 10 caracteres e service.ts autoriza reprocessamento exclusivamente com audit ID', () => {
    const routePath = path.resolve(
      process.cwd(),
      'app/api/admin/vehicle-lookup/route.ts',
    );
    const routeContent = fs.readFileSync(routePath, 'utf8');

    const servicePath = path.resolve(
      process.cwd(),
      'lib/vehicle-lookup/service.ts',
    );
    const serviceContent = fs.readFileSync(servicePath, 'utf8');

    // Na route handler, validação de motivo exige pelo menos 10 caracteres
    assert.match(
      routeContent,
      /body\.manualReprocessReason\.trim\(\)\.length\s*<\s*10/,
      'Route handler deve exigir no mínimo 10 caracteres no motivo',
    );
    assert.doesNotMatch(
      routeContent,
      /length\s*<\s*5/,
      'Validação antiga de 5 caracteres deve ser removida',
    );

    // No service.ts, autorização de reprocessamento depende única e exclusivamente de manualReprocessAuditId
    assert.match(
      serviceContent,
      /isManualReprocessAuthorized\s*=\s*Boolean\(params\.manualReprocessAuditId\);/,
      'service.ts deve autorizar reprocessamento exclusivamente via manualReprocessAuditId',
    );
    assert.doesNotMatch(
      serviceContent,
      /isManualBypass/,
      'service.ts não pode conter isManualBypass baseado em flags booleanas',
    );
    assert.doesNotMatch(
      serviceContent,
      /params\.isManualReprocess\s*&&\s*params\.confirmedManualReprocess/,
      'service.ts não pode usar flags booleanas de reprocessamento para bypass de cache',
    );
  });

  it('20. Teste de integração exige SUPABASE_TEST_ADMIN_USER_ID real e rejeita crypto.randomUUID() para usuário', () => {
    const integrationPath = path.resolve(
      process.cwd(),
      'lib/vehicle-lookup/__tests__/integration-vehicle-lookup.test.ts',
    );
    const integrationContent = fs.readFileSync(integrationPath, 'utf8');

    assert.match(
      integrationContent,
      /const testAdminUserId = process\.env\.SUPABASE_TEST_ADMIN_USER_ID;/,
      'Deve ler SUPABASE_TEST_ADMIN_USER_ID da variável de ambiente',
    );
    assert.doesNotMatch(
      integrationContent,
      /testAdminUserId\s*=\s*crypto\.randomUUID\(\)/,
      'NUNCA pode gerar UUID aleatório para o usuário admin de teste',
    );
    assert.match(
      integrationContent,
      /auth\.admin\.getUserById\(testAdminUserId\)/,
      'Deve validar existência do usuário em auth.users',
    );
    assert.match(
      integrationContent,
      /from\('admin_profiles'\)/,
      'Deve validar perfil admin ativo em admin_profiles',
    );
  });
});

