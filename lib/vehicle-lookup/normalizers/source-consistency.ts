// ─────────────────────────────────────────────────────────────────────────────
// Source Consistency Normalizer
//
// Detects divergences between multiple data sources (nacional, estadual,
// emplacamento) and produces structured alerts — never classifying
// divergence as fraud or irregularity, only as "divergência cadastral".
// ─────────────────────────────────────────────────────────────────────────────

import type { SourceConsistencyEntry } from './types.ts';
import { normalizeForComparison } from './availability-helpers.ts';

/**
 * Normalize a location name for comparison — strips accents, uppercases,
 * removes common filler words, and trims.
 */
export function normalizeLocationForComparison(name: unknown): string {
  if (typeof name !== 'string' || !name.trim()) return '';
  let norm = normalizeForComparison(name);
  // Remove common prepositions/articles that differ between sources
  norm = norm.replace(/\b(DE|DO|DA|DOS|DAS|DI)\b/g, '').trim();
  // Collapse multiple spaces
  norm = norm.replace(/\s+/g, ' ');
  return norm;
}

/**
 * Returns true if two location names are semantically equivalent after normalization.
 */
function areLocationsEquivalent(a: string, b: string): boolean {
  const normA = normalizeLocationForComparison(a);
  const normB = normalizeLocationForComparison(b);
  if (!normA || !normB) return true; // If one is missing, no divergence
  return normA === normB;
}

export interface RawConsistencyData {
  cidade?: string;
  municipio?: string;
  municipioEmplacamento?: string;
  uf?: string;
  ufFaturado?: string;
  baseEstadual?: { municipio?: string; uf?: string };
  baseNacional?: { municipio?: string; uf?: string };
  [key: string]: unknown;
}

/**
 * Detects municipality divergence across emplacamento, base estadual,
 * and base nacional sources.
 *
 * Only generates an alert for REAL divergences — not when values are
 * equivalent after normalization or when a source is absent.
 */
export function detectMunicipioDivergence(
  data: RawConsistencyData | null,
): SourceConsistencyEntry | null {
  if (!data) return null;

  const raw = data;
  const defaultUf = (raw.uf || raw.baseEstadual?.uf || raw.baseNacional?.uf || '')
    .trim()
    .toUpperCase();
  const defaultUfSuffix = defaultUf ? `/${defaultUf}` : '';

  const municipioEmplacamento = raw.municipioEmplacamento || raw.cidade || raw.municipio;
  const municipioEstadual = raw.baseEstadual?.municipio;
  const municipioNacional = raw.baseNacional?.municipio;

  // Format with UF suffix if not present
  const formatCity = (city: string, specificUf?: string) => {
    const trimmed = city.trim();
    if (trimmed.includes('/')) return trimmed;
    const uf = specificUf ? specificUf.trim().toUpperCase() : defaultUf;
    return uf ? `${trimmed}${defaultUfSuffix}` : trimmed;
  };

  // Collect non-empty sources
  const sources: Array<{ source: string; value: string }> = [];
  if (
    municipioEmplacamento &&
    typeof municipioEmplacamento === 'string' &&
    municipioEmplacamento.trim()
  ) {
    sources.push({
      source: 'Município de emplacamento',
      value: formatCity(municipioEmplacamento, raw.uf),
    });
  }
  if (municipioEstadual && typeof municipioEstadual === 'string' && municipioEstadual.trim()) {
    sources.push({
      source: 'Município informado na base estadual',
      value: formatCity(municipioEstadual, raw.baseEstadual?.uf),
    });
  }
  if (municipioNacional && typeof municipioNacional === 'string' && municipioNacional.trim()) {
    sources.push({
      source: 'Município informado na base nacional',
      value: formatCity(municipioNacional, raw.baseNacional?.uf),
    });
  }

  if (sources.length < 2) return null; // Not enough sources to compare

  // Check all pairs for divergence using city name only
  let hasDivergence = false;
  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const cityOnlyI = sources[i].value.split('/')[0];
      const cityOnlyJ = sources[j].value.split('/')[0];
      if (!areLocationsEquivalent(cityOnlyI, cityOnlyJ)) {
        hasDivergence = true;
        break;
      }
    }
    if (hasDivergence) break;
  }

  if (!hasDivergence) return null;

  return {
    field: 'Município',
    sources,
    recommendation:
      'A divergência entre fontes não confirma irregularidade por si só. ' +
      'Recomenda-se conferir o CRLV-e e os dados atualizados no órgão de trânsito antes de concluir a negociação ou transferência.',
  };
}

/**
 * Detects UF divergence across sources.
 */
export function detectUfDivergence(
  data: RawConsistencyData | null,
): SourceConsistencyEntry | null {
  if (!data) return null;

  const raw = data;
  const ufRoot = raw.uf;
  const ufEstadual = raw.baseEstadual?.uf;
  const ufNacional = raw.baseNacional?.uf;
  const ufFaturado = raw.ufFaturado;

  const sources: Array<{ source: string; value: string }> = [];
  if (ufRoot && typeof ufRoot === 'string' && ufRoot.trim()) {
    sources.push({ source: 'UF principal', value: ufRoot.trim().toUpperCase() });
  }
  if (ufEstadual && typeof ufEstadual === 'string' && ufEstadual.trim()) {
    sources.push({ source: 'Base estadual', value: ufEstadual.trim().toUpperCase() });
  }
  if (ufNacional && typeof ufNacional === 'string' && ufNacional.trim()) {
    sources.push({ source: 'Base nacional', value: ufNacional.trim().toUpperCase() });
  }
  if (ufFaturado && typeof ufFaturado === 'string' && ufFaturado.trim() && ufFaturado !== '--') {
    sources.push({ source: 'UF de faturamento', value: ufFaturado.trim().toUpperCase() });
  }

  if (sources.length < 2) return null;

  const uniqueValues = new Set(sources.map((s) => s.value));
  if (uniqueValues.size <= 1) return null;

  return {
    field: 'UF',
    sources,
    recommendation:
      'Há divergência de UF entre fontes consultadas. ' +
      'Recomenda-se verificar junto ao DETRAN competente.',
  };
}

/**
 * Runs all consistency checks and returns an array of divergences found.
 * Returns empty array if everything is consistent.
 */
export function detectAllDivergences(
  data: RawConsistencyData | null,
): SourceConsistencyEntry[] {
  const results: SourceConsistencyEntry[] = [];

  const municipio = detectMunicipioDivergence(data);
  if (municipio) results.push(municipio);

  const uf = detectUfDivergence(data);
  if (uf) results.push(uf);

  return results;
}
