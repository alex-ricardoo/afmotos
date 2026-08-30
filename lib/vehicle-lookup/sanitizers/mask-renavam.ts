/**
 * Masks Renavam displaying only the last 4 digits: *******1234
 */
export function maskRenavam(renavam: string | null | undefined): string {
  if (!renavam) return '***';
  const clean = renavam.trim();
  if (clean.length <= 4) return '***';
  return `*******${clean.slice(-4)}`;
}
