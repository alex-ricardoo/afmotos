import { CommissionStatus, CommissionType } from '@/types/commission';

/**
 * Calcula o valor da comissão com base no tipo e valor de venda
 */
export function calculateCommission(
  type: CommissionType,
  percentage: number | null | undefined,
  fixedValue: number | null | undefined,
  saleValue: number | null | undefined,
): number {
  const safeSaleValue = Math.max(0, Number(saleValue) || 0);

  if (type === 'fixed') {
    return Math.max(0, Number(fixedValue) || 0);
  }

  const safePercentage = Math.min(100, Math.max(0, Number(percentage) || 0));
  const rawValue = (safeSaleValue * safePercentage) / 100;
  return Number(rawValue.toFixed(2));
}

/**
 * Calcula o valor líquido devido ao proprietário do veículo
 */
export function getNetClientValue(
  saleValue: number | null | undefined,
  commissionValue: number | null | undefined,
): number {
  const safeSale = Math.max(0, Number(saleValue) || 0);
  const safeCommission = Math.max(0, Number(commissionValue) || 0);
  return Math.max(0, Number((safeSale - safeCommission).toFixed(2)));
}

/**
 * Mapeamento e validação de transições de status da máquina de estados
 */
export function canTransitionCommissionStatus(
  currentStatus: CommissionStatus,
  targetStatus: CommissionStatus,
): boolean {
  if (currentStatus === targetStatus) return true;

  const validTransitions: Record<CommissionStatus, CommissionStatus[]> = {
    draft: ['proposed', 'confirmed', 'receivable', 'cancelled', 'voided'],
    proposed: ['draft', 'confirmed', 'receivable', 'cancelled', 'voided'],
    confirmed: ['receivable', 'received', 'cancelled', 'voided'],
    receivable: ['received', 'cancelled', 'voided'],
    received: ['voided'], // Não pode ir direto para cancelado sem estorno/anulação auditada
    cancelled: ['draft', 'voided'],
    voided: [],
  };

  return (validTransitions[currentStatus] || []).includes(targetStatus);
}

/**
 * Identifica se o status da proposta representa conclusão bem-sucedida (venda / compra)
 */
export function isProposalSuccessful(proposalStatus: string | null | undefined): boolean {
  if (!proposalStatus) return false;
  const s = proposalStatus.toUpperCase();
  return (
    s === 'CONVERTED' ||
    s === 'CONCLUDED' ||
    s === 'APPROVED' ||
    s === 'PURCHASED' ||
    s === 'SOLD' ||
    s === 'GANHO' ||
    s === 'CONCLUIDO'
  );
}

/**
 * Identifica se o status da proposta representa cancelamento ou perda
 */
export function isProposalCancelled(proposalStatus: string | null | undefined): boolean {
  if (!proposalStatus) return false;
  const s = proposalStatus.toUpperCase();
  return (
    s === 'LOST' ||
    s === 'PERDIDO' ||
    s === 'REJECTED' ||
    s === 'RECUSADO' ||
    s === 'CLOSED' ||
    s === 'CANCELLED' ||
    s === 'CANCELADO'
  );
}

/**
 * Regra rígida de elegibilidade contábil e gerencial para relatórios
 */
export function isProposalReportEligible(
  proposalStatus: string | null | undefined,
  commissionStatus: CommissionStatus | null | undefined,
  eligibleForReportsFlag?: boolean,
): boolean {
  if (eligibleForReportsFlag === false) return false;
  if (!commissionStatus) return false;

  const isCommissionActive =
    commissionStatus === 'confirmed' ||
    commissionStatus === 'receivable' ||
    commissionStatus === 'received';

  if (!isCommissionActive) return false;

  // Proposta não pode estar cancelada ou perdida
  if (isProposalCancelled(proposalStatus)) return false;

  return isProposalSuccessful(proposalStatus) || Boolean(eligibleForReportsFlag);
}

export function getCommissionStatusLabel(status: CommissionStatus): string {
  const labels: Record<CommissionStatus, string> = {
    draft: 'Rascunho',
    proposed: 'Proposta / Acordo',
    confirmed: 'Confirmada',
    receivable: 'A Receber',
    received: 'Recebida (Baixada)',
    cancelled: 'Cancelada',
    voided: 'Anulada',
  };
  return labels[status] || status;
}

export function getCommissionStatusBadgeVariant(
  status: CommissionStatus,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'received':
    case 'confirmed':
      return 'default';
    case 'proposed':
    case 'receivable':
      return 'secondary';
    case 'cancelled':
    case 'voided':
      return 'destructive';
    case 'draft':
    default:
      return 'outline';
  }
}

export function getCommissionStatusBadgeClass(status: CommissionStatus): string {
  switch (status) {
    case 'received':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'confirmed':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'receivable':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'proposed':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    case 'cancelled':
    case 'voided':
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    case 'draft':
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
}
