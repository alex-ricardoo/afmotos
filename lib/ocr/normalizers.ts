/**
 * Utilitários de normalização e sanitização de dados veiculares extraídos de documentos.
 */

export function normalizePlate(val?: string | null): string {
  if (!val) return '';
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length === 7) {
    // Se for formato antigo (ex: ABC1234), podemos formatar como ABC-1234
    // Se for Mercosul (ex: ABC1D23), mantém direto ABC1D23
    const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(clean);
    if (isMercosul) {
      return clean;
    }
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}

export function normalizeRenavam(val?: string | null): string {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  // Preserva zeros à esquerda, limitando a 11 dígitos
  return digits.slice(0, 11);
}

export function normalizeChassi(val?: string | null): string {
  if (!val) return '';
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.slice(0, 17);
}

export function normalizeYear(val?: number | string | null): number | null {
  if (!val) return null;
  const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : Math.floor(val);
  const currentYear = new Date().getFullYear();
  if (isNaN(num) || num < 1900 || num > currentYear + 2) {
    return null;
  }
  return num;
}

export function normalizeEngineCapacity(val?: number | string | null): number | null {
  if (!val) return null;
  const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : Math.floor(val);
  if (isNaN(num) || num <= 0 || num > 3000) {
    return null;
  }
  return num;
}

export function normalizeFuel(
  val?: string | null,
): 'gasolina' | 'etanol' | 'flex' | 'eletrico' | 'diesel' | null {
  if (!val) return null;
  const lower = val.toLowerCase().trim();
  if (
    lower.includes('flex') ||
    (lower.includes('gas') && lower.includes('alc')) ||
    (lower.includes('gas') && lower.includes('etan'))
  ) {
    return 'flex';
  }
  if (lower.includes('etan') || lower.includes('alcool') || lower.includes('álcool')) {
    return 'etanol';
  }
  if (lower.includes('elet') || lower.includes('elét')) {
    return 'eletrico';
  }
  if (lower.includes('diesel')) {
    return 'diesel';
  }
  if (lower.includes('gas')) {
    return 'gasolina';
  }
  return null;
}

export function normalizeText(val?: string | null): string {
  if (!val) return '';
  return val.trim().replace(/\s+/g, ' ');
}
