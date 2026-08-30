import { cleanNumeric, formatCpf, formatPhone, formatCep } from './formatters';

export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  let digits = cleanNumeric(raw);
  // Se vier com DDI 55 no início e tiver 12 ou 13 dígitos, remove o 55
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  return digits;
}

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeCpf(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = cleanNumeric(raw);
  return digits.length === 11 ? digits : digits.length > 0 ? digits : null;
}

export function isValidCpf(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const cpf = cleanNumeric(raw);
  return cpf.length === 11;
}

export function maskCpf(raw: string | null | undefined): string {
  if (!raw) return '-';
  const cpf = cleanNumeric(raw);
  if (cpf.length === 11) {
    return `***.***.${cpf.substring(6, 9)}-${cpf.substring(9, 11)}`;
  }
  return formatCpf(raw);
}

export { formatCpf, formatPhone, formatCep, cleanNumeric };
