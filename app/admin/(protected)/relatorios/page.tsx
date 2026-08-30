import { resolveDateRange } from '@/lib/reports/date-range';
import {
  getOverviewReportData,
  getSalesReportData,
  getFinancialReportData,
  getInventoryReportData,
  getCustomersReportData,
} from '@/lib/reports/queries';
import { ReportsDashboard } from '@/components/admin/reports/reports-dashboard';
import { ReportPeriodPreset } from '@/lib/reports/types';

export const metadata = {
  title: 'Central de Relatórios Gerenciais',
  description: 'Acompanhe vendas, faturamento, despesas, estoque e demonstrativos de apoio contábil.',
};

export const dynamic = 'force-dynamic';

interface ReportsPageProps {
  searchParams: Promise<{
    period?: string;
    start_date?: string;
    end_date?: string;
    tab?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;

  const preset = (params.period || 'this_month') as ReportPeriodPreset;
  const customStart = params.start_date || null;
  const customEnd = params.end_date || null;

  const dateRange = resolveDateRange(preset, customStart, customEnd);

  // Parallel server-side data fetching
  const [overviewData, salesData, financialData, inventoryData, customersData] = await Promise.all([
    getOverviewReportData(dateRange),
    getSalesReportData(dateRange),
    getFinancialReportData(dateRange),
    getInventoryReportData(dateRange),
    getCustomersReportData(dateRange),
  ]);

  return (
    <ReportsDashboard
      overviewData={overviewData}
      salesData={salesData}
      financialData={financialData}
      inventoryData={inventoryData}
      customersData={customersData}
      dateRange={dateRange}
    />
  );
}
