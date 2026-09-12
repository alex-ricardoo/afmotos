import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminTransactionsFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  refundStatus?: string;
}

export interface AdminTransactionSummary {
  totalRevenue: number;
  approvedCount: number;
  pendingCount: number;
  refundedCount: number;
  failedRefundsCount: number;
}

export async function getAdminPaymentTransactions(params: AdminTransactionsFilter = {}) {
  const admin = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = admin
    .from('payment_transactions')
    .select(
      `
      id,
      consultation_id,
      user_id,
      mp_payment_id,
      mp_preference_id,
      status,
      status_detail,
      payment_method_id,
      payment_type_id,
      transaction_amount,
      net_received_amount,
      installments,
      payer_email,
      refund_status,
      refund_amount,
      refunded_at,
      refund_reason,
      created_at,
      updated_at,
      customer_plate_consultations!inner (
        plate,
        plate_normalized,
        status,
        payment_status
      )
    `,
      { count: 'exact' }
    );

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params.refundStatus && params.refundStatus !== 'all') {
    query = query.eq('refund_status', params.refundStatus);
  }

  if (params.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(
      `payer_email.ilike.${term},mp_payment_id.ilike.${term},customer_plate_consultations.plate_normalized.ilike.${term}`
    );
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('[getAdminPaymentTransactions] Error:', error);
  }

  // Calculate high-level summary metrics
  const { data: allTransactions } = await admin
    .from('payment_transactions')
    .select('status, transaction_amount, refund_status');

  const summary: AdminTransactionSummary = {
    totalRevenue: 0,
    approvedCount: 0,
    pendingCount: 0,
    refundedCount: 0,
    failedRefundsCount: 0,
  };

  if (allTransactions) {
    for (const tx of allTransactions) {
      if (tx.status === 'approved') {
        summary.approvedCount++;
        summary.totalRevenue += Number(tx.transaction_amount || 0);
      } else if (tx.status === 'pending' || tx.status === 'in_process') {
        summary.pendingCount++;
      }

      if (tx.refund_status === 'refunded') {
        summary.refundedCount++;
      } else if (tx.refund_status === 'failed') {
        summary.failedRefundsCount++;
      }
    }
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const transactions = (data || []).map((item: any) => ({
    id: item.id,
    consultationId: item.consultation_id,
    userId: item.user_id,
    mpPaymentId: item.mp_payment_id,
    status: item.status,
    statusDetail: item.status_detail,
    paymentMethodId: item.payment_method_id,
    paymentTypeId: item.payment_type_id,
    transactionAmount: Number(item.transaction_amount || 0),
    netReceivedAmount: item.net_received_amount ? Number(item.net_received_amount) : null,
    installments: item.installments,
    payerEmail: item.payer_email,
    refundStatus: item.refund_status,
    refundAmount: item.refund_amount ? Number(item.refund_amount) : null,
    refundedAt: item.refunded_at,
    refundReason: item.refund_reason,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    plate: item.customer_plate_consultations?.plate || '---',
    consultationStatus: item.customer_plate_consultations?.status,
  }));

  return {
    transactions,
    totalCount,
    totalPages,
    currentPage: page,
    summary,
  };
}

export async function getTransactionDetail(transactionId: string) {
  const admin = createAdminClient();

  const { data: tx, error } = await admin
    .from('payment_transactions')
    .select(
      `
      *,
      customer_plate_consultations (
        id,
        plate,
        plate_normalized,
        status,
        payment_status,
        auto_refund_attempted,
        lookup_error_message,
        created_at
      )
    `
    )
    .eq('id', transactionId)
    .single();

  if (error || !tx) {
    return null;
  }

  // Fetch customer profile
  const { data: profile } = await admin
    .from('customer_profiles')
    .select('*')
    .eq('id', tx.user_id)
    .maybeSingle();

  // Fetch timeline logs
  const { data: logs } = await admin
    .from('consultation_audit_logs')
    .select('*')
    .eq('consultation_id', tx.consultation_id)
    .order('created_at', { ascending: true });

  return {
    transaction: tx,
    consultation: tx.customer_plate_consultations,
    customer: profile,
    timeline: logs || [],
  };
}
