// ─────────────────────────────────────────────────────────────────────────────
// Debts Normalizer
//
// Normalizes debt data with source dates and staleness detection.
// Never classifies zero values as "quitado" without checking the source date.
// ─────────────────────────────────────────────────────────────────────────────

import type { DebtsSourceInfo } from './types.ts';
import { STALE_THRESHOLD_DAYS_DEFAULT } from './types.ts';
import { isSourceStale, parseBrazilianDate } from './availability-helpers.ts';

interface DebtsNormalizationResult {
  finesPending: number;
  ipvaPending: number;
  licensingPending: number;
  dpvatPending: number;
  municipalDebts: number;
  totalDebts: number;
  sourceInfo: DebtsSourceInfo;
  contextualLabel: string;
}

function parseDebtValue(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalizes debt data from the raw base estadual response.
 *
 * Rules:
 * 1. Always include the licensing year and last update date
 * 2. Flag when data is older than threshold
 * 3. Never say "Quitado" — say "Sem débitos informados na base consultada em [data]"
 * 4. Distinguish between "no debts" and "source didn't provide data"
 */
export function normalizeDebts(
  data: Record<string, any> | null,
  thresholdDays: number = STALE_THRESHOLD_DAYS_DEFAULT,
): DebtsNormalizationResult {
  const baseEstadual = data?.baseEstadual;

  // If no state base data at all
  if (!baseEstadual) {
    return {
      finesPending: 0,
      ipvaPending: 0,
      licensingPending: 0,
      dpvatPending: 0,
      municipalDebts: 0,
      totalDebts: 0,
      sourceInfo: {
        isStale: false,
        staleWarning: undefined,
      },
      contextualLabel: 'Base estadual não retornada pela fonte consultada',
    };
  }

  const finesPending = parseDebtValue(baseEstadual.debitoMultas);
  const ipvaPending = parseDebtValue(baseEstadual.debitoIpva);
  const licensingPending = parseDebtValue(baseEstadual.debitoLicenciamento);
  const dpvatPending = parseDebtValue(baseEstadual.debitoDpvat);
  const municipalDebts = parseDebtValue(baseEstadual.debitoMunicipais);
  const totalDebts = finesPending + ipvaPending + licensingPending + dpvatPending + municipalDebts;

  // Source date info
  const lastUpdateDate = baseEstadual.licdata || baseEstadual.dataEmissaoCrv || null;
  const licensingYear = baseEstadual.exercicioLicenciamento || null;
  const stale = isSourceStale(lastUpdateDate, thresholdDays);

  let staleWarning: string | undefined;
  if (stale && lastUpdateDate) {
    staleWarning = `Os dados de débitos são referentes à base atualizada em ${lastUpdateDate}. ` +
      `Recomenda-se consultar diretamente o DETRAN/Sefaz para informações mais atualizadas.`;
  }

  // Contextual label — never absolute
  let contextualLabel: string;
  if (totalDebts === 0) {
    if (lastUpdateDate) {
      contextualLabel = `Sem débitos informados na base consultada em ${lastUpdateDate}`;
      if (licensingYear) {
        contextualLabel += ` (exercício ${licensingYear})`;
      }
    } else {
      contextualLabel = 'Sem débitos informados na base consultada';
    }
  } else {
    const formatted = totalDebts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    contextualLabel = `Débitos identificados: ${formatted}`;
    if (lastUpdateDate) {
      contextualLabel += ` (referência: ${lastUpdateDate})`;
    }
  }

  return {
    finesPending,
    ipvaPending,
    licensingPending,
    dpvatPending,
    municipalDebts,
    totalDebts,
    sourceInfo: {
      licensingYear: licensingYear || undefined,
      lastUpdateDate: lastUpdateDate || undefined,
      isStale: stale,
      staleWarning,
    },
    contextualLabel,
  };
}
