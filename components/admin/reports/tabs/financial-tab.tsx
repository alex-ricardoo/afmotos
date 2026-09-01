'use client';

import React from 'react';
import { DollarSign, Wallet, Bike, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { FinancialReportData } from '@/lib/reports/types';
import { formatCurrencyBRL } from '@/lib/reports/formatters';
import { ReportKpiCard } from '../report-kpi-card';
import { ReportChartCard } from '../report-chart-card';

interface FinancialTabProps {
  data: FinancialReportData;
  storeName?: string;
}

export function FinancialTab({ data, storeName = 'AF Motos' }: FinancialTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. KPIs Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKpiCard
          title="Receita Realizada"
          value={formatCurrencyBRL(data.totalRevenue)}
          icon={DollarSign}
          iconColor="text-emerald-400"
          confidence="confirmed"
        />

        <ReportKpiCard
          title="Despesas Pagas"
          value={formatCurrencyBRL(data.totalExpensesPaid)}
          icon={Wallet}
          iconColor="text-rose-400"
          confidence="confirmed"
        />

        <ReportKpiCard
          title="Gastos com Motos (Oficina)"
          value={formatCurrencyBRL(data.expensesByVehicle)}
          subtitle="Peças, manutenção, revisão e lavagem"
          icon={Bike}
          iconColor="text-cyan-400"
          confidence="confirmed"
        />

        <ReportKpiCard
          title="Gastos da Loja (Operacional)"
          value={formatCurrencyBRL(data.expensesByStore)}
          subtitle="Ponto, energia, internet e marketing"
          icon={Building2}
          iconColor="text-purple-400"
          confidence="confirmed"
        />
      </div>

      {/* 2. Detalhamento de Despesas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Despesas por Categoria */}
        <ReportChartCard
          title="Despesas por Categoria"
          subtitle="Centros de custo com maior impacto no período."
        >
          {data.expensesByCategory.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-medium">
              Nenhuma despesa registrada no período.
            </div>
          ) : (
            <div className="space-y-3">
              {data.expensesByCategory.slice(0, 8).map((cat) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/60"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        cat.expenseType === 'MOTO' ? 'bg-cyan-400' : 'bg-purple-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">{cat.categoryName}</span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {cat.count} {cat.count === 1 ? 'lançamento' : 'lançamentos'} (
                        {cat.percentageOfTotal.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-rose-400">
                    {formatCurrencyBRL(cat.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ReportChartCard>

        {/* Motos com Maior Custo de Oficina/Preparação */}
        <ReportChartCard
          title="Motos com Maior Custo de Preparação"
          subtitle="Veículos com maior volume acumulado de manutenção e peças."
        >
          {data.expensesByMotorcycleRanking.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-medium">
              Nenhum gasto específico vinculado a veículos no período.
            </div>
          ) : (
            <div className="space-y-3">
              {data.expensesByMotorcycleRanking.slice(0, 8).map((item) => (
                <div
                  key={item.motorcycleId}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/60"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{item.motorcycleLabel}</span>
                    {item.plate && (
                      <span className="text-[10px] text-zinc-500 font-medium">
                        Placa: {item.plate} • {item.expensesCount}{' '}
                        {item.expensesCount === 1 ? 'gasto' : 'gastos'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black text-rose-400">
                    {formatCurrencyBRL(item.totalExpenses)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ReportChartCard>
      </div>

      {/* 3. Observação de Apoio Gerencial */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400">
        <AlertCircle className="w-4 h-4 text-[#c9a44c] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-zinc-200 block">Demonstrativo Operacional Gerencial</span>
          <p className="mt-0.5 text-zinc-400">
            Os valores acima refletem os registros de vendas e despesas lançados na plataforma {storeName}.
            Este relatório não substitui a contabilidade oficial da empresa e deve ser validado pelo
            contador responsável.
          </p>
        </div>
      </div>
    </div>
  );
}
