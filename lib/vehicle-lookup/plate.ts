/**
 * Brazilian License Plate normalization, formatting and validation
 * Supports:
 * - Legacy format: AAA-9999 / AAA9999
 * - Mercosul format: AAA9A99 / AAA-9A99
 */

const MERCUSOL_PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
const LEGACY_PLATE_REGEX = /^[A-Z]{3}[0-9]{4}$/;

/**
 * Normalizes any plate string into an uppercase alphanumeric-only format.
 * Example: 'abc-1234' -> 'ABC1234', 'bra-2e19' -> 'BRA2E19'
 */
export function normalizeBrazilianPlate(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
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
 * Mercosul: BRA2E19 or BRA-2E19 (Mercosul standard commonly displays as BRA2E19 or ABC-1D23)
 */
export function formatBrazilianPlate(value: string | null | undefined): string {
  const normalized = normalizeBrazilianPlate(value);
  if (normalized.length !== 7) return normalized;

  // If standard legacy format (3 letters + 4 numbers): format with hyphen
  if (LEGACY_PLATE_REGEX.test(normalized)) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }

  // If Mercosul format (3 letters + 1 digit + 1 letter/digit + 2 digits): format standard
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}

/**
 * Detects whether a valid plate is Mercosul or Legacy.
 */
export function getPlateType(value: string | null | undefined): 'mercosul' | 'legacy' | 'invalid' {
  const normalized = normalizeBrazilianPlate(value);
  if (LEGACY_PLATE_REGEX.test(normalized)) return 'legacy';
  if (MERCUSOL_PLATE_REGEX.test(normalized)) return 'mercosul';
  return 'invalid';
}
