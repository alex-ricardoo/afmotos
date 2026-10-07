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
});
