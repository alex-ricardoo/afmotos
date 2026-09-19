/**
 * Masks financial contract numbers, gravame identifiers, and account keys.
 * Never exposes raw internal financial identification numbers in public reports.
 */
export function maskFinancialIdentifier(identifier: string | null | undefined): string {
  if (!identifier) return 'Dado não informado';
  const clean = identifier.trim();
  if (!clean || clean === 'N/A' || clean === 'N/I' || clean === '0') {
    return 'Dado não informado';
  }
  if (clean.length <= 4) {
    return '****';
  }
  return `${clean.slice(0, 2)}******${clean.slice(-2)}`;
}
