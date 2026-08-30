'use client';

import React from 'react';
import Link from 'next/link';
import { Users, MessageSquare, ArrowUpRight, CheckCircle2, UserPlus, PhoneCall } from 'lucide-react';
import { CustomersReportData } from '@/lib/reports/types';
import { ReportKpiCard } from '../report-kpi-card';
import { ReportChartCard } from '../report-chart-card';

interface CustomersTabProps {
  data: CustomersReportData;
}

export function CustomersTab({ data }: CustomersTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. KPIs de Clientes e Comercial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKpiCard
          title="Novos Clientes"
          value={`${data.newCustomersCount} ${data.newCustomersCount === 1 ? 'cliente' : 'clientes'}`}
          icon={UserPlus}
          iconColor="text-indigo-400"
          confidence="confirmed"
        />

        <ReportKpiCard
          title="Contatos & Leads"
          value={`${data.totalLeadsCount} ${data.totalLeadsCount === 1 ? 'contato' : 'contatos'}`}
          icon={MessageSquare}
          iconColor="text-cyan-400"
          confidence="confirmed"
        />

        <ReportKpiCard
          title="Pedidos de Venda/Anúncio"
          value={`${data.sellRequestsCount} ${data.sellRequestsCount === 1 ? 'solicitação' : 'solicitações'}`}
          subtitle="Formulário público 'Venda sua moto'"
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          confidence="confirmed"
        />

        <ReportKpiCard
          title="Solicitações de Aluguel"
          value={`${data.rentalRequestsCount} ${data.rentalRequestsCount === 1 ? 'solicitação' : 'solicitações'}`}
          subtitle="Interesses em locação"
          icon={PhoneCall}
          iconColor="text-amber-400"
          confidence="confirmed"
        />
      </div>

      {/* 2. Origem dos Clientes Cadastrados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChartCard
          title="Origem dos Clientes"
          subtitle="Canais que trouxeram novos clientes no período."
        >
          {data.customersBySource.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-medium">
              Nenhum cliente cadastrado no período selecionado.
            </div>
          ) : (
            <div className="space-y-3">
              {data.customersBySource.map((src) => (
                <div
                  key={src.source}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{src.label}</span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {src.percentage.toFixed(1)}% do total
                    </span>
                  </div>
                  <span className="text-sm font-black text-indigo-400">
                    {src.count} {src.count === 1 ? 'cliente' : 'clientes'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ReportChartCard>

        {/* Funil Comercial Preliminar */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="pb-3 border-b border-zinc-900">
            <h3 className="font-bold text-base text-white">Funil Comercial & Conversão</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Relação entre solicitações de entrada e vendas registradas com cliente.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                  Contatos / Leads Recebidos
                </span>
                <span className="text-base font-bold text-white block mt-0.5">
                  {data.conversionFunnel.totalLeads} contatos
                </span>
              </div>
              <span className="text-xs font-bold text-zinc-400">100% (Topo de Funil)</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                  Vendas Vinculadas a Clientes
                </span>
                <span className="text-base font-bold text-emerald-400 block mt-0.5">
                  {data.conversionFunnel.convertedSales} vendas
                </span>
              </div>
              {data.conversionFunnel.conversionRate !== null ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black">
                  {data.conversionFunnel.conversionRate.toFixed(1)}% conversão
                </span>
              ) : (
                <span className="text-xs text-zinc-500">Sem dados</span>
              )}
            </div>
          </div>

          <div className="pt-2 text-center flex items-center justify-center gap-4">
            <Link
              href="/admin/clientes"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e3c56c] hover:underline"
            >
              <span>Ver Base de Clientes</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/propostas"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:underline"
            >
              <span>Ver Propostas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
