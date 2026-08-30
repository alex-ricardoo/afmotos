import { createClient } from '@/lib/supabase/server';
import {
  ReportDateRange,
  OverviewReportData,
  SalesReportData,
  FinancialReportData,
  InventoryReportData,
  CustomersReportData,
  AnnualAccountantReportData,
  StockMovementReportData,
  ConsignmentReportItem,
  VehicleResultReportItem,
  DataQualityIssueItem,
} from './types';
import { formatCurrencyBRL } from './formatters';
import { getPreviousPeriodRange } from './date-range';

/**
 * 1. Consulta e Agregação da Aba 1 (Visão Geral Executiva)
 */
export async function getOverviewReportData(
  dateRange: ReportDateRange,
): Promise<OverviewReportData> {
  const supabase = await createClient();
  const prevDateRange = getPreviousPeriodRange(dateRange);

  // Consultas paralelas no período atual
  const [
    { data: currentSales },
    { data: currentExpenses },
    { data: currentCustomers },
    { data: currentLeads },
    { data: prevSales },
    { data: prevExpenses },
    { data: prevCustomers },
    { data: prevLeads },
    { data: last6MonthsSales },
    { data: last6MonthsExpenses },
    { data: agreementsRaw },
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('id, sale_price, payment_method, payment_status, sale_date, motorcycle:motorcycles(id, ownership_type)')
      .gte('sale_date', dateRange.startDate)
      .lte('sale_date', dateRange.endDate),
    supabase
      .from('expenses')
      .select('id, amount, status, expense_type, expense_date')
      .gte('expense_date', dateRange.startDate)
      .lte('expense_date', dateRange.endDate),
    supabase
      .from('customers')
      .select('id')
      .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
      .lte('created_at', `${dateRange.endDate}T23:59:59Z`),
    supabase
      .from('leads')
      .select('id')
      .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
      .lte('created_at', `${dateRange.endDate}T23:59:59Z`),
    supabase
      .from('sales')
      .select('id, sale_price, payment_status, motorcycle:motorcycles(id, ownership_type)')
      .gte('sale_date', prevDateRange.startDate)
      .lte('sale_date', prevDateRange.endDate),
    supabase
      .from('expenses')
      .select('id, amount, status')
      .gte('expense_date', prevDateRange.startDate)
      .lte('expense_date', prevDateRange.endDate),
    supabase
      .from('customers')
      .select('id')
      .gte('created_at', `${prevDateRange.startDate}T00:00:00Z`)
      .lte('created_at', `${prevDateRange.endDate}T23:59:59Z`),
    supabase
      .from('leads')
      .select('id')
      .gte('created_at', `${prevDateRange.startDate}T00:00:00Z`)
      .lte('created_at', `${prevDateRange.endDate}T23:59:59Z`),
    supabase
      .from('sales')
      .select('id, sale_price, sale_date, payment_status, motorcycle:motorcycles(id, ownership_type)')
      .order('sale_date', { ascending: true }),
    supabase
      .from('expenses')
      .select('id, amount, expense_date, status')
      .order('expense_date', { ascending: true }),
    supabase
      .from('sale_agreements')
      .select('sale_id, commission_value'),
  ]);

  // Vendas confirmadas
  const paidSales = (currentSales || []).filter((s: any) => s.payment_status === 'PAID');
  const prevPaidSales = (prevSales || []).filter((s: any) => s.payment_status === 'PAID');

  const agreementMap: Record<string, number> = {};
  (agreementsRaw || []).forEach((a: any) => {
    if (a.sale_id && a.commission_value) {
      agreementMap[a.sale_id] = Number(a.commission_value);
    }
  });

  // Segregação: Própria (100% da venda entra na receita) vs Consignação (apenas comissão entra na receita)
  let grossRevenueValue = 0;
  let thirdPartyTransactedVolume = 0;
  let ownedSalesCount = 0;
  let consignmentSalesCount = 0;

  paidSales.forEach((s: any) => {
    const moto = Array.isArray(s.motorcycle) ? s.motorcycle[0] : s.motorcycle;
    const isConsignment = moto?.ownership_type === 'CONSIGNMENT';
    const salePrice = Number(s.sale_price || 0);

    if (isConsignment) {
      consignmentSalesCount += 1;
      thirdPartyTransactedVolume += salePrice;
      const commission = agreementMap[s.id] || 0;
      grossRevenueValue += commission;
    } else {
      ownedSalesCount += 1;
      grossRevenueValue += salePrice;
    }
  });

  let prevGrossRevenueValue = 0;
  prevPaidSales.forEach((s: any) => {
    const moto = Array.isArray(s.motorcycle) ? s.motorcycle[0] : s.motorcycle;
    const isConsignment = moto?.ownership_type === 'CONSIGNMENT';
    const salePrice = Number(s.sale_price || 0);

    if (isConsignment) {
      const commission = agreementMap[s.id] || 0;
      prevGrossRevenueValue += commission;
    } else {
      prevGrossRevenueValue += salePrice;
    }
  });

  const salesCountValue = paidSales.length;
  const prevSalesCountValue = prevPaidSales.length;

  const averageTicketValue = salesCountValue > 0 ? grossRevenueValue / salesCountValue : 0;
  const prevAverageTicketValue =
    prevSalesCountValue > 0 ? prevGrossRevenueValue / prevSalesCountValue : 0;

  // Despesas pagas vs pendentes
  const paidExpenses = (currentExpenses || []).filter((e) => e.status === 'PAID');
  const pendingExpenses = (currentExpenses || []).filter((e) => e.status === 'PENDING');
  const prevPaidExpenses = (prevExpenses || []).filter((e) => e.status === 'PAID');

  const totalExpensesValue = paidExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const totalExpensesPendingValue = pendingExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const prevTotalExpensesValue = prevPaidExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const estimatedOperatingResultValue = grossRevenueValue - totalExpensesValue;
  const prevEstimatedOperatingResultValue = prevGrossRevenueValue - prevTotalExpensesValue;

  const estimatedMarginPercentageValue =
    grossRevenueValue > 0 ? (estimatedOperatingResultValue / grossRevenueValue) * 100 : null;

  const newCustomersCountValue = (currentCustomers || []).length;
  const prevNewCustomersCountValue = (prevCustomers || []).length;

  const totalLeadsCountValue = (currentLeads || []).length;
  const prevTotalLeadsCountValue = (prevLeads || []).length;

  // Helpers de comparação percentual
  const calcComparison = (curr: number, prev: number): number | null => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Number((((curr - prev) / prev) * 100).toFixed(1));
  };

  // Agrupamento de evolução por mês (Últimos 6 meses)
  const monthMap: Record<
    string,
    { revenue: number; expenses: number; salesCount: number; label: string; fullLabel: string }
  > = {};

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const fullMonths = [
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

  // Preenche últimos 6 meses cronológicos
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${yyyy}-${mm}`;
    monthMap[key] = {
      revenue: 0,
      expenses: 0,
      salesCount: 0,
      label: `${months[d.getMonth()]}/${String(yyyy).slice(2)}`,
      fullLabel: `${fullMonths[d.getMonth()]} de ${yyyy}`,
    };
  }

  (last6MonthsSales || []).forEach((s) => {
    if (s.payment_status !== 'PAID' || !s.sale_date) return;
    const key = s.sale_date.substring(0, 7);
    if (monthMap[key]) {
      monthMap[key].revenue += Number(s.sale_price || 0);
      monthMap[key].salesCount += 1;
    }
  });

  (last6MonthsExpenses || []).forEach((e) => {
    if (e.status !== 'PAID' || !e.expense_date) return;
    const key = e.expense_date.substring(0, 7);
    if (monthMap[key]) {
      monthMap[key].expenses += Number(e.amount || 0);
    }
  });

  const revenueVsExpenseEvolution = Object.entries(monthMap).map(([key, val]) => ({
    periodKey: key,
    label: val.label,
    fullLabel: val.fullLabel,
    revenue: val.revenue,
    expenses: val.expenses,
    operatingResult: val.revenue - val.expenses,
    salesCount: val.salesCount,
  }));

  // Distribuição por Meio de Pagamento
  const methodMap: Record<string, { count: number; total: number; label: string }> = {
    PIX: { count: 0, total: 0, label: 'Pix' },
    CASH: { count: 0, total: 0, label: 'Dinheiro' },
    FINANCING: { count: 0, total: 0, label: 'Financiamento' },
    CREDIT_CARD: { count: 0, total: 0, label: 'Cartão de Crédito' },
    DEBIT_CARD: { count: 0, total: 0, label: 'Cartão de Débito' },
    TRADE: { count: 0, total: 0, label: 'Troca / Permuta' },
    TRANSFER: { count: 0, total: 0, label: 'Transferência Bancária' },
    BOLETO: { count: 0, total: 0, label: 'Boleto Bancário' },
    OTHER: { count: 0, total: 0, label: 'Outros / Não Informado' },
  };

  paidSales.forEach((s) => {
    const rawMethod = (s.payment_method || 'OTHER').toUpperCase();
    const targetKey = methodMap[rawMethod] ? rawMethod : 'OTHER';
    methodMap[targetKey].count += 1;
    methodMap[targetKey].total += Number(s.sale_price || 0);
  });

  const paymentDistribution = Object.entries(methodMap)
    .filter(([_, data]) => data.count > 0)
    .map(([method, data]) => ({
      method,
      label: data.label,
      count: data.count,
      totalAmount: data.total,
      percentage: grossRevenueValue > 0 ? (data.total / grossRevenueValue) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    dateRange,
    grossRevenue: {
      value: grossRevenueValue,
      formattedValue: formatCurrencyBRL(grossRevenueValue),
      confidence: 'confirmed',
      comparisonPercentage: calcComparison(grossRevenueValue, prevGrossRevenueValue),
      tooltipFormula: 'Soma de vendas com pagamento confirmado no período.',
    },
    salesCount: {
      value: salesCountValue,
      formattedValue: `${salesCountValue} ${salesCountValue === 1 ? 'moto' : 'motos'}`,
      confidence: 'confirmed',
      comparisonPercentage: calcComparison(salesCountValue, prevSalesCountValue),
      tooltipFormula: 'Contagem de motos com venda realizada no período.',
    },
    averageTicket: {
      value: averageTicketValue,
      formattedValue: formatCurrencyBRL(averageTicketValue),
      confidence: 'confirmed',
      comparisonPercentage: calcComparison(averageTicketValue, prevAverageTicketValue),
      tooltipFormula: 'Faturamento bruto dividido pela quantidade de vendas.',
    },
    totalExpenses: {
      value: totalExpensesValue,
      formattedValue: formatCurrencyBRL(totalExpensesValue),
      confidence: 'confirmed',
      comparisonPercentage: calcComparison(totalExpensesValue, prevTotalExpensesValue),
      tooltipFormula: 'Total de despesas efetivamente pagas no período.',
    },
    totalExpensesPending: {
      value: totalExpensesPendingValue,
      formattedValue: formatCurrencyBRL(totalExpensesPendingValue),
      confidence: 'confirmed',
      tooltipFormula: 'Total de despesas com pagamento pendente no período.',
    },
    estimatedOperatingResult: {
      value: estimatedOperatingResultValue,
      formattedValue: formatCurrencyBRL(estimatedOperatingResultValue),
      confidence: 'estimated',
      confidenceReason:
        'Resultado gerencial simplificado (Receita - Despesas Pagas). Não inclui custos não cadastrados ou provisões tributárias.',
      comparisonPercentage: calcComparison(
        estimatedOperatingResultValue,
        prevEstimatedOperatingResultValue,
      ),
      tooltipFormula: 'Faturamento Bruto - Total de Despesas Pagas.',
    },
    estimatedMarginPercentage: {
      value: estimatedMarginPercentageValue,
      formattedValue:
        estimatedMarginPercentageValue !== null
          ? `${estimatedMarginPercentageValue.toFixed(1)}%`
          : 'Indisponível',
      confidence: estimatedMarginPercentageValue !== null ? 'estimated' : 'unavailable',
      confidenceReason:
        'Margem operacional gerencial calculada sobre o faturamento do período.',
      tooltipFormula: '(Resultado Operacional Estimado / Faturamento Bruto) * 100',
    },
    newCustomersCount: {
      value: newCustomersCountValue,
      formattedValue: `${newCustomersCountValue}`,
      confidence: 'confirmed',
      comparisonPercentage: calcComparison(newCustomersCountValue, prevNewCustomersCountValue),
    },
    totalLeadsCount: {
      value: totalLeadsCountValue,
      formattedValue: `${totalLeadsCountValue}`,
      confidence: 'confirmed',
      comparisonPercentage: calcComparison(totalLeadsCountValue, prevTotalLeadsCountValue),
    },
    thirdPartyTransactedVolume: {
      value: thirdPartyTransactedVolume,
      formattedValue: formatCurrencyBRL(thirdPartyTransactedVolume),
      confidence: 'confirmed',
      tooltipFormula: 'Valor total transacionado de veículos de terceiros (pago diretamente aos proprietários).',
    },
    ownedSalesCount,
    consignmentSalesCount,
    revenueVsExpenseEvolution,
    paymentDistribution,
  };
}

/**
 * 2. Consulta da Aba 2 (Relatório Comercial e Vendas)
 */
export async function getSalesReportData(dateRange: ReportDateRange): Promise<SalesReportData> {
  const supabase = await createClient();

  const [{ data: salesRaw }, { data: agreementsRaw }] = await Promise.all([
    supabase
      .from('sales')
      .select(
        `
        id,
        sale_price,
        sale_date,
        payment_method,
        payment_status,
        receipt_number,
        buyer_name,
        buyer_phone,
        buyer_document,
        entry_amount,
        financed_amount,
        trade_amount,
        motorcycle_id,
        customer_id,
        motorcycle:motorcycles (
          id,
          brand,
          model,
          version,
          license_plate,
          operation_type,
          ownership_type
        )
      `,
      )
      .gte('sale_date', dateRange.startDate)
      .lte('sale_date', dateRange.endDate)
      .order('sale_date', { ascending: false }),
    supabase.from('sale_agreements').select('sale_id, commission_value'),
  ]);

  const agreementMap: Record<string, number> = {};
  (agreementsRaw || []).forEach((a: any) => {
    if (a.sale_id && a.commission_value) {
      agreementMap[a.sale_id] = Number(a.commission_value);
    }
  });

  const sales = (salesRaw || []).filter((s: any) => s.payment_status === 'PAID');
  const salesCount = sales.length;

  let totalSalesValue = 0; // Receita real que entrou na conta da AF Motos
  let totalGrossVolume = 0; // Volume global
  let ownedSalesTotal = 0;
  let consignmentCommissionsTotal = 0;
  let consignmentTransactedVolume = 0;

  // Lista analítica detalhada com segregação contábil
  const detailedSalesList = sales.map((s: any) => {
    const moto = Array.isArray(s.motorcycle) ? s.motorcycle[0] : s.motorcycle;
    const isConsignment = moto?.ownership_type === 'CONSIGNMENT';
    const salePrice = Number(s.sale_price || 0);
    const commVal = isConsignment ? (agreementMap[s.id] ?? null) : null;
    const storeRevenue = isConsignment ? (commVal || 0) : salePrice;
    const payoutToOwner = isConsignment ? (salePrice - (commVal || 0)) : null;

    totalGrossVolume += salePrice;
    totalSalesValue += storeRevenue;

    if (isConsignment) {
      consignmentTransactedVolume += salePrice;
      consignmentCommissionsTotal += (commVal || 0);
    } else {
      ownedSalesTotal += salePrice;
    }

    return {
      id: s.id,
      saleDate: s.sale_date,
      motorcycleId: s.motorcycle_id,
      motorcycleLabel: `${moto?.brand || ''} ${moto?.model || ''}`.trim() || 'Motocicleta',
      motorcyclePlate: moto?.license_plate || null,
      ownershipType: (moto?.ownership_type || 'OWNED') as 'OWNED' | 'CONSIGNMENT',
      customerId: s.customer_id,
      buyerName: s.buyer_name,
      buyerPhone: s.buyer_phone,
      buyerDocument: s.buyer_document,
      salePrice,
      storeRevenue,
      commissionValue: commVal,
      payoutToOwner,
      entryAmount: s.entry_amount ? Number(s.entry_amount) : null,
      financedAmount: s.financed_amount ? Number(s.financed_amount) : null,
      tradeAmount: s.trade_amount ? Number(s.trade_amount) : null,
      paymentMethod: s.payment_method,
      paymentStatus: s.payment_status,
      receiptNumber: s.receipt_number,
      linkedExpensesTotal: 0,
      estimatedMargin: storeRevenue,
    };
  });

  const averageTicket = salesCount > 0 ? totalSalesValue / salesCount : 0;

  // Maior e Menor Venda
  let highestSale = null;
  let lowestSale = null;

  if (sales.length > 0) {
    const sorted = [...sales].sort((a: any, b: any) => Number(b.sale_price) - Number(a.sale_price));
    const highest: any = sorted[0];
    const lowest: any = sorted[sorted.length - 1];

    const highestMoto = Array.isArray(highest.motorcycle) ? highest.motorcycle[0] : highest.motorcycle;
    const lowestMoto = Array.isArray(lowest.motorcycle) ? lowest.motorcycle[0] : lowest.motorcycle;

    highestSale = {
      id: highest.id,
      model: `${highestMoto?.brand || ''} ${highestMoto?.model || ''}`.trim() || 'Moto',
      value: Number(highest.sale_price),
      date: highest.sale_date,
    };

    lowestSale = {
      id: lowest.id,
      model: `${lowestMoto?.brand || ''} ${lowestMoto?.model || ''}`.trim() || 'Moto',
      value: Number(lowest.sale_price),
      date: lowest.sale_date,
    };
  }

  // Ranking de Marcas
  const brandMap: Record<string, { count: number; totalRevenue: number }> = {};
  sales.forEach((s: any) => {
    const moto = Array.isArray(s.motorcycle) ? s.motorcycle[0] : s.motorcycle;
    const brand = moto?.brand || 'Outras';
    if (!brandMap[brand]) {
      brandMap[brand] = { count: 0, totalRevenue: 0 };
    }
    brandMap[brand].count += 1;
    brandMap[brand].totalRevenue += Number(s.sale_price || 0);
  });

  const salesByBrand = Object.entries(brandMap)
    .map(([brand, data]) => ({
      brand,
      count: data.count,
      totalRevenue: data.totalRevenue,
      percentage: totalSalesValue > 0 ? (data.totalRevenue / totalSalesValue) * 100 : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    dateRange,
    totalSalesValue,
    salesCount,
    averageTicket,
    highestSale,
    lowestSale,
    salesByBrand,
    salesByCategory: [],
    salesByOperationType: [],
    detailedSalesList,
  };
}

/**
 * 3. Consulta da Aba 3 (Financeiro e Despesas)
 */
export async function getFinancialReportData(
  dateRange: ReportDateRange,
): Promise<FinancialReportData> {
  const supabase = await createClient();

  const [{ data: salesRaw }, { data: expensesRaw }] = await Promise.all([
    supabase
      .from('sales')
      .select('sale_price, payment_status')
      .gte('sale_date', dateRange.startDate)
      .lte('sale_date', dateRange.endDate),
    supabase
      .from('expenses')
      .select(
        `
        id,
        amount,
        expense_date,
        expense_type,
        payment_method,
        status,
        motorcycle_id,
        category:expense_categories (
          id,
          name,
          slug,
          expense_type
        ),
        motorcycle:motorcycles (
          id,
          brand,
          model,
          license_plate
        )
      `,
      )
      .gte('expense_date', dateRange.startDate)
      .lte('expense_date', dateRange.endDate),
  ]);

  const paidSales = (salesRaw || []).filter((s) => s.payment_status === 'PAID');
  const totalRevenue = paidSales.reduce((acc, s) => acc + Number(s.sale_price || 0), 0);

  const expenses = expensesRaw || [];
  const paidExpenses = expenses.filter((e: any) => e.status === 'PAID');
  const pendingExpenses = expenses.filter((e: any) => e.status === 'PENDING');

  const totalExpensesPaid = paidExpenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
  const totalExpensesPending = pendingExpenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);

  const expensesByVehicle = paidExpenses
    .filter((e: any) => e.expense_type === 'MOTO')
    .reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);

  const expensesByStore = paidExpenses
    .filter((e: any) => e.expense_type === 'LOJA')
    .reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);

  const estimatedOperatingResult = totalRevenue - totalExpensesPaid;

  const paymentMethodLabelMap: Record<string, string> = {
    PIX: 'Pix',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    CASH: 'Dinheiro',
    TRANSFER: 'Transferência',
    BOLETO: 'Boleto',
    DIRECT_DEBIT: 'Débito em Conta',
    OTHER: 'Outro',
  };

  // Agrupamento por Categoria com Formas de Pagamento
  const categoryMap: Record<
    string,
    { name: string; type: 'MOTO' | 'LOJA'; count: number; total: number; methods: Set<string> }
  > = {};

  paidExpenses.forEach((e: any) => {
    const cat = Array.isArray(e.category) ? e.category[0] : e.category;
    const catId = cat?.id || 'outros';
    const catName = cat?.name || 'Outras Despesas';
    const catType = (e.expense_type || 'LOJA') as 'MOTO' | 'LOJA';
    const rawMethod = e.payment_method || 'PIX';
    const methodLabel = paymentMethodLabelMap[rawMethod] || rawMethod;

    if (!categoryMap[catId]) {
      categoryMap[catId] = { name: catName, type: catType, count: 0, total: 0, methods: new Set() };
    }
    categoryMap[catId].count += 1;
    categoryMap[catId].total += Number(e.amount || 0);
    categoryMap[catId].methods.add(methodLabel);
  });

  const expensesByCategory = Object.entries(categoryMap)
    .map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      expenseType: data.type,
      count: data.count,
      totalAmount: data.total,
      percentageOfTotal: totalExpensesPaid > 0 ? (data.total / totalExpensesPaid) * 100 : 0,
      paymentMethodLabel: Array.from(data.methods).join(', ') || 'Pix',
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Gastos por Motocicleta
  const motoMap: Record<string, { label: string; plate: string | null; count: number; total: number }> =
    {};

  paidExpenses
    .filter((e: any) => e.motorcycle_id)
    .forEach((e: any) => {
      const mId = e.motorcycle_id;
      const moto = Array.isArray(e.motorcycle) ? e.motorcycle[0] : e.motorcycle;
      const label = `${moto?.brand || ''} ${moto?.model || ''}`.trim() || 'Moto Sem Nome';
      const plate = moto?.license_plate || null;

      if (!motoMap[mId]) {
        motoMap[mId] = { label, plate, count: 0, total: 0 };
      }
      motoMap[mId].count += 1;
      motoMap[mId].total += Number(e.amount || 0);
    });

  const expensesByMotorcycleRanking = Object.entries(motoMap)
    .map(([id, data]) => ({
      motorcycleId: id,
      motorcycleLabel: data.label,
      plate: data.plate,
      expensesCount: data.count,
      totalExpenses: data.total,
    }))
    .sort((a, b) => b.totalExpenses - a.totalExpenses);

  return {
    dateRange,
    totalRevenue,
    totalExpensesPaid,
    totalExpensesPending,
    expensesByVehicle,
    expensesByStore,
    estimatedOperatingResult,
    expensesByCategory,
    expensesByMotorcycleRanking,
  };
}

/**
 * 4. Consulta da Aba 4 (Estoque e Idade de Pátio)
 */
export async function getInventoryReportData(
  dateRange: ReportDateRange,
): Promise<InventoryReportData> {
  const supabase = await createClient();

  const [{ data: activeMotos }, { data: soldMotosInPeriod }] = await Promise.all([
    supabase
      .from('motorcycles')
      .select(
        'id, internal_code, brand, model, year_model, price, fipe_price, status, ownership_type, created_at',
      )
      .in('status', ['AVAILABLE', 'RESERVED', 'MAINTENANCE']),
    supabase
      .from('sales')
      .select('id')
      .gte('sale_date', dateRange.startDate)
      .lte('sale_date', dateRange.endDate)
      .eq('payment_status', 'PAID'),
  ]);

  const active = activeMotos || [];
  const activeCount = active.length;
  const ownedCount = active.filter((m) => m.ownership_type === 'OWNED').length;
  const consignmentCount = active.filter((m) => m.ownership_type === 'CONSIGNMENT').length;

  const totalAnnouncedValue = active.reduce((acc, m) => acc + Number(m.price || 0), 0);
  const totalFipeEstimatedValue = active.reduce((acc, m) => acc + Number(m.fipe_price || 0), 0);

  const now = new Date();
  let totalDays = 0;

  const ageDistribution = {
    under30Days: 0,
    between31And60Days: 0,
    between61And90Days: 0,
    over90Days: 0,
  };

  const motosRequiringAttention: any[] = [];

  active.forEach((m) => {
    const entryDate = m.created_at ? new Date(m.created_at) : now;
    const diffMs = now.getTime() - entryDate.getTime();
    const daysInStock = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    totalDays += daysInStock;

    if (daysInStock <= 30) {
      ageDistribution.under30Days += 1;
    } else if (daysInStock <= 60) {
      ageDistribution.between31And60Days += 1;
    } else if (daysInStock <= 90) {
      ageDistribution.between61And90Days += 1;
    } else {
      ageDistribution.over90Days += 1;
    }

    if (daysInStock > 60 || (m.fipe_price && m.price && m.price > m.fipe_price * 1.15)) {
      let reason = '';
      let action = '';

      if (daysInStock > 90) {
        reason = `Estoque Crítico (${daysInStock} dias em pátio)`;
        action = 'Avaliar desconto ou campanha promocional';
      } else if (daysInStock > 60) {
        reason = `Atenção de Giro (${daysInStock} dias em pátio)`;
        action = 'Destacar no site e intensificar fotos/vídeos';
      } else {
        reason = 'Preço anunciado > 15% acima da Tabela FIPE';
        action = 'Revisar precificação de mercado';
      }

      motosRequiringAttention.push({
        id: m.id,
        internalCode: m.internal_code || 'S/N',
        brand: m.brand,
        model: m.model,
        yearModel: m.year_model,
        daysInStock,
        price: Number(m.price || 0),
        fipePrice: m.fipe_price ? Number(m.fipe_price) : null,
        status: m.status,
        ownershipType: (m.ownership_type || 'OWNED') as 'OWNED' | 'CONSIGNMENT',
        reason,
        suggestedAction: action,
      });
    }
  });

  const averageInventoryAgeDays = activeCount > 0 ? Math.round(totalDays / activeCount) : 0;
  const soldInPeriodCount = (soldMotosInPeriod || []).length;

  return {
    dateRange,
    activeCount,
    ownedCount,
    consignmentCount,
    totalAnnouncedValue,
    totalFipeEstimatedValue,
    averageInventoryAgeDays,
    soldInPeriodCount,
    ageDistribution,
    motosRequiringAttention: motosRequiringAttention.sort((a, b) => b.daysInStock - a.daysInStock),
  };
}

/**
 * 5. Consulta da Aba 5 (Clientes e Leads)
 */
export async function getCustomersReportData(
  dateRange: ReportDateRange,
): Promise<CustomersReportData> {
  const supabase = await createClient();

  const [
    { data: customersRaw },
    { data: leadsRaw },
    { data: sellRequestsRaw },
    { data: rentalRequestsRaw },
    { data: salesRaw },
  ] = await Promise.all([
    supabase
      .from('customers')
      .select('id, source, created_at')
      .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
      .lte('created_at', `${dateRange.endDate}T23:59:59Z`),
    supabase
      .from('leads')
      .select('id, source, created_at')
      .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
      .lte('created_at', `${dateRange.endDate}T23:59:59Z`),
    supabase
      .from('sell_requests')
      .select('id, created_at')
      .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
      .lte('created_at', `${dateRange.endDate}T23:59:59Z`),
    supabase
      .from('rental_requests')
      .select('id, created_at')
      .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
      .lte('created_at', `${dateRange.endDate}T23:59:59Z`),
    supabase
      .from('sales')
      .select('id, customer_id')
      .gte('sale_date', dateRange.startDate)
      .lte('sale_date', dateRange.endDate)
      .eq('payment_status', 'PAID'),
  ]);

  const customers = customersRaw || [];
  const newCustomersCount = customers.length;
  const totalLeadsCount = (leadsRaw || []).length;
  const sellRequestsCount = (sellRequestsRaw || []).length;
  const rentalRequestsCount = (rentalRequestsRaw || []).length;

  // Origem dos Clientes
  const sourceLabelMap: Record<string, string> = {
    manual: 'Balcão / Cadastro Manual',
    website_sell_request: 'Site (Venda sua Moto)',
    website_consignment_request: 'Site (Consignação)',
    website_contact: 'Site (Formulário Contato)',
    sale_registration: 'Conversão em Venda Direta',
    rental_registration: 'Locação / Aluguel',
    admin_proposal: 'Proposta Comercial',
    imported: 'Importação / Legado',
    other: 'Outros Canais',
  };

  const sourceCountMap: Record<string, number> = {};
  customers.forEach((c) => {
    const src = c.source || 'other';
    sourceCountMap[src] = (sourceCountMap[src] || 0) + 1;
  });

  const customersBySource = Object.entries(sourceCountMap)
    .map(([source, count]) => ({
      source,
      label: sourceLabelMap[source] || source,
      count,
      percentage: newCustomersCount > 0 ? (count / newCustomersCount) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const convertedSales = (salesRaw || []).filter((s) => s.customer_id !== null).length;
  const totalTopFunnel = totalLeadsCount + sellRequestsCount + rentalRequestsCount;
  const conversionRate = totalTopFunnel > 0 ? (convertedSales / totalTopFunnel) * 100 : null;

  return {
    dateRange,
    newCustomersCount,
    totalLeadsCount,
    sellRequestsCount,
    rentalRequestsCount,
    customersBySource,
    conversionFunnel: {
      totalLeads: totalTopFunnel,
      convertedSales,
      conversionRate,
    },
  };
}

/**
 * 6. Consulta Consolidada para Fechamento Anual & Central do Contador
 */
export async function getAnnualAccountantReportData(
  dateRange: ReportDateRange,
): Promise<AnnualAccountantReportData> {
  const supabase = await createClient();

  const [
    overview,
    sales,
    financial,
    inventory,
    customers,
    { data: consignmentsRaw },
    { data: agreementsRaw },
    { data: allMotorcyclesRaw },
    { data: allExpensesRaw },
    { data: rawSalesWithoutJoin },
  ] = await Promise.all([
    getOverviewReportData(dateRange),
    getSalesReportData(dateRange),
    getFinancialReportData(dateRange),
    getInventoryReportData(dateRange),
    getCustomersReportData(dateRange),
    supabase
      .from('consignments')
      .select(
        `
        id,
        asking_price,
        advertised_price,
        commission_type,
        commission_value,
        commission_amount,
        contract_status,
        start_date,
        end_date,
        motorcycle:motorcycles(brand, model, license_plate),
        owner:motorcycle_owners(name)
      `,
      )
      .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
      .lte('created_at', `${dateRange.endDate}T23:59:59Z`),
    supabase
      .from('sale_agreements')
      .select('id, sale_id, commission_percentage, commission_value, expected_sale_value, status')
      .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
      .lte('created_at', `${dateRange.endDate}T23:59:59Z`),
    supabase.from('motorcycles').select('id, brand, model, price, status, ownership_type, created_at'),
    supabase.from('expenses').select('id, amount, status, category_id, motorcycle_id, expense_date'),
    supabase.from('sales').select('id, payment_method, customer_id, receipt_number, sale_date'),
  ]);

  // 1. Movimentação de Estoque
  const allMotos = allMotorcyclesRaw || [];
  const periodStart = new Date(`${dateRange.startDate}T00:00:00Z`);
  const periodEnd = new Date(`${dateRange.endDate}T23:59:59Z`);

  const initialStock = allMotos.filter(
    (m) => new Date(m.created_at) < periodStart && m.status === 'AVAILABLE',
  );
  const entriesOwned = allMotos.filter((m) => {
    const d = new Date(m.created_at);
    return d >= periodStart && d <= periodEnd && m.ownership_type === 'OWNED';
  });
  const entriesConsignment = allMotos.filter((m) => {
    const d = new Date(m.created_at);
    return d >= periodStart && d <= periodEnd && m.ownership_type === 'CONSIGNMENT';
  });

  const stockMovement: StockMovementReportData = {
    initialStockCount: initialStock.length,
    initialStockValue: initialStock.reduce((acc, m) => acc + Number(m.price || 0), 0),
    entriesOwnedCount: entriesOwned.length,
    entriesConsignmentCount: entriesConsignment.length,
    salesCount: sales.salesCount,
    finalStockCount: inventory.activeCount,
    finalStockValue: inventory.totalAnnouncedValue,
  };

  // 2. Comissões e Consignações
  const consignments: ConsignmentReportItem[] = (consignmentsRaw || []).map((c: any) => {
    const moto = Array.isArray(c.motorcycle) ? c.motorcycle[0] : c.motorcycle;
    const owner = Array.isArray(c.owner) ? c.owner[0] : c.owner;
    const asking = Number(c.asking_price || 0);
    const advertised = Number(c.advertised_price || 0);
    const commAmount = c.commission_amount ? Number(c.commission_amount) : advertised - asking;
    const payout = advertised > 0 && commAmount > 0 ? advertised - commAmount : asking;

    return {
      id: c.id,
      motorcycleLabel: `${moto?.brand || ''} ${moto?.model || ''}`.trim() || 'Moto Consignada',
      plate: moto?.license_plate || null,
      ownerName: owner?.name || null,
      askingPrice: asking,
      advertisedPrice: advertised,
      commissionType: c.commission_type || 'percentage',
      commissionValue: Number(c.commission_value || 0),
      commissionAmount: commAmount > 0 ? commAmount : null,
      payoutToOwner: payout,
      contractStatus: c.contract_status || 'DRAFT',
      startDate: c.start_date,
      endDate: c.end_date,
    };
  });

  // 3. Resultado por Veículo (com tratamento estrito de custo ausente)
  const vehicleExpenseMap: Record<string, number> = {};
  (allExpensesRaw || []).forEach((e) => {
    if (e.motorcycle_id && e.status === 'PAID') {
      vehicleExpenseMap[e.motorcycle_id] =
        (vehicleExpenseMap[e.motorcycle_id] || 0) + Number(e.amount || 0);
    }
  });

  const vehicleResults: VehicleResultReportItem[] = sales.detailedSalesList.map((sale) => {
    const linkedExpenses = vehicleExpenseMap[sale.motorcycleId] || 0;
    const isConsignment = sale.ownershipType === 'CONSIGNMENT';

    // Regra estrita: Se moto própria e não há custo de aquisição lançado, não presumir zero
    const hasAcquisitionCost = false; // Em evolução futura será preenchido
    const acquisitionCost = null;

    let estimatedResult: number | null = null;
    let confidence: any = 'unavailable';
    let confidenceReason = 'Custo de aquisição individual não cadastrado.';

    if (isConsignment) {
      const agreement = (agreementsRaw || []).find((a) => a.sale_id === sale.id);
      const commVal = agreement?.commission_value ? Number(agreement.commission_value) : null;
      if (commVal !== null) {
        estimatedResult = commVal - linkedExpenses;
        confidence = 'estimated';
        confidenceReason = 'Comissão contratual apurada menos despesas de preparação.';
      }
    }

    return {
      motorcycleId: sale.motorcycleId,
      motorcycleLabel: sale.motorcycleLabel,
      plate: sale.motorcyclePlate,
      ownershipType: sale.ownershipType as 'OWNED' | 'CONSIGNMENT',
      entryDate: null,
      saleDate: sale.saleDate,
      daysInStock: 0,
      acquisitionCost,
      linkedExpenses,
      salePrice: sale.salePrice,
      commissionReceived: null,
      payoutToOwner: null,
      estimatedResult,
      confidence,
      confidenceReason,
    };
  });

  // 4. Auditoria de Qualidade & Pendências Cadastrais
  const dataQualityIssues: DataQualityIssueItem[] = [];

  const rawSales = rawSalesWithoutJoin || [];
  const salesWithoutMethod = rawSales.filter((s) => !s.payment_method).length;
  if (salesWithoutMethod > 0) {
    dataQualityIssues.push({
      id: 'sales-no-method',
      category: 'SALES',
      title: 'Vendas sem Meio de Pagamento Registrado',
      count: salesWithoutMethod,
      impact: 'Dificulta a conciliação bancária e extrato de formas de recebimento.',
      recommendedAction: 'Editar o cadastro da venda e definir a forma de pagamento (Pix, Cartão, Dinheiro).',
      adminLink: '/admin/vendas',
    });
  }

  const salesWithoutCustomer = rawSales.filter((s) => !s.customer_id).length;
  if (salesWithoutCustomer > 0) {
    dataQualityIssues.push({
      id: 'sales-no-customer',
      category: 'SALES',
      title: 'Vendas sem Cliente Vinculado ao CRM',
      count: salesWithoutCustomer,
      impact: 'Impede o rastreio cadastral e emissão de recibo com dados completos do comprador.',
      recommendedAction: 'Vincular o comprador cadastrado na base de clientes.',
      adminLink: '/admin/vendas',
    });
  }

  const salesWithoutReceipt = rawSales.filter((s) => !s.receipt_number).length;
  if (salesWithoutReceipt > 0) {
    dataQualityIssues.push({
      id: 'sales-no-receipt',
      category: 'SALES',
      title: 'Vendas sem Número de Recibo Oficial',
      count: salesWithoutReceipt,
      impact: 'Risco de ausência de numeração sequencial para controle contábil.',
      recommendedAction: 'Gerar o recibo oficial de venda na página do registro.',
      adminLink: '/admin/vendas',
    });
  }

  const pendingExpCount = (allExpensesRaw || []).filter((e) => e.status === 'PENDING').length;
  if (pendingExpCount > 0) {
    dataQualityIssues.push({
      id: 'expenses-pending',
      category: 'EXPENSES',
      title: 'Despesas Lançadas com Status Pendente',
      count: pendingExpCount,
      impact: 'Valores pendentes não entram no demonstrativo de despesas pagas do exercício.',
      recommendedAction: 'Dar baixa e informar a data de pagamento assim que quitadas.',
      adminLink: '/admin/gastos',
    });
  }

  const motosWithoutFipe = inventory.motosRequiringAttention.filter((m) => !m.fipePrice).length;
  if (motosWithoutFipe > 0) {
    dataQualityIssues.push({
      id: 'motos-no-fipe',
      category: 'MOTORCYCLES',
      title: 'Motos em Pátio sem Referência da Tabela FIPE',
      count: motosWithoutFipe,
      impact: 'Impede o cálculo do valor FIPE estimado do estoque em 31/12.',
      recommendedAction: 'Realizar consulta FIPE na ficha da motocicleta para vincular o código oficial.',
      adminLink: '/admin/fipe',
    });
  }

  return {
    overview,
    sales,
    financial,
    inventory,
    customers,
    stockMovement,
    consignments,
    vehicleResults,
    dataQualityIssues,
  };
}
