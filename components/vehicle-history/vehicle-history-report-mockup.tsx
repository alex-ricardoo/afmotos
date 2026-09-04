'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Sparkles,
  ShieldCheck,
  AlertOctagon,
  Landmark,
  Scale,
  Car,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useVehicleHistory } from './vehicle-history-context';

const REPORT_HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Diagnóstico Geral de Risco',
    desc: 'Alerta instantâneo de roubo e furto ativo, restrições e gravame impeditivo.',
    tag: 'Segurança Máxima',
  },
  {
    icon: Landmark,
    title: 'Dívidas Bancárias & Gravame',
    desc: 'Comprova se o veículo está quitado ou alienado fiduciariamente a bancos.',
    tag: 'Financeiro',
  },
  {
    icon: AlertOctagon,
    title: 'Leilão & Histórico de Batidas',
    desc: 'Identifica leilão financeiro, recuperado de seguradora e sinistro com média monta.',
    tag: 'Anti-Prejuízo',
  },
  {
    icon: Scale,
    title: 'Bloqueios Judiciais & Renajud',
    desc: 'Verifica pendências na justiça que impedem transferência ou causam apreensão.',
    tag: 'Jurídico',
  },
  {
    icon: Car,
    title: 'Tabela FIPE, IPVA & Multas',
    desc: 'Valor de mercado em tempo real e levantamento de débitos estaduais em aberto.',
    tag: 'Oficial Detran',
  },
];

interface VehicleHistoryReportMockupProps {
  siteName?: string;
}

export function VehicleHistoryReportMockup({ siteName = 'AF Motos' }: VehicleHistoryReportMockupProps = {}) {
  const { scrollToSection } = useVehicleHistory();
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Close modal on ESC key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomOpen(false);
      }
    };
    if (isZoomOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      setZoomScale(1);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isZoomOpen]);

  const handleZoomIn = useCallback(() => {
    setZoomScale((prev) => Math.min(prev + 0.35, 2.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomScale((prev) => Math.max(prev - 0.35, 0.8));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomScale(1);
  }, []);

  const handleConsultarClick = () => {
    setIsZoomOpen(false);
    scrollToSection('consulta-placa');
  };

  return (
    <section className="py-14 sm:py-20 bg-[#0A0E17] border-t border-[#1F293D] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Exemplo Real do Documento</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Veja como você recebe seu laudo oficial
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Você recebe um <strong className="text-amber-400">link no WhatsApp</strong> e pode{' '}
            <strong className="text-amber-400">baixar o laudo em PDF</strong> para guardar ou apresentar ao comprador na hora de negociar.
          </p>
        </div>

        {/* Executive Document Showcase Card */}
        <div className="relative rounded-3xl p-3 sm:p-6 md:p-8 bg-[#101622]/95 border border-[#1F293D] shadow-2xl shadow-black/80 backdrop-blur-xl">
          {/* Top Document Viewer Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#1F293D]/80">
            {/* Window controls + File Identity */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 mr-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>

              <div className="flex items-center gap-2 bg-[#090D15] px-3 py-1.5 rounded-lg border border-[#1F293D]">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-[11px] sm:text-xs font-bold text-zinc-200 truncate">
                  laudo_oficial_AFM-2026.pdf
                </span>
                <span className="hidden md:inline text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Autêntico Senatran
                </span>
              </div>
            </div>

            {/* Quick Action Zoom Button */}
            <button
              type="button"
              id="btn-mockup-zoom-open"
              onClick={() => setIsZoomOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver laudo completo ampliado</span>
            </button>
          </div>

          {/* Interactive Document Sheet Viewer */}
          <div
            onClick={() => setIsZoomOpen(true)}
            className="group relative w-full rounded-2xl overflow-hidden bg-[#07090F] border border-zinc-800/90 shadow-2xl cursor-zoom-in transition-all duration-300 hover:border-amber-500/40 p-1.5 sm:p-3"
            title="Clique para abrir e ampliar o laudo oficial em alta resolução"
          >
            {/* The Document Sheet */}
            <div className="relative w-full aspect-[9/13] sm:aspect-[4/5] md:aspect-[16/15] rounded-xl overflow-hidden bg-white shadow-2xl shadow-black/90">
              <Image
                src="/exemplo-laudo-historico.jpg"
                alt={`Exemplo do Laudo de Histórico Veicular Oficial emitido pela ${siteName}`}
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 960px"
                className="object-contain object-top transition-transform duration-300 group-hover:scale-[1.015]"
              />
            </div>

            {/* Floating Touch-Friendly Overlay Badge */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:bg-slate-950 group-hover:border-amber-400">
              <ZoomIn className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span>Toque para dar zoom em HD</span>
            </div>
          </div>

          {/* Key Inspection Highlights Cards */}
          <div className="mt-5 pt-5 border-t border-[#1F293D]/90 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-200 uppercase tracking-wider">
                O que você descobre nesta página do laudo:
              </h3>
              <span className="text-[11px] text-zinc-400 hidden sm:inline">
                5 pontos cruciais checados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {REPORT_HIGHLIGHTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#090D15]/90 border border-[#1F293D] hover:border-zinc-700 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{item.desc}</p>
                  </div>
                );
              })}

              {/* Price comparison card */}
              <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/25 flex flex-col justify-between space-y-2 sm:col-span-2 lg:col-span-1">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-amber-300">Economia Real</span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      R$ 39,90
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug mt-1">
                    Concorrentes cobram <strong className="text-zinc-400 line-through">R$ 64,90</strong> pelo mesmo laudo. Aqui você paga menos com atendimento humano.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToSection('consulta-placa')}
                  className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Consultar Placa Agora</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Trust & Delivery Pledge */}
          <div className="mt-5 pt-3.5 border-t border-[#1F293D] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-400">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Receba o PDF oficial e link seguro direto no seu WhatsApp após a confirmação.</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300/90 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Use para negociar com vantagem e evitar prejuízo</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Fidelity Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Sticky Modal Top Bar */}
          <header
            className="w-full max-w-5xl flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">Exemplo Real de Laudo Emitido</p>
                <p className="text-[10px] text-zinc-400 hidden sm:block">Placa Modelo BRA-2E12 • Senatran / Detran Oficial</p>
              </div>
            </div>

            {/* Zoom Controls Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-0.5">
                <button
                  type="button"
                  title="Diminuir Zoom"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] font-bold text-amber-400 px-2 min-w-[42px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  title="Aumentar Zoom"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Restaurar Tamanho Normal"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-slate-800 transition-colors ml-0.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Close Button with min 48px touch target */}
              <button
                type="button"
                id="btn-mockup-zoom-close"
                onClick={() => setIsZoomOpen(false)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xl border border-zinc-700 active:scale-95"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Fechar</span>
              </button>
            </div>
          </header>

          {/* Interactive Scrollable Canvas */}
          <div
            className="relative w-full max-w-5xl flex-1 my-2 overflow-auto rounded-2xl bg-neutral-950 border border-zinc-800/80 shadow-2xl flex items-start justify-center p-2 sm:p-6 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative transition-transform duration-200 ease-out origin-top shadow-2xl rounded-xl overflow-hidden bg-white"
              style={{
                transform: `scale(${zoomScale})`,
                width: '100%',
                maxWidth: '900px',
                minHeight: '1150px',
              }}
            >
              <Image
                src="/exemplo-laudo-historico.jpg"
                alt="Laudo Oficial de Histórico Veicular Ampliado em Alta Resolução"
                fill
                loading="eager"
                priority
                className="object-contain object-top"
              />
            </div>
          </div>

          {/* Sticky Modal Bottom Action Bar */}
          <footer
            className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-md z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-xs text-zinc-300 text-center sm:text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Consulte qualquer veículo por apenas <strong>R$ 39,90</strong> com suporte de nossa equipe.</span>
            </div>

            <button
              type="button"
              onClick={handleConsultarClick}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>Consultar Minha Placa Agora</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </footer>
        </div>
      )}
    </section>
  );
}
