import { createAdminClient } from '../supabase/admin.ts';
import { maskId } from '../mercadopago/observability.ts';

export interface AdminPaymentFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  purpose?: 'all' | 'vehicle_consultation' | 'credit_package' | string;
  status?: string;
  deliveryStatus?: string;
  refundStatus?: string;
  attentionOnly?: boolean;
  insufficientCreditsOnly?: boolean;
  approvedWithoutReportOnly?: boolean;
  pendingRefundsOnly?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface AdminPaymentSummary {
  totalApproved: number;
  totalReportsCompleted: number;
  totalInProcessing: number;
  totalRetryScheduled: number;
  totalPermanentFailures: number;
  totalPendingRefunds: number;
  totalConfirmedRefunds: number;
  totalInsufficientCredits: number;
  // Métricas segmentadas para pacotes vs consultas
  totalApprovedConsultations: number;
  totalApprovedPackages: number;
  packagesPendingGrant: number;
  revenueConsultationsCents: number;
  revenuePackagesCents: number;
}

export interface AdminPaymentItemDTO {
  transactionId: string;
  paymentCreatedAt: string;
  paymentUpdatedAt: string;
  amount: number;
  amountFormatted: string;
  paymentMethodId: string | null;
  paymentTypeId: string | null;
  paymentStatus: string;
  paymentStatusDetail: string | null;
  mpPaymentId: string | null;
  mpPreferenceId: string | null;
  purpose?: string;
  creditPackageOrderId?: string | null;

  package?: {
    orderId: string | null;
    offerName: string | null;
    creditsQuantity: number;
    orderStatus: string | null;
    paidAt: string | null;
    grantedAt: string | null;
    packageId: string | null;
    creditsRemaining?: number;
    isGranted: boolean;
    isRefundEligible: boolean;
  } | null;

  consultationId: string;
  plate: string;
  plateNormalized: string;
  consultationStatus: string;
  consultationPaymentStatus: string;
  hasReportData: boolean;
  consultationProcessedAt: string | null;

  customer: {
    id: string | null;
    name: string;
    email: string;
    phone: string | null;
  };

  delivery: {
    jobId: string | null;
    status: string;
    attemptCount: number;
    maxAttempts: number;
    nextRetryAt: string | null;
    lastErrorCode: string | null;
    lastErrorMessageSafe: string | null;
    lastHttpStatus: number | null;
    lastFailureClass: string | null;
    provider: string;
  };

  refund: {
    refundId: string | null;
    status: string;
    providerRefundId: string | null;
    reasonCode: string | null;
    reasonSafe: string | null;
    requestedAt: string | null;
    confirmedAt: string | null;
    lastErrorCode: string | null;
  };

  flags: {
    isInsufficientCredits: boolean;
    isRefundEligible: boolean;
    isReprocessEligible: boolean;
    requiresAttention: boolean;
    attentionReason: string | null;
  };
}

export interface AuditTimelineItem {
  id: string;
  timestamp: string;
  actorType: 'customer' | 'system' | 'admin' | 'webhook';
  actorIdMasked: string;
  event: string;
  summary: string;
  details?: Record<string, unknown> | null;
}

export interface AdminPaymentDetailDTO {
  item: AdminPaymentItemDTO;
  timeline: AuditTimelineItem[];
}

function formatBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

interface RawPaymentRow {
  is_insufficient_credits?: boolean | null;
  delivery_last_error_code?: string | null;
  delivery_last_http_status?: number | null;
  amount?: number | string | null;
  transaction_amount?: number | string | null;
  refund_status?: string | null;
  has_report_data?: boolean | null;
  vehicle_data?: unknown;
  payment_status?: string | null;
  status?: string | null;
  delivery_status?: string | null;
  is_refund_eligible?: boolean | null;
  is_reprocess_eligible?: boolean | null;
  mp_payment_id?: string | null;
  mp_preference_id?: string | null;
  transaction_id?: string;
  id?: string;
  payment_created_at?: string;
  created_at?: string;
  payment_updated_at?: string;
  updated_at?: string;
  payment_method_id?: string | null;
  payment_type_id?: string | null;
  payment_status_detail?: string | null;
  status_detail?: string | null;
  purpose?: string | null;
  credit_package_order_id?: string | null;
  package_order_id?: string | null;
  package_offer_name?: string | null;
  package_credits_quantity?: number | null;
  package_order_status?: string | null;
  package_paid_at?: string | null;
  package_granted_at?: string | null;
  is_package_granted?: boolean | null;
  is_package_refund_eligible?: boolean | null;
  package_id?: string | null;
  package_credits_remaining?: number | null;
  consultation_id?: string | null;
  plate?: string | null;
  plate_normalized?: string | null;
  consultation_status?: string | null;
  consultation_payment_status?: string | null;
  consultation_processed_at?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  delivery_job_id?: string | null;
  delivery_attempt_count?: number | null;
  delivery_max_attempts?: number | null;
  delivery_next_retry_at?: string | null;
  delivery_last_error_message_safe?: string | null;
  delivery_last_failure_class?: string | null;
  delivery_provider?: string | null;
  attempt_count?: number | null;
  max_attempts?: number | null;
  next_retry_at?: string | null;
  last_error_code?: string | null;
  last_error_message_safe?: string | null;
  last_http_status?: number | null;
  last_failure_class?: string | null;
  provider?: string | null;
  refund_id?: string | null;
  provider_refund_id?: string | null;
  refund_reason_code?: string | null;
  refund_reason_safe?: string | null;
  refund_requested_at?: string | null;
  refund_confirmed_at?: string | null;
  refund_last_error_code?: string | null;
  reason_code?: string | null;
  reason_safe?: string | null;
  requested_at?: string | null;
  confirmed_at?: string | null;
  [key: string]: unknown;
}

/**
 * Mapeia linha do banco (View ou fallback) para DTO higienizado
 */
export function mapRowToDTO(row: RawPaymentRow): AdminPaymentItemDTO {
  const isInsufficient = Boolean(
    row.is_insufficient_credits ??
      (row.delivery_last_error_code === 'APIBRASIL_INSUFFICIENT_CREDITS' ||
        row.delivery_last_http_status === 402),
  );

  const amount = Number(row.amount ?? row.transaction_amount ?? 0);
  const refundStatus = row.refund_status || 'none';
  const hasReport = Boolean(row.has_report_data || row.vehicle_data);
  const paymentStatus = row.payment_status || row.status;
  const deliveryStatus = row.delivery_status || 'none';

  const isCreditPackage =
    row.purpose === 'credit_package' ||
    Boolean(row.credit_package_order_id) ||
    Boolean(row.package_order_id);

  const packageData = isCreditPackage
    ? {
        orderId: (row.package_order_id || row.credit_package_order_id || null) as string | null,
        offerName: (row.package_offer_name || 'Pacote de Créditos') as string,
        creditsQuantity: Number(row.package_credits_quantity ?? 0),
        orderStatus: (row.package_order_status || row.payment_status || 'pending') as string,
        paidAt: (row.package_paid_at || null) as string | null,
        grantedAt: (row.package_granted_at || null) as string | null,
        packageId: (row.package_id || null) as string | null,
        creditsRemaining:
          row.package_credits_remaining != null ? Number(row.package_credits_remaining) : undefined,
        isGranted: Boolean(row.is_package_granted ?? Boolean(row.package_granted_at)),
        isRefundEligible: Boolean(
          row.is_package_refund_eligible ??
            (paymentStatus === 'approved' &&
              Boolean(row.mp_payment_id) &&
              !['requested', 'pending', 'confirmed'].includes(refundStatus)),
        ),
      }
    : null;

  // Lógica defensiva de elegibilidade caso não venha da View
  const isRefundEligible = isCreditPackage
    ? Boolean(packageData?.isRefundEligible)
    : Boolean(
        row.is_refund_eligible ??
          (paymentStatus === 'approved' &&
            !hasReport &&
            !['requested', 'pending', 'confirmed'].includes(refundStatus) &&
            Boolean(row.mp_payment_id)),
      );

  const isReprocessEligible =
    !isCreditPackage &&
    Boolean(
      row.is_reprocess_eligible ??
        (paymentStatus === 'approved' &&
          !hasReport &&
          !['requested', 'pending', 'confirmed'].includes(refundStatus) &&
          deliveryStatus !== 'processing'),
    );

  let requiresAttention = false;
  let attentionReason: string | null = null;

  if (isCreditPackage) {
    if (paymentStatus === 'approved' && !packageData?.isGranted) {
      requiresAttention = true;
      attentionReason = 'Pacote aprovado no Mercado Pago aguardando liberação de créditos.';
    } else if (refundStatus === 'failed' || refundStatus === 'manual_review') {
      requiresAttention = true;
      attentionReason = 'Estorno de pacote falhou ou requer revisão manual.';
    } else if (refundStatus === 'pending') {
      requiresAttention = true;
      attentionReason = 'Estorno de pacote pendente de confirmação no gateway.';
    }
  } else {
    if (isInsufficient) {
      requiresAttention = true;
      attentionReason = 'Saldo insuficiente na API Brasil (Recarga necessária).';
    } else if (refundStatus === 'failed' || refundStatus === 'manual_review') {
      requiresAttention = true;
      attentionReason = 'Estorno falhou ou requer revisão manual no Mercado Pago.';
    } else if (refundStatus === 'pending') {
      requiresAttention = true;
      attentionReason = 'Estorno pendente de reconciliação no gateway.';
    } else if (paymentStatus === 'approved' && !hasReport && deliveryStatus === 'failed_permanent') {
      requiresAttention = true;
      attentionReason = 'Falha permanente na entrega do laudo; ação necessária.';
    }
  }

  return {
    transactionId: row.transaction_id || row.id || '',
    paymentCreatedAt: row.payment_created_at || row.created_at || '',
    paymentUpdatedAt: row.payment_updated_at || row.updated_at || '',
    amount,
    amountFormatted: formatBRL(amount),
    paymentMethodId: row.payment_method_id ?? null,
    paymentTypeId: row.payment_type_id ?? null,
    paymentStatus: paymentStatus || 'unknown',
    paymentStatusDetail: row.payment_status_detail ?? row.status_detail ?? null,
    mpPaymentId: row.mp_payment_id ?? null,
    mpPreferenceId: row.mp_preference_id ?? null,
    purpose: isCreditPackage ? 'credit_package' : ((row.purpose as string) || 'vehicle_consultation'),
    creditPackageOrderId: (row.package_order_id || row.credit_package_order_id as string) || null,
    package: packageData,

    consultationId: row.consultation_id || '',
    plate: isCreditPackage ? 'PACOTE DE CRÉDITOS' : (row.plate || 'SEM PLACA'),
    plateNormalized: isCreditPackage
      ? 'PACOTE'
      : (row.plate_normalized || (row.plate ? row.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() : '')),
    consultationStatus: isCreditPackage
      ? (packageData?.isGranted ? 'completed' : 'pending')
      : (row.consultation_status || 'pending'),
    consultationPaymentStatus:
      row.consultation_payment_status || (paymentStatus === 'approved' ? 'paid' : 'unpaid'),
    hasReportData: isCreditPackage ? Boolean(packageData?.isGranted) : hasReport,
    consultationProcessedAt: row.consultation_processed_at || null,

    customer: {
      id: row.customer_id || null,
      name: row.customer_name || 'Cliente AF Veículos PE',
      email: row.customer_email || 'nao-informado@afmotos.com.br',
      phone: row.customer_phone || null,
    },

    delivery: {
      jobId: row.delivery_job_id || null,
      status: deliveryStatus,
      attemptCount: Number(row.delivery_attempt_count ?? 0),
      maxAttempts: Number(row.delivery_max_attempts ?? 5),
      nextRetryAt: row.delivery_next_retry_at || null,
      lastErrorCode: row.delivery_last_error_code || null,
      lastErrorMessageSafe: row.delivery_last_error_message_safe || null,
      lastHttpStatus: row.delivery_last_http_status ? Number(row.delivery_last_http_status) : null,
      lastFailureClass: row.delivery_last_failure_class || null,
      provider: row.delivery_provider || 'apibrasil',
    },

    refund: {
      refundId: row.refund_id || null,
      status: refundStatus,
      providerRefundId: row.provider_refund_id || null,
      reasonCode: row.refund_reason_code || null,
      reasonSafe: row.refund_reason_safe || null,
      requestedAt: row.refund_requested_at || null,
      confirmedAt: row.refund_confirmed_at || null,
      lastErrorCode: row.refund_last_error_code || null,
    },

    flags: {
      isInsufficientCredits: isInsufficient,
      isRefundEligible,
      isReprocessEligible,
      requiresAttention,
      attentionReason,
    },
  };
}

/**
 * Obtém os resumos e contadores (KPIs) da central administrativa
 */
export async function getAdminPaymentSummary(): Promise<AdminPaymentSummary> {
  const adminDb = createAdminClient();

  const [
    approvedConsultationsRes,
    approvedPackagesRes,
    completedRes,
    processingRes,
    retryRes,
    failedPermanentRes,
    pendingRefundsRes,
    confirmedRefundsRes,
    insufficientRes,
    pendingGrantRes,
    approvedTransactionsRes,
  ] = await Promise.all([
    adminDb
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .or('purpose.eq.vehicle_consultation,purpose.is.null'),
    adminDb
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .eq('purpose', 'credit_package'),
    adminDb
      .from('customer_plate_consultations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    adminDb
      .from('consultation_delivery_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing']),
    adminDb
      .from('consultation_delivery_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'retry_scheduled'),
    adminDb
      .from('consultation_delivery_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed_permanent'),
    adminDb
      .from('payment_refunds')
      .select('*', { count: 'exact', head: true })
      .in('status', ['requested', 'pending']),
    adminDb
      .from('payment_refunds')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed'),
    adminDb
      .from('consultation_delivery_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('last_error_code', 'APIBRASIL_INSUFFICIENT_CREDITS'),
    adminDb
      .from('credit_package_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid')
      .is('granted_at', null),
    adminDb
      .from('payment_transactions')
      .select('amount, purpose')
      .eq('status', 'approved'),
  ]);

  let revenueConsultationsCents = 0;
  let revenuePackagesCents = 0;
  if (approvedTransactionsRes.data) {
    for (const tx of approvedTransactionsRes.data) {
      const amtCents = Math.round(Number(tx.amount || 0) * 100);
      if (tx.purpose === 'credit_package') {
        revenuePackagesCents += amtCents;
      } else {
        revenueConsultationsCents += amtCents;
      }
    }
  }

  const totalApprovedConsultations = approvedConsultationsRes.count ?? 0;
  const totalApprovedPackages = approvedPackagesRes.count ?? 0;

  return {
    totalApproved: totalApprovedConsultations + totalApprovedPackages,
    totalReportsCompleted: completedRes.count ?? 0,
    totalInProcessing: processingRes.count ?? 0,
    totalRetryScheduled: retryRes.count ?? 0,
    totalPermanentFailures: failedPermanentRes.count ?? 0,
    totalPendingRefunds: pendingRefundsRes.count ?? 0,
    totalConfirmedRefunds: confirmedRefundsRes.count ?? 0,
    totalInsufficientCredits: insufficientRes.count ?? 0,
    totalApprovedConsultations,
    totalApprovedPackages,
    packagesPendingGrant: pendingGrantRes.count ?? 0,
    revenueConsultationsCents,
    revenuePackagesCents,
  };
}

/**
 * Consulta a lista paginada e filtrada de pagamentos e consultas
 */
export async function getAdminPaymentsList(params: AdminPaymentFilterParams = {}): Promise<{
  items: AdminPaymentItemDTO[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const adminDb = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const offset = (page - 1) * pageSize;

  // 1. Tenta consultar a View administrativa
  try {
    let query = adminDb.from('admin_payment_consultations_view').select('*', { count: 'exact' });

    if (params.search) {
      const cleanSearch = params.search.trim().replace(/[^a-zA-Z0-9@._-]/g, '');
      const plateSearch = params.search
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      const rawSearch = params.search.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSearch);

      const searchClauses = [
        `plate.ilike.%${cleanSearch}%`,
        `plate_normalized.ilike.%${plateSearch}%`,
        `mp_payment_id.ilike.%${cleanSearch}%`,
        `customer_email.ilike.%${cleanSearch}%`,
        `customer_name.ilike.%${cleanSearch}%`,
        `package_offer_name.ilike.%${cleanSearch}%`,
      ];
      if (isUuid) {
        searchClauses.push(`transaction_id.eq.${rawSearch}`);
        searchClauses.push(`package_order_id.eq.${rawSearch}`);
        searchClauses.push(`credit_package_order_id.eq.${rawSearch}`);
      }
      query = query.or(searchClauses.join(','));
    }

    if (params.purpose && params.purpose !== 'all') {
      if (params.purpose === 'credit_package') {
        query = query.eq('purpose', 'credit_package');
      } else if (params.purpose === 'vehicle_consultation') {
        query = query.or('purpose.eq.vehicle_consultation,purpose.is.null');
      }
    }

    if (params.status) {
      query = query.eq('payment_status', params.status);
    }
    if (params.deliveryStatus) {
      query = query.eq('delivery_status', params.deliveryStatus);
    }
    if (params.refundStatus) {
      query = query.eq('refund_status', params.refundStatus);
    }
    if (params.insufficientCreditsOnly) {
      query = query.eq('is_insufficient_credits', true);
    }
    if (params.approvedWithoutReportOnly) {
      query = query.eq('payment_status', 'approved').eq('has_report_data', false);
    }
    if (params.pendingRefundsOnly) {
      query = query.in('refund_status', ['requested', 'pending', 'failed']);
    }
    if (params.startDate) {
      query = query.gte('payment_created_at', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('payment_created_at', params.endDate);
    }

    // Ordenação padrão: casos com ação necessária primeiro, depois mais recentes
    query = query
      .order('is_insufficient_credits', { ascending: false })
      .order('payment_created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: rows, count, error } = await query;

    if (!error && rows) {
      const totalItems = count ?? rows.length;
      return {
        items: rows.map(mapRowToDTO),
        totalItems,
        page,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      };
    }
  } catch (viewErr) {
    console.warn('[ADMIN_PAYMENTS] View query falhou; aplicando fallback relacional:', viewErr);
  }

  // 2. Fallback defensivo direto em payment_transactions se a view não estiver disponível
  let fallbackQuery = adminDb
    .from('payment_transactions')
    .select(
      `
      *,
      customer_plate_consultations (
        id, plate, plate_normalized, status, payment_status, vehicle_data, processed_at,
        customer_profiles ( id, full_name, email, phone )
      ),
      credit_package_orders (
        id, offer_name, credits_quantity, status, paid_at, granted_at,
        customer_profiles ( id, full_name, email, phone )
      ),
      consultation_delivery_jobs (
        id, status, attempt_count, max_attempts, next_retry_at, last_error_code, last_error_message_safe, last_http_status, last_failure_class, provider
      ),
      payment_refunds (
        id, status, provider_refund_id, reason_code, reason_safe, requested_at, confirmed_at, last_error_code
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params.purpose && params.purpose !== 'all') {
    if (params.purpose === 'credit_package') {
      fallbackQuery = fallbackQuery.eq('purpose', 'credit_package');
    } else if (params.purpose === 'vehicle_consultation') {
      fallbackQuery = fallbackQuery.or('purpose.eq.vehicle_consultation,purpose.is.null');
    }
  }

  if (params.status) {
    fallbackQuery = fallbackQuery.eq('status', params.status);
  }

  const { data: fallbackRows, count: fallbackCount, error: fallbackError } = await fallbackQuery;

  if (fallbackError) {
    console.error('[ADMIN_PAYMENTS] Erro no fallback relacional:', fallbackError);
    throw new Error(`Falha ao listar transações: ${fallbackError.message}`);
  }

  interface FallbackRow extends RawPaymentRow {
    customer_plate_consultations?: {
      id?: string;
      plate?: string;
      plate_normalized?: string;
      status?: string;
      payment_status?: string;
      vehicle_data?: unknown;
      processed_at?: string;
      customer_profiles?: {
        id?: string;
        full_name?: string;
        email?: string;
        phone?: string;
      } | null;
    } | null;
    credit_package_orders?: {
      id?: string;
      offer_name?: string;
      credits_quantity?: number;
      status?: string;
      paid_at?: string;
      granted_at?: string;
      customer_profiles?: {
        id?: string;
        full_name?: string;
        email?: string;
        phone?: string;
      } | null;
    } | null;
    consultation_delivery_jobs?: Array<RawPaymentRow> | RawPaymentRow | null;
    payment_refunds?: Array<RawPaymentRow> | RawPaymentRow | null;
  }

  const items = ((fallbackRows as unknown as FallbackRow[]) || []).map((row) => {
    const cpc = row.customer_plate_consultations;
    const cp = cpc?.customer_profiles;
    const pkgOrder = row.credit_package_orders;
    const pkgProfile = pkgOrder?.customer_profiles;

    const deliveryJob = Array.isArray(row.consultation_delivery_jobs)
      ? (row.consultation_delivery_jobs[row.consultation_delivery_jobs.length - 1] as
          RawPaymentRow | undefined)
      : (row.consultation_delivery_jobs as RawPaymentRow | undefined);
    const refundRecord = Array.isArray(row.payment_refunds)
      ? (row.payment_refunds[row.payment_refunds.length - 1] as RawPaymentRow | undefined)
      : (row.payment_refunds as RawPaymentRow | undefined);

    return mapRowToDTO({
      ...row,
      consultation_id: cpc?.id,
      plate: cpc?.plate,
      plate_normalized: cpc?.plate_normalized,
      consultation_status: cpc?.status,
      consultation_payment_status: cpc?.payment_status,
      has_report_data: Boolean(cpc?.vehicle_data),
      consultation_processed_at: cpc?.processed_at,
      customer_id: cp?.id || pkgProfile?.id,
      customer_name: cp?.full_name || pkgProfile?.full_name,
      customer_email: cp?.email || pkgProfile?.email,
      customer_phone: cp?.phone || pkgProfile?.phone,
      package_order_id: pkgOrder?.id,
      package_offer_name: pkgOrder?.offer_name,
      package_credits_quantity: pkgOrder?.credits_quantity,
      package_order_status: pkgOrder?.status,
      package_paid_at: pkgOrder?.paid_at,
      package_granted_at: pkgOrder?.granted_at,
      is_package_granted: Boolean(pkgOrder?.granted_at),
      delivery_job_id: deliveryJob?.id,
      delivery_status: deliveryJob?.status,
      delivery_attempt_count: deliveryJob?.attempt_count,
      delivery_max_attempts: deliveryJob?.max_attempts,
      delivery_next_retry_at: deliveryJob?.next_retry_at,
      delivery_last_error_code: deliveryJob?.last_error_code,
      delivery_last_error_message_safe: deliveryJob?.last_error_message_safe,
      delivery_last_http_status: deliveryJob?.last_http_status,
      delivery_last_failure_class: deliveryJob?.last_failure_class,
      delivery_provider: deliveryJob?.provider,
      refund_id: refundRecord?.id,
      refund_status: refundRecord?.status || row.refund_status,
      provider_refund_id: refundRecord?.provider_refund_id,
      refund_reason_code: refundRecord?.reason_code,
      refund_reason_safe: refundRecord?.reason_safe,
      refund_requested_at: refundRecord?.requested_at,
      refund_confirmed_at: refundRecord?.confirmed_at,
      refund_last_error_code: refundRecord?.last_error_code,
    });
  });

  const totalItems = fallbackCount ?? items.length;
  return {
    items,
    totalItems,
    page,
    pageSize,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

/**
 * Obtém detalhes profundos de uma transação específica com timeline de auditoria
 */
export async function getAdminPaymentDetails(
  transactionId: string,
): Promise<AdminPaymentDetailDTO | null> {
  const adminDb = createAdminClient();

  // 1. Carrega o item principal
  const { items } = await getAdminPaymentsList({
    page: 1,
    pageSize: 1,
    search: transactionId,
  });

  const item = items.find((i) => i.transactionId === transactionId) || items[0];
  if (!item) {
    return null;
  }

  // 2. Carrega a timeline cronológica de auditoria
  const orderId = item.package?.orderId || item.creditPackageOrderId;
  const auditClauses = [`transaction_id.eq.${transactionId}`];
  if (item.consultationId) {
    auditClauses.push(`consultation_id.eq.${item.consultationId}`);
  }
  if (orderId) {
    auditClauses.push(`details->>order_id.eq.${orderId}`);
    auditClauses.push(`details->>orderId.eq.${orderId}`);
  }

  const { data: auditLogs, error: auditError } = await adminDb
    .from('consultation_audit_logs')
    .select('*')
    .or(auditClauses.join(','))
    .order('created_at', { ascending: true });

  if (auditError) {
    console.warn('[ADMIN_PAYMENTS] Falha ao carregar audit logs:', auditError);
  }

  interface RawAuditLog {
    id: string;
    created_at: string;
    actor_type: string;
    actor_id: string | null;
    event: string;
    details?: {
      alert?: string;
      message?: string;
      error_code?: string;
      [key: string]: unknown;
    } | null;
  }

  const timeline: AuditTimelineItem[] = ((auditLogs as unknown as RawAuditLog[]) || []).map(
    (log) => {
      let summary = `Evento: ${log.event}`;
      if (log.details?.alert) summary = log.details.alert;
      else if (log.details?.message) summary = log.details.message;
      else if (log.event === 'payment_approved')
        summary = 'Pagamento aprovado pelo gateway Mercado Pago.';
      else if (log.event === 'admin_refund_requested')
        summary = 'Estorno solicitado via Central Administrativa.';
      else if (log.event === 'refund_confirmed')
        summary = 'Estorno integral confirmado com sucesso pelo Mercado Pago.';
      else if (log.event === 'admin_delivery_reprocessed')
        summary = 'Entrega do laudo reprocessada pelo administrador.';
      else if (log.event === 'delivery_attempt_failed')
        summary = `Falha na consulta veicular: ${log.details?.error_code || 'Erro de rede'}.`;

      return {
        id: log.id,
        timestamp: log.created_at,
        actorType: log.actor_type as AuditTimelineItem['actorType'],
        actorIdMasked: (log.actor_id ? maskId(log.actor_id) : null) || 'system',
        event: log.event,
        summary,
        details: log.details,
      };
    },
  );

  return {
    item,
    timeline,
  };
}
