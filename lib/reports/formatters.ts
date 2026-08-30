import { MetricConfidence } from './types';

export function formatCurrencyBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrencyBRL(value: number | null | undefined): string {
  if (!value || isNaN(value)) return 'R$ 0';
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}k`;
  }
  return `R$ ${Math.round(value)}`;
}

export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatReportDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(d);
  } catch {
    return dateStr;
  }
}

export function getConfidenceBadgeProps(confidence: MetricConfidence): {
  label: string;
  variant: 'emerald' | 'amber' | 'zinc';
  description: string;
} {
  switch (confidence) {
    case 'confirmed':
      return {
        label: 'Confirmado',
        variant: 'emerald',
        description: 'Calculado sobre lançamentos finalizados e comprovados no sistema.',
      };
    case 'estimated':
      return {
        label: 'Estimado',
        variant: 'amber',
        description: 'Aproximação baseada em dados operacionais disponíveis.',
      };
    case 'unavailable':
    default:
      return {
        label: 'Indisponível',
        variant: 'zinc',
        description: 'Dados insuficientes no momento para apuração confiável.',
      };
  }
}
