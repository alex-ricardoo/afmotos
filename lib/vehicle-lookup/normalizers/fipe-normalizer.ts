// ─────────────────────────────────────────────────────────────────────────────
// FIPE Normalizer
//
// Handles multiple FIPE references: selects a primary, preserves alternatives,
// and adds appropriate disclaimers. Never invents a version or treats FIPE
// as sale price.
// ─────────────────────────────────────────────────────────────────────────────

import type { FipeReferenceNormalized, FipeSingleReference } from './types.ts';
import { FIPE_MARKET_DISCLAIMER } from './types.ts';
import { normalizeForComparison } from './availability-helpers.ts';

interface RawFipeInfo {
  fipeId?: string;
  codigoFipe?: string;
  codigo?: string;
  marca?: string;
  modelo?: string;
  versao?: string;
  descricao?: string;
  valorAtual?: string | number;
  preco?: string | number;
  valor?: string | number;
  combustivel?: string;
  ano?: string | number;
  historicoPreco?: Array<{
    ano?: string | number;
    mes?: string | number;
    valor?: string | number;
    predicao?: boolean;
  }>;
}

interface RawInfoGeral {
  fipeId?: string;
  marca?: string;
  modelo?: string;
  versao?: string;
  idVersao?: string;
}

interface RawFipeCode {
  codigo?: string;
  valorZeroKM?: string | number;
}

export interface RawFipePayload {
  dadosBasicosDoVeiculo?: {
    descricao?: string;
    marca?: string;
    informacoesFipe?: RawFipeInfo[];
    informacoesGerais?: RawInfoGeral[];
  };
  revisao?: {
    veiculosFipe?: RawFipeInfo[];
  };
  decodificadorPrecificador?: {
    veiculosFipe?: RawFipeInfo[];
    codigoFipe?: string;
    codigo?: string;
    modelo?: string;
    versao?: string;
    descricao?: string;
    preco?: string | number;
    valor?: string | number;
    combustivel?: string;
  };
  codigoFipe?: RawFipeCode[];
  fipe?: {
    codigo_fipe?: string;
    codigo?: string;
    modelo?: string;
    versao?: string;
    valor_atual?: string | number;
    preco?: string | number;
    combustivel?: string;
  };
  marcaModelo?: string;
  [key: string]: unknown;
}

function parseFipePrice(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  const str = String(val)
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Computes a matching score between a vehicle description and a FIPE version string.
 * Higher score = better match.
 */
function computeVersionMatchScore(
  vehicleDescription: string,
  vehicleBrand: string,
  fipeVersion: string,
): number {
  const normVehicle = normalizeForComparison(vehicleDescription);
  const normBrand = normalizeForComparison(vehicleBrand);
  const normFipe = normalizeForComparison(fipeVersion);

  if (!normFipe) return 0;

  let score = 0;

  // Exact match in description
  if (normFipe.includes(normVehicle) || normVehicle.includes(normFipe)) {
    score += 10;
  }

  // Brand match
  if (normFipe.includes(normBrand)) {
    score += 3;
  }

  // Word-level overlap
  const vehicleWords = normVehicle.split(/\s+/).filter((w) => w.length > 2);
  const fipeWords = normFipe.split(/\s+/).filter((w) => w.length > 2);
  for (const vw of vehicleWords) {
    if (fipeWords.some((fw) => fw.includes(vw) || vw.includes(fw))) {
      score += 2;
    }
  }

  return score;
}

/**
 * Normalizes FIPE references from raw payload with the following priorities:
 * 1. Prioritize exact match of year/model/brand/description
 * 2. Prioritize version with highest textual match
 * 3. If uncertain, don't hide alternatives
 * 4. Never invent a version
 * 5. Never treat FIPE as sale price
 */
export function normalizeFipeReferences(
  data: RawFipePayload | Record<string, unknown> | null,
): FipeReferenceNormalized {
  const empty: FipeReferenceNormalized = {
    primary: null,
    alternatives: [],
    selectionNote: 'Referência FIPE não disponível para este veículo.',
    marketDisclaimer: FIPE_MARKET_DISCLAIMER,
    priceHistory: [],
  };

  if (!data) return empty;

  const raw = data as RawFipePayload;
  const fipeInfoList: RawFipeInfo[] = [];

  if (Array.isArray(raw.dadosBasicosDoVeiculo?.informacoesFipe)) {
    fipeInfoList.push(...raw.dadosBasicosDoVeiculo.informacoesFipe);
  }

  // Also check revisao.veiculosFipe
  if (Array.isArray(raw.revisao?.veiculosFipe)) {
    for (const vf of raw.revisao.veiculosFipe) {
      const fipeId = vf.codigoFipe || vf.codigo || vf.fipeId;
      if (fipeId && !fipeInfoList.some((existing) => existing.fipeId === fipeId)) {
        fipeInfoList.push({
          fipeId,
          modelo: vf.modelo,
          versao: vf.versao || vf.descricao,
          valorAtual: vf.preco || vf.valor || vf.valorAtual,
          combustivel: vf.combustivel,
        });
      }
    }
  }

  // Also check decodificadorPrecificador.veiculosFipe
  if (Array.isArray(raw.decodificadorPrecificador?.veiculosFipe)) {
    for (const vf of raw.decodificadorPrecificador.veiculosFipe) {
      const fipeId = vf.codigoFipe || vf.codigo || vf.fipeId;
      if (fipeId && !fipeInfoList.some((existing) => existing.fipeId === fipeId)) {
        fipeInfoList.push({
          fipeId,
          modelo: vf.modelo,
          versao: vf.versao || vf.descricao,
          valorAtual: vf.preco || vf.valor || vf.valorAtual,
          combustivel: vf.combustivel,
        });
      }
    }
  } else if (fipeInfoList.length === 0 && raw.decodificadorPrecificador) {
    const dp = raw.decodificadorPrecificador;
    fipeInfoList.push({
      fipeId: dp.codigoFipe || dp.codigo,
      modelo: dp.modelo,
      versao: dp.versao || dp.descricao,
      valorAtual: dp.preco || dp.valor,
      combustivel: dp.combustivel,
    });
  }

  const infoGerais: RawInfoGeral[] = raw.dadosBasicosDoVeiculo?.informacoesGerais || [];

  // Also check d.fipe for alternate API format
  if (fipeInfoList.length === 0 && raw.fipe) {
    const alt = raw.fipe;
    fipeInfoList.push({
      fipeId: alt.codigo_fipe || alt.codigo,
      modelo: alt.modelo,
      versao: alt.versao,
      valorAtual: alt.valor_atual || alt.preco,
      combustivel: alt.combustivel,
    });
  }

  const fipeCodeList: RawFipeCode[] = Array.isArray(raw.codigoFipe) ? raw.codigoFipe : [];

  if (fipeInfoList.length === 0) {
    // Try to build from codigoFipe array alone
    if (fipeCodeList.length > 0) {
      const refs: FipeSingleReference[] = fipeCodeList.map((fc) => ({
        code: fc.codigo || 'N/I',
        version: 'Versão não detalhada',
        price: parseFipePrice(fc.valorZeroKM),
        fuel: undefined,
      }));

      return {
        primary: refs[0] || null,
        alternatives: refs.slice(1),
        hasMultipleReferences: refs.length > 1,
        selectionNote:
          refs.length > 1
            ? 'Referência principal sugerida com base nos dados cadastrais disponíveis. Há outras referências compatíveis.'
            : 'Referência única identificada.',
        marketDisclaimer: FIPE_MARKET_DISCLAIMER,
        priceHistory: [],
      };
    }

    return empty;
  }

  // Build references from informacoesFipe
  const rawVeh = raw.dadosBasicosDoVeiculo;
  const vehicleDesc =
    rawVeh?.descricao ||
    (typeof raw.marcaModelo === 'string' ? raw.marcaModelo.split('/')?.[1] : '') ||
    '';
  const vehicleBrand =
    rawVeh?.marca ||
    (typeof raw.marcaModelo === 'string' ? raw.marcaModelo.split('/')?.[0] : '') ||
    '';

  const allRefs: Array<
    FipeSingleReference & { score: number; historyData?: Array<Record<string, unknown>> }
  > = fipeInfoList.map((fi) => {
    const fullVersion = `${fi.modelo || ''} ${fi.versao || ''}`.trim();
    const score = computeVersionMatchScore(vehicleDesc, vehicleBrand, fullVersion);

    return {
      code: fi.fipeId || 'N/I',
      version: fullVersion || 'Versão não especificada',
      price: parseFipePrice(fi.valorAtual),
      fuel: fi.combustivel || undefined,
      referenceMonth: undefined,
      score,
      historyData: fi.historicoPreco as Array<Record<string, unknown>> | undefined,
    };
  });

  // Enrich with informacoesGerais (more detailed version names)
  if (infoGerais.length > 0) {
    for (const ref of allRefs) {
      const match = infoGerais.find((ig) => ig.fipeId === ref.code);
      if (match && match.versao) {
        const detailedVersion = `${match.modelo || ''} ${match.versao || ''}`.trim();
        if (detailedVersion.length > ref.version.length) {
          ref.version = detailedVersion;
        }
      }
    }
  }

  // Sort by score descending, then by price
  allRefs.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.price - a.price;
  });

  const primary = allRefs[0] || null;
  const alternatives = allRefs.slice(1).map((r) => ({
    code: r.code,
    version: r.version,
    price: r.price,
    fuel: r.fuel,
    referenceMonth: r.referenceMonth,
  }));

  // Extract price history from primary
  const priceHistory: Array<{ reference: string; price: number }> = [];
  if (primary?.historyData && Array.isArray(primary.historyData)) {
    for (const h of primary.historyData) {
      if (h.ano && h.mes && h.valor) {
        priceHistory.push({
          reference: `${h.mes}/${h.ano}`,
          price: parseFipePrice(h.valor),
        });
      }
    }
  }

  // Clean primary (remove internal fields)
  const cleanPrimary: FipeSingleReference | null = primary
    ? { code: primary.code, version: primary.version, price: primary.price, fuel: primary.fuel }
    : null;

  // Build selection note
  let selectionNote: string;
  if (allRefs.length === 1) {
    selectionNote = 'Referência única identificada para este veículo.';
  } else if (primary && primary.score >= 10) {
    selectionNote =
      'Referência principal selecionada por correspondência com os dados cadastrais do veículo.';
  } else {
    selectionNote =
      'Referência principal sugerida com base nos dados cadastrais disponíveis. ' +
      'Há outras referências compatíveis — confirme a versão exata do veículo.';
  }

  return {
    primary: cleanPrimary,
    alternatives,
    hasMultipleReferences: alternatives.length > 0,
    selectionNote,
    marketDisclaimer: FIPE_MARKET_DISCLAIMER,
    priceHistory,
  };
}
