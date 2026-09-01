'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  FileText,
  ShieldCheck,
  ZoomIn,
  Download,
  Share2,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';

const REPORT_SECTIONS = [
  {
    title: 'Diagnóstico Geral de Risco',
    desc: 'Roubo/furto, Renajud, gravame, leilão e sinistro em destaque imediato.',
    tag: 'Segurança',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    title: 'Identificação Cadastral',
    desc: 'Dados oficiais Senatran & Detran com mascaramento LGPD.',
    tag: 'Oficial',
    tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  },
  {
    title: 'Restrições & Gravame',
    desc: 'Detalhamento de alienação fiduciária e agente financeiro.',
    tag: 'Financeiro',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  {
    title: 'Proprietários Anteriores',
    desc: 'Histórico de titularidade por ano e tipo de titular.',
    tag: 'Procedência',
    tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  {
    title: 'Tabela FIPE & Débitos',
    desc: 'Cotação média atualizada e débitos estaduais (IPVA/multas).',
    tag: 'Valores',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
];

interface VehicleHistoryReportMockupProps {
  siteName?: string;
}

export function VehicleHistoryReportMockup({ siteName = 'AF Motos' }: VehicleHistoryReportMockupProps = {}) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  return (
    <section className="py-12 sm:py-20 bg-[#0D111A] border-t border-[#1F293D] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Exemplo Real do Documento</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Veja como você recebe seu laudo oficial
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Relatório oficial diagramado, limpo e direto ao ponto. Pronto para imprimir ou compartilhar no WhatsApp.
          </p>
        </div>

        {/* Real Document Preview Frame */}
        <div className="relative rounded-3xl p-4 sm:p-7 bg-[#131A26] border border-[#1F293D] shadow-2xl shadow-black/80 backdrop-blur-xl">
          {/* Top Bar with actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#1F293D] text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-xs sm:text-sm">
                LAUDO DE HISTÓRICO VEICULAR • {(siteName || 'AF Motos').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="Clique para ampliar o laudo"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Ampliar Imagem</span>
              </button>
            </div>
          </div>

          {/* Image Container with clickable zoom */}
          <div
            onClick={() => setIsZoomOpen(true)}
            className="group relative w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-inner cursor-zoom-in transition-all duration-300 hover:border-amber-500/40"
          >
            <div className="relative w-full aspect-[9/11] sm:aspect-[4/5] md:aspect-[16/17]">
              <Image
                src="/exemplo-laudo-historico.jpg"
                alt={`Exemplo do Laudo de Histórico Veicular Oficial emitido pela ${siteName || 'AF Motos'}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 900px"
                className="object-contain object-top transition-transform duration-300 group-hover:scale-[1.01]"
                priority
              />
            </div>

            {/* Hover Floating Overlay Badge */}
            <div className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-xl transition-opacity opacity-90 group-hover:opacity-100">
              <ZoomIn className="w-4 h-4 text-amber-400" />
              <span>Clique para ver em tela cheia</span>
            </div>
          </div>

          {/* Breakdown Pills below Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-5 mt-4 border-t border-[#1F293D]">
            {REPORT_SECTIONS.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#080B11] border border-[#1F293D] space-y-1"
              >
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <span
                    className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${item.tagColor}`}
                  >
                    {item.tag}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom Reassurance */}
          <div className="mt-5 pt-3 border-t border-[#1F293D] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Share2 className="w-4 h-4 text-emerald-400" />
              Enviado em PDF diretamente no seu WhatsApp após a confirmação.
            </span>
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              <Lock className="w-3 h-3 text-emerald-400" />
              Conformidade total com LGPD & Senatran
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="w-full max-w-4xl max-h-[95vh] flex flex-col items-center relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-10 sm:-top-12 right-0 sm:right-2 p-2 rounded-full bg-zinc-800/90 text-white hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold px-3"
            >
              <X className="w-4 h-4" />
              <span>Fechar</span>
            </button>

            {/* Modal Image Box */}
            <div
              className="relative w-full h-[85vh] rounded-2xl overflow-y-auto overflow-x-hidden bg-zinc-950 border border-zinc-800 shadow-2xl p-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full min-h-[650px] sm:min-h-[900px]">
                <Image
                  src="/exemplo-laudo-historico.jpg"
                  alt="Laudo Oficial de Histórico Veicular Ampliado"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
