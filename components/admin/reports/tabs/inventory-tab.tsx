'use client';

import React from 'react';
import Link from 'next/link';
import { Bike, DollarSign, Clock, AlertTriangle, ArrowUpRight, Scale } from 'lucide-react';
import { InventoryReportData } from '@/lib/reports/types';
import { formatCurrencyBRL } from '@/lib/reports/formatters';
import { ReportKpiCard } from '../report-kpi-card';
import { ReportChartCard } from '../report-chart-card';
import { InventoryAgePyramid } from '../charts/inventory-age-pyramid';

interface InventoryTabProps {
  data: InventoryReportData;
}

export function InventoryTab({ data }: InventoryTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. KPIs do Estoque */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKpiCard
          title="Motos Disponíveis"
          value={`${data.activeCount} ${data.activeCount === 1 ? 'veículo' : 'veículos'}`}
          icon={Bike}
          iconColor="text-emerald-400"
          confidence="confirmed"
        />

        <ReportKpiCard
          title="Capital Anunciado em Pátio"
          value={formatCurrencyBRL(data.totalAnnouncedValue)}
          icon={DollarSign}
          iconColor="text-[#c9a44c]"
          confidence="confirmed"
        />

        <ReportKpiCard
          title="Idade Média do Pátio"
          value={`${data.averageInventoryAgeDays} dias`}
          subtitle="Média desde a data de entrada"
          icon={Clock}
          iconColor="text-sky-400"
          confidence="estimated"
        />

        <ReportKpiCard
          title="Motos Vendidas no Período"
          value={`${data.soldInPeriodCount} ${data.soldInPeriodCount === 1 ? 'moto' : 'motos'}`}
          icon={Scale}
          iconColor="text-purple-400"
          confidence="confirmed"
        />
      </div>

      {/* 2. Pirâmide de Idade do Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChartCard
          title="Faixas de Idade do Estoque"
          subtitle="Distribuição dos veículos disponíveis por tempo de pátio."
        >
          <InventoryAgePyramid
            distribution={data.ageDistribution}
            totalActive={data.activeCount}
          />
        </ReportChartCard>

        {/* Resumo de Liquidez de Pátio */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="pb-3 border-b border-zinc-900">
            <h3 className="font-bold text-base text-white">Saúde e Liquidez de Estoque</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Diretrizes gerenciais para aceleração de giro.
            </p>
          </div>

          <div className="space-y-3 text-xs text-zinc-300">
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
              <div>
                <span className="font-bold text-white block">Estoque Saudável (&lt; 60 dias)</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {data.ageDistribution.under30Days + data.ageDistribution.between31And60Days} motos
                  estão na janela ideal de comercialização e recebem o maior volume de contatos.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 mt-1 shrink-0" />
              <div>
                <span className="font-bold text-white block">Estoque Ocioso (&gt; 60 dias)</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {data.ageDistribution.between61And90Days + data.ageDistribution.over90Days} motos
                  requerem atenção do gestor para evitar custo financeiro de oportunidade.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/admin/motos"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e3c56c] hover:underline"
            >
              <span>Gerenciar Estoque Completo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Motos que Exigem Atenção */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <h3 className="font-bold text-base text-white">Motos que Exigem Atenção Comercial</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Veículos com longo tempo de pátio ou disparidade de preço em relação à tabela.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400">
            {data.motosRequiringAttention.length} em alerta
          </span>
        </div>

        {data.motosRequiringAttention.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500 font-medium">
            Excelente! Nenhum veículo em estoque crítico ou com alerta comercial ativo no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pr-4">Moto</th>
                  <th className="pb-3 pr-4">Dias no Pátio</th>
                  <th className="pb-3 pr-4">Preço Anunciado</th>
                  <th className="pb-3 pr-4">Motivo do Alerta</th>
                  <th className="pb-3 pr-4">Ação Sugerida</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {data.motosRequiringAttention.map((moto) => (
                  <tr key={moto.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3.5 pr-4">
                      <span className="font-bold text-white block">
                        {moto.brand} {moto.model}
                      </span>
                      <span className="text-[10px] text-zinc-500">Ano: {moto.yearModel}</span>
                    </td>
                    <td className="py-3.5 pr-4 font-extrabold text-amber-400">
                      {moto.daysInStock} dias
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-white">
                      {formatCurrencyBRL(moto.price)}
                    </td>
                    <td className="py-3.5 pr-4 text-zinc-400 text-[11px]">{moto.reason}</td>
                    <td className="py-3.5 pr-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        {moto.suggestedAction}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/admin/motos/${moto.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c9a44c] hover:underline"
                      >
                        <span>Editar</span>
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
