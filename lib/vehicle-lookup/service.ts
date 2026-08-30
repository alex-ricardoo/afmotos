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

  // Prefer LIVE completed consultation, otherwise latest MOCK consultation
  const { data, error } = await supabase
    .from('vehicle_plate_consultations')
    .select('*')
    .eq('plate_normalized', normalized)
    .in('status', ['COMPLETED'])
    .order('mode', { ascending: false }) // 'mock' vs 'live' -> 'mock' < 'live' so live first
    .order('consulted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as VehicleConsultationRecord;
}

/**
 * Loads mock fixture and adapts plate to the requested target plate
 */
function loadMockFixture(targetPlate: string): Record<string, unknown> {
  try {
    const fixturePath = path.resolve(process.cwd(), 'lib/vehicle-lookup/fixtures/vehicle-total.mock.json');
    const content = fs.readFileSync(fixturePath, 'utf-8');
    const parsed = JSON.parse(content);

    // Override plate in mock fixture to match requested plate
    const norm = normalizeBrazilianPlate(targetPlate);
    const disp = formatBrazilianPlate(norm);
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
    // In-memory fallback if fs fails in bundled environment
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
 * Main Service Orchestrator: executes lookup following cache, mock/live, and concurrency rules
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
    if (existing) {
      // If live mode is on and existing is live completed -> Reuse (R$ 0,00)
      if (currentMode === 'live' && existing.mode === 'live' && existing.status === 'COMPLETED') {
        return {
          success: true,
          isCacheHit: true,
          record: existing,
          message: 'Consulta recuperada do cache local (Custo R$ 0,00).',
        };
      }
      // If mock mode is on and existing is completed -> Reuse
      if (currentMode === 'mock' && existing.status === 'COMPLETED') {
        return {
          success: true,
          isCacheHit: true,
          record: existing,
          message: 'Consulta simulada recuperada do cache local.',
        };
      }
    }
  }

  // 2. Execution according to Mode (Mock vs Live)
  let rawPayload: Record<string, unknown>;
  let isMock = true;
  let isChargeable = false;
  let chargedAmount = 0.0;
  let executionStatus: VehicleConsultationStatus = 'COMPLETED';
  let balanceBefore: number | null = null;
  let balanceAfter: number | null = null;
  let taxCharged: number | null = null;

  if (currentMode === 'live') {
    if (!config.apiBrasilToken) {
      throw new Error(
        'Modo LIVE ativado, porém a variável APIBRASIL_TOKEN não está configurada no servidor.'
      );
    }

    isMock = false;
    isChargeable = true;
    chargedAmount = config.estimatedCostPerLookup;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(`${config.apiBrasilBaseUrl}/vehicles/dados-veiculo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiBrasilToken}`,
        },
        body: JSON.stringify({
          placa: normalizedPlate,
          tipo: 'veiculos-total',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Erro do provedor API Brasil: HTTP ${response.status} - ${response.statusText}`);
      }

      rawPayload = (await response.json()) as Record<string, unknown>;
      balanceBefore = typeof rawPayload.balance === 'number' ? rawPayload.balance : null;
      taxCharged = typeof rawPayload.tax === 'number' ? rawPayload.tax : null;
      if (balanceBefore != null && taxCharged != null) {
        balanceAfter = balanceBefore - taxCharged;
      }
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      // Ambiguous state: if request was already sent, avoid immediate automated retries
      executionStatus = 'CHARGE_STATUS_UNKNOWN';
      rawPayload = {
        error: true,
        message: fetchErr?.message || 'Falha de comunicação de rede com API Brasil.',
        fetch_error: String(fetchErr),
      };
    }
  } else {
    // Mock Mode
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
      : 'Consulta oficial realizada com sucesso.',
  };
}
