'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, DollarSign, Receipt, Coins, ArrowUpRight, Bike } from 'lucide-react';
import { SalesReportData } from '@/lib/reports/types';
import { formatCurrencyBRL, formatReportDate } from '@/lib/reports/formatters';
import { ReportKpiCard } from '../report-kpi-card';
import { ReportChartCard } from '../report-chart-card';
import { RankingHorizontalBars } from '../charts/ranking-horizontal-bars';

interface SalesTabProps {
  data: SalesReportData;
}

export function SalesTab({ data }: SalesTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. KPIs da Aba de Vendas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKpiCard
          title="Faturamento Total"
          value={formatCurrencyBRL(data.totalSalesValue)}
          icon={DollarSign}
          iconColor="text-emerald-400"
          confidence="confirmed"
        />

        <ReportKpiCard
          title="Motos Vendidas"
          value={`${data.salesCount} ${data.salesCount === 1 ? 'moto' : 'motos'}`}
          icon={Receipt}
          iconColor="text-sky-400"
          confidence="confirmed"
        />

        <ReportKpiCard
          title="Ticket Médio"
          value={formatCurrencyBRL(data.averageTicket)}
          icon={Coins}
          iconColor="text-amber-400"
          confidence="confirmed"
        />

        {data.highestSale && (
          <ReportKpiCard
            title="Maior Venda Realizada"
            value={formatCurrencyBRL(data.highestSale.value)}
            subtitle={data.highestSale.model}
            icon={Trophy}
            iconColor="text-[#e3c56c]"
            confidence="confirmed"
          />
        )}
      </div>

      {/* 2. Ranking de Marcas Mais Vendidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChartCard
          title="Marcas Mais Vendidas"
          subtitle="Volume e faturamento por montadora no período."
        >
          <RankingHorizontalBars items={data.salesByBrand} />
        </ReportChartCard>

        {/* Resumo de Destaques Comerciais */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="pb-3 border-b border-zinc-900">
            <h3 className="font-bold text-base text-white">Destaques Comerciais</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Extremos de transações de venda do período selecionado.
            </p>
          </div>

          <div className="space-y-3">
            {data.highestSale && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    Venda de Maior Valor
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {data.highestSale.model}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatReportDate(data.highestSale.date)}
                  </span>
                </div>
                <span className="text-base font-black text-emerald-400">
                  {formatCurrencyBRL(data.highestSale.value)}
                </span>
              </div>
            )}

            {data.lowestSale && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    Venda de Menor Valor
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {data.lowestSale.model}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatReportDate(data.lowestSale.date)}
                  </span>
                </div>
                <span className="text-base font-black text-zinc-200">
                  {formatCurrencyBRL(data.lowestSale.value)}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/admin/vendas"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e3c56c] hover:underline"
            >
              <span>Acessar Gestão Completa de Vendas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Tabela Analítica de Vendas */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
          <div>
            <h3 className="font-bold text-base text-white">Relação Analítica de Vendas</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Lista detalhada de motocicletas comercializadas no período.
            </p>
          </div>
          <span className="text-xs font-bold text-zinc-400">
            {data.detailedSalesList.length} {data.detailedSalesList.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {data.detailedSalesList.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 font-medium">
            Nenhuma venda concluída encontrada no período selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pr-4">Data</th>
                  <th className="pb-3 pr-4">Motocicleta</th>
                  <th className="pb-3 pr-4">Comprador</th>
                  <th className="pb-3 pr-4">Forma Pgto</th>
                  <th className="pb-3 text-right">Valor Venda</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {data.detailedSalesList.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3.5 pr-4 text-zinc-300 whitespace-nowrap">
                      {formatReportDate(sale.saleDate)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="font-bold text-white block">
                        {sale.motorcycleLabel}
                      </span>
                      {sale.motorcyclePlate && (
                        <span className="text-[10px] text-zinc-500 font-medium">
                          Placa: {sale.motorcyclePlate}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-zinc-200 font-medium block">
                        {sale.buyerName || 'Cliente Balcão'}
                      </span>
                      {sale.buyerPhone && (
                        <span className="text-[10px] text-zinc-500">{sale.buyerPhone}</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-zinc-300">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                        {sale.paymentMethod || 'Outro'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-black text-emerald-400 whitespace-nowrap">
                      {formatCurrencyBRL(sale.salePrice)}
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/admin/vendas/${sale.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c9a44c] hover:underline"
                      >
                        <span>Ver</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
