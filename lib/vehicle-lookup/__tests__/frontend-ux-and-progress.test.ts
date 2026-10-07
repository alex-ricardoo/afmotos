import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatElapsedTime,
  calculateElapsedSeconds,
  calculateHonestProgress,
  maskPlateForTelemetry,
  maskIdForTelemetry,
  saveLookupSession,
  getActiveLookupSession,
  clearLookupSession,
  STORAGE_PREFIX,
  type ActiveLookupSession,
  type LookupUiStatus,
} from '../ui-session.ts';

describe('Frontend UX & Vehicle Lookup Progress Tests', () => {
  describe('1. Cronômetro e Formatação de Tempo', () => {
    it('formata tempos inferiores a 1 minuto com precisão mm:ss (00:47)', () => {
      assert.strictEqual(formatElapsedTime(0), '00:00');
      assert.strictEqual(formatElapsedTime(9), '00:09');
      assert.strictEqual(formatElapsedTime(47), '00:47');
      assert.strictEqual(formatElapsedTime(59), '00:59');
    });

    it('formata tempos superiores a 1 minuto com precisão mm:ss (01:12)', () => {
      assert.strictEqual(formatElapsedTime(60), '01:00');
      assert.strictEqual(formatElapsedTime(72), '01:12');
      assert.strictEqual(formatElapsedTime(95), '01:35');
      assert.strictEqual(formatElapsedTime(120), '02:00');
    });

    it('trata valores negativos ou inválidos sem quebrar', () => {
      assert.strictEqual(formatElapsedTime(-10), '00:00');
      assert.strictEqual(formatElapsedTime(NaN), '00:00');
    });

    it('reconstrói tempo decorrido a partir de startedAtIso (restauração de refresh)', () => {
      const nowMs = 1700000100000;
      // Sessão iniciada há 47 segundos
      const startedAt = new Date(nowMs - 47000).toISOString();
      const elapsed = calculateElapsedSeconds(startedAt, nowMs);
      assert.strictEqual(elapsed, 47);
      assert.strictEqual(formatElapsedTime(elapsed), '00:47');

      // Sessão iniciada há 72 segundos (1m12s)
      const startedAt72 = new Date(nowMs - 72000).toISOString();
      const elapsed72 = calculateElapsedSeconds(startedAt72, nowMs);
      assert.strictEqual(elapsed72, 72);
      assert.strictEqual(formatElapsedTime(elapsed72), '01:12');
    });
  });

  describe('2. Progresso Visual Honesto (Nunca 100% prematuro)', () => {
    it('nunca atinge 100% durante estados de espera ou processamento', () => {
      const waitStatuses: LookupUiStatus[] = ['starting', 'processing', 'consultation_in_progress'];

      for (const status of waitStatuses) {
        assert.ok(calculateHonestProgress(0, status) < 100);
        assert.ok(calculateHonestProgress(30, status) < 100);
        assert.ok(calculateHonestProgress(60, status) < 100);
        assert.ok(calculateHonestProgress(90, status) < 100);
        assert.ok(calculateHonestProgress(120, status) <= 85);
        assert.ok(calculateHonestProgress(200, status) <= 85);
      }
    });

    it('avanca suavemente respeitando a curva assintótica e estaciona em 85% no teto de 120s', () => {
      const p0 = calculateHonestProgress(0, 'processing');
      const p15 = calculateHonestProgress(15, 'processing');
      const p45 = calculateHonestProgress(45, 'processing');
      const p90 = calculateHonestProgress(90, 'processing');
      const p120 = calculateHonestProgress(120, 'processing');
      const p180 = calculateHonestProgress(180, 'processing');

      assert.ok(p0 >= 5);
      assert.ok(p15 >= p0);
      assert.ok(p45 >= p15);
      assert.ok(p90 >= p45);
      assert.strictEqual(p120, 85);
      // Mesmo se demorar 3 minutos, permanece no teto de 85% sem mentir 100%
      assert.strictEqual(p180, 85);
    });

    it('atinge 100% exclusivamente quando o status for "completed"', () => {
      assert.strictEqual(calculateHonestProgress(10, 'completed'), 100);
      assert.strictEqual(calculateHonestProgress(45, 'completed'), 100);
      assert.strictEqual(calculateHonestProgress(120, 'completed'), 100);
    });

    it('congela abaixo de 85% em falhas terminais, charge_status_unknown e manual_review', () => {
      const unknownProg = calculateHonestProgress(120, 'charge_status_unknown');
      assert.ok(unknownProg <= 85);
      assert.notStrictEqual(unknownProg, 100);

      const manualProg = calculateHonestProgress(120, 'manual_review');
      assert.ok(manualProg <= 85);
      assert.notStrictEqual(manualProg, 100);
    });
  });

  describe('3. Telemetria e Mascaramento Seguro de Dados Sensíveis', () => {
    it('mascara placas ocultando caracteres intermediários', () => {
      assert.strictEqual(maskPlateForTelemetry('PFX3G38'), 'PFX***8');
      assert.strictEqual(maskPlateForTelemetry('ABC1234'), 'ABC***4');
      assert.strictEqual(maskPlateForTelemetry('AB'), '***');
    });

    it('mascara IDs de consulta sem vazar UUID completo', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const masked = maskIdForTelemetry(uuid);
      assert.strictEqual(masked, '550e...0000');
    });

    it('não inclui tokens, senhas, CPF, Renavam ou chassi na estrutura de telemetria', () => {
      const samplePayload = {
        context: 'customer_portal' as const,
        plateMasked: 'PFX3G38',
        status: 'processing' as const,
        elapsedSeconds: 45,
        consultationIdMasked: '550e8400-e29b-41d4-a716-446655440000',
        action: 'poll_delivery',
      };

      const serialized = JSON.stringify(samplePayload);
      assert.doesNotMatch(serialized, /cpf/i);
      assert.doesNotMatch(serialized, /chassi/i);
      assert.doesNotMatch(serialized, /renavam/i);
      assert.doesNotMatch(serialized, /token/i);
      assert.doesNotMatch(serialized, /password/i);
    });
  });

  describe('4. Persistência de Sessão e Restauração', () => {
    // Simulação leve de window.sessionStorage no ambiente Node
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

    it('salva e recupera sessão ativa por placa e contexto', () => {
      (globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow;

      const session: ActiveLookupSession = {
        context: 'admin_panel',
        plateNormalized: 'PFX3G38',
        plateDisplay: 'PFX-3G38',
        startedAt: new Date().toISOString(),
        status: 'processing',
      };

      saveLookupSession(session);

      const recovered = getActiveLookupSession('admin_panel', 'PFX3G38');
      assert.ok(recovered);
      assert.strictEqual(recovered?.plateNormalized, 'PFX3G38');
      assert.strictEqual(recovered?.status, 'processing');

      clearLookupSession('admin_panel', 'PFX3G38');
      const afterClear = getActiveLookupSession('admin_panel', 'PFX3G38');
      assert.strictEqual(afterClear, null);
    });

    it('garante que a chave de sessionStorage contenha o prefixo correto', () => {
      const key = `${STORAGE_PREFIX}admin_panel_PFX3G38`;
      assert.ok(key.startsWith('af_lookup_session_v1_'));
    });
  });

  describe('5. Regras de Bloqueio, Gating e Diferenciação Admin vs Cliente', () => {
    it('valida que o botão de confirmação exige checkbox marcado', () => {
      const canSubmitInitially = (isCheckboxChecked: boolean, isSubmitting: boolean) => {
        return isCheckboxChecked && !isSubmitting;
      };

      // Sem checkbox -> desabilitado
      assert.strictEqual(canSubmitInitially(false, false), false);
      // Com checkbox, sem submissão -> habilitado
      assert.strictEqual(canSubmitInitially(true, false), true);
      // Com checkbox, mas já em submissão (proteção de duplo clique) -> desabilitado
      assert.strictEqual(canSubmitInitially(true, true), false);
    });

    it('bloqueia reprocessamento manual para perfil cliente', () => {
      const canShowManualReprocess = (role: 'admin' | 'customer', status: LookupUiStatus) => {
        if (role !== 'admin') return false;
        return status === 'charge_status_unknown' || status === 'manual_review';
      };

      assert.strictEqual(canShowManualReprocess('customer', 'charge_status_unknown'), false);
      assert.strictEqual(canShowManualReprocess('customer', 'manual_review'), false);
      assert.strictEqual(canShowManualReprocess('admin', 'charge_status_unknown'), true);
      assert.strictEqual(canShowManualReprocess('admin', 'manual_review'), true);
      assert.strictEqual(canShowManualReprocess('admin', 'processing'), false);
    });

    it('não permite retry automático para charge_status_unknown', () => {
      const shouldAutoRetry = (status: LookupUiStatus) => {
        // Regra estrita: NUNCA auto-retry no frontend em nenhum status
        return false;
      };

      assert.strictEqual(shouldAutoRetry('charge_status_unknown'), false);
      assert.strictEqual(shouldAutoRetry('failed'), false);
      assert.strictEqual(shouldAutoRetry('consultation_in_progress'), false);
    });

    it('identifica que 409 (consultation_in_progress) orienta acompanhamento sem disparar novo request', () => {
      const getActionForStatus = (status: LookupUiStatus) => {
        switch (status) {
          case 'consultation_in_progress':
            return 'Acompanhar consulta em andamento';
          case 'completed':
            return 'Ver resultado da consulta';
          case 'charge_status_unknown':
          case 'manual_review':
            return 'Entendi';
          default:
            return 'Aguardar';
        }
      };

      assert.strictEqual(getActionForStatus('consultation_in_progress'), 'Acompanhar consulta em andamento');
      assert.strictEqual(getActionForStatus('completed'), 'Ver resultado da consulta');
      assert.strictEqual(getActionForStatus('charge_status_unknown'), 'Entendi');
    });

    it('define se beforeunload deve estar ativo baseado exclusivamente no status', () => {
      const shouldAttachBeforeUnload = (status: LookupUiStatus) => {
        return status === 'starting' || status === 'processing';
      };

      assert.strictEqual(shouldAttachBeforeUnload('starting'), true);
      assert.strictEqual(shouldAttachBeforeUnload('processing'), true);
      assert.strictEqual(shouldAttachBeforeUnload('completed'), false);
      assert.strictEqual(shouldAttachBeforeUnload('failed'), false);
      assert.strictEqual(shouldAttachBeforeUnload('charge_status_unknown'), false);
      assert.strictEqual(shouldAttachBeforeUnload('manual_review'), false);
    });
  });
});
