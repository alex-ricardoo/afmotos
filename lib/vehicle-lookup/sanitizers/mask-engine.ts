/**
 * Masks Engine Number displaying only prefix and suffix: NC23E***5678
 */
export function maskEngine(engine: string | null | undefined): string {
  if (!engine) return '***';
  const clean = engine.trim().toUpperCase();
  if (clean.length <= 5) return '***';
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}
