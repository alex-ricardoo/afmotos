import { createAdminClient } from '../supabase/admin.ts';

export interface RecoveryCheckResult {
  consultationId: string;
  userId: string;
  hasReservation: boolean;
  reservationDetails: unknown;
  hasLedgerReserve: boolean;
  ledgerEntries: unknown[];
  userBalance: unknown;
  consultationStatus: string | null;
  paymentCoverageType: string | null;
  creditStatus: string | null;
  hasDeliveryJob: boolean;
  deliveryJobDetails: unknown;
  isCleanRollback: boolean;
  recommendedAction: 'SAFE_TO_RETRY' | 'MANUAL_REVIEW_REQUIRED';
}

/**
 * Procedimento seguro de auditoria e verificação de integridade pós-falha.
 * Não altera nenhum dado no banco. Apenas inspeciona o estado atual.
 */
export async function verifyConsultationRecoveryState(
  consultationId: string = '6dc6bde8-ddf1-4b26-a697-bc89bb69a559',
  userId: string = '93ca5b44-377e-45e4-ae7e-9707b3ce4836',
  dbClient?: unknown,
): Promise<RecoveryCheckResult> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  // 1. Verificar se existe reservation
  const { data: reservation } = await adminDb
    .from('customer_credit_reservations')
    .select('*')
    .eq('consultation_id', consultationId)
    .maybeSingle();

  // 2. Verificar se existe ledger reserve
  const { data: ledgerEntries } = await adminDb
    .from('customer_credit_ledger')
    .select('*')
    .eq('consultation_id', consultationId);

  // 3. Verificar saldo agregado
  const { data: balance } = await adminDb
    .from('customer_credit_balances')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  // 4. Verificar dados da consulta
  const { data: consultation } = await adminDb
    .from('customer_plate_consultations')
    .select('id, user_id, status, payment_coverage_type, credit_status')
    .eq('id', consultationId)
    .maybeSingle();

  // 5. Verificar se existe job de entrega
  const { data: deliveryJob } = await adminDb
    .from('consultation_delivery_jobs')
    .select('*')
    .eq('consultation_id', consultationId)
    .maybeSingle();

  const hasReservation = Boolean(reservation);
  const hasLedgerReserve = Boolean(ledgerEntries && ledgerEntries.length > 0);
  const hasDeliveryJob = Boolean(deliveryJob);
  const coverageChanged =
    consultation?.payment_coverage_type === 'platform_credit' ||
    consultation?.credit_status === 'reserved';

  // O rollback é considerado limpo e completo quando nenhuma mutação parcial sobreviveu
  const isCleanRollback =
    !hasReservation && !hasLedgerReserve && !coverageChanged && !hasDeliveryJob;

  return {
    consultationId,
    userId,
    hasReservation,
    reservationDetails: reservation || null,
    hasLedgerReserve,
    ledgerEntries: ledgerEntries || [],
    userBalance: balance || null,
    consultationStatus: consultation?.status || null,
    paymentCoverageType: consultation?.payment_coverage_type || null,
    creditStatus: consultation?.credit_status || null,
    hasDeliveryJob,
    deliveryJobDetails: deliveryJob || null,
    isCleanRollback,
    recommendedAction: isCleanRollback ? 'SAFE_TO_RETRY' : 'MANUAL_REVIEW_REQUIRED',
  };
}
