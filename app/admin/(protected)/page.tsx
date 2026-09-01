import { getDashboardMetrics } from '@/lib/queries/dashboard';
import { DashboardHeader } from '@/components/admin/dashboard/dashboard-header';
import { DashboardKpis } from '@/components/admin/dashboard/dashboard-kpis';
import { QuickActionsBar } from '@/components/admin/dashboard/quick-actions-bar';
import { SalesAnalyticsChart } from '@/components/admin/dashboard/sales-analytics-chart';
import { PaymentBrandsBreakdown } from '@/components/admin/dashboard/payment-brands-breakdown';
import { DashboardActivityTabs } from '@/components/admin/dashboard/dashboard-activity-tabs';

export const metadata = {
  title: 'Dashboard Geral | AF Motos',
  description: 'Visão executiva de faturamento, estoque, vendas e propostas.',
};

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-8">
      {/* 1. Header do Dashboard com Saudação & Resumo Rápido */}
      <DashboardHeader />

      {/* 2. KPIs de Alto Impacto (Faturamento, Pátio, Propostas/Leads, Resultado Líquido) */}
      <DashboardKpis metrics={metrics} />

      {/* 3. Ações Rápidas em 1 Toque (Mobile-First Quick Actions) */}
      <QuickActionsBar />

      {/* 4. Central de Operações Recentes com Abas (Vendas, Propostas WhatsApp, Consultas de Placa) */}
      <DashboardActivityTabs
        sales={metrics.recentSales}
        leads={metrics.recentLeads}
        consultations={metrics.recentConsultations}
      />

      {/* 5. Gráficos de Vendas & Mês Recorde */}
      <SalesAnalyticsChart data={metrics.monthlyHistory} bestMonth={metrics.bestMonth} />

      {/* 6. Distribuição de Pagamento & Marcas Mais Vendidas */}
      <PaymentBrandsBreakdown
        paymentDistribution={metrics.paymentDistribution}
        topBrands={metrics.topBrands}
      />
    </div>
  );
}
