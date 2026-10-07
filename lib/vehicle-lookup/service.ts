import fs from 'node:fs';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getVehicleLookupConfig } from './config.ts';
import { normalizeBrazilianPlate, formatBrazilianPlate, isValidBrazilianPlate } from './plate.ts';
import { parseApiBrasilVehicleResponse } from './adapters/apibrasil-vehicle-total.ts';
import { extractDatabaseSummaryColumns } from './adapters/vehicle-summary.ts';
import type {
  VehicleConsultationRecord,
  VehicleLookupMode,
  VehicleConsultationStatus,
} from './types.ts';

import { getVehicleHistoryPricingConfig } from '../settings/pricing-service.ts';
import {
  acquireDistributedProviderLock,
  releaseDistributedProviderLock,
  renewDistributedProviderLock,
  checkAmbiguousProviderAttempt,
  createProviderAttemptRecord,
  updateProviderAttemptRecord,
  ConsultationInProgressError,
  ChargeStatusUnknownError,
  ProviderLockUnavailableError,
  ProviderPersistenceAfterSuccessError,
  AmbiguousAttemptGuardError,
} from './lock-service.ts';
import { logProviderEvent, type ProviderSource } from './provider-logger.ts';

export {
  ConsultationInProgressError,
  ChargeStatusUnknownError,
  ProviderLockUnavailableError,
  ProviderPersistenceAfterSuccessError,
  AmbiguousAttemptGuardError,
};

export class InsufficientBalanceError extends Error {
  balance?: string;
  rechargeUrl?: string;

  constructor(message: string, balance?: string, rechargeUrl?: string) {
    super(message);
    this.name = 'InsufficientBalanceError';
    this.balance = balance;
    this.rechargeUrl = rechargeUrl || 'https://app.apibrasil.io/dashboard?modal=recharge';
  }
}

export class InvalidTokenError extends Error {
  constructor(message?: string) {
    super(
      message ||
        'Token da API Brasil expirado ou inválido. Acesse a tela de credenciais na API Brasil (https://app.apibrasil.io), gere um novo token, configure a variável de ambiente APIBRASIL_TOKEN na Vercel ou entre em contato com o desenvolvedor Alex.',
    );
    this.name = 'InvalidTokenError';
  }
}

export class ProviderUnavailableError extends Error {
  attempts: number;
  lastStatusCode?: number;
  isProviderUnavailable: boolean;

  constructor(
    message: string = 'Instabilidade temporária nas bases governamentais (SENATRAN/DETRAN) ou no gateway da API Brasil. Foram realizadas tentativas de conexão sem sucesso.',
    attempts: number = 3,
    lastStatusCode?: number,
  ) {
    super(message);
    this.name = 'ProviderUnavailableError';
    this.attempts = attempts;
    this.lastStatusCode = lastStatusCode;
    this.isProviderUnavailable = true;
  }
}

export interface ExecuteLookupParams {
  plate: string;
  userId: string;
  confirmedPlate: string;
  confirmationMessageVersion?: string;
  motorcycleId?: string | null;
  sellRequestId?: string | null;
  forceRefresh?: boolean;
  requireLiveOnly?: boolean;
  pricingVersionId?: string | null;
  costSnapshotCents?: number | null;
  customerConsultationId?: string | null;
  deliveryJobId?: string | null;
  logicalRequestId?: string;
  source?: 'admin_panel' | 'customer_flow' | 'cron' | 'worker';
  deploymentId?: string | null;
  isManualReprocess?: boolean;
  confirmedManualReprocess?: boolean;
  manualReprocessReason?: string;
}

export interface LookupExecutionResult {
  success: boolean;
  isCacheHit: boolean;
  record: VehicleConsultationRecord;
  message?: string;
}

export interface FindExistingConsultationOptions {
  requireLiveOnly?: boolean;
}

/**
 * Checks if an existing completed consultation exists in the database for the given plate.
 */
export async function findExistingConsultation(
  plate: string,
  supabase: SupabaseClient,
  options?: FindExistingConsultationOptions,
): Promise<VehicleConsultationRecord | null> {
  const normalized = normalizeBrazilianPlate(plate);
  if (!normalized) return null;

  let query = supabase
    .from('vehicle_plate_consultations')
    .select('*')
    .eq('plate_normalized', normalized)
    .in('status', ['COMPLETED']);

  if (options?.requireLiveOnly) {
    query = query.eq('is_mock', false).eq('mode', 'live');
  } else {
    // Put live (is_mock = false) first, then mock (is_mock = true)
    query = query.order('is_mock', { ascending: true });
  }

  const { data, error } = await query
    .order('consulted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as VehicleConsultationRecord;
}

/**
 * Loads mock fixture only when explicitly in mock mode or unit testing
 */
function loadMockFixture(targetPlate: string): Record<string, unknown> {
  try {
    const fixturePath = path.resolve(
      process.cwd(),
      'lib/vehicle-lookup/fixtures/vehicle-total.mock.json',
    );
    const content = fs.readFileSync(fixturePath, 'utf-8');
    const parsed = JSON.parse(content);

    const norm = normalizeBrazilianPlate(targetPlate);
    if (parsed.data) {
      parsed.data.placa = norm;
      if (parsed.data.dadosBasicosDoVeiculo) parsed.data.dadosBasicosDoVeiculo.placa = norm;
      if (parsed.data.baseEstadual) parsed.data.baseEstadual.placa = norm;
      if (parsed.data.baseNacional) parsed.data.baseNacional.placa = norm;
    }
    if (parsed.dados) {
      parsed.dados.placa = norm;
    }
    return parsed;
  } catch (err) {
    const norm = normalizeBrazilianPlate(targetPlate);
    return {
      error: false,
      message: 'Consulta simulada (Mock Fallback)',
      status_code: 200,
      balance: 150.0,
      tax: 0.0,
      dados: {
        placa: norm,
        marca: 'HONDA',
        modelo: 'CB 600F HORNET',
        ano_fabricacao: 2021,
        ano_modelo: 2022,
        cor: 'PRETA',
        tipo_veiculo: 'MOTOCICLO',
        uf: 'SP',
        municipio: 'SAO PAULO',
        fotos: [
          'https://static.suporteleiloes.com.br/leiloespbcombr/bens/29802/arquivos/687e824b5d6bf-687e824c41ecb.jpg',
          'https://static.suporteleiloes.com.br/leiloespbcombr/bens/29802/arquivos/687e82bc54f8a-687e82bcafa77.jpg',
          'https://static.suporteleiloes.com.br/leiloespbcombr/bens/29802/arquivos/687e82fca9c2b-687e82fd903ef.jpg',
        ],
        fotosLoteVeiculo: {
          conteudo: [
            {
              url: 'https://static.suporteleiloes.com.br/leiloespbcombr/bens/29802/arquivos/687e824b5d6bf-687e824c41ecb.jpg',
              descricao: 'FRENTE DO VEÍCULO / LOTE',
              base64: null,
            },
            {
              url: 'https://static.suporteleiloes.com.br/leiloespbcombr/bens/29802/arquivos/687e82bc54f8a-687e82bcafa77.jpg',
              descricao: 'LATERAL E TRASEIRA',
              base64: null,
            },
            {
              url: 'https://static.suporteleiloes.com.br/leiloespbcombr/bens/29802/arquivos/687e82fca9c2b-687e82fd903ef.jpg',
              descricao: 'VISTA SUPERIOR / PÁTIO',
              base64: null,
            },
          ],
        },
        leilao: {
          descricao: 'Consta registro de leilão para o veículo informado',
          registros: [
            {
              leiloeiro: 'FREITAS LEILOEIRO OFICIAL',
              dataLeilao: '15/08/2021',
              lote: '1234',
              comitente: 'PORTO SEGURO CIA DE SEGUROS GERAIS',
              condicaoGeral: 'RECUPERAVEL / SUCATA',
              tipoSinistro: 'COLISAO / PEQUENA MONTA',
              patio: 'SAO PAULO / SP',
              chassi: '9C2KC123456789012',
              placa: norm,
              marcaModelo: 'HONDA/CB 600F HORNET',
              fotos: [
                'https://static.suporteleiloes.com.br/leiloespbcombr/bens/29802/arquivos/687e824b5d6bf-687e824c41ecb.jpg',
                'https://static.suporteleiloes.com.br/leiloespbcombr/bens/29802/arquivos/687e82bc54f8a-687e82bcafa77.jpg',
                'https://static.suporteleiloes.com.br/leiloespbcombr/bens/29802/arquivos/687e82fca9c2b-687e82fd903ef.jpg',
              ],
            },
          ],
          score: {
            aceitacao: 'RESTRITA',
            exigenciaVistoriaEspecial: 'SIM',
            percentualSobreRef: '70',
            pontuacao: '4',
            score: 'ALTO RISCO',
          },
        },
      },
    };
  }
}

/**
 * Main Service Orchestrator: executes lookup following cache, live API, and error rules
 *
 * BLOQUEADORES implementados:
 * 1 — Sem fallback não atômico (via lock-service.ts)
 * 4 — Falha de persistência após sucesso não permite retry
 * 5 — TTL 180s, renovação de lock antes de fetch e persistência
 * 7 — Guarda de tentativa ambígua bloqueia reprocessamento automático
 * 8 — HTTP 429 tratado como cobrança desconhecida
 */
export async function executeVehiclePlateLookup(
  params: ExecuteLookupParams,
  supabase: SupabaseClient,
): Promise<LookupExecutionResult> {
  const normalizedPlate = normalizeBrazilianPlate(params.plate);

  console.log(`\n[API_BRASIL] 🔍 ========================================================`);
  console.log(
    `[API_BRASIL] 🔍 [executeVehiclePlateLookup] Iniciando processamento para placa: "${params.plate}" (normalizada: "${normalizedPlate}")`,
  );

  if (!isValidBrazilianPlate(normalizedPlate)) {
    console.warn(`[API_BRASIL] ❌ Placa inválida: "${params.plate}"`);
    throw new Error(
      `Placa inválida: "${params.plate}". Informe uma placa válida no formato antigo ou Mercosul.`,
    );
  }

  const pricingConfig = await getVehicleHistoryPricingConfig(supabase).catch(() => null);
  const activeCostCents = params.costSnapshotCents ?? pricingConfig?.apiBrasilLiveCostCents ?? 3000;
  const activePricingVersionId = params.pricingVersionId ?? pricingConfig?.versionId ?? null;
  const defaultCostBrl = activeCostCents / 100;

  const config = getVehicleLookupConfig(defaultCostBrl);
  const currentMode: VehicleLookupMode = config.mode;
  const timeoutMs = config.timeoutMs;
  const source: ProviderSource = params.source || 'admin_panel';
  const logicalRequestId = params.logicalRequestId || `req_${crypto.randomUUID()}`;
  const physicalRequestId = `att_${crypto.randomUUID()}`;
  const idempotencyKey = `apibrasil:veiculos-total:${normalizedPlate}:${logicalRequestId}`;
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  const deploymentId = params.deploymentId || process.env.VERCEL_DEPLOYMENT_ID || null;
  const lockTtlSeconds = 180;

  console.log(
    `[API_BRASIL] ⚙️ Modo ativo: [${currentMode.toUpperCase()}] | URL Base: ${config.apiBrasilBaseUrl} | Timeout: ${timeoutMs}ms`,
  );
  console.log(
    `[API_BRASIL] 🔑 Token configurado? ${Boolean(config.apiBrasilToken)} ${config.apiBrasilToken ? `(tamanho: ${config.apiBrasilToken.length} caracteres)` : '(TOKEN AUSENTE!)'}`,
  );

  // Reprocessamento manual confirmado por admin bypassa cache e guarda ambígua
  const isManualBypass =
    Boolean(params.isManualReprocess && params.confirmedManualReprocess) ||
    Boolean(params.forceRefresh && params.confirmedManualReprocess);

  // =========================================================================
  // 1. Aquisição do Lock Distribuído (BLOQUEADOR 1: sem fallback)
  // =========================================================================
  const lockResult = await acquireDistributedProviderLock(
    {
      provider: 'apibrasil',
      operation: 'veiculos-total',
      plateNormalized: normalizedPlate,
      logicalRequestId,
      lockedBy: physicalRequestId,
      ttlSeconds: lockTtlSeconds,
      source,
      timeoutMs,
    },
    supabase,
  );

  if (!lockResult.acquired) {
    logProviderEvent({
      event: 'provider_duplicate_blocked',
      provider: 'apibrasil',
      operation: 'veiculos-total',
      placa_normalizada: normalizedPlate,
      logical_request_id: logicalRequestId,
      physical_request_id: physicalRequestId,
      attempt_number: 1,
      timeout_ms: timeoutMs,
      duration_ms: 0,
      status: 'deduplicated',
      charge_status: 'not_sent',
      deployment_id: deploymentId,
      origem: source,
      extra: {
        lock_key: lockResult.lockKey,
        locked_by: lockResult.lockedBy,
        lock_expires_at: lockResult.lockExpiresAt,
      },
    });

    await createProviderAttemptRecord(
      {
        provider: 'apibrasil',
        operation: 'veiculos-total',
        plateNormalized: normalizedPlate,
        logicalRequestId,
        physicalRequestId,
        idempotencyKey,
        attemptNumber: 1,
        status: 'deduplicated',
        chargeStatus: 'not_sent',
        timeoutMs,
        environment,
        deploymentId,
        source,
        customerConsultationId: params.customerConsultationId,
        deliveryJobId: params.deliveryJobId,
        estimatedCostCents: activeCostCents,
      },
      supabase,
    );

    throw new ConsultationInProgressError(normalizedPlate, lockResult.lockKey);
  }

  logProviderEvent({
    event: 'provider_lock_acquired',
    provider: 'apibrasil',
    operation: 'veiculos-total',
    placa_normalizada: normalizedPlate,
    logical_request_id: logicalRequestId,
    physical_request_id: physicalRequestId,
    attempt_number: 1,
    timeout_ms: timeoutMs,
    duration_ms: 0,
    status: 'locked',
    charge_status: 'not_sent',
    deployment_id: deploymentId,
    origem: source,
    extra: {
      recovered_expired: lockResult.recoveredExpired,
      lock_key: lockResult.lockKey,
    },
  });

  // 2. Persistir tentativa física como 'created' antes de qualquer chamada
  const attemptDbId = await createProviderAttemptRecord(
    {
      provider: 'apibrasil',
      operation: 'veiculos-total',
      plateNormalized: normalizedPlate,
      logicalRequestId,
      physicalRequestId,
      idempotencyKey,
      attemptNumber: 1,
      status: 'created',
      chargeStatus: 'not_sent',
      timeoutMs,
      environment,
      deploymentId,
      source,
      customerConsultationId: params.customerConsultationId,
      deliveryJobId: params.deliveryJobId,
      estimatedCostCents: activeCostCents,
    },
    supabase,
  );

  logProviderEvent({
    event: 'provider_attempt_created',
    provider: 'apibrasil',
    operation: 'veiculos-total',
    placa_normalizada: normalizedPlate,
    logical_request_id: logicalRequestId,
    physical_request_id: physicalRequestId,
    attempt_number: 1,
    timeout_ms: timeoutMs,
    duration_ms: 0,
    status: 'created',
    charge_status: 'not_sent',
    deployment_id: deploymentId,
    origem: source,
  });

  try {
    // 3. Cache-first check (unless forceRefresh is explicitly requested with confirmedManualReprocess)
    if (!isManualBypass) {
      console.log(`[API_BRASIL] 🔎 Verificando se já existe laudo em cache local no Supabase...`);
      const requireLiveOnly = currentMode === 'live' || Boolean(params.requireLiveOnly);
      const existing = await findExistingConsultation(normalizedPlate, supabase, { requireLiveOnly });
      if (existing && existing.status === 'COMPLETED') {
        console.log(
          `[API_BRASIL] ✅ Cache HIT local! Consulta prévia reaproveitada (ID: ${existing.id}, Custo: R$ 0,00)`,
        );

        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            consultationId: existing.id,
            status: 'succeeded',
            chargeStatus: 'not_incurred',
            finishedAt: new Date().toISOString(),
            durationMs: 0,
            actualCostCents: 0,
          },
          supabase,
        );

        return {
          success: true,
          isCacheHit: true,
          record: existing,
          message: 'Consulta recuperada do cache local (Custo R$ 0,00).',
        };
      }
      console.log(`[API_BRASIL] ℹ️ Cache MISS: Nenhuma consulta válida encontrada em cache local.`);
    } else {
      console.log(`[API_BRASIL] 🔄 Reprocessamento manual confirmado: Executando nova chamada tarifável.`);
    }

    // =========================================================================
    // BLOQUEADOR 5 & 7: Guarda de tentativa ambígua após cache miss
    // Se existe attempt recente com status ambíguo e a chamada NÃO é
    // reprocessamento manual confirmado, bloquear.
    // =========================================================================
    if (currentMode === 'live' && !isManualBypass) {
      const ambiguousCheck = await checkAmbiguousProviderAttempt(
        'apibrasil',
        'veiculos-total',
        normalizedPlate,
        supabase,
      );

      if (ambiguousCheck.hasAmbiguousAttempt) {
        logProviderEvent({
          event: 'provider_ambiguous_attempt_guard_blocked',
          provider: 'apibrasil',
          operation: 'veiculos-total',
          placa_normalizada: normalizedPlate,
          logical_request_id: logicalRequestId,
          physical_request_id: physicalRequestId,
          attempt_number: 1,
          timeout_ms: timeoutMs,
          duration_ms: 0,
          status: 'blocked',
          charge_status: 'not_sent',
          deployment_id: deploymentId,
          origem: source,
          extra: {
            previous_attempt_id: ambiguousCheck.attemptId,
            previous_status: ambiguousCheck.status,
            previous_charge_status: ambiguousCheck.chargeStatus,
          },
        });

        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'blocked',
            chargeStatus: 'not_sent',
            finishedAt: new Date().toISOString(),
            providerErrorCode: 'AMBIGUOUS_ATTEMPT_GUARD_BLOCKED',
          },
          supabase,
        );

        await releaseDistributedProviderLock(lockResult.lockKey, physicalRequestId, supabase);

        throw new AmbiguousAttemptGuardError(normalizedPlate, ambiguousCheck.attemptId);
      }
    }

    let rawPayload: Record<string, unknown> = {};
    let isMock = false;
    let isChargeable = true;
    let chargedAmount = defaultCostBrl;
    let executionStatus: VehicleConsultationStatus = 'COMPLETED';
    let balanceBefore: number | null = null;
    let balanceAfter: number | null = null;
    let taxCharged: number | null = null;

    if (currentMode === 'live') {
      if (!config.apiBrasilToken) {
        console.error(
          `[API_BRASIL] ❌ Erro: APIBRASIL_TOKEN não configurado no ambiente e modo live solicitado!`,
        );
        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'failed',
            chargeStatus: 'not_sent',
            providerErrorCode: 'MISSING_TOKEN',
            finishedAt: new Date().toISOString(),
          },
          supabase,
        );
        throw new InvalidTokenError(
          'Token da API Brasil não configurado. Por favor, configure a variável de ambiente APIBRASIL_TOKEN com o token obtido em https://app.apibrasil.io ou entre em contato com o desenvolvedor Alex.',
        );
      }

      isMock = false;
      isChargeable = true;
      chargedAmount = config.estimatedCostPerLookup;

      const rawToken = config.apiBrasilToken.trim();
      const cleanToken = rawToken.replace(/^Bearer\s+/i, '');
      const authHeader = `Bearer ${cleanToken}`;

      // =====================================================================
      // BLOQUEADOR 5: Renovar lock ANTES do fetch
      // =====================================================================
      const preRenew = await renewDistributedProviderLock(
        lockResult.lockKey,
        physicalRequestId,
        lockTtlSeconds,
        supabase,
      );
      if (preRenew.renewed) {
        logProviderEvent({
          event: 'provider_lock_renewed',
          provider: 'apibrasil',
          operation: 'veiculos-total',
          placa_normalizada: normalizedPlate,
          logical_request_id: logicalRequestId,
          physical_request_id: physicalRequestId,
          attempt_number: 1,
          timeout_ms: timeoutMs,
          duration_ms: 0,
          status: 'locked',
          charge_status: 'not_sent',
          deployment_id: deploymentId,
          origem: source,
          extra: { phase: 'pre_fetch', new_expires_at: preRenew.newExpiresAt },
        });
      } else {
        // Lock já expirou antes do fetch — estado ambíguo, bloquear
        logProviderEvent({
          event: 'provider_lock_renewal_failed',
          provider: 'apibrasil',
          operation: 'veiculos-total',
          placa_normalizada: normalizedPlate,
          logical_request_id: logicalRequestId,
          physical_request_id: physicalRequestId,
          attempt_number: 1,
          timeout_ms: timeoutMs,
          duration_ms: 0,
          status: 'blocked',
          charge_status: 'not_sent',
          deployment_id: deploymentId,
          origem: source,
          extra: { phase: 'pre_fetch', reason: preRenew.reason },
        });

        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'blocked',
            chargeStatus: 'not_sent',
            finishedAt: new Date().toISOString(),
            providerErrorCode: 'LOCK_RENEWAL_FAILED_PRE_FETCH',
          },
          supabase,
        );

        throw new ProviderLockUnavailableError(
          'Falha na renovação do lock antes do envio. Consulta impedida para evitar duplicidade.',
        );
      }

      // 4. Antes de fetch, atualizar status = request_sent, charge_status = unknown, request_sent_at = now()
      const requestSentAtIso = new Date().toISOString();
      await updateProviderAttemptRecord(
        {
          id: attemptDbId,
          physicalRequestId,
          status: 'request_sent',
          chargeStatus: 'unknown',
          requestSentAt: requestSentAtIso,
        },
        supabase,
      );

      logProviderEvent({
        event: 'provider_request_sent',
        provider: 'apibrasil',
        operation: 'veiculos-total',
        placa_normalizada: normalizedPlate,
        logical_request_id: logicalRequestId,
        physical_request_id: physicalRequestId,
        attempt_number: 1,
        timeout_ms: timeoutMs,
        duration_ms: 0,
        status: 'request_sent',
        charge_status: 'unknown',
        deployment_id: deploymentId,
        origem: source,
      });

      console.log(
        `[API_BRASIL] 🚀 [Chamada Única] Disparando POST para API Brasil: ${config.apiBrasilBaseUrl}`,
      );
      console.log(
        `[API_BRASIL] ⏳ Aguardando retorno da API Brasil (Timeout: ${timeoutMs / 1000}s)...`,
      );

      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);
      const attemptStartTime = Date.now();
      let response: Response;
      let responseText: string;

      try {
        response = await fetch(config.apiBrasilBaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            tipo: 'veiculos-total',
            placa: normalizedPlate,
            homolog: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutTimer);
        const elapsedMs = Date.now() - attemptStartTime;

        responseText = await response.text();

        // BLOQUEADOR 4: Marcar response_received imediatamente
        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'response_received',
            chargeStatus: 'unknown',
            responseReceivedAt: new Date().toISOString(),
            durationMs: elapsedMs,
            httpStatus: response.status,
          },
          supabase,
        );

        logProviderEvent({
          event: 'provider_response_received',
          provider: 'apibrasil',
          operation: 'veiculos-total',
          placa_normalizada: normalizedPlate,
          logical_request_id: logicalRequestId,
          physical_request_id: physicalRequestId,
          attempt_number: 1,
          timeout_ms: timeoutMs,
          duration_ms: elapsedMs,
          status: 'response_received',
          charge_status: 'unknown',
          http_status: response.status,
          deployment_id: deploymentId,
          origem: source,
        });
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutTimer);
        const elapsedMs = Date.now() - attemptStartTime;
        const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError';

        // REGRA MANDATÓRIA: Em timeout ou erro de rede APÓS request_sent:
        // status = charge_status_unknown, charge_status = unknown e NÃO REPETIR!
        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'charge_status_unknown',
            chargeStatus: 'unknown',
            durationMs: elapsedMs,
            finishedAt: new Date().toISOString(),
            providerErrorCode: isAbort ? 'APIBRASIL_TIMEOUT' : 'APIBRASIL_NETWORK_ERROR',
            providerMessageSafe: isAbort
              ? `Tempo limite excedido após ${timeoutMs / 1000}s de espera.`
              : 'Falha de rede ou oscilação de conexão após envio da requisição.',
          },
          supabase,
        );

        logProviderEvent({
          event: 'provider_timeout_charge_unknown',
          provider: 'apibrasil',
          operation: 'veiculos-total',
          placa_normalizada: normalizedPlate,
          logical_request_id: logicalRequestId,
          physical_request_id: physicalRequestId,
          attempt_number: 1,
          timeout_ms: timeoutMs,
          duration_ms: elapsedMs,
          status: 'charge_status_unknown',
          charge_status: 'unknown',
          deployment_id: deploymentId,
          origem: source,
          extra: {
            is_abort: isAbort,
          },
        });

        throw new ChargeStatusUnknownError(
          `Tempo limite ou falha de comunicação (${elapsedMs}ms) após o envio da consulta à API Brasil. Para evitar cobrança duplicada de R$ 30, qualquer retentativa automática foi bloqueada. É necessária conferência manual ou confirmação explícita de reprocessamento.`,
          normalizedPlate,
          physicalRequestId,
          logicalRequestId,
        );
      }

      // =====================================================================
      // BLOQUEADOR 5: Renovar lock APÓS resposta, ANTES de persistência
      // =====================================================================
      const postRenew = await renewDistributedProviderLock(
        lockResult.lockKey,
        physicalRequestId,
        lockTtlSeconds,
        supabase,
      );
      if (postRenew.renewed) {
        logProviderEvent({
          event: 'provider_lock_renewed',
          provider: 'apibrasil',
          operation: 'veiculos-total',
          placa_normalizada: normalizedPlate,
          logical_request_id: logicalRequestId,
          physical_request_id: physicalRequestId,
          attempt_number: 1,
          timeout_ms: timeoutMs,
          duration_ms: 0,
          status: 'response_received',
          charge_status: 'unknown',
          deployment_id: deploymentId,
          origem: source,
          extra: { phase: 'post_response', new_expires_at: postRenew.newExpiresAt },
        });
      } else {
        // Lock expirou durante o fetch. A resposta foi recebida mas o lock não é nosso.
        // Marcar como charge_status_unknown e bloquear.
        logProviderEvent({
          event: 'provider_lock_renewal_failed',
          provider: 'apibrasil',
          operation: 'veiculos-total',
          placa_normalizada: normalizedPlate,
          logical_request_id: logicalRequestId,
          physical_request_id: physicalRequestId,
          attempt_number: 1,
          timeout_ms: timeoutMs,
          duration_ms: 0,
          status: 'charge_status_unknown',
          charge_status: 'unknown',
          deployment_id: deploymentId,
          origem: source,
          extra: { phase: 'post_response', reason: postRenew.reason },
        });

        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'charge_status_unknown',
            chargeStatus: 'unknown',
            finishedAt: new Date().toISOString(),
            providerErrorCode: 'LOCK_EXPIRED_AFTER_RESPONSE',
            providerMessageSafe: 'Lock expirou após resposta recebida. Cobrança desconhecida.',
          },
          supabase,
        );

        throw new ChargeStatusUnknownError(
          'O lock distribuído expirou após receber a resposta da API Brasil. Cobrança potencialmente duplicada. Reprocessamento manual necessário.',
          normalizedPlate,
          physicalRequestId,
          logicalRequestId,
        );
      }

      // Tratamento de respostas HTTP
      if (response.status === 401 || response.status === 403) {
        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'failed',
            chargeStatus: 'not_incurred',
            finishedAt: new Date().toISOString(),
            providerErrorCode: 'APIBRASIL_AUTH_ERROR',
            providerMessageSafe: `Erro de Autenticação (HTTP ${response.status}).`,
          },
          supabase,
        );
        throw new InvalidTokenError();
      }

      if (response.status === 402) {
        // BLOQUEADOR 8: Ser conservador — usar unknown se não há confirmação do fornecedor
        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'failed',
            chargeStatus: 'not_incurred',
            finishedAt: new Date().toISOString(),
            providerErrorCode: 'APIBRASIL_INSUFFICIENT_CREDITS',
            providerMessageSafe: 'Saldo insuficiente na API Brasil.',
          },
          supabase,
        );
        throw new InsufficientBalanceError(
          'Saldo insuficiente na conta da API Brasil para tarifar esta consulta.',
        );
      }

      // =====================================================================
      // BLOQUEADOR 8: HTTP 429 = cobrança potencialmente desconhecida
      // Zero retry, charge_status = unknown, manual review
      // =====================================================================
      if (response.status === 429) {
        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'charge_status_unknown',
            chargeStatus: 'unknown',
            finishedAt: new Date().toISOString(),
            providerErrorCode: 'APIBRASIL_RATE_LIMIT_CHARGE_UNKNOWN',
            providerMessageSafe: 'Rate limit (HTTP 429) — cobrança desconhecida.',
          },
          supabase,
        );

        logProviderEvent({
          event: 'provider_429_charge_unknown',
          provider: 'apibrasil',
          operation: 'veiculos-total',
          placa_normalizada: normalizedPlate,
          logical_request_id: logicalRequestId,
          physical_request_id: physicalRequestId,
          attempt_number: 1,
          timeout_ms: timeoutMs,
          duration_ms: 0,
          status: 'charge_status_unknown',
          charge_status: 'unknown',
          http_status: 429,
          deployment_id: deploymentId,
          origem: source,
        });

        throw new ChargeStatusUnknownError(
          'A API Brasil retornou HTTP 429 (rate limit). Até confirmação formal do fornecedor, a cobrança é considerada desconhecida. Reprocessamento manual necessário.',
          normalizedPlate,
          physicalRequestId,
          logicalRequestId,
        );
      }

      if ([500, 502, 503, 504].includes(response.status)) {
        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'charge_status_unknown',
            chargeStatus: 'unknown',
            finishedAt: new Date().toISOString(),
            providerErrorCode: 'APIBRASIL_SERVER_ERROR',
            providerMessageSafe: `Servidor da API Brasil retornou HTTP ${response.status}.`,
          },
          supabase,
        );
        throw new ChargeStatusUnknownError(
          `O gateway da API Brasil retornou HTTP ${response.status} após processamento. Cobrança desconhecida. Reenvio automático bloqueado.`,
          normalizedPlate,
          physicalRequestId,
          logicalRequestId,
        );
      }

      // Parse JSON
      let parsedJson: Record<string, unknown>;
      try {
        parsedJson = JSON.parse(responseText) as Record<string, unknown>;
      } catch (parseErr) {
        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'charge_status_unknown',
            chargeStatus: 'unknown',
            finishedAt: new Date().toISOString(),
            providerErrorCode: 'APIBRASIL_INVALID_RESPONSE',
            providerMessageSafe: 'Resposta da API Brasil não é um JSON válido.',
          },
          supabase,
        );
        throw new ChargeStatusUnknownError(
          'A resposta da API Brasil não pôde ser interpretada como JSON. Cobrança desconhecida. Reenvio automático bloqueado.',
          normalizedPlate,
          physicalRequestId,
          logicalRequestId,
        );
      }

      // Check balance / recharge in JSON body
      if (
        parsedJson.error === true &&
        (String(parsedJson.message || '').toLowerCase().includes('saldo') ||
          String(parsedJson.message || '').toLowerCase().includes('recarregue') ||
          parsedJson.recharge_url)
      ) {
        const balanceStr = typeof parsedJson.balance === 'string' ? parsedJson.balance : 'R$ 0,00';
        const rechargeUrl =
          typeof parsedJson.recharge_url === 'string'
            ? parsedJson.recharge_url
            : 'https://app.apibrasil.io/dashboard?modal=recharge';

        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'failed',
            chargeStatus: 'not_incurred',
            finishedAt: new Date().toISOString(),
            providerErrorCode: 'APIBRASIL_INSUFFICIENT_CREDITS',
            providerMessageSafe: String(parsedJson.message || 'Saldo insuficiente.'),
          },
          supabase,
        );

        throw new InsufficientBalanceError(
          String(parsedJson.message || 'Você não possui saldo suficiente para realizar essa consulta.'),
          balanceStr,
          rechargeUrl,
        );
      }

      if (parsedJson.error === true) {
        const errMsg = String(parsedJson.message || 'Erro ao processar consulta na API Brasil.');
        await updateProviderAttemptRecord(
          {
            id: attemptDbId,
            physicalRequestId,
            status: 'failed',
            chargeStatus: 'unknown',
            finishedAt: new Date().toISOString(),
            providerErrorCode: 'APIBRASIL_ERROR',
            providerMessageSafe: errMsg,
          },
          supabase,
        );

        if (errMsg.toLowerCase().includes('token') || errMsg.toLowerCase().includes('autentic')) {
          throw new InvalidTokenError(errMsg);
        }
        throw new Error(`API Brasil: ${errMsg}`);
      }

      // Sucesso na consulta — BLOQUEADOR 4: marcar charge_status como 'incurred'
      rawPayload = parsedJson;

      // Atualizar attempt para refletir cobrança incorrida
      await updateProviderAttemptRecord(
        {
          id: attemptDbId,
          physicalRequestId,
          chargeStatus: 'incurred',
        },
        supabase,
      );

      if (typeof rawPayload.balance === 'string') {
        const num = parseFloat(rawPayload.balance.replace(/[^\d,.-]/g, '').replace(',', '.'));
        balanceBefore = !isNaN(num) ? num : null;
      } else if (typeof rawPayload.balance === 'number') {
        balanceBefore = rawPayload.balance;
      }

      taxCharged = typeof rawPayload.tax === 'number' ? rawPayload.tax : defaultCostBrl;
      if (balanceBefore != null && taxCharged != null) {
        balanceAfter = balanceBefore - taxCharged;
      }
    } else {
      // Mock mode
      console.log(`[API_BRASIL] 🧪 Modo MOCK ativo. Carregando dados simulados para placa: "${normalizedPlate}"`);
      isMock = true;
      isChargeable = false;
      chargedAmount = 0.0;
      rawPayload = loadMockFixture(normalizedPlate);
    }

    // 5. Parse & Extract Summary Columns
    const parsedResponse = parseApiBrasilVehicleResponse(rawPayload);
    const summaryCols = extractDatabaseSummaryColumns(parsedResponse, rawPayload);

    // =====================================================================
    // 6. Persist to Database (vehicle_plate_consultations)
    // BLOQUEADOR 4: Se a persistência falhar após resposta bem-sucedida,
    // marcar manual_review e bloquear retry automático.
    // =====================================================================
    const insertPayload = {
      ...summaryCols,
      consultation_type: 'veiculos-total',
      provider: 'apibrasil',
      raw_response: rawPayload,
      response_schema_version: '1.0',
      status: executionStatus,
      mode: currentMode,
      is_mock: isMock,
      is_chargeable: isChargeable,
      charged_amount: chargedAmount,
      provider_balance_before: balanceBefore,
      provider_balance_after: balanceAfter,
      provider_tax: taxCharged,
      confirmation_at: new Date().toISOString(),
      confirmed_by: params.userId,
      confirmation_plate: params.confirmedPlate || formatBrazilianPlate(normalizedPlate),
      confirmation_message_version: params.confirmationMessageVersion || 'v1.0',
      motorcycle_id: params.motorcycleId || null,
      sell_request_id: params.sellRequestId || null,
      consulted_at: new Date().toISOString(),
      consulted_by: params.userId,
      pdf_generation_count: 0,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('vehicle_plate_consultations')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError || !inserted) {
      // =====================================================================
      // BLOQUEADOR 4: Persistência falhou APÓS resposta bem-sucedida da API
      // A cobrança já ocorreu. NÃO permitir retry automático.
      // =====================================================================
      console.error(`[API_BRASIL] ❌ BLOQUEADOR 4: Falha ao salvar consulta no Supabase após resposta bem-sucedida:`, insertError);

      await updateProviderAttemptRecord(
        {
          id: attemptDbId,
          physicalRequestId,
          status: 'manual_review',
          chargeStatus: isMock ? 'not_incurred' : 'incurred',
          finishedAt: new Date().toISOString(),
          providerErrorCode: 'DATABASE_PERSISTENCE_FAILED_AFTER_PROVIDER_SUCCESS',
          providerMessageSafe: `Falha ao salvar consulta: ${insertError?.message || 'unknown'}`,
        },
        supabase,
      );

      logProviderEvent({
        event: 'provider_response_persistence_failed',
        provider: 'apibrasil',
        operation: 'veiculos-total',
        placa_normalizada: normalizedPlate,
        logical_request_id: logicalRequestId,
        physical_request_id: physicalRequestId,
        attempt_number: 1,
        timeout_ms: timeoutMs,
        duration_ms: 0,
        status: 'manual_review',
        charge_status: isMock ? 'not_incurred' : 'incurred',
        deployment_id: deploymentId,
        origem: source,
        extra: {
          db_error_code: insertError?.code,
          db_error_message: insertError?.message,
        },
      });

      throw new ProviderPersistenceAfterSuccessError(
        `A consulta veicular foi processada e potencialmente cobrada (R$ ${chargedAmount.toFixed(2)}), mas houve falha ao salvar os dados localmente. Retentativa automática BLOQUEADA. Contate o suporte para reconciliação manual.`,
      );
    }

    // 7. Registrar custo em vehicle_lookup_provider_costs
    const actualCostCents = isMock
      ? 0
      : taxCharged != null
        ? Math.round(taxCharged * 100)
        : activeCostCents;

    const providerRef =
      typeof rawPayload.protocolo === 'string'
        ? rawPayload.protocolo
        : typeof rawPayload.protocol === 'string'
          ? rawPayload.protocol
          : null;

    try {
      await supabase.from('vehicle_lookup_provider_costs').insert({
        customer_consultation_id: params.customerConsultationId || null,
        vehicle_consultation_id: inserted.id,
        delivery_job_id: params.deliveryJobId || null,
        provider: 'apibrasil',
        provider_request_reference: providerRef,
        request_mode: currentMode,
        is_mock: isMock,
        charge_status: isMock ? 'not_applicable' : 'incurred',
        cost_snapshot_cents: isMock ? 0 : activeCostCents,
        actual_cost_cents: actualCostCents,
        currency: 'BRL',
        pricing_version_id:
          activePricingVersionId &&
          activePricingVersionId !== 'legacy-fallback' &&
          activePricingVersionId !== 'hard-fallback'
            ? activePricingVersionId
            : null,
        provider_http_status: 200,
        provider_balance_before: balanceBefore,
        provider_balance_after: balanceAfter,
        idempotency_key: `vpc_${inserted.id}`,
        incurred_at: isMock ? null : new Date().toISOString(),
      });
    } catch (costErr) {
      console.warn('[executeVehiclePlateLookup] Aviso ao registrar custo do provedor:', costErr);
    }

    // 8. Atualizar tentativa física para SUCCEEDED
    await updateProviderAttemptRecord(
      {
        id: attemptDbId,
        physicalRequestId,
        consultationId: inserted.id,
        status: 'succeeded',
        chargeStatus: isMock ? 'not_incurred' : 'incurred',
        finishedAt: new Date().toISOString(),
        actualCostCents,
        providerRequestReference: providerRef,
      },
      supabase,
    );

    return {
      success: executionStatus === 'COMPLETED',
      isCacheHit: false,
      record: inserted as VehicleConsultationRecord,
      message: isMock
        ? 'Consulta simulada executada com sucesso (Ambiente de Teste).'
        : 'Consulta oficial realizada com sucesso na API Brasil.',
    };
  } finally {
    // 9. LIBERAÇÃO OBRIGATÓRIA DO LOCK EM FINALLY
    await releaseDistributedProviderLock(lockResult.lockKey, physicalRequestId, supabase);
  }
}
