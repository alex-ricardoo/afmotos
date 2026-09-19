// ─────────────────────────────────────────────────────────────────────────────
// Centralized helpers for resolving data availability from raw API responses.
// These ensure consistent handling of null, undefined, empty, and explicit
// "NADA CONSTA" values across the entire normalization pipeline.
// ─────────────────────────────────────────────────────────────────────────────

import type { DataAvailability } from './types.ts';

// ─── Emoji stripping ───────────────────────────────────────────────────────

const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

/**
 * Remove emojis from text. API Brasil sometimes returns emojis (😃) in
 * risk/sinister descriptions — these should never reach the PDF.
 */
export function stripEmojis(text: string): string {
  return text.replace(EMOJI_REGEX, '').trim();
}

// ─── Normalization helpers ──────────────────────────────────────────────────

/**
 * Normalize text for comparison: NFD, strip accents, uppercase, trim.
 */
export function normalizeForComparison(text: unknown): string {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

// ─── Explicit status detection ──────────────────────────────────────────────

const EXPLICIT_CLEAR_PATTERNS = [
  'NADA CONSTA',
  'NAO CONSTA',
  'NAO EXISTE',
  'SEM REGISTRO',
  'NAO INDICA',
  'VEICULO NAO INDICA',
];

/**
 * Returns true when the source *explicitly* returned "NADA CONSTA" or equivalent,
 * meaning the source confirmed absence — this is semantically different from null.
 */
export function isExplicitNadaConsta(text: unknown): boolean {
  if (typeof text !== 'string' || !text.trim()) return false;
  const norm = normalizeForComparison(text);
  return EXPLICIT_CLEAR_PATTERNS.some((pattern) => norm.includes(pattern));
}

/**
 * Returns true when the source explicitly returned a restriction/occurrence marker
 * (anything present and not a "clear" marker).
 */
export function isExplicitRestriction(text: unknown): boolean {
  if (typeof text !== 'string' || !text.trim()) return false;
  const norm = normalizeForComparison(text);
  if (!norm || norm === 'NAO' || norm === 'N') return false;
  return !EXPLICIT_CLEAR_PATTERNS.some((pattern) => norm.includes(pattern));
}

// ─── Placeholder detection ──────────────────────────────────────────────────

const PLACEHOLDER_DOCS = new Set([
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
  '00000000000000',
  '11111111111111',
  '00000000000100', // CNPJ placeholder variant
]);

/**
 * Detects placeholder/zeroed documents that should NOT be rendered as
 * visually valid CPF/CNPJ in the report.
 */
export function isPlaceholderDocument(doc: unknown): boolean {
  if (typeof doc !== 'string') return true;
  const clean = doc.replace(/\D/g, '');
  if (!clean || clean.length < 5) return true;
  return PLACEHOLDER_DOCS.has(clean);
}

// ─── Availability resolution ────────────────────────────────────────────────

/**
 * Central function to resolve the semantic availability of a field value.
 *
 * @param value - The raw value from the API
 * @param explicitText - The raw text from the API for status fields (e.g., "NADA CONSTA")
 * @param fieldSupported - Whether this field is supported by the current query product
 */
export function resolveAvailability(
  value: unknown,
  explicitText?: unknown,
  fieldSupported: boolean = true,
): DataAvailability {
  if (!fieldSupported) return 'not_available';

  // If there's explicit text, check it first
  if (explicitText != null && typeof explicitText === 'string' && explicitText.trim()) {
    if (isExplicitNadaConsta(explicitText)) return 'positive';
    if (isExplicitRestriction(explicitText)) return 'negative';
  }

  // For boolean fields
  if (typeof value === 'boolean') {
    return value ? 'negative' : 'positive';
  }

  // Null/undefined/empty means "not informed"
  if (value == null) return 'not_informed';
  if (typeof value === 'string' && !value.trim()) return 'not_informed';
  if (Array.isArray(value) && value.length === 0) return 'not_informed';

  // Has a value but no explicit text — treat as having data
  return 'negative';
}

// ─── Label formatting ───────────────────────────────────────────────────────

const AVAILABILITY_LABELS: Record<DataAvailability, string> = {
  positive: 'Sem apontamentos nas bases consultadas',
  negative: 'Apontamento identificado',
  not_informed: 'Não informado pela fonte',
  not_available: 'Não disponível nesta consulta',
  inconsistent: 'Divergência identificada entre fontes',
  historical: 'Registro histórico identificado',
};

/**
 * Returns a user-facing Portuguese label for a given availability status.
 */
export function formatAvailabilityLabel(availability: DataAvailability): string {
  return AVAILABILITY_LABELS[availability] || 'Situação indeterminada';
}

/**
 * Returns a safe label for display. Uses the explicit text if it's a clear
 * positive, otherwise uses the availability label.
 */
export function formatFieldStatus(
  availability: DataAvailability,
  explicitText?: string | null,
): string {
  if (availability === 'positive' && explicitText) {
    // Return a sanitized version of the explicit clear text
    return 'Sem apontamentos nas bases consultadas';
  }
  if (availability === 'negative' && explicitText) {
    return stripEmojis(explicitText);
  }
  return formatAvailabilityLabel(availability);
}

// ─── Source date helpers ────────────────────────────────────────────────────

/**
 * Extracts the most recent source update date from the raw data object.
 */
export function getSourceUpdateDate(data: Record<string, any> | null): string | null {
  if (!data) return null;
  return (
    data.dtUltimaAtualizacao ||
    data.baseEstadual?.licdata ||
    data.baseEstadual?.dataEmissaoCrv ||
    data.baseNacional?.dtUltimaAtualizacao ||
    null
  );
}

/**
 * Parses a Brazilian date string (DD/MM/YYYY) into a Date object.
 */
export function parseBrazilianDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Checks if a source date is stale (older than thresholdDays from today).
 */
export function isSourceStale(
  dateStr: string | null | undefined,
  thresholdDays: number = 90,
): boolean {
  const d = parseBrazilianDate(dateStr);
  if (!d) return false; // Cannot determine — don't raise false alarm
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}
