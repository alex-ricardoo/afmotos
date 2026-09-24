import type { WarrantyInfo, WarrantyStatus } from './types.ts';

/**
 * Retorna a data calendário (ano, mês 1-12, dia 1-31) no fuso horário 'America/Sao_Paulo'.
 */
export function getSaoPauloCalendarParts(dateInput: Date | string): {
  year: number;
  month: number;
  day: number;
} {
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(dateObj.getTime())) {
    throw new Error(`Data inválida fornecida para cálculo de garantia: ${dateInput}`);
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(dateObj);
  const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10);
  const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10);

  return { year, month, day };
}

/**
 * Calcula a data final inclusiva da garantia por adição de meses-calendário.
 * Respeita finais de mês (ex: 31/08 + 3 meses = 30/11; 30/11 + 3 meses = 28/02 ou 29/02).
 * Retorna string no formato 'YYYY-MM-DD'.
 */
export function calculateWarrantyEndDate(
  issuedAt: Date | string,
  months: number = 3,
): string {
  if (months <= 0 || months > 60) {
    throw new Error(`Prazo de garantia em meses inválido: ${months}. Deve ser entre 1 e 60.`);
  }

  const { year, month, day } = getSaoPauloCalendarParts(issuedAt);

  const totalMonths = month - 1 + months;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1; // 1 to 12

  // Último dia do mês alvo (passando 0 como dia para o mês seguinte)
  const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(day, daysInTargetMonth);

  const yyyy = String(targetYear).padStart(4, '0');
  const mm = String(targetMonth).padStart(2, '0');
  const dd = String(targetDay).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Converte 'YYYY-MM-DD' para 'DD/MM/AAAA'
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Diferença em dias de calendário entre duas datas (endDate - startDate).
 */
export function calculateCalendarDaysDifference(
  startDateStr: string,
  endDateStr: string,
): number {
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);

  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((endUtc - startUtc) / msPerDay);
}

export interface SaleWarrantyInput {
  is_repasse?: boolean | null;
  warranty_issued_at?: string | null;
  warranty_ends_at?: string | null;
  warranty_months?: number | null;
}

/**
 * Deriva todas as informações operacionais e visuais de garantia comercial da venda.
 */
export function getWarrantyInfo(
  sale: SaleWarrantyInput,
  referenceDateInput?: Date | string,
): WarrantyInfo {
  const isRepasse = Boolean(sale.is_repasse);
  const months = sale.warranty_months && sale.warranty_months > 0 ? sale.warranty_months : 3;

  if (isRepasse) {
    return {
      status: 'NO_WARRANTY',
      label: 'Sem garantia (Repasse)',
      badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      badgeBorderClass: 'border-amber-500/30',
      badgeBgClass: 'bg-amber-500/15',
      badgeTextClass: 'text-amber-400',
      issuedAt: null,
      endsAt: null,
      formattedIssuedAt: null,
      formattedEndsAt: null,
      daysRemaining: null,
      isRepasse: true,
      months,
    };
  }

  if (!sale.warranty_ends_at || !sale.warranty_issued_at) {
    return {
      status: 'AWAITING_ISSUANCE',
      label: 'Aguardando emissão',
      badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      badgeBorderClass: 'border-zinc-700',
      badgeBgClass: 'bg-zinc-800',
      badgeTextClass: 'text-zinc-400',
      issuedAt: null,
      endsAt: null,
      formattedIssuedAt: null,
      formattedEndsAt: null,
      daysRemaining: null,
      isRepasse: false,
      months,
    };
  }

  const refParts = getSaoPauloCalendarParts(referenceDateInput || new Date());
  const refDateStr = `${refParts.year}-${String(refParts.month).padStart(2, '0')}-${String(refParts.day).padStart(2, '0')}`;

  const cleanEndsAt = sale.warranty_ends_at.includes('T')
    ? sale.warranty_ends_at.split('T')[0]
    : sale.warranty_ends_at;

  const daysRemaining = calculateCalendarDaysDifference(refDateStr, cleanEndsAt);

  let status: WarrantyStatus = 'UNDER_WARRANTY';
  let label = 'Em garantia';
  let badgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let badgeBorderClass = 'border-emerald-500/30';
  let badgeBgClass = 'bg-emerald-500/15';
  let badgeTextClass = 'text-emerald-400';

  if (daysRemaining < 0) {
    status = 'EXPIRED';
    label = 'Garantia encerrada';
    badgeClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    badgeBorderClass = 'border-rose-500/30';
    badgeBgClass = 'bg-rose-500/15';
    badgeTextClass = 'text-rose-400';
  } else if (daysRemaining <= 15) {
    status = 'EXPIRING_SOON';
    label = 'Vence em breve';
    badgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    badgeBorderClass = 'border-amber-500/30';
    badgeBgClass = 'bg-amber-500/15';
    badgeTextClass = 'text-amber-400';
  }

  const issuedParts = getSaoPauloCalendarParts(sale.warranty_issued_at);
  const formattedIssuedAt = `${String(issuedParts.day).padStart(2, '0')}/${String(issuedParts.month).padStart(2, '0')}/${issuedParts.year}`;
  const formattedEndsAt = formatDateBR(cleanEndsAt);

  return {
    status,
    label,
    badgeClass,
    badgeBorderClass,
    badgeBgClass,
    badgeTextClass,
    issuedAt: sale.warranty_issued_at,
    endsAt: cleanEndsAt,
    formattedIssuedAt,
    formattedEndsAt,
    daysRemaining,
    isRepasse: false,
    months,
  };
}
