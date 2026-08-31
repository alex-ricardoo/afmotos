import React from 'react';
import {
  FileCheck,
  ShieldCheck,
  AlertCircle,
  FileText,
  TrendingUp,
  Download,
  Share2,
  CheckCircle2,
} from 'lucide-react';

export function VehicleHistoryReportMockup() {
  return (
    <section className="py-16 sm:py-24 bg-[#0D111A] border-t border-[#1F293D] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Produto Real • Sem Surpresas</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Veja exatamente como você recebe seu laudo
          </h2>
          <p className="text-sm sm:text-base text-zinc-300">
            Você recebe um relatório completo, fácil de ler e pronto para imprimir ou compartilhar no WhatsApp.
          </p>
        </div>

        {/* Floating Mockup Card with Realistic Visual Hierarchy */}
        <div className="relative rounded-3xl p-4 sm:p-8 bg-[#131A26] border border-[#1F293D] shadow-2xl shadow-black/60 backdrop-blur-xl">
          {/* Top Bar with actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#1F293D] text-xs">
            <div className="flex items-center gap-2 text-zinc-400 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LAUDO OFICIAL • AUTENTICAÇÃO DIGITAL DETRAN/SENATRAN</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                Exemplo Demonstrativo
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400">
                <Download className="w-3.5 h-3.5 text-zinc-300" /> PDF Oficial
              </span>
            </div>
          </div>

          {/* Report Sheet */}
          <div className="bg-[#080B11] rounded-2xl border border-[#1F293D] p-4 sm:p-7 space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1F293D]">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Veículo Consultado
                </span>
                <h4 className="text-lg sm:text-2xl font-black text-white font-heading">
                  HONDA CG 160 TITAN FLEX (2024/2024)
                </h4>
                <p className="text-xs text-zinc-400 font-mono">
                  Placa: <strong className="text-white">BRA2E19</strong> • Renavam: <strong className="text-zinc-300">012948*****</strong> • Chassi: <strong className="text-zinc-300">9C2KC16******</strong>
                </p>
              </div>

              {/* Status Geral */}
              <div className="flex items-center gap-2 self-start sm:self-center px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold shadow-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Situação Cadastral: Regular</span>
              </div>
            </div>

            {/* Critical Alert Points Highlight Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Highlight 1: Nada Consta Roubo */}
              <div className="p-4 rounded-2xl bg-[#131A26] border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 uppercase font-bold">Roubo & Furto</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-base font-black text-emerald-400">
                  Nada Consta
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Nenhuma queixa policial ou ocorrência ativa nas bases nacionais.
                </p>
              </div>

              {/* Highlight 2: Alienação / Gravame */}
              <div className="p-4 rounded-2xl bg-[#131A26] border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 uppercase font-bold">Gravame / Financiamento</span>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-base font-black text-amber-400">
                  Alienação Fiduciária Ativa
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Banco Santander (Brasil) S.A. • Exige quitação antes de transferir.
                </p>
              </div>

              {/* Highlight 3: Leilão */}
              <div className="p-4 rounded-2xl bg-[#131A26] border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 uppercase font-bold">Leilão & Sinistro</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-base font-black text-emerald-400">
                  Sem Registros de Leilão
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Nenhum apontamento em leiloeiros oficiais ou indenização integral.
                </p>
              </div>
            </div>

            {/* Structured Table: Proprietários e FIPE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#131A26] border border-[#1F293D] space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                  👥 Histórico de Proprietários
                </span>
                <div className="space-y-1.5 text-xs text-zinc-300">
                  <div className="flex justify-between pb-1 border-b border-[#1F293D]">
                    <span className="text-zinc-400">1º Proprietário (2024-2025):</span>
                    <span className="font-semibold text-white">Pessoa Física</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">2º Proprietário Atual:</span>
                    <span className="font-semibold text-white">Pessoa Física (PE)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#131A26] border border-[#1F293D] space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                  📊 Cotação Oficial FIPE
                </span>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-zinc-400">Valor de Referência:</span>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    R$ 19.850,00
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Código FIPE: 811162-4 • Atualização oficial do mês corrente
                </p>
              </div>
            </div>

            {/* Bottom Actions reassurance */}
            <div className="pt-3 border-t border-[#1F293D] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <Share2 className="w-4 h-4 text-emerald-400" />
                Envio automático em PDF no seu WhatsApp logo após a emissão
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                Hash de Autenticidade: Senatran-PE-2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
