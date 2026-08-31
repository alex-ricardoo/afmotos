/**
 * Brazilian License Plate normalization, formatting and validation
 * Supports:
 * - Legacy format: AAA-9999 / AAA9999 (Placa Cinza)
 * - Mercosul format: AAA9A99 / AAA-9A99 (Placa Mercosul)
 */

export const MERCUSOL_PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
export const LEGACY_PLATE_REGEX = /^[A-Z]{3}[0-9]{4}$/;

/**
 * Normalizes any plate string into an uppercase alphanumeric-only format.
 * Example: 'abc-1234' -> 'ABC1234', 'bra-2e19' -> 'BRA2E19'
 */
export function normalizeBrazilianPlate(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7)
    .trim();
}

/**
 * Validates if the normalized string matches Brazilian plate patterns (Mercosul or Legacy).
 */
export function isValidBrazilianPlate(value: string | null | undefined): boolean {
  const normalized = normalizeBrazilianPlate(value);
  if (normalized.length !== 7) return false;
  return LEGACY_PLATE_REGEX.test(normalized) || MERCUSOL_PLATE_REGEX.test(normalized);
}

/**
 * Formats a normalized plate for visual presentation.
 * Legacy: ABC-1234
 * Mercosul: BRA2E19 (Mercosul official standard has no hyphen)
 */
export function formatBrazilianPlate(value: string | null | undefined): string {
  const normalized = normalizeBrazilianPlate(value);
  if (normalized.length !== 7) return normalized;

  // Legacy format (3 letters + 4 numbers): format with hyphen ABC-1234
  if (LEGACY_PLATE_REGEX.test(normalized)) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }

  // Mercosul format (3 letters + 1 digit + 1 letter + 2 digits): format without hyphen
  return normalized;
}

/**
 * Detects whether a plate string is Mercosul, Legacy (Cinza) or Neutral/Partial.
 */
export function getPlateType(value: string | null | undefined): 'mercosul' | 'legacy' | 'neutral' {
  const normalized = normalizeBrazilianPlate(value);
  if (!normalized) return 'neutral';

  if (MERCUSOL_PLATE_REGEX.test(normalized)) return 'mercosul';
  if (LEGACY_PLATE_REGEX.test(normalized)) return 'legacy';

  // Partial detection while typing (must start with 3 letters)
  if (/^[A-Z]{3}[0-9][A-Z]/.test(normalized)) return 'mercosul';
  if (/^[A-Z]{3}[0-9]{2}/.test(normalized)) return 'legacy';

  return 'neutral';
}
