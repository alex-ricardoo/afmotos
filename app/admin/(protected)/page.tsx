import { getDashboardMetrics } from '@/lib/queries/dashboard';
import { DashboardKpis } from '@/components/admin/dashboard/dashboard-kpis';
import { QuickActionsBar } from '@/components/admin/dashboard/quick-actions-bar';
import { SalesAnalyticsChart } from '@/components/admin/dashboard/sales-analytics-chart';
import { PaymentBrandsBreakdown } from '@/components/admin/dashboard/payment-brands-breakdown';
import { RecentSalesFeed } from '@/components/admin/dashboard/recent-sales-feed';
import { Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Dashboard Geral | AF Motos Admin',
  description: 'Visão executiva de faturamento, estoque, vendas e propostas.',
};

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header do Dashboard com Saudação & Resumo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Painel de Gestão
            </h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Acompanhe o faturamento em tempo real, giro do estoque e propostas comerciais.
          </p>
        </div>
      </div>

      {/* 2. KPIs de Alto Impacto (Faturamento, Pátio, Ticket Médio, Leads) */}
      <DashboardKpis metrics={metrics} />

      {/* 3. Ações Rápidas (Mobile-First 1-Tap Actions) */}
      <QuickActionsBar />

      {/* 4. Gráficos de Vendas & Mês Recorde */}
      <SalesAnalyticsChart data={metrics.monthlyHistory} bestMonth={metrics.bestMonth} />

      {/* 5. Distribuição de Pagamento & Marcas Mais Vendidas */}
      <PaymentBrandsBreakdown
        paymentDistribution={metrics.paymentDistribution}
        topBrands={metrics.topBrands}
      />

      {/* 6. Feed de Vendas Recentes & Emissão de Recibos */}
      <RecentSalesFeed sales={metrics.recentSales} />
    </div>
  );
}
