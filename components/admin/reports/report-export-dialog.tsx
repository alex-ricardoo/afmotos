'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Table, ShieldCheck, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ReportDateRange } from '@/lib/reports/types';

interface ReportExportDialogProps {
  dateRange: ReportDateRange;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportExportDialog({ dateRange, isOpen, onClose }: ReportExportDialogProps) {
  const [includePII, setIncludePII] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (format: 'csv' | 'xlsx' | 'pdf', type: string, label: string) => {
    const key = `${format}-${type}`;
    setIsDownloading(key);

    const toastId = toast.loading(`Gerando ${label}...`, {
      description: 'Consultando dados do período e gerando arquivo...',
    });

    try {
      const params = new URLSearchParams();
      params.set('format', format);
      params.set('type', type);
      params.set('preset', dateRange.preset);
      params.set('startDate', dateRange.startDate);
      params.set('endDate', dateRange.endDate);
      if (includePII) {
        params.set('includePII', 'true');
      }

      const response = await fetch(`/api/admin/reports/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Falha no servidor ao gerar ${label}`);
      }

      let filename = `relatorio-af-motos.${format === 'xlsx' ? 'xls' : format}`;
      const disposition = response.headers.get('content-disposition');
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${label} gerado com sucesso!`, {
        id: toastId,
        description: `O arquivo ${filename} foi baixado.`,
      });

      onClose();
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Erro ao baixar ${label}.`, {
        id: toastId,
        description: 'Tente novamente ou verifique a conexão.',
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#0c0c0f] border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h3 className="text-base font-bold text-white">Exportar Relatórios</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Período selecionado: <span className="text-[#e3c56c] font-semibold">{dateRange.label}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={Boolean(isDownloading)}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {/* Option 1: PDF Executivo */}
          <button
            onClick={() => handleDownload('pdf', 'consolidado', 'Relatório Executivo (PDF)')}
            disabled={Boolean(isDownloading)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-[#c9a44c]/60 hover:bg-zinc-900 transition-all text-left group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                {isDownloading === 'pdf-consolidado' ? (
                  <Loader2 className="w-5 h-5 text-[#e3c56c] animate-spin" />
                ) : (
                  <FileText className="w-5 h-5 text-[#e3c56c]" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isDownloading === 'pdf-consolidado' ? 'Gerando PDF...' : 'Relatório Executivo (PDF)'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Resumo visual com logotipo, KPIs e tabelas consolidadas.
                </span>
              </div>
            </div>
            {isDownloading === 'pdf-consolidado' ? (
              <Loader2 className="w-4 h-4 text-[#e3c56c] animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-zinc-500 group-hover:text-white shrink-0" />
            )}
          </button>

          {/* Option 2: XLSX Consolidado */}
          <button
            onClick={() => handleDownload('xlsx', 'consolidado', 'Planilha Excel (XLSX)')}
            disabled={Boolean(isDownloading)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/60 hover:bg-zinc-900 transition-all text-left group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                {isDownloading === 'xlsx-consolidado' ? (
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isDownloading === 'xlsx-consolidado' ? 'Gerando XLSX...' : 'Pasta de Trabalho (XLSX)'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Planilha multi-abas para o contador (Vendas, Despesas, Estoque).
                </span>
              </div>
            </div>
            {isDownloading === 'xlsx-consolidado' ? (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-zinc-500 group-hover:text-white shrink-0" />
            )}
          </button>

          {/* Option 3: CSV Vendas */}
          <button
            onClick={() => handleDownload('csv', 'vendas', 'Vendas Detalhadas (CSV)')}
            disabled={Boolean(isDownloading)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-sky-500/60 hover:bg-zinc-900 transition-all text-left group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                {isDownloading === 'csv-vendas' ? (
                  <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                ) : (
                  <Table className="w-5 h-5 text-sky-400" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isDownloading === 'csv-vendas' ? 'Gerando CSV...' : 'Vendas Detalhadas (CSV)'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Transações analíticas formatadas para Excel no Brasil.
                </span>
              </div>
            </div>
            {isDownloading === 'csv-vendas' ? (
              <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-zinc-500 group-hover:text-white shrink-0" />
            )}
          </button>

          {/* Option 4: CSV Despesas */}
          <button
            onClick={() => handleDownload('csv', 'despesas', 'Despesas e Gastos (CSV)')}
            disabled={Boolean(isDownloading)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-rose-500/60 hover:bg-zinc-900 transition-all text-left group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                {isDownloading === 'csv-despesas' ? (
                  <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
                ) : (
                  <Table className="w-5 h-5 text-rose-400" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isDownloading === 'csv-despesas' ? 'Gerando CSV...' : 'Despesas e Gastos (CSV)'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Rateio por categorias e custos por motocicleta.
                </span>
              </div>
            </div>
            {isDownloading === 'csv-despesas' ? (
              <Loader2 className="w-4 h-4 text-rose-400 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-zinc-500 group-hover:text-white shrink-0" />
            )}
          </button>
        </div>

        {/* PII Toggle & Disclaimer */}
        <div className="pt-2 space-y-3">
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includePII}
              onChange={(e) => setIncludePII(e.target.checked)}
              disabled={Boolean(isDownloading)}
              className="mt-0.5 rounded-sm border-zinc-700 bg-zinc-900 text-[#c9a44c] focus:ring-0"
            />
            <div className="text-[11px] text-zinc-400">
              <span className="font-bold text-zinc-200 block">
                Incluir dados cadastrais para o contador
              </span>
              <span>
                Exporta telefones e informações de compradores para conciliação contábil.
              </span>
            </div>
          </label>

          <div className="flex items-center gap-2 text-[10px] text-zinc-500 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download seguro autenticado • Sessão de Administrador</span>
          </div>
        </div>
      </div>
    </div>
  );
}
