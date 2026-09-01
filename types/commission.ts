/**
 * Tipos de Domínio e Contratos TypeScript para Comissões por Proposta
 * Feature: 022-registro-comissoes-propostas
 */

export type CommissionStatus =
  | 'draft'
  | 'proposed'
  | 'confirmed'
  | 'receivable'
  | 'received'
  | 'cancelled'
  | 'voided';

export type CommissionType = 'percentage' | 'fixed';

export type CommissionAuditAction =
  | 'created'
  | 'updated'
  | 'confirmed'
  | 'received'
  | 'cancelled'
  | 'voided'
  | 'reopened'
  | 'report_eligibility_changed';

export interface ProposalCommissionRecord {
  id: string;
  proposal_id: string;
  sell_request_id: string | null;
  sale_agreement_id: string | null;
  sale_id: string | null;
  motorcycle_id: string | null;
  owner_customer_id: string | null;
  buyer_customer_id: string | null;

  commission_type: CommissionType;
  commission_percentage: number | null;
  commission_fixed_value: number | null;

  expected_sale_value: number | null;
  final_sale_value: number | null;

  commission_expected_value: number;
  commission_confirmed_value: number | null;
  commission_received_value: number | null;

  status: CommissionStatus;

  eligible_for_reports: boolean;
  eligible_at: string | null;

  confirmed_at: string | null;
  confirmed_by: string | null;

  received_at: string | null;
  received_by: string | null;
  received_payment_method: string | null;
  received_reference: string | null;

  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;

  notes: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface ProposalCommissionAuditLogRecord {
  id: string;
  commission_id: string;
  action: CommissionAuditAction;
  previous_snapshot: Record<string, unknown> | null;
  new_snapshot: Record<string, unknown>;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
  user_email?: string | null;
  user_name?: string | null;
}

export interface CommissionSummaryViewModel {
  id?: string;
  proposalId: string;
  sellRequestId?: string | null;
  saleAgreementId?: string | null;
  saleId?: string | null;
  motorcycleId?: string | null;
  ownerCustomerId?: string | null;
  buyerCustomerId?: string | null;

  commissionType: CommissionType;
  commissionPercentage: number | null;
  commissionFixedValue: number | null;

  expectedSaleValue: number;
  finalSaleValue?: number | null;

  commissionExpectedValue: number;
  commissionConfirmedValue?: number | null;
  commissionReceivedValue?: number | null;
  netClientExpectedValue: number;
  netClientFinalValue?: number | null;

  status: CommissionStatus;
  statusLabel: string;
  statusBadgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';

  eligibleForReports: boolean;
  eligibleAt?: string | null;

  confirmedAt?: string | null;
  receivedAt?: string | null;
  receivedPaymentMethod?: string | null;
  receivedReference?: string | null;

  cancelledAt?: string | null;
  cancellationReason?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
