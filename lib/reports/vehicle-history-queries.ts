/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/admin';
import { ReportDateRange } from './types';

export interface VehicleHistoryReportFilters {
  coverageType?: 'all' | 'mercadopago' | 'platform_credit' | 'free';
  reportOrigin?: 'all' | 'live' | 'cache' | 'mock';
  consultationStatus?: 'all' | 'completed' | 'processing' | 'failed';
  paymentStatus?: 'all' | 'approved' | 'pending' | 'rejected' | 'refunded';
  refundStatus?: 'all' | 'none' | 'pending' | 'confirmed';
  customerId?: string;
  plate?: string;
  page?: number;
  pageSize?: number;
}

export interface VehicleHistoryConsultationRow {
  consultationId: string;
  shortId: string;
  consultedAt: string;
  plate: string;
  customerName: string;
  customerEmail: string;
  coverageType: string;
  consultationStatus: string;
  reportOrigin: 'live' | 'cache' | 'mock' | 'unknown';
  providerHttpStatus: number | null;
  costSnapshotCents: number;
  actualCostCents: number;
  costStatus: string;
  publicPriceSnapshotCents: number;
  estimatedMarginCents: number | null;
  deliveryAttempts: number;
  hasReportData: boolean;
}

export interface VehicleHistoryPaymentRow {
  transactionId: string;
  shortId: string;
  paymentCreatedAt: string;
  mpPaymentIdMasked: string | null;
  customerName: string;
  customerEmail: string;
  plate: string;
  grossAmountCents: number;
  paymentStatus: string;
  refundStatus: string;
  refundAmountCents: number;
  netRevenueCents: number;
  refundReasonSafe: string | null;
  coverageType: string;
}

export interface VehicleHistoryCreditPackageRow {
  packageId: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  packageType: string;
  grantedAt: string;
  paymentChannel: string;
  totalPaidCents: number | null;
  creditsGranted: number;
  creditsRemaining: number;
  creditsReserved: number;
  creditsConsumed: number;
  creditsReleased: number;
  status: string;
  totalProviderCostCents: number;
  estimatedPackageMarginCents: number | null;
}

export interface VehicleHistoryReportSummary {
  grossRevenueCents: number;
  confirmedRefundsCents: number;
  netRevenueCents: number;
  totalApiBrasilCostCents: number;
  estimatedGrossMarginCents: number;
  marginPercentage: number;

  totalConsultationsStarted: number;
  totalConsultationsCompleted: number;
  totalLiveChargedCalls: number;
  totalCacheHits: number;
  totalCreditConsultations: number;
  totalCreditsConsumed: number;
  totalCreditsReturned: number;
  totalPermanentFailures: number;
  totalPendingRefundsCount: number;
  totalPendingRefundsAmountCents: number;

  completionRatePercentage: number;
  cacheHitRatePercentage: number;
  averageTicketCents: number;
  averageLiveCostCents: number;
}

export interface VehicleHistoryReportResult {
  dateRange: ReportDateRange;
  summary: VehicleHistoryReportSummary;
  consultations: {
    items: VehicleHistoryConsultationRow[];
    total: number;
  };
  payments: {
    items: VehicleHistoryPaymentRow[];
    total: number;
  };
  creditPackages: {
    items: VehicleHistoryCreditPackageRow[];
    total: number;
  };
}

/**
 * Consulta e agrega os dados analíticos de Histórico Veicular para o período informado.
 */
export async function getVehicleHistoryReportData(
  dateRange: ReportDateRange,
  filters: VehicleHistoryReportFilters = {},
): Promise<VehicleHistoryReportResult> {
  const adminDb = createAdminClient();
  const startIso = `${dateRange.startDate}T00:00:00.000Z`;
  const endIso = `${dateRange.endDate}T23:59:59.999Z`;

  try {
    // 1. Tenta consultar a view unificada
    const { data: viewRows, error: viewError } = await adminDb
      .from('admin_vehicle_history_financial_view')
      .select('*')
      .gte('consultation_created_at', startIso)
      .lte('consultation_created_at', endIso)
      .order('consultation_created_at', { ascending: false });

    // 2. Busca pacotes de crédito do período
    const { data: packagesData } = await adminDb
      .from('customer_credit_packages')
      .select(
        `
        *,
        customer_profiles:user_id (
          full_name,
          email
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (!viewError && Array.isArray(viewRows)) {
      return processViewRows(viewRows, packagesData || [], dateRange, filters);
    }
  } catch (err) {
    console.warn(
      '[getVehicleHistoryReportData] Falha na view analítica, aplicando fallback de tabelas base:',
      err,
    );
  }

  // Fallback direto sobre as tabelas base
  return executeFallbackQueries(adminDb, startIso, endIso, dateRange, filters);
}

function processViewRows(
  rows: any[],
  packages: any[],
  dateRange: ReportDateRange,
  _filters: VehicleHistoryReportFilters,
): VehicleHistoryReportResult {
  let grossRevenueCents = 0;
  let confirmedRefundsCents = 0;
  let totalApiBrasilCostCents = 0;

  const totalConsultationsStarted = rows.length;
  let totalConsultationsCompleted = 0;
  let totalLiveChargedCalls = 0;
  let totalCacheHits = 0;
  let totalCreditConsultations = 0;
  let totalCreditsConsumed = 0;
  let totalCreditsReturned = 0;
  let totalPermanentFailures = 0;
  let totalPendingRefundsCount = 0;
  let totalPendingRefundsAmountCents = 0;

  const consultationRows: VehicleHistoryConsultationRow[] = [];
  const paymentRows: VehicleHistoryPaymentRow[] = [];
  const processedTransactions = new Set<string>();

  for (const row of rows) {
    // Contadores operacionais
    if (row.consultation_status === 'completed') {
      totalConsultationsCompleted++;
    } else if (row.consultation_status === 'failed' || row.delivery_status === 'failed_permanent') {
      totalPermanentFailures++;
    }

    if (row.report_origin === 'cache') {
      totalCacheHits++;
    } else if (row.report_origin === 'live' && row.provider_cost_status === 'incurred') {
      totalLiveChargedCalls++;
      totalApiBrasilCostCents += row.actual_cost_cents || 0;
    }

    if (row.payment_coverage_type === 'platform_credit') {
      totalCreditConsultations++;
      if (row.credit_status === 'consumed') totalCreditsConsumed++;
      if (row.credit_status === 'released') totalCreditsReturned++;
    }

    // Pagamentos e Estornos (apenas 1 vez por transação)
    if (row.transaction_id && !processedTransactions.has(row.transaction_id)) {
      processedTransactions.add(row.transaction_id);

      if (row.payment_status === 'approved') {
        grossRevenueCents += row.payment_amount_cents || 0;
      }

      if (row.refund_status === 'confirmed') {
        confirmedRefundsCents += row.refund_amount_cents || 0;
      } else if (row.refund_status === 'requested' || row.refund_status === 'pending') {
        totalPendingRefundsCount++;
        totalPendingRefundsAmountCents += row.refund_amount_cents || 0;
      }

      paymentRows.push({
        transactionId: row.transaction_id,
        shortId: row.transaction_id.substring(0, 8),
        paymentCreatedAt: row.consultation_created_at,
        mpPaymentIdMasked: row.mp_payment_id ? `mp_${row.mp_payment_id.slice(-6)}` : null,
        customerName: row.customer_name || 'Cliente AF',
        customerEmail: row.customer_email || '-',
        plate: row.plate || '-',
        grossAmountCents: row.payment_amount_cents || 0,
        paymentStatus: row.payment_status || 'unknown',
        refundStatus: row.refund_status || 'none',
        refundAmountCents: row.refund_amount_cents || 0,
        netRevenueCents: row.net_revenue_cents || 0,
        refundReasonSafe: row.refund_reason_code || null,
        coverageType: row.payment_coverage_type || 'mercadopago',
      });
    }

    consultationRows.push({
      consultationId: row.consultation_id,
      shortId: row.consultation_id.substring(0, 8),
      consultedAt: row.consultation_created_at,
      plate: row.plate || '-',
      customerName: row.customer_name || 'Cliente AF',
      customerEmail: row.customer_email || '-',
      coverageType: row.payment_coverage_type || 'mercadopago',
      consultationStatus: row.consultation_status || 'pending',
      reportOrigin: (row.report_origin as 'live' | 'cache' | 'mock' | 'unknown') || 'unknown',
      providerHttpStatus: row.provider_status_code,
      costSnapshotCents: row.provider_cost_snapshot_cents || 0,
      actualCostCents: row.actual_cost_cents || 0,
      costStatus: row.provider_cost_status || 'unknown',
      publicPriceSnapshotCents: row.public_price_snapshot_cents || 3990,
      estimatedMarginCents: row.estimated_margin_cents,
      deliveryAttempts: row.delivery_attempt_count || 0,
      hasReportData: Boolean(row.has_report_data),
    });
  }

  const netRevenueCents = Math.max(0, grossRevenueCents - confirmedRefundsCents);
  const estimatedGrossMarginCents = netRevenueCents - totalApiBrasilCostCents;
  const marginPercentage =
    netRevenueCents > 0 ? Math.round((estimatedGrossMarginCents / netRevenueCents) * 100) : 0;

  const completionRatePercentage =
    totalConsultationsStarted > 0
      ? Math.round((totalConsultationsCompleted / totalConsultationsStarted) * 100)
      : 0;

  const cacheHitRatePercentage =
    totalConsultationsCompleted > 0
      ? Math.round((totalCacheHits / totalConsultationsCompleted) * 100)
      : 0;

  const averageTicketCents =
    processedTransactions.size > 0 ? Math.round(grossRevenueCents / processedTransactions.size) : 0;

  const averageLiveCostCents =
    totalLiveChargedCalls > 0 ? Math.round(totalApiBrasilCostCents / totalLiveChargedCalls) : 0;

  // Monta lista de pacotes
  const creditPackageRows: VehicleHistoryCreditPackageRow[] = packages.map((pkg) => {
    const pkgPaidCents = pkg.total_paid_cents || 0;
    const consumed = pkg.credits_granted - pkg.credits_remaining;
    const estimatedCost = consumed * 3000;
    return {
      packageId: pkg.id,
      customerName: pkg.customer_profiles?.full_name || 'Parceiro B2B',
      customerEmail: pkg.customer_profiles?.email || '-',
      packageName: pkg.package_name,
      packageType: pkg.package_type,
      grantedAt: pkg.created_at,
      paymentChannel: pkg.payment_channel,
      totalPaidCents: pkg.total_paid_cents,
      creditsGranted: pkg.credits_granted,
      creditsRemaining: pkg.credits_remaining,
      creditsReserved: 0,
      creditsConsumed: consumed,
      creditsReleased: 0,
      status: pkg.status,
      totalProviderCostCents: estimatedCost,
      estimatedPackageMarginCents: pkgPaidCents > 0 ? pkgPaidCents - estimatedCost : null,
    };
  });

  return {
    dateRange,
    summary: {
      grossRevenueCents,
      confirmedRefundsCents,
      netRevenueCents,
      totalApiBrasilCostCents,
      estimatedGrossMarginCents,
      marginPercentage,
      totalConsultationsStarted,
      totalConsultationsCompleted,
      totalLiveChargedCalls,
      totalCacheHits,
      totalCreditConsultations,
      totalCreditsConsumed,
      totalCreditsReturned,
      totalPermanentFailures,
      totalPendingRefundsCount,
      totalPendingRefundsAmountCents,
      completionRatePercentage,
      cacheHitRatePercentage,
      averageTicketCents,
      averageLiveCostCents,
    },
    consultations: {
      items: consultationRows,
      total: consultationRows.length,
    },
    payments: {
      items: paymentRows,
      total: paymentRows.length,
    },
    creditPackages: {
      items: creditPackageRows,
      total: creditPackageRows.length,
    },
  };
}

async function executeFallbackQueries(
  adminDb: ReturnType<typeof createAdminClient>,
  startIso: string,
  endIso: string,
  dateRange: ReportDateRange,
  _filters: VehicleHistoryReportFilters,
): Promise<VehicleHistoryReportResult> {
  const [
    { data: consultationsData },
    { data: paymentsData },
    { data: refundsData },
    { data: packagesData },
  ] = await Promise.all([
    adminDb
      .from('customer_plate_consultations')
      .select('*, customer_profiles(full_name, email)')
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .order('created_at', { ascending: false }),
    adminDb
      .from('payment_transactions')
      .select('*')
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    adminDb
      .from('payment_refunds')
      .select('*')
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    adminDb
      .from('customer_credit_packages')
      .select('*, customer_profiles:user_id(full_name, email)')
      .order('created_at', { ascending: false }),
  ]);

  const consultations = consultationsData || [];
  const payments = paymentsData || [];
  const refunds = refundsData || [];

  let grossRevenueCents = 0;
  for (const pt of payments) {
    if (pt.status === 'approved') {
      grossRevenueCents += Math.round((pt.transaction_amount || 0) * 100);
    }
  }

  let confirmedRefundsCents = 0;
  let totalPendingRefundsCount = 0;
  let totalPendingRefundsAmountCents = 0;
  for (const pr of refunds) {
    if (pr.status === 'confirmed') {
      confirmedRefundsCents += pr.amount_cents || 0;
    } else if (pr.status === 'requested' || pr.status === 'pending') {
      totalPendingRefundsCount++;
      totalPendingRefundsAmountCents += pr.amount_cents || 0;
    }
  }

  const netRevenueCents = Math.max(0, grossRevenueCents - confirmedRefundsCents);
  let totalApiBrasilCostCents = 0;
  let totalLiveChargedCalls = 0;
  let totalCacheHits = 0;
  let totalCreditConsultations = 0;
  let totalConsultationsCompleted = 0;

  const consultationRows: VehicleHistoryConsultationRow[] = (
    consultations as Array<Record<string, unknown>>
  ).map((c) => {
    const customerProfiles = (c.customer_profiles || {}) as Record<string, unknown>;
    if (c.status === 'completed') totalConsultationsCompleted++;
    const isCache = Boolean(c.source_consultation_id);
    if (isCache) {
      totalCacheHits++;
    } else if (c.status === 'completed') {
      totalLiveChargedCalls++;
      totalApiBrasilCostCents += 3000;
    }
    if (c.payment_coverage_type === 'platform_credit') totalCreditConsultations++;

    return {
      consultationId: String(c.id || ''),
      shortId: String(c.id || '').substring(0, 8),
      consultedAt: String(c.created_at || ''),
      plate: String(c.plate || '-'),
      customerName: String(customerProfiles.full_name || 'Cliente AF'),
      customerEmail: String(customerProfiles.email || '-'),
      coverageType: String(c.payment_coverage_type || 'mercadopago'),
      consultationStatus: String(c.status || 'pending'),
      reportOrigin: isCache ? 'cache' : 'live',
      providerHttpStatus: 200,
      costSnapshotCents: isCache ? 0 : 3000,
      actualCostCents: isCache ? 0 : 3000,
      costStatus: isCache ? 'not_applicable' : 'incurred',
      publicPriceSnapshotCents: 3990,
      estimatedMarginCents: isCache ? 3990 : 990,
      deliveryAttempts: 1,
      hasReportData: Boolean(c.vehicle_data),
    };
  });

  const estimatedGrossMarginCents = netRevenueCents - totalApiBrasilCostCents;
  const marginPercentage =
    netRevenueCents > 0 ? Math.round((estimatedGrossMarginCents / netRevenueCents) * 100) : 0;

  return {
    dateRange,
    summary: {
      grossRevenueCents,
      confirmedRefundsCents,
      netRevenueCents,
      totalApiBrasilCostCents,
      estimatedGrossMarginCents,
      marginPercentage,
      totalConsultationsStarted: consultations.length,
      totalConsultationsCompleted,
      totalLiveChargedCalls,
      totalCacheHits,
      totalCreditConsultations,
      totalCreditsConsumed: totalCreditConsultations,
      totalCreditsReturned: 0,
      totalPermanentFailures: 0,
      totalPendingRefundsCount,
      totalPendingRefundsAmountCents,
      completionRatePercentage:
        consultations.length > 0
          ? Math.round((totalConsultationsCompleted / consultations.length) * 100)
          : 0,
      cacheHitRatePercentage:
        totalConsultationsCompleted > 0
          ? Math.round((totalCacheHits / totalConsultationsCompleted) * 100)
          : 0,
      averageTicketCents: payments.length > 0 ? Math.round(grossRevenueCents / payments.length) : 0,
      averageLiveCostCents: totalLiveChargedCalls > 0 ? 3000 : 0,
    },
    consultations: {
      items: consultationRows,
      total: consultationRows.length,
    },
    payments: {
      items: [],
      total: 0,
    },
    creditPackages: {
      items: [],
      total: (packagesData || []).length,
    },
  };
}
