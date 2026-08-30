/**
 * Tipos e Contratos de Domínio para a Central de Relatórios e Exportação Contábil
 * Feature: 017-central-relatorios-gerenciais
 */

export type ReportPeriodPreset =
  | 'today'
  | 'last_7_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_3_months'
  | 'this_semester'
  | 'last_6_months'
  | 'this_year'
  | 'last_12_months'
  | 'custom';

export type MetricConfidence = 'confirmed' | 'estimated' | 'unavailable';

export interface ReportDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string;
  preset: ReportPeriodPreset;
  previousStartDate?: string;
  previousEndDate?: string;
}

export interface ReportMetric<T = number> {
  value: T;
  formattedValue: string;
  confidence: MetricConfidence;
  confidenceReason?: string;
  comparisonPercentage?: number | null; // ex: +12.5% vs período anterior
  tooltipFormula?: string;
}

// ---------------------------------------------------------
// Aba 1: Visão Geral Executiva
// ---------------------------------------------------------

export interface RevenueExpensesEvolutionItem {
  periodKey: string; // ex: "2026-01"
  label: string; // ex: "Jan/26"
  fullLabel: string;
  revenue: number;
  expenses: number;
  operatingResult: number;
  salesCount: number;
}

export interface PaymentDistributionItem {
  method: string;
  label: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface OverviewReportData {
  dateRange: ReportDateRange;
  grossRevenue: ReportMetric<number>; // Receita efetiva da AF Motos (Vendas próprias + comissões)
  thirdPartyTransactedVolume?: ReportMetric<number>; // Volume total transacionado de terceiros (informativo)
  salesCount: ReportMetric<number>;
  ownedSalesCount?: number;
  consignmentSalesCount?: number;
  averageTicket: ReportMetric<number>;
  totalExpenses: ReportMetric<number>;
  totalExpensesPending: ReportMetric<number>;
  estimatedOperatingResult: ReportMetric<number>;
  estimatedMarginPercentage: ReportMetric<number | null>;
  newCustomersCount: ReportMetric<number>;
  totalLeadsCount: ReportMetric<number>;
  revenueVsExpenseEvolution: RevenueExpensesEvolutionItem[];
  paymentDistribution: PaymentDistributionItem[];
}

// ---------------------------------------------------------
// Aba 2: Relatório de Vendas
// ---------------------------------------------------------

export interface SaleDetailedReportItem {
  id: string;
  saleDate: string;
  motorcycleId: string;
  motorcycleLabel: string;
  motorcyclePlate: string | null;
  ownershipType: 'OWNED' | 'CONSIGNMENT' | 'THIRD_PARTY';
  customerId: string | null;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerDocument?: string | null;
  salePrice: number; // Preço total do veículo
  storeRevenue: number; // Receita real que entra na conta da AF Motos (100% própria ou apenas comissão para consignação)
  commissionValue?: number | null; // Comissão de intermediação (se consignada)
  payoutToOwner?: number | null; // Valor que vai para a conta do dono (se consignada)
  entryAmount: number | null;
  financedAmount: number | null;
  tradeAmount: number | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  receiptNumber: string | null;
  linkedExpensesTotal: number;
  estimatedMargin: number | null;
}

export interface BrandSalesRankingItem {
  brand: string;
  count: number;
  totalRevenue: number;
  percentage: number;
}

export interface SalesReportData {
  dateRange: ReportDateRange;
  totalSalesValue: number; // Receita efetiva da loja
  totalGrossVolume?: number; // Volume total transacionado
  ownedSalesTotal?: number;
  consignmentCommissionsTotal?: number;
  consignmentTransactedVolume?: number;
  salesCount: number;
  averageTicket: number;
  highestSale: {
    id: string;
    model: string;
    value: number;
    date: string;
  } | null;
  lowestSale: {
    id: string;
    model: string;
    value: number;
    date: string;
  } | null;
  salesByBrand: BrandSalesRankingItem[];
  salesByCategory: { category: string; count: number; totalRevenue: number }[];
  salesByOperationType: { operationType: string; count: number; totalRevenue: number }[];
  detailedSalesList: SaleDetailedReportItem[];
}

// ---------------------------------------------------------
// Aba 3: Relatório Financeiro e Despesas
// ---------------------------------------------------------

export interface ExpenseByCategoryItem {
  categoryId: string;
  categoryName: string;
  expenseType: 'MOTO' | 'LOJA';
  count: number;
  totalAmount: number;
  percentageOfTotal: number;
  paymentMethod?: string | null;
  paymentMethodLabel?: string;
}

export interface ExpenseByMotorcycleItem {
  motorcycleId: string;
  motorcycleLabel: string;
  plate: string | null;
  expensesCount: number;
  totalExpenses: number;
}

export interface FinancialReportData {
  dateRange: ReportDateRange;
  totalRevenue: number;
  totalExpensesPaid: number;
  totalExpensesPending: number;
  expensesByVehicle: number; // MOTO
  expensesByStore: number; // LOJA
  estimatedOperatingResult: number;
  expensesByCategory: ExpenseByCategoryItem[];
  expensesByMotorcycleRanking: ExpenseByMotorcycleItem[];
}

// ---------------------------------------------------------
// Aba 4: Relatório de Estoque
// ---------------------------------------------------------

export interface MotorcycleAttentionAlertItem {
  id: string;
  internalCode: string;
  brand: string;
  model: string;
  yearModel: number;
  daysInStock: number;
  price: number;
  fipePrice: number | null;
  status: string;
  ownershipType: 'OWNED' | 'CONSIGNMENT';
  reason: string;
  suggestedAction: string;
}

export interface InventoryReportData {
  dateRange: ReportDateRange;
  activeCount: number;
  ownedCount: number;
  consignmentCount: number;
  totalAnnouncedValue: number; // Substitui o termo antigo 'Capital imobilizado'
  totalFipeEstimatedValue: number;
  averageInventoryAgeDays: number;
  soldInPeriodCount: number;
  ageDistribution: {
    under30Days: number;
    between31And60Days: number;
    between61And90Days: number;
    over90Days: number;
  };
  motosRequiringAttention: MotorcycleAttentionAlertItem[];
}

// ---------------------------------------------------------
// Aba 5: Relatório de Clientes e CRM
// ---------------------------------------------------------

export interface CustomersReportData {
  dateRange: ReportDateRange;
  newCustomersCount: number;
  totalLeadsCount: number;
  sellRequestsCount: number;
  rentalRequestsCount: number;
  customersBySource: {
    source: string;
    label: string;
    count: number;
    percentage: number;
  }[];
  conversionFunnel: {
    totalLeads: number;
    convertedSales: number;
    conversionRate: number | null;
  };
}

// ---------------------------------------------------------
// Estruturas Avançadas para o Fechamento Contábil / Anual
// ---------------------------------------------------------

export interface StockMovementReportData {
  initialStockCount: number;
  initialStockValue: number;
  entriesOwnedCount: number;
  entriesConsignmentCount: number;
  salesCount: number;
  finalStockCount: number;
  finalStockValue: number;
}

export interface ConsignmentReportItem {
  id: string;
  motorcycleLabel: string;
  plate: string | null;
  ownerName: string | null;
  askingPrice: number;
  advertisedPrice: number;
  commissionType: string;
  commissionValue: number;
  commissionAmount: number | null;
  payoutToOwner: number | null;
  contractStatus: string;
  startDate: string | null;
  endDate: string | null;
}

export interface VehicleResultReportItem {
  motorcycleId: string;
  motorcycleLabel: string;
  plate: string | null;
  ownershipType: 'OWNED' | 'CONSIGNMENT';
  entryDate: string | null;
  saleDate: string | null;
  daysInStock: number;
  acquisitionCost: number | null; // Custo de aquisição se cadastrado
  linkedExpenses: number; // Despesas de oficina vinculadas
  salePrice: number;
  commissionReceived: number | null;
  payoutToOwner: number | null;
  estimatedResult: number | null; // null se custo não cadastrado
  confidence: MetricConfidence;
  confidenceReason?: string;
}

export interface DataQualityIssueItem {
  id: string;
  category: 'SALES' | 'EXPENSES' | 'MOTORCYCLES' | 'CONSIGNMENTS';
  title: string;
  count: number;
  impact: string;
  recommendedAction: string;
  adminLink: string;
}

export interface AnnualAccountantReportData {
  overview: OverviewReportData;
  sales: SalesReportData;
  financial: FinancialReportData;
  inventory: InventoryReportData;
  customers: CustomersReportData;
  stockMovement: StockMovementReportData;
  consignments: ConsignmentReportItem[];
  vehicleResults: VehicleResultReportItem[];
  dataQualityIssues: DataQualityIssueItem[];
}
