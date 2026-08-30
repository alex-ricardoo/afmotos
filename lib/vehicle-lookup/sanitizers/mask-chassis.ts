/**
 * Masks Chassis displaying only prefix and suffix: 9BW***1234
 */
export function maskChassis(chassis: string | null | undefined): string {
  if (!chassis) return '***';
  const clean = chassis.trim().toUpperCase();
  if (clean.length < 8) return '***';
  return `${clean.slice(0, 3)}******${clean.slice(-4)}`;
}
