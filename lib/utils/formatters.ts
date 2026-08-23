/**
 * Utilitários puros de formatação e máscaras para AF Motos
 */

export function cleanNumeric(val: string | null | undefined): string {
  if (!val) return '';
  return val.replace(/\D/g, '');
}

export function cleanAlphaNumeric(val: string | null | undefined): string {
  if (!val) return '';
  return val.replace(/[^a-zA-Z0-9]/g, '');
}

export function formatCpf(val: string | null | undefined): string {
  const digits = cleanNumeric(val);
  return digits
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

export function formatCpfCnpj(val: string | null | undefined): string {
  return formatCpf(val);
}

export function formatPhone(val: string | null | undefined): string {
  const digits = cleanNumeric(val);
  if (!digits) return '';
  if (digits.length <= 10) {
    // (00) 0000-0000
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
      .slice(0, 14);
  }
  // (00) 00000-0000
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
    .slice(0, 15);
}

export function formatCep(val: string | null | undefined): string {
  const digits = cleanNumeric(val);
  return digits.replace(/^(\d{5})(\d{1,3})$/, '$1-$2').slice(0, 9);
}

export function formatRenavam(val: string | null | undefined): string {
  const digits = cleanNumeric(val);
  return digits.slice(0, 11);
}

export function formatChassi(val: string | null | undefined): string {
  if (!val) return '';
  return cleanAlphaNumeric(val).toUpperCase().slice(0, 17);
}

export function formatLicensePlate(val: string | null | undefined): string {
  if (!val) return '';
  const clean = cleanAlphaNumeric(val).toUpperCase();
  if (clean.length <= 7) {
    if (clean.length > 3) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    return clean;
  }
  return clean.slice(0, 8);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Se a string for no formato YYYY-MM-DD sem fuso horário, evita o offset UTC
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(year, month - 1, day));
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '-';
  }
}

export function formatKm(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0 km';
  return `${new Intl.NumberFormat('pt-BR').format(val)} km`;
}
