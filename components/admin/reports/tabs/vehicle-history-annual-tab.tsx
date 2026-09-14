'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Receipt,
  Layers,
  Users,
  RefreshCw,
} from 'lucide-react';
import {
  AnnualReportResult,
  ACCOUNTANT_LEGAL_DISCLAIMER,
} from '@/lib/reports/annual-accountant-queries';
import { getVehicleHistoryAnnualReportAction } from '@/lib/actions/annual-report';
import { cn } from '@/lib/utils';

interface VehicleHistoryAnnualTabProps {
  initialYear?: number;
}

export function VehicleHistoryAnnualTab({ initialYear = 2026 }: VehicleHistoryAnnualTabProps) {
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [includeMocks, setIncludeMocks] = useState<boolean>(false);
  const [reportData, setReportData] = useState<AnnualReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadData = (year: number, mocks: boolean) => {
    startTransition(async () => {
      setError(null);
      const res = await getVehicleHistoryAnnualReportAction(year, mocks);
      if (res.success && res.data) {
        setReportData(res.data);
      } else {
        setError(res.error || 'Não foi possível carregar o relatório anual.');
      }
    });
  };

  useEffect(() => {
    loadData(selectedYear, includeMocks);
  }, [selectedYear, includeMocks]);

  const formatBrl = (cents: number | null | undefined) => {
    const val = Number(cents || 0);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
  };

  const formatPercent = (cents: number, totalCents: number) => {
    if (!totalCents || totalCents <= 0) return '0,0%';
    const pct = (cents / totalCents) * 100;
    return `${pct.toFixed(1)}%`;
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.annualSummary;

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Controles de Exportação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-zinc-300">Ano Calendário:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={isPending}
              className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value={2027}>2027</option>
              <option value={2026}>2026 (Exercício Atual)</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeMocks}
              onChange={(e) => setIncludeMocks(e.target.checked)}
              disabled={isPending}
              className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
            />
            <span>Incluir testes e fixtures de mock</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 mr-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Consolidando dados...</span>
            </div>
          )}

          <a
            href={`/api/admin/reports/vehicle-history/export-csv?year=${selectedYear}&includeMock=${includeMocks}`}
            download
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV Contador</span>
          </a>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards de Consolidação Anual */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Receita Líquida Gateway</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-100">
              {formatBrl(summary.netGatewayRevenueCents)}
            </div>
            <div className="text-xs text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-800/80">
              <span>Bruto: {formatBrl(summary.grossGatewayRevenueCents)}</span>
              <span className="text-rose-400">
                Estornos: -{formatBrl(summary.confirmedRefundsCents)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Custo Efetivo API Brasil</span>
              <Receipt className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {formatBrl(summary.totalApiBrasilCostCents)}
            </div>
            <div className="text-xs text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-800/80">
              <span>{summary.totalLiveChargedConsultations} chamadas live</span>
              <span>Médio: {formatBrl(summary.averageCostPerLiveLookupCents)}/un</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Margem Bruta Estimada</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div
              className={cn(
                'text-2xl font-bold',
                summary.estimatedGrossMarginCents >= 0 ? 'text-cyan-400' : 'text-rose-400',
              )}
            >
              {formatBrl(summary.estimatedGrossMarginCents)}
            </div>
            <div className="text-xs text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-800/80">
              <span>Margem sobre vendas</span>
              <span className="text-cyan-400 font-medium">
                {formatPercent(
                  summary.estimatedGrossMarginCents,
                  summary.totalEstimatedRevenueCents,
                )}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Volume de Consultas</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-100">
              {summary.totalCompletedConsultations}
            </div>
            <div className="text-xs text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-800/80">
              <span className="text-emerald-400">
                {summary.totalCacheConsultations} em cache (R$ 0)
              </span>
              <span>{summary.totalLiveChargedConsultations} live</span>
            </div>
          </div>
        </div>
      )}

      {/* Cartões Auxiliares de Créditos B2B e Pendências de Estorno */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Movimentação de Créditos B2B no Ano {selectedYear}</span>
              </div>
              <div className="text-xs text-zinc-400 flex items-center gap-4">
                <span>
                  Concedidos:{' '}
                  <strong className="text-zinc-200">{summary.creditsGrantedAnnual}</strong>
                </span>
                <span>
                  Consumidos:{' '}
                  <strong className="text-zinc-200">{summary.creditsConsumedAnnual}</strong>
                </span>
                <span>
                  Saldo em Aberto no Encerramento:{' '}
                  <strong className="text-indigo-400">
                    {summary.outstandingCreditBalanceYearEnd}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Estornos Pendentes em Aberto no Fechamento</span>
              </div>
              <div className="text-xs text-zinc-400 flex items-center gap-4">
                <span>
                  Quantidade:{' '}
                  <strong className="text-zinc-200">{summary.pendingRefundsYearEndCount}</strong>
                </span>
                <span>
                  Valor Provisionado:{' '}
                  <strong className="text-amber-400">
                    {formatBrl(summary.pendingRefundsYearEndAmountCents)}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Fechamento Mês a Mês (Janeiro a Dezembro) */}
      <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Demonstrativo Analítico Mensal ({selectedYear})
            </h3>
          </div>
          <span className="text-xs text-zinc-500">Valores em Reais (BRL)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-800/60 text-zinc-400 font-medium border-b border-zinc-800">
              <tr>
                <th className="py-3 px-3">Mês</th>
                <th className="py-3 px-3 text-right">Rec. Gateway (Bruto)</th>
                <th className="py-3 px-3 text-right">Estornos Conf.</th>
                <th className="py-3 px-3 text-right text-emerald-400">Rec. Líquida Gateway</th>
                <th className="py-3 px-3 text-right">Rec. Pacotes B2B</th>
                <th className="py-3 px-3 text-right text-amber-400">Custo API Brasil</th>
                <th className="py-3 px-3 text-right text-cyan-400">Margem Bruta</th>
                <th className="py-3 px-3 text-center">Consultas Totais</th>
                <th className="py-3 px-3 text-center">Live</th>
                <th className="py-3 px-3 text-center">Cache</th>
                <th className="py-3 px-3 text-center">Créditos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {reportData?.monthlyBreakdown.map((m) => (
                <tr key={m.month} className="hover:bg-zinc-800/30 transition">
                  <td className="py-2.5 px-3 font-medium text-zinc-200 flex items-center gap-2">
                    <span className="w-5 text-zinc-500">{String(m.month).padStart(2, '0')}</span>
                    <span>{m.monthLabel}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                    {formatBrl(m.grossRevenueCents)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-400">
                    {m.confirmedRefundsCents > 0
                      ? `-${formatBrl(m.confirmedRefundsCents)}`
                      : 'R$ 0,00'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                    {formatBrl(m.netRevenueCents)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                    {formatBrl(m.packageRevenueCents)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                    {formatBrl(m.apiBrasilCostCents)}
                  </td>
                  <td
                    className={cn(
                      'py-2.5 px-3 text-right font-mono font-semibold',
                      m.estimatedMarginCents >= 0 ? 'text-cyan-400' : 'text-rose-400',
                    )}
                  >
                    {formatBrl(m.estimatedMarginCents)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium text-zinc-200">
                    {m.totalConsultations}
                  </td>
                  <td className="py-2.5 px-3 text-center text-zinc-400">{m.liveCallsCount}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400">{m.cacheHitsCount}</td>
                  <td className="py-2.5 px-3 text-center text-indigo-400">{m.creditsConsumed}</td>
                </tr>
              ))}
            </tbody>
            {summary && (
              <tfoot className="bg-zinc-800/80 font-semibold border-t-2 border-zinc-700 text-zinc-100">
                <tr>
                  <td className="py-3 px-3 uppercase tracking-wider text-xs">
                    Total Anual ({selectedYear})
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatBrl(summary.grossGatewayRevenueCents)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-400">
                    -{formatBrl(summary.confirmedRefundsCents)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    {formatBrl(summary.netGatewayRevenueCents)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-300">
                    {formatBrl(summary.externalPackagesRevenueCents)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-400">
                    {formatBrl(summary.totalApiBrasilCostCents)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-400">
                    {formatBrl(summary.estimatedGrossMarginCents)}
                  </td>
                  <td className="py-3 px-3 text-center">{summary.totalCompletedConsultations}</td>
                  <td className="py-3 px-3 text-center">{summary.totalLiveChargedConsultations}</td>
                  <td className="py-3 px-3 text-center text-emerald-400">
                    {summary.totalCacheConsultations}
                  </td>
                  <td className="py-3 px-3 text-center text-indigo-400">
                    {summary.creditsConsumedAnnual}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Box de Aviso Legal Mandatório para o Contador */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-semibold text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span>AVISO LEGAL OBRIGATÓRIO DE APOIO GERENCIAL</span>
        </div>
        <p className="text-zinc-300">{ACCOUNTANT_LEGAL_DISCLAIMER}</p>
      </div>
    </div>
  );
}
