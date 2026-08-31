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
        'Token da API Brasil expirado ou inválido. Acesse a tela de credenciais na API Brasil (https://app.apibrasil.io), gere um novo token, configure a variável de ambiente APIBRASIL_TOKEN na Vercel ou entre em contato com o desenvolvedor Alex.'
    );
    this.name = 'InvalidTokenError';
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
}

export interface LookupExecutionResult {
  success: boolean;
  isCacheHit: boolean;
  record: VehicleConsultationRecord;
  message?: string;
}

/**
 * Checks if an existing completed consultation exists in the database for the given plate.
 */
export async function findExistingConsultation(
  plate: string,
  supabase: SupabaseClient
): Promise<VehicleConsultationRecord | null> {
  const normalized = normalizeBrazilianPlate(plate);
  if (!normalized) return null;

  // Prefer LIVE completed consultation, otherwise latest consultation
  const { data, error } = await supabase
    .from('vehicle_plate_consultations')
    .select('*')
    .eq('plate_normalized', normalized)
    .in('status', ['COMPLETED'])
    .order('mode', { ascending: false }) // 'live' first
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
    const fixturePath = path.resolve(process.cwd(), 'lib/vehicle-lookup/fixtures/vehicle-total.mock.json');
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
      },
    };
  }
}

/**
 * Main Service Orchestrator: executes lookup following cache, live API, and error rules
 */
export async function executeVehiclePlateLookup(
  params: ExecuteLookupParams,
  supabase: SupabaseClient
): Promise<LookupExecutionResult> {
  const normalizedPlate = normalizeBrazilianPlate(params.plate);

  if (!isValidBrazilianPlate(normalizedPlate)) {
    throw new Error(`Placa inválida: "${params.plate}". Informe uma placa válida no formato antigo ou Mercosul.`);
  }

  const config = getVehicleLookupConfig();
  const currentMode: VehicleLookupMode = config.mode;

  // 1. Cache-first check (unless forceRefresh is explicitly requested)
  if (!params.forceRefresh) {
    const existing = await findExistingConsultation(normalizedPlate, supabase);
    if (existing && existing.status === 'COMPLETED') {
      return {
        success: true,
        isCacheHit: true,
        record: existing,
        message: 'Consulta recuperada do cache local (Custo R$ 0,00).',
      };
    }
  }

  // 2. Execution according to Mode (Live API vs Mock)
  let rawPayload: Record<string, unknown>;
  let isMock = false;
  let isChargeable = true;
  let chargedAmount = config.estimatedCostPerLookup; // R$ 30,00
  let executionStatus: VehicleConsultationStatus = 'COMPLETED';
  let balanceBefore: number | null = null;
  let balanceAfter: number | null = null;
  let taxCharged: number | null = null;

  if (currentMode === 'live') {
    if (!config.apiBrasilToken) {
      throw new InvalidTokenError(
        'Token da API Brasil não configurado. Por favor, configure a variável de ambiente APIBRASIL_TOKEN com o token obtido em https://app.apibrasil.io ou entre em contato com o desenvolvedor Alex.'
      );
    }

    isMock = false;
    isChargeable = true;
    chargedAmount = config.estimatedCostPerLookup;

    const rawToken = config.apiBrasilToken.trim();
    const cleanToken = rawToken.replace(/^Bearer\s+/i, '');
    const authHeader = `Bearer ${cleanToken}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(config.apiBrasilBaseUrl, {
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

      clearTimeout(timeout);

      // Handle Authentication & Authorization errors
      if (response.status === 401 || response.status === 403) {
        throw new InvalidTokenError();
      }

      const responseText = await response.text();
      try {
        rawPayload = JSON.parse(responseText) as Record<string, unknown>;
      } catch (parseErr) {
        throw new Error(`Resposta inválida recebida da API Brasil (HTTP ${response.status}): ${responseText.slice(0, 200)}`);
      }

      // Check for Insufficient Balance (Saldo Insuficiente)
      if (
        rawPayload.error === true &&
        (String(rawPayload.message || '').toLowerCase().includes('saldo') ||
          String(rawPayload.message || '').toLowerCase().includes('recarregue') ||
          rawPayload.recharge_url)
      ) {
        const balanceStr = typeof rawPayload.balance === 'string' ? rawPayload.balance : 'R$ 0,00';
        const rechargeUrl =
          typeof rawPayload.recharge_url === 'string'
            ? rawPayload.recharge_url
            : 'https://app.apibrasil.io/dashboard?modal=recharge';

        throw new InsufficientBalanceError(
          String(rawPayload.message || 'Você não possui saldo suficiente para realizar essa consulta.'),
          balanceStr,
          rechargeUrl
        );
      }

      // Check for other API errors
      if (rawPayload.error === true) {
        const errMsg = String(rawPayload.message || 'Erro ao processar consulta na API Brasil.');
        if (errMsg.toLowerCase().includes('token') || errMsg.toLowerCase().includes('autentic')) {
          throw new InvalidTokenError(errMsg);
        }
        throw new Error(`API Brasil: ${errMsg}`);
      }

      // Track balances if provided
      if (typeof rawPayload.balance === 'string') {
        const num = parseFloat(rawPayload.balance.replace(/[^\d,.-]/g, '').replace(',', '.'));
        balanceBefore = !isNaN(num) ? num : null;
      } else if (typeof rawPayload.balance === 'number') {
        balanceBefore = rawPayload.balance;
      }

      taxCharged = typeof rawPayload.tax === 'number' ? rawPayload.tax : 30.0;
      if (balanceBefore != null && taxCharged != null) {
        balanceAfter = balanceBefore - taxCharged;
      }
    } catch (fetchErr: any) {
      clearTimeout(timeout);

      // Re-throw our specific custom domain errors
      if (fetchErr instanceof InsufficientBalanceError || fetchErr instanceof InvalidTokenError) {
        throw fetchErr;
      }

      if (fetchErr.name === 'AbortError') {
        throw new Error('A consulta na API Brasil excedeu o tempo limite de 120 segundos. Tente novamente.');
      }

      executionStatus = 'CHARGE_STATUS_UNKNOWN';
      rawPayload = {
        error: true,
        message: fetchErr?.message || 'Falha de comunicação com gateway da API Brasil.',
        fetch_error: String(fetchErr),
      };
      throw fetchErr;
    }
  } else {
    // Mock Mode (Ambiente de desenvolvimento sem token)
    isMock = true;
    isChargeable = false;
    chargedAmount = 0.0;
    rawPayload = loadMockFixture(normalizedPlate);
  }

  // 3. Parse & Extract Summary Columns
  const parsedResponse = parseApiBrasilVehicleResponse(rawPayload);
  const summaryCols = extractDatabaseSummaryColumns(parsedResponse, rawPayload);

  // 4. Persist to Database
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
    throw new Error(`Erro ao salvar histórico veicular no banco de dados: ${insertError?.message}`);
  }

  return {
    success: executionStatus === 'COMPLETED',
    isCacheHit: false,
    record: inserted as VehicleConsultationRecord,
    message: isMock
      ? 'Consulta simulada executada com sucesso (Ambiente de Teste).'
      : 'Consulta oficial realizada com sucesso na API Brasil.',
  };
}
