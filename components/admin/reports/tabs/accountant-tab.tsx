'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  FileText,
  Table,
  Download,
  AlertCircle,
  Building,
  Calendar,
  Sparkles,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Boxes,
  HandCoins,
} from 'lucide-react';
import { toast } from 'sonner';
import { ReportDateRange } from '@/lib/reports/types';

interface AccountantTabProps {
  dateRange: ReportDateRange;
  storeName?: string;
}

export function AccountantTab({ dateRange, storeName = 'AF Motos' }: AccountantTabProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [includePII, setIncludePII] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const availableYears = [
    currentYear.toString(),
    (currentYear - 1).toString(),
    (currentYear - 2).toString(),
    (currentYear - 3).toString(),
  ];

  const handleExport = async (
    format: 'csv' | 'xlsx' | 'pdf',
    type: string,
    useSpecificYear?: string,
    docLabel?: string,
  ) => {
    const exportKey = `${format}-${type}-${useSpecificYear || 'period'}`;
    if (isExporting) return;

    setIsExporting(exportKey);
    const label =
      docLabel || (type === 'informe-anual' ? `Informe Anual ${useSpecificYear}` : 'Relatório');
    const toastId = toast.loading(`Gerando ${label}... Aguarde alguns segundos.`, {
      description: 'Consultando lançamentos e gerando arquivo no servidor...',
    });

    try {
      const params = new URLSearchParams();
      params.set('format', format);
      params.set('type', type);

      if (useSpecificYear) {
        params.set('year', useSpecificYear);
      } else {
        params.set('preset', dateRange.preset);
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }

      if (includePII) {
        params.set('includePII', 'true');
      }

      const response = await fetch(`/api/admin/reports/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Falha no servidor ao gerar documento (${response.status})`);
      }

      let filename = `af-motos-relatorio.${format === 'xlsx' ? 'xls' : format}`;
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
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error(`Erro ao gerar ${label}.`, {
        id: toastId,
        description: 'Verifique sua conexão ou tente novamente.',
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ========================================================= */}
      {/* CARD DESTAQUE: INFORME ANUAL DE RENDIMENTOS & DECLARAÇÃO */}
      {/* ========================================================= */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-zinc-950 via-[#14120b] to-zinc-950 border-2 border-[#c9a44c]/60 shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#c9a44c]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#c9a44c]/20 border border-[#c9a44c]/40 flex items-center justify-center text-[#e3c56c] shrink-0 shadow-lg">
              {isExporting?.startsWith('pdf-informe-anual') ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#e3c56c]" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-white">
                  Informe Anual de Rendimentos & Apoio Contábil
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40 text-[10px] font-black uppercase tracking-wider">
                  Resumo Executivo Anual
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 max-w-2xl">
                Demonstrativo em 10 seções padronizado com cabeçalho oficial da <strong>{storeName}</strong>,
                logotipo, CNPJ, endereço, apuração de vendas, despesas pagas/pendentes, estoque em 31/12
                e auditoria cadastral.
              </p>
            </div>
          </div>

          {/* Seletor de Ano-Base & Botão de Download */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <Calendar className="w-4 h-4 text-[#c9a44c]" />
              <span className="text-xs font-bold text-zinc-400">Ano-Base:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={Boolean(isExporting)}
                className="bg-transparent text-xs font-black text-white focus:outline-hidden cursor-pointer disabled:opacity-50"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year} className="bg-zinc-950 text-white">
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                handleExport(
                  'pdf',
                  'informe-anual',
                  selectedYear,
                  `Informe Anual ${selectedYear} (PDF)`,
                )
              }
              disabled={Boolean(isExporting)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#c9a44c] to-[#e3c56c] hover:from-[#d8b35a] hover:to-[#ebd283] text-black font-black text-xs shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExporting === `pdf-informe-anual-${selectedYear}` ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Gerando PDF do Ano {selectedYear}...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Emitir Informe Anual {selectedYear} (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Processing Banner */}
        {isExporting === `pdf-informe-anual-${selectedYear}` && (
          <div className="p-3 rounded-2xl bg-[#c9a44c]/15 border border-[#c9a44c]/40 flex items-center gap-3 animate-in fade-in duration-150">
            <Loader2 className="w-4 h-4 animate-spin text-[#e3c56c] shrink-0" />
            <span className="text-xs font-bold text-[#e3c56c]">
              Processando e gerando o relatório anual em PDF no padrão {storeName}... O download iniciará
              automaticamente.
            </span>
          </div>
        )}

        {/* Resumo das 10 Seções do Documento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 relative z-10">
          <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <span className="text-[10px] text-[#e3c56c] font-bold uppercase tracking-wider block">
              Seções I a III
            </span>
            <span className="text-xs font-bold text-white block mt-0.5">Empresa, Resumo & Vendas</span>
            <span className="text-[11px] text-zinc-400">
              CNPJ, endereço, faturamento, ticket médio e vendas próprias vs terceiros.
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <span className="text-[10px] text-[#e3c56c] font-bold uppercase tracking-wider block">
              Seções IV a VI
            </span>
            <span className="text-xs font-bold text-white block mt-0.5">Recebimentos & Despesas</span>
            <span className="text-[11px] text-zinc-400">
              Distribuição de formas de pgto, custos de oficina e despesas da loja.
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <span className="text-[10px] text-[#e3c56c] font-bold uppercase tracking-wider block">
              Seções VII & VIII
            </span>
            <span className="text-xs font-bold text-white block mt-0.5">Estoque & Comissões</span>
            <span className="text-[11px] text-zinc-400">
              Valor anunciado do pátio, FIPE estimada e repasses a proprietários.
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <span className="text-[10px] text-[#e3c56c] font-bold uppercase tracking-wider block">
              Seções IX & X
            </span>
            <span className="text-xs font-bold text-white block mt-0.5">Qualidade & Isenção Fiscal</span>
            <span className="text-[11px] text-zinc-400">
              Auditoria cadastral, aviso de apoio gerencial e rodapé eletrônico.
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HEADER DA CENTRAL DO CONTADOR & CONFIGURAÇÕES */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Pacote de Exportações Estruturadas (CSV / XLSX / PDF)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Arquivos formatados para conferência contábil no período selecionado ({dateRange.label}).
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs font-bold shrink-0">
            Filtro: {dateRange.label}
          </span>
        </div>

        {/* Compliance Legal Disclaimer */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-start gap-3 text-xs text-zinc-400">
          <AlertCircle className="w-4 h-4 text-[#c9a44c] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-zinc-200 block">
              Aviso de Uso Gerencial & Limitação Fiscal
            </span>
            <p>
              Este relatório é um demonstrativo gerencial de apoio, elaborado a partir dos dados
              cadastrados no sistema {storeName}. Os valores devem ser conferidos com notas fiscais,
              contratos, comprovantes de pagamento e demais documentos. A validação contábil, fiscal e
              tributária é responsabilidade do contador responsável.
            </p>
          </div>
        </div>

        {/* PII Toggle */}
        <div className="pt-2">
          <label className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includePII}
              onChange={(e) => setIncludePII(e.target.checked)}
              className="rounded-sm border-zinc-700 bg-zinc-900 text-[#c9a44c] focus:ring-0"
            />
            <span className="text-xs font-bold text-zinc-200">
              Incluir dados pessoais necessários para conferência contábil (telefones e CPFs/documentos)
            </span>
          </label>
        </div>
      </div>

      {/* ========================================================= */}
      {/* GRID DE CARDS DE EXPORTAÇÃO */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Relatório Executivo PDF do Período */}
        <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-[#c9a44c]/60 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              {isExporting === 'pdf-consolidado-period' ? (
                <Loader2 className="w-5 h-5 text-[#e3c56c] animate-spin" />
              ) : (
                <FileText className="w-5 h-5 text-[#e3c56c]" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Relatório Executivo do Período (PDF)</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Demonstrativo visual formal com logotipo, dados do período ({dateRange.label}),
                faturamento, despesas e rodapé eletrônico.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              handleExport(
                'pdf',
                'consolidado',
                undefined,
                `Relatório Executivo (${dateRange.label})`,
              )
            }
            disabled={Boolean(isExporting)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#c9a44c] hover:bg-[#d8b35a] text-black font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting === 'pdf-consolidado-period' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar PDF do Período</span>
              </>
            )}
          </button>
        </div>

        {/* Card 2: Pasta de Trabalho XLSX */}
        <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-emerald-500/60 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              {isExporting === 'xlsx-consolidado-period' ? (
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Pasta de Trabalho Excel (XLSX)</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Planilha completa contendo abas separadas de Resumo, Vendas Detalhadas e Despesas do
                período.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              handleExport(
                'xlsx',
                'consolidado',
                undefined,
                `Planilha Excel (${dateRange.label})`,
              )
            }
            disabled={Boolean(isExporting)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting === 'xlsx-consolidado-period' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Gerando Planilha...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar XLSX Completo</span>
              </>
            )}
          </button>
        </div>

        {/* Card 3: Vendas Detalhadas CSV */}
        <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-sky-500/60 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              {isExporting === 'csv-vendas-period' ? (
                <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
              ) : (
                <Table className="w-5 h-5 text-sky-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Vendas Detalhadas (CSV)</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Transações de venda, tipo de estoque (própria/consignação), formas de pagamento e recibo.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              handleExport('csv', 'vendas', undefined, `CSV de Vendas (${dateRange.label})`)
            }
            disabled={Boolean(isExporting)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting === 'csv-vendas-period' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-200" />
                <span>Gerando CSV...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar CSV de Vendas</span>
              </>
            )}
          </button>
        </div>

        {/* Card 4: Despesas CSV */}
        <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-rose-500/60 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              {isExporting === 'csv-despesas-period' ? (
                <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
              ) : (
                <Table className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Despesas & Centros de Custo (CSV)</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Lista de gastos categorizados, rateio entre oficina e loja e custos vinculados a
                veículos.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              handleExport('csv', 'despesas', undefined, `CSV de Despesas (${dateRange.label})`)
            }
            disabled={Boolean(isExporting)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting === 'csv-despesas-period' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-200" />
                <span>Gerando CSV...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar CSV de Despesas</span>
              </>
            )}
          </button>
        </div>

        {/* Card 5: Estoque Final CSV */}
        <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-purple-500/60 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              {isExporting === 'csv-estoque-period' ? (
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              ) : (
                <Table className="w-5 h-5 text-purple-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Estoque Final em 31/12 (CSV)</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Balanço de motocicletas ativas, dias de pátio, valor total anunciado e referência FIPE.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              handleExport('csv', 'estoque', undefined, `CSV de Estoque (${dateRange.label})`)
            }
            disabled={Boolean(isExporting)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting === 'csv-estoque-period' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-200" />
                <span>Gerando CSV...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar CSV de Estoque</span>
              </>
            )}
          </button>
        </div>

        {/* Card 6: Movimentação de Estoque CSV */}
        <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-cyan-500/60 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              {isExporting === 'csv-movimentacao-estoque-period' ? (
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              ) : (
                <Boxes className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Movimentação de Estoque (CSV)</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Demonstrativo de entradas de motos próprias e consignadas, saídas e saldo final.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              handleExport(
                'csv',
                'movimentacao-estoque',
                undefined,
                `Movimentação de Estoque (${dateRange.label})`,
              )
            }
            disabled={Boolean(isExporting)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting === 'csv-movimentacao-estoque-period' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-200" />
                <span>Gerando CSV...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Movimentação</span>
              </>
            )}
          </button>
        </div>

        {/* Card 7: Comissões e Consignações CSV */}
        <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-amber-500/60 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              {isExporting === 'csv-comissoes-period' ? (
                <Loader2 className="w-5 h-5 text-[#e3c56c] animate-spin" />
              ) : (
                <HandCoins className="w-5 h-5 text-[#e3c56c]" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Comissões & Consignações (CSV)</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Operações com motos de terceiros, comissões apuradas e valores de repasse aos proprietários.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              handleExport(
                'csv',
                'comissoes',
                undefined,
                `Comissões e Consignações (${dateRange.label})`,
              )
            }
            disabled={Boolean(isExporting)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting === 'csv-comissoes-period' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-200" />
                <span>Gerando CSV...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Comissões</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
