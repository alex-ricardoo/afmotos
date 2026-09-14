'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  FileCheck2,
  Sparkles,
  Zap,
  Users,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Download,
  HelpCircle,
} from 'lucide-react';
import { VehicleHistoryReportResult } from '@/lib/reports/vehicle-history-queries';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { VehicleHistoryAnnualTab } from './vehicle-history-annual-tab';

interface VehicleHistoryTabProps {
  data: VehicleHistoryReportResult;
  onSelectYear?: (year: number) => void;
}

export function VehicleHistoryTab({ data }: VehicleHistoryTabProps) {
  const [subTab, setSubTab] = useState<'consultations' | 'payments' | 'credits' | 'annual'>(
    'consultations',
  );
  const [searchTerm, setSearchTerm] = useState('');

  const { summary, consultations, payments, creditPackages, dateRange } = data;

  const formatBrl = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      cents / 100,
    );
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return iso;
    }
  };

  const filteredConsultations = consultations.items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.plate.toLowerCase().includes(term) ||
      item.customerName.toLowerCase().includes(term) ||
      item.customerEmail.toLowerCase().includes(term) ||
      item.shortId.toLowerCase().includes(term)
    );
  });

  const filteredPayments = payments.items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.plate.toLowerCase().includes(term) ||
      item.customerName.toLowerCase().includes(term) ||
      (item.mpPaymentIdMasked && item.mpPaymentIdMasked.toLowerCase().includes(term)) ||
      item.shortId.toLowerCase().includes(term)
    );
  });

  const filteredPackages = creditPackages.items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.packageName.toLowerCase().includes(term) ||
      item.customerName.toLowerCase().includes(term) ||
      item.customerEmail.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      {/* 1. Header do Módulo com Exportação Direta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white tracking-tight">
              Relatório Financeiro & Operacional de Histórico Veicular
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/30">
              Auditado
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Métricas de faturamento Mercado Pago, estornos confirmados, chamadas live cobráveis e
            entregas via cache.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/reports/vehicle-history/export-csv?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white font-bold text-xs transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#c9a44c]" />
            <span>Exportar CSV do Período</span>
          </a>
        </div>
      </div>

      {/* 2. Grid de Cards Superiores (KPIs Consolidados) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Receita Bruta */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Receita Bruta</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-black font-mono text-white">
              {formatBrl(summary.grossRevenueCents)}
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">MP Aprovados</p>
          </div>
        </div>

        {/* Estornos Confirmados */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Estornos</span>
            <RotateCcw className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-black font-mono text-rose-400">
              {formatBrl(summary.confirmedRefundsCents)}
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">Estornos confirmados</p>
          </div>
        </div>

        {/* Receita Líquida */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Receita Líquida</span>
            <TrendingUp className="w-4 h-4 text-[#c9a44c]" />
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-black font-mono text-[#e3c56c]">
              {formatBrl(summary.netRevenueCents)}
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">Bruta (-) Estornos</p>
          </div>
        </div>

        {/* Custo Total API Brasil */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Custo API Brasil</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-black font-mono text-amber-400">
              {formatBrl(summary.totalApiBrasilCostCents)}
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {summary.totalLiveChargedCalls} chamadas live
            </p>
          </div>
        </div>

        {/* Margem Bruta Estimada */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Margem Estimada</span>
            <TrendingUp
              className={`w-4 h-4 ${summary.estimatedGrossMarginCents >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            />
          </div>
          <div className="my-2">
            <div
              className={`text-lg sm:text-xl font-black font-mono ${
                summary.estimatedGrossMarginCents >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatBrl(summary.estimatedGrossMarginCents)}
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {summary.marginPercentage}% de margem
            </p>
          </div>
        </div>

        {/* Cache Hits (Custo Zero) */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Cache Hits</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-black font-mono text-cyan-300">
              {summary.totalCacheHits}
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {summary.cacheHitRatePercentage}% das entregas
            </p>
          </div>
        </div>
      </div>

      {/* 3. Indicadores Operacionais Secundários */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-900 text-xs">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-zinc-400" />
          <div>
            <span className="text-zinc-500 block text-[10px]">Consultas Concluídas:</span>
            <span className="font-bold text-white">
              {summary.totalConsultationsCompleted} de {summary.totalConsultationsStarted} (
              {summary.completionRatePercentage}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <div>
            <span className="text-zinc-500 block text-[10px]">Créditos B2B:</span>
            <span className="font-bold text-white">
              {summary.totalCreditConsultations} consultas ({summary.totalCreditsConsumed}{' '}
              consumidos)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <div>
            <span className="text-zinc-500 block text-[10px]">Falhas Permanentes:</span>
            <span className="font-bold text-rose-300">{summary.totalPermanentFailures}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-zinc-500 block text-[10px]">Estornos Pendentes:</span>
            <span className="font-bold text-amber-300">
              {summary.totalPendingRefundsCount} (
              {formatBrl(summary.totalPendingRefundsAmountCents)})
            </span>
          </div>
        </div>
      </div>

      {/* 4. Navegação entre as 3 Visões Especializadas */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
            <button
              onClick={() => setSubTab('consultations')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                subTab === 'consultations'
                  ? 'bg-[#c9a44c] text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Consultas e Custos ({consultations.total})
            </button>
            <button
              onClick={() => setSubTab('payments')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                subTab === 'payments'
                  ? 'bg-[#c9a44c] text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Pagamentos e Estornos ({payments.total})
            </button>
            <button
              onClick={() => setSubTab('credits')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                subTab === 'credits'
                  ? 'bg-[#c9a44c] text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Pacotes e Créditos B2B ({creditPackages.total})
            </button>
            <button
              onClick={() => setSubTab('annual')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                subTab === 'annual'
                  ? 'bg-[#c9a44c] text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Informe Anual Contador
            </button>
          </div>

          {subTab !== 'annual' && (
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar placa, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:border-[#c9a44c] outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Sub-Aba 4: Informe Anual Contador */}
        {subTab === 'annual' && <VehicleHistoryAnnualTab />}

        {/* 5. Conteúdo da Aba 1: Consultas e Custo */}
        {subTab === 'consultations' && (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-semibold">
                <tr>
                  <th className="py-3 px-3.5">Data/Hora</th>
                  <th className="py-3 px-3">Placa</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Modalidade</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Origem</th>
                  <th className="py-3 px-3">Custo Efetivo</th>
                  <th className="py-3 px-3">Preço Venda</th>
                  <th className="py-3 px-3">Margem</th>
                  <th className="py-3 px-3 text-right">Laudo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {filteredConsultations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-zinc-500 italic">
                      Nenhuma consulta encontrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  filteredConsultations.map((item) => (
                    <tr
                      key={item.consultationId}
                      className="hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3 px-3.5 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                        {formatDate(item.consultedAt)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white tracking-wider">
                        {item.plate}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-zinc-200 truncate max-w-[140px]">
                          {item.customerName}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                          {item.customerEmail}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {item.coverageType === 'platform_credit' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Crédito B2B
                          </span>
                        ) : item.coverageType === 'mercadopago' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Mercado Pago
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                            Gratuito
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {item.consultationStatus === 'completed' ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> Concluído
                          </span>
                        ) : item.consultationStatus === 'failed' ? (
                          <span className="text-rose-400 font-semibold text-[11px]">Falha</span>
                        ) : (
                          <span className="text-amber-400 font-semibold text-[11px]">
                            Processando
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {item.reportOrigin === 'cache' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Cache Hit (R$ 0)
                          </span>
                        ) : item.reportOrigin === 'live' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Live API
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                            Mock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-amber-400">
                        {formatBrl(item.actualCostCents)}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-white">
                        {formatBrl(item.publicPriceSnapshotCents)}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold">
                        {item.estimatedMarginCents != null ? (
                          <span
                            className={
                              item.estimatedMarginCents >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }
                          >
                            {formatBrl(item.estimatedMarginCents)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {item.hasReportData ? (
                          <Link
                            href={`/admin/consulta-placa?placa=${item.plate}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c9a44c] hover:underline"
                          >
                            Ver Laudo <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">Pendente</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Conteúdo da Aba 2: Pagamentos e Estornos */}
        {subTab === 'payments' && (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-semibold">
                <tr>
                  <th className="py-3 px-3.5">Data/Hora</th>
                  <th className="py-3 px-3">Payment ID</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Placa</th>
                  <th className="py-3 px-3">Valor Bruto</th>
                  <th className="py-3 px-3">Status Pagamento</th>
                  <th className="py-3 px-3">Estorno</th>
                  <th className="py-3 px-3">Valor Estornado</th>
                  <th className="py-3 px-3">Receita Líquida</th>
                  <th className="py-3 px-3">Motivo Estorno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-zinc-500 italic">
                      Nenhuma transação financeira registrada no período.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((item) => (
                    <tr key={item.transactionId} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                        {formatDate(item.paymentCreatedAt)}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-300 text-[11px]">
                        {item.mpPaymentIdMasked || item.shortId}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white truncate max-w-[150px]">
                        {item.customerName}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-zinc-300">{item.plate}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {formatBrl(item.grossAmountCents)}
                      </td>
                      <td className="py-3 px-3">
                        {item.paymentStatus === 'approved' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Aprovado
                          </span>
                        ) : item.paymentStatus === 'refunded' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Estornado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300">
                            {item.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {item.refundStatus === 'confirmed' ? (
                          <span className="text-rose-400 font-bold text-[11px]">Confirmado</span>
                        ) : item.refundStatus === 'pending' || item.refundStatus === 'requested' ? (
                          <span className="text-amber-400 font-semibold text-[11px]">Pendente</span>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">Nenhum</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-rose-400">
                        {item.refundAmountCents > 0 ? formatBrl(item.refundAmountCents) : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {formatBrl(item.netRevenueCents)}
                      </td>
                      <td className="py-3 px-3 text-zinc-400 text-[11px] truncate max-w-xs">
                        {item.refundReasonSafe || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. Conteúdo da Aba 3: Pacotes e Créditos */}
        {subTab === 'credits' && (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-semibold">
                <tr>
                  <th className="py-3 px-3.5">Cliente/Agência</th>
                  <th className="py-3 px-3">Pacote</th>
                  <th className="py-3 px-3">Data Concessão</th>
                  <th className="py-3 px-3">Canal</th>
                  <th className="py-3 px-3">Valor Informado</th>
                  <th className="py-3 px-3">Concedidos</th>
                  <th className="py-3 px-3">Restantes</th>
                  <th className="py-3 px-3">Consumidos</th>
                  <th className="py-3 px-3">Custo API Brasil</th>
                  <th className="py-3 px-3">Margem Estimada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-zinc-500 italic">
                      Nenhum pacote B2B de créditos cadastrado.
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((item) => (
                    <tr key={item.packageId} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-white">{item.customerName}</div>
                        <div className="text-[10px] text-zinc-500">{item.customerEmail}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-200">{item.packageName}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                        {formatDate(item.grantedAt)}
                      </td>
                      <td className="py-3 px-3 uppercase text-[11px] font-mono text-zinc-400">
                        {item.paymentChannel}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {item.totalPaidCents != null ? formatBrl(item.totalPaidCents) : 'Não inf.'}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-zinc-300">
                        {item.creditsGranted}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {item.creditsRemaining}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {item.creditsConsumed}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-amber-400">
                        {formatBrl(item.totalProviderCostCents)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {item.estimatedPackageMarginCents != null ? (
                          <span
                            className={
                              item.estimatedPackageMarginCents >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }
                          >
                            {formatBrl(item.estimatedPackageMarginCents)}
                          </span>
                        ) : (
                          <span className="text-zinc-500 italic text-[11px]">Sob conciliação</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 8. Disclaimer Mandatório de Natureza Gerencial */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 text-zinc-500 text-[11px] flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-zinc-400">Aviso Gerencial de Apoio:</strong> Este relatório
          apresenta consolidações gerenciais, custos operacionais da API Brasil e conciliações de
          pagamentos Mercado Pago. Não substitui notas fiscais, livros fiscais ou apuração
          tributária oficial.
        </div>
      </div>
    </div>
  );
}
