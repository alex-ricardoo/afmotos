import { createAdminClient } from '../supabase/admin.ts';

export interface AnnualReportParams {
  year: number; // Ex: 2026
  includeMockTests?: boolean; // Default: false (estritamente excluídos por padrão)
  adminId?: string;
  adminName?: string;
}

export interface AnnualReportMonthItem {
  month: number; // 1 a 12
  monthLabel: string; // 'Janeiro', 'Fevereiro', etc.
  grossRevenueCents: number;
  confirmedRefundsCents: number;
  netRevenueCents: number;
  packageRevenueCents: number;
  apiBrasilCostCents: number;
  estimatedMarginCents: number;
  totalConsultations: number;
  liveCallsCount: number;
  cacheHitsCount: number;
  creditsConsumed: number;
}

export interface AnnualReportSummary {
  grossGatewayRevenueCents: number; // Receita bruta Mercado Pago aprovada
  confirmedRefundsCents: number; // (-) Estornos confirmados
  netGatewayRevenueCents: number; // (=) Receita líquida Mercado Pago

  externalPackagesRevenueCents: number; // Receitas comerciais informadas de pacotes
  totalEstimatedRevenueCents: number; // netGatewayRevenueCents + externalPackagesRevenueCents

  totalApiBrasilCostCents: number; // Custo total live incorrido
  estimatedGrossMarginCents: number; // totalEstimatedRevenueCents - totalApiBrasilCostCents

  totalCompletedConsultations: number;
  totalLiveChargedConsultations: number;
  totalCacheConsultations: number;
  averageCostPerLiveLookupCents: number;

  // Créditos B2B no Ano
  creditsGrantedAnnual: number;
  creditsConsumedAnnual: number;
  creditsReleasedAnnual: number;
  outstandingCreditBalanceYearEnd: number;

  pendingRefundsYearEndCount: number;
  pendingRefundsYearEndAmountCents: number;
}

export interface AnnualReportResult {
  metadata: {
    reportYear: number;
    generatedAt: string; // ISO 8601
    timezone: 'America/Sao_Paulo';
    generatedByAdminId: string;
    generatedByAdminName: string;
    isMockIncluded: boolean;
    disclaimer: string;
  };
  annualSummary: AnnualReportSummary;
  monthlyBreakdown: AnnualReportMonthItem[];
}

export const ACCOUNTANT_LEGAL_DISCLAIMER =
  'AVISO LEGAL DE APOIO GERENCIAL: Este documento é um relatório gerencial de apoio à organização financeira ' +
  'e contábil da AF Veículos PE. Não substitui notas fiscais (NFS-e), livros fiscais, extratos bancários de conta corrente, ' +
  'conciliação financeira bancária ou declaração tributária oficial perante os órgãos fazendários. Não constitui ' +
  'apuração fiscal de impostos nem orientação jurídica. Valide toda a escrituração e apuração de tributos diretamente ' +
  'com seu contador responsável.';

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface NormalizedViewRow {
  consultation_id?: string;
  consultation_created_at: string;
  plate?: string;
  coverage_type?: string;
  consultation_status?: string;
  is_cache_hit?: boolean;
  is_mock?: boolean;
  report_origin?: string;
  actual_cost_cents?: number;
  provider_cost_status?: string;
  payment_status?: string | null;
  gross_amount_cents?: number;
  refund_status?: string;
  refund_amount_cents?: number;
  net_amount_cents?: number;
}

/**
 * Consulta e agrega os dados analíticos anuais do Histórico Veicular mês a mês.
 */
export async function getVehicleHistoryAnnualReport(
  params: AnnualReportParams,
): Promise<AnnualReportResult> {
  const {
    year,
    includeMockTests = false,
    adminId = 'system',
    adminName = 'Administrador',
  } = params;
  const adminDb = createAdminClient();

  const startIso = `${year}-01-01T00:00:00.000Z`;
  const endIso = `${year}-12-31T23:59:59.999Z`;

  // Inicializa a grade mensal vazia para os 12 meses
  const monthlyBreakdown: AnnualReportMonthItem[] = MONTH_LABELS.map((label, index) => ({
    month: index + 1,
    monthLabel: label,
    grossRevenueCents: 0,
    confirmedRefundsCents: 0,
    netRevenueCents: 0,
    packageRevenueCents: 0,
    apiBrasilCostCents: 0,
    estimatedMarginCents: 0,
    totalConsultations: 0,
    liveCallsCount: 0,
    cacheHitsCount: 0,
    creditsConsumed: 0,
  }));

  // 1. Tenta buscar da view unificada
  let viewRows: NormalizedViewRow[] | null = null;
  try {
    let query = adminDb
      .from('admin_vehicle_history_financial_view')
      .select('*')
      .gte('consultation_created_at', startIso)
      .lte('consultation_created_at', endIso);

    if (!includeMockTests) {
      query = query.eq('is_mock', false);
    }

    const res = await query;
    if (!res.error && res.data) {
      viewRows = res.data as unknown as NormalizedViewRow[];
    }
  } catch (err) {
    console.warn('[AnnualReport] View admin_vehicle_history_financial_view não disponível:', err);
  }

  // 2. Se a view falhou, faz fallback para tabelas base
  if (!viewRows) {
    let consultQuery = adminDb
      .from('customer_plate_consultations')
      .select(
        `
        *,
        payment_transactions:payment_transaction_id (*),
        vehicle_lookup_provider_costs (*)
      `,
      )
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    if (!includeMockTests) {
      consultQuery = consultQuery.eq('is_mock', false);
    }

    const { data: baseConsultations } = await consultQuery;

    // Normaliza rows
    viewRows = ((baseConsultations || []) as unknown as Array<Record<string, unknown>>).map((c) => {
      const tx = (c.payment_transactions || {}) as Record<string, unknown>;
      const providerCosts = (c.vehicle_lookup_provider_costs || []) as Array<
        Record<string, unknown>
      >;
      const actualCost = providerCosts.reduce(
        (sum: number, pc) => sum + Number(pc.actual_cost_cents || 0),
        0,
      );
      const isCache =
        Boolean(c.is_cache_hit) ||
        Boolean(c.report_json && !c.pricing_version_id && actualCost === 0);

      return {
        consultation_id: String(c.id || ''),
        consultation_created_at: String(c.created_at || ''),
        plate: String(c.plate || ''),
        coverage_type: String(c.coverage_type || 'mercadopago'),
        consultation_status: String(c.status || ''),
        is_cache_hit: Boolean(c.is_cache_hit),
        is_mock: Boolean(c.is_mock),
        report_origin: c.is_mock ? 'mock' : isCache ? 'cache' : 'live',
        actual_cost_cents:
          typeof c.actual_cost_cents === 'number' ? c.actual_cost_cents : actualCost,
        provider_cost_status: String(
          c.provider_cost_status || (actualCost > 0 ? 'incurred' : 'not_applicable'),
        ),
        payment_status:
          (tx.status as string) ||
          (c.coverage_type === 'mercadopago' && c.status === 'completed' ? 'approved' : null),
        gross_amount_cents:
          Number(tx.gross_amount_cents) ||
          (c.coverage_type === 'mercadopago' && c.status === 'completed' ? 3990 : 0),
        refund_status: String(tx.refund_status || 'none'),
        refund_amount_cents: Number(tx.refund_amount_cents || 0),
        net_amount_cents: Number(tx.gross_amount_cents || 0) - Number(tx.refund_amount_cents || 0),
      };
    });
  }

  // 3. Busca pagamentos de transações gerais no ano (para cobrir pagamentos aprovados independentes)
  const { data: paymentsData } = await adminDb
    .from('payment_transactions')
    .select('*')
    .gte('created_at', startIso)
    .lte('created_at', endIso);

  // 4. Busca pacotes de créditos concedidos no ano
  const { data: packagesData } = await adminDb
    .from('customer_credit_packages')
    .select('*')
    .gte('created_at', startIso)
    .lte('created_at', endIso);

  // 5. Busca movimentações de ledger de créditos do ano
  const { data: ledgerData } = await adminDb
    .from('customer_credit_ledger')
    .select('*')
    .gte('created_at', startIso)
    .lte('created_at', endIso);

  // Processa consultas e custos mês a mês
  for (const row of viewRows || []) {
    const d = new Date(row.consultation_created_at);
    // Ajusta para mês 1-12 no timezone do objeto Date
    const monthIndex = d.getUTCMonth(); // 0 a 11
    if (monthIndex >= 0 && monthIndex < 12) {
      const monthItem = monthlyBreakdown[monthIndex];

      if (row.consultation_status === 'completed') {
        monthItem.totalConsultations++;
      }

      const cost = Number(row.actual_cost_cents || 0);
      if (cost > 0 && row.provider_cost_status === 'incurred') {
        monthItem.apiBrasilCostCents += cost;
        monthItem.liveCallsCount++;
      } else if (row.is_cache_hit || row.report_origin === 'cache') {
        monthItem.cacheHitsCount++;
      }
    }
  }

  // Processa pagamentos e estornos mês a mês
  let pendingRefundsYearEndCount = 0;
  let pendingRefundsYearEndAmountCents = 0;

  for (const tx of paymentsData || []) {
    const d = new Date(tx.created_at);
    const monthIndex = d.getUTCMonth();
    if (monthIndex >= 0 && monthIndex < 12) {
      const monthItem = monthlyBreakdown[monthIndex];

      if (tx.status === 'approved') {
        const gross = Number(tx.gross_amount_cents || 0);
        monthItem.grossRevenueCents += gross;
      }

      if (tx.refund_status === 'confirmed' || tx.refund_status === 'refunded') {
        const refundAmt = Number(tx.refund_amount_cents || 0);
        monthItem.confirmedRefundsCents += refundAmt;
      } else if (tx.refund_status === 'pending') {
        pendingRefundsYearEndCount++;
        pendingRefundsYearEndAmountCents += Number(
          tx.refund_amount_cents || tx.gross_amount_cents || 0,
        );
      }
    }
  }

  // Processa pacotes B2B comercializados mês a mês
  for (const pkg of packagesData || []) {
    const d = new Date(pkg.created_at);
    const monthIndex = d.getUTCMonth();
    if (monthIndex >= 0 && monthIndex < 12) {
      const monthItem = monthlyBreakdown[monthIndex];
      // Se houver preço ou receita informada para pacotes comerciais
      const priceCents = Number(pkg.price_paid_cents || pkg.unit_price_cents || 0);
      monthItem.packageRevenueCents += priceCents;
    }
  }

  // Processa créditos consumidos via ledger mês a mês
  let creditsGrantedAnnual = 0;
  let creditsConsumedAnnual = 0;
  let creditsReleasedAnnual = 0;

  for (const entry of ledgerData || []) {
    const d = new Date(entry.created_at);
    const monthIndex = d.getUTCMonth();
    const amount = Math.abs(Number(entry.amount || entry.credits || 0));
    const entryType = entry.entry_type || entry.type;

    if (entryType === 'grant' || entryType === 'purchase') {
      creditsGrantedAnnual += amount;
    } else if (entryType === 'consumption' || entryType === 'deduct') {
      creditsConsumedAnnual += amount;
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyBreakdown[monthIndex].creditsConsumed += amount;
      }
    } else if (entryType === 'refund' || entryType === 'release') {
      creditsReleasedAnnual += amount;
    }
  }

  // Finaliza cálculos derivados mês a mês
  for (const m of monthlyBreakdown) {
    m.netRevenueCents = m.grossRevenueCents - m.confirmedRefundsCents;
    m.estimatedMarginCents = m.netRevenueCents + m.packageRevenueCents - m.apiBrasilCostCents;
  }

  // Totalizadores anuais
  const grossGatewayRevenueCents = monthlyBreakdown.reduce(
    (sum, m) => sum + m.grossRevenueCents,
    0,
  );
  const confirmedRefundsCents = monthlyBreakdown.reduce(
    (sum, m) => sum + m.confirmedRefundsCents,
    0,
  );
  const netGatewayRevenueCents = grossGatewayRevenueCents - confirmedRefundsCents;
  const externalPackagesRevenueCents = monthlyBreakdown.reduce(
    (sum, m) => sum + m.packageRevenueCents,
    0,
  );
  const totalEstimatedRevenueCents = netGatewayRevenueCents + externalPackagesRevenueCents;
  const totalApiBrasilCostCents = monthlyBreakdown.reduce(
    (sum, m) => sum + m.apiBrasilCostCents,
    0,
  );
  const estimatedGrossMarginCents = totalEstimatedRevenueCents - totalApiBrasilCostCents;

  const totalCompletedConsultations = monthlyBreakdown.reduce(
    (sum, m) => sum + m.totalConsultations,
    0,
  );
  const totalLiveChargedConsultations = monthlyBreakdown.reduce(
    (sum, m) => sum + m.liveCallsCount,
    0,
  );
  const totalCacheConsultations = monthlyBreakdown.reduce((sum, m) => sum + m.cacheHitsCount, 0);

  const averageCostPerLiveLookupCents =
    totalLiveChargedConsultations > 0
      ? Math.round(totalApiBrasilCostCents / totalLiveChargedConsultations)
      : 0;

  const outstandingCreditBalanceYearEnd = Math.max(
    0,
    creditsGrantedAnnual - creditsConsumedAnnual + creditsReleasedAnnual,
  );

  return {
    metadata: {
      reportYear: year,
      generatedAt: new Date().toISOString(),
      timezone: 'America/Sao_Paulo',
      generatedByAdminId: adminId,
      generatedByAdminName: adminName,
      isMockIncluded: includeMockTests,
      disclaimer: ACCOUNTANT_LEGAL_DISCLAIMER,
    },
    annualSummary: {
      grossGatewayRevenueCents,
      confirmedRefundsCents,
      netGatewayRevenueCents,
      externalPackagesRevenueCents,
      totalEstimatedRevenueCents,
      totalApiBrasilCostCents,
      estimatedGrossMarginCents,
      totalCompletedConsultations,
      totalLiveChargedConsultations,
      totalCacheConsultations,
      averageCostPerLiveLookupCents,
      creditsGrantedAnnual,
      creditsConsumedAnnual,
      creditsReleasedAnnual,
      outstandingCreditBalanceYearEnd,
      pendingRefundsYearEndCount,
      pendingRefundsYearEndAmountCents,
    },
    monthlyBreakdown,
  };
}
