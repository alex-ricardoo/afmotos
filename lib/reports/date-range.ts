import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subYears,
  format,
  parseISO,
  differenceInDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReportDateRange, ReportPeriodPreset } from './types';

export const PERIOD_PRESETS: Array<{ id: ReportPeriodPreset; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'last_7_days', label: 'Últimos 7 dias' },
  { id: 'this_month', label: 'Este mês' },
  { id: 'last_month', label: 'Mês anterior' },
  { id: 'this_quarter', label: 'Este trimestre' },
  { id: 'last_3_months', label: 'Últimos 3 meses' },
  { id: 'this_semester', label: 'Este semestre' },
  { id: 'last_6_months', label: 'Últimos 6 meses' },
  { id: 'this_year', label: 'Este ano' },
  { id: 'last_12_months', label: 'Últimos 12 meses' },
  { id: 'custom', label: 'Personalizado' },
];

export function resolveDateRange(
  preset: ReportPeriodPreset = 'this_month',
  customStart?: string | null,
  customEnd?: string | null,
): ReportDateRange {
  const now = new Date();

  let start: Date;
  let end: Date;
  let label = 'Este mês';

  switch (preset) {
    case 'today':
      start = startOfDay(now);
      end = endOfDay(now);
      label = `Hoje (${format(now, 'dd/MM/yyyy', { locale: ptBR })})`;
      break;

    case 'last_7_days':
      start = startOfDay(subDays(now, 6));
      end = endOfDay(now);
      label = 'Últimos 7 dias';
      break;

    case 'last_month': {
      const prevMonth = subMonths(now, 1);
      start = startOfMonth(prevMonth);
      end = endOfMonth(prevMonth);
      label = format(start, 'MMMM yyyy', { locale: ptBR });
      label = label.charAt(0).toUpperCase() + label.slice(1);
      break;
    }

    case 'this_quarter':
      start = startOfQuarter(now);
      end = endOfDay(now);
      label = 'Este trimestre';
      break;

    case 'last_3_months':
      start = startOfDay(subMonths(now, 3));
      end = endOfDay(now);
      label = 'Últimos 3 meses';
      break;

    case 'this_semester': {
      const currentMonth = now.getMonth(); // 0-11
      const isSecondSemester = currentMonth >= 6;
      start = new Date(now.getFullYear(), isSecondSemester ? 6 : 0, 1);
      end = endOfDay(now);
      label = isSecondSemester ? `2º Semestre ${now.getFullYear()}` : `1º Semestre ${now.getFullYear()}`;
      break;
    }

    case 'last_6_months':
      start = startOfDay(subMonths(now, 6));
      end = endOfDay(now);
      label = 'Últimos 6 meses';
      break;

    case 'this_year':
      start = startOfYear(now);
      end = endOfDay(now);
      label = `Ano de ${now.getFullYear()}`;
      break;

    case 'last_12_months':
      start = startOfDay(subMonths(now, 12));
      end = endOfDay(now);
      label = 'Últimos 12 meses';
      break;

    case 'custom':
      if (customStart && customEnd) {
        try {
          start = startOfDay(parseISO(customStart));
          end = endOfDay(parseISO(customEnd));
          if (start > end) {
            start = startOfMonth(now);
            end = endOfDay(now);
          }
          label = `${format(start, 'dd/MM/yyyy')} a ${format(end, 'dd/MM/yyyy')}`;
        } catch {
          start = startOfMonth(now);
          end = endOfDay(now);
          label = 'Este mês';
        }
      } else {
        start = startOfMonth(now);
        end = endOfDay(now);
        label = 'Este mês';
      }
      break;

    case 'this_month':
    default:
      start = startOfMonth(now);
      end = endOfDay(now);
      label = format(start, 'MMMM yyyy', { locale: ptBR });
      label = label.charAt(0).toUpperCase() + label.slice(1);
      break;
  }

  // Calculate previous equivalent period
  const durationInDays = differenceInDays(end, start) + 1;
  const previousEnd = endOfDay(subDays(start, 1));
  const previousStart = startOfDay(subDays(previousEnd, durationInDays - 1));

  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    label,
    preset,
    previousStartDate: format(previousStart, 'yyyy-MM-dd'),
    previousEndDate: format(previousEnd, 'yyyy-MM-dd'),
  };
}

export function getPreviousPeriodRange(dateRange: ReportDateRange): ReportDateRange {
  if (dateRange.previousStartDate && dateRange.previousEndDate) {
    return {
      startDate: dateRange.previousStartDate,
      endDate: dateRange.previousEndDate,
      label: 'Período anterior',
      preset: dateRange.preset,
    };
  }

  const start = parseISO(dateRange.startDate);
  const end = parseISO(dateRange.endDate);
  const durationInDays = differenceInDays(end, start) + 1;
  const previousEnd = endOfDay(subDays(start, 1));
  const previousStart = startOfDay(subDays(previousEnd, durationInDays - 1));

  return {
    startDate: format(previousStart, 'yyyy-MM-dd'),
    endDate: format(previousEnd, 'yyyy-MM-dd'),
    label: 'Período anterior',
    preset: dateRange.preset,
  };
}

