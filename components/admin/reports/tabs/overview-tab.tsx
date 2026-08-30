'use client';

import React from 'react';
import {
  DollarSign,
  Receipt,
  Wallet,
  Scale,
  Percent,
  Users,
  MessageSquare,
  Bike,
  Coins,
  TrendingUp,
} from 'lucide-react';
import { OverviewReportData } from '@/lib/reports/types';
import { ReportKpiCard } from '../report-kpi-card';
import { ReportChartCard } from '../report-chart-card';
import { RevenueExpensesBarChart } from '../charts/revenue-expenses-bar-chart';
import { PaymentMethodsDonut } from '../charts/payment-methods-donut';

interface OverviewTabProps {
  data: OverviewReportData;
}

export function OverviewTab({ data }: OverviewTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Grid de KPIs Prioritários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Faturamento Bruto */}
        <ReportKpiCard
          title="Faturamento Bruto"
          value={data.grossRevenue.formattedValue}
          icon={DollarSign}
          iconColor="text-emerald-400"
          confidence={data.grossRevenue.confidence}
          confidenceReason={data.grossRevenue.confidenceReason}
          comparisonPercentage={data.grossRevenue.comparisonPercentage}
          tooltipFormula="Soma de vendas concluídas no período com pagamento confirmado."
        />

        {/* Quantidade Vendida */}
        <ReportKpiCard
          title="Motos Vendidas"
          value={data.salesCount.formattedValue}
          icon={Receipt}
          iconColor="text-sky-400"
          confidence={data.salesCount.confidence}
          comparisonPercentage={data.salesCount.comparisonPercentage}
          tooltipFormula="Contagem de motos com venda realizada no período."
        />

        {/* Ticket Médio */}
        <ReportKpiCard
          title="Ticket Médio"
          value={data.averageTicket.formattedValue}
          icon={Coins}
          iconColor="text-amber-400"
          confidence={data.averageTicket.confidence}
          confidenceReason={data.averageTicket.confidenceReason}
          comparisonPercentage={data.averageTicket.comparisonPercentage}
          tooltipFormula="Faturamento bruto dividido pela quantidade de vendas."
        />

        {/* Despesas do Período */}
        <ReportKpiCard
          title="Despesas do Período"
          value={data.totalExpenses.formattedValue}
          icon={Wallet}
          iconColor="text-rose-400"
          confidence={data.totalExpenses.confidence}
          confidenceReason={data.totalExpenses.confidenceReason}
          comparisonPercentage={data.totalExpenses.comparisonPercentage}
          tooltipFormula="Total de gastos pagos no período (oficina + loja)."
        />

        {/* Resultado Operacional Estimado */}
        <ReportKpiCard
          title="Resultado Operacional (Est.)"
          value={data.estimatedOperatingResult.formattedValue}
          icon={TrendingUp}
          iconColor="text-[#e3c56c]"
          confidence={data.estimatedOperatingResult.confidence}
          confidenceReason={data.estimatedOperatingResult.confidenceReason}
          comparisonPercentage={data.estimatedOperatingResult.comparisonPercentage}
          tooltipFormula="Receita bruta de vendas - Total de despesas pagas."
        />

        {/* Margem Operacional Estimada */}
        <ReportKpiCard
          title="Margem Estimada (%)"
          value={data.estimatedMarginPercentage.formattedValue}
          icon={Percent}
          iconColor="text-purple-400"
          confidence={data.estimatedMarginPercentage.confidence}
          confidenceReason={data.estimatedMarginPercentage.confidenceReason}
          tooltipFormula="Resultado operacional estimado dividido pelo faturamento x 100."
        />

        {/* Clientes Novos */}
        <ReportKpiCard
          title="Novos Clientes"
          value={data.newCustomersCount.formattedValue}
          icon={Users}
          iconColor="text-indigo-400"
          confidence={data.newCustomersCount.confidence}
          comparisonPercentage={data.newCustomersCount.comparisonPercentage}
          tooltipFormula="Contagem de novos clientes cadastrados no período."
        />

        {/* Total de Leads / Contatos */}
        <ReportKpiCard
          title="Leads e Propostas"
          value={data.totalLeadsCount.formattedValue}
          icon={MessageSquare}
          iconColor="text-cyan-400"
          confidence={data.totalLeadsCount.confidence}
          comparisonPercentage={data.totalLeadsCount.comparisonPercentage}
          tooltipFormula="Soma de contatos, propostas, pedidos de venda e aluguéis."
        />
      </div>

      {/* 2. Gráficos Principais: Evolução e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução Faturamento vs Despesas */}
        <div className="lg:col-span-2">
          <ReportChartCard
            title="Evolução Mensal do Faturamento"
            subtitle="Desempenho financeiro consolidado nos últimos 6 meses."
          >
            <RevenueExpensesBarChart data={data.revenueVsExpenseEvolution} />
          </ReportChartCard>
        </div>

        {/* Distribuição por Forma de Pagamento */}
        <div>
          <ReportChartCard
            title="Formas de Pagamento"
            subtitle="Composição de recebimento das vendas no período."
          >
            <PaymentMethodsDonut items={data.paymentDistribution} />
          </ReportChartCard>
        </div>
      </div>
    </div>
  );
}
