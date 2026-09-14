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
  creditReservationId: string | null;
  hasDeliveryJob: boolean;
  deliveryJobDetails: unknown;
  hasPaymentTransactions: boolean;
  paymentTransactions: unknown[];
  isCleanRollback: boolean;
  hasOrphanReservation: boolean;
  recommendedAction: 'SAFE_TO_RETRY' | 'MANUAL_REVIEW_REQUIRED';
}

/**
 * Procedimento seguro de auditoria e verificação de integridade pós-falha.
 * Não altera nenhum dado no banco. Apenas inspeciona o estado atual dos 8 pontos canônicos:
 * 1. customer_plate_consultations.credit_status
 * 2. customer_plate_consultations.credit_reservation_id
 * 3. customer_plate_consultations.payment_coverage_type
 * 4. customer_credit_reservations
 * 5. customer_credit_ledger
 * 6. customer_credit_balances
 * 7. consultation_delivery_jobs
 * 8. payment_transactions
 */
export async function verifyConsultationRecoveryState(
  consultationId: string = '6dc6bde8-ddf1-4b26-a697-bc89bb69a559',
  userId: string = '93ca5b44-377e-45e4-ae7e-9707b3ce4836',
  dbClient?: unknown,
): Promise<RecoveryCheckResult> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  // 1. Verificar dados da consulta
  const { data: consultation } = await adminDb
    .from('customer_plate_consultations')
    .select('id, user_id, status, payment_coverage_type, credit_status, credit_reservation_id')
    .eq('id', consultationId)
    .maybeSingle();

  const effectiveUserId = consultation?.user_id || userId;

  // 2. Verificar se existe reservation
  const { data: reservation } = await adminDb
    .from('customer_credit_reservations')
    .select('*')
    .eq('consultation_id', consultationId)
    .maybeSingle();

  // 3. Verificar se existe ledger
  const { data: ledgerEntries } = await adminDb
    .from('customer_credit_ledger')
    .select('*')
    .eq('consultation_id', consultationId);

  // 4. Verificar saldo agregado
  const { data: balance } = await adminDb
    .from('customer_credit_balances')
    .select('*')
    .eq('user_id', effectiveUserId)
    .maybeSingle();

  // 5. Verificar se existe job de entrega
  const { data: deliveryJob } = await adminDb
    .from('consultation_delivery_jobs')
    .select('*')
    .eq('consultation_id', consultationId)
    .maybeSingle();

  // 6. Verificar payment_transactions (não deve haver para crédito)
  const { data: paymentTransactions } = await adminDb
    .from('payment_transactions')
    .select('*')
    .eq('consultation_id', consultationId);

  const hasReservation = Boolean(reservation);
  const hasLedgerReserve = Boolean(ledgerEntries && ledgerEntries.length > 0);
  const hasDeliveryJob = Boolean(deliveryJob);
  const hasPaymentTransactions = Boolean(paymentTransactions && paymentTransactions.length > 0);
  const coverageChanged =
    consultation?.payment_coverage_type === 'platform_credit' ||
    consultation?.credit_status === 'reserved';

  const isCleanRollback =
    !hasReservation &&
    !hasLedgerReserve &&
    !coverageChanged &&
    !hasDeliveryJob &&
    !hasPaymentTransactions;

  // Reserva órfã: existe reserva ativa, mas nenhum delivery job e a consulta continua pending
  const hasOrphanReservation =
    hasReservation && !hasDeliveryJob && consultation?.status === 'pending';

  return {
    consultationId,
    userId: effectiveUserId,
    hasReservation,
    reservationDetails: reservation || null,
    hasLedgerReserve,
    ledgerEntries: ledgerEntries || [],
    userBalance: balance || null,
    consultationStatus: consultation?.status || null,
    paymentCoverageType: consultation?.payment_coverage_type || null,
    creditStatus: consultation?.credit_status || null,
    creditReservationId: consultation?.credit_reservation_id || null,
    hasDeliveryJob,
    deliveryJobDetails: deliveryJob || null,
    hasPaymentTransactions,
    paymentTransactions: paymentTransactions || [],
    isCleanRollback,
    hasOrphanReservation,
    recommendedAction: hasOrphanReservation
      ? 'MANUAL_REVIEW_REQUIRED'
      : isCleanRollback
        ? 'SAFE_TO_RETRY'
        : 'MANUAL_REVIEW_REQUIRED',
  };
}
