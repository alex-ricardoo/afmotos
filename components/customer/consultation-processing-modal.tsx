'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Shield,
} from 'lucide-react';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';

interface ConsultationProcessingModalProps {
  isOpen: boolean;
  plate: string;
  isApiDone: boolean;
  apiError: string | null;
  onFinished: () => void;
  onRetry: () => void;
}

interface StepItem {
  id: number;
  title: string;
  subtitle: string;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    title: 'Autenticação & Pagamento Seguro',
    subtitle: 'Gateway autenticado com criptografia bancária',
  },
  {
    id: 2,
    title: 'Bases Oficiais SENATRAN e DETRAN',
    subtitle: 'Consulta em tempo real à Base Índice Nacional (BIN)',
  },
  {
    id: 3,
    title: 'Multas, IPVA & Restrições Judiciais',
    subtitle: 'Varredura em RENAINF, débitos e sistema RENAJUD',
  },
  {
    id: 4,
    title: 'Histórico de Sinistros e Leilões',
    subtitle: 'Cruzamento com pátios de seguradoras e boletins',
  },
  {
    id: 5,
    title: 'Estruturação e Emissão do Laudo',
    subtitle: 'Consolidação de procedência, score e Tabela FIPE',
  },
];

export function ConsultationProcessingModal({
  isOpen,
  plate,
  isApiDone,
  apiError,
  onFinished,
  onRetry,
}: ConsultationProcessingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);
  const formattedPlate = formatBrazilianPlate(plate);

  const onFinishedRef = useRef(onFinished);
  const isApiDoneRef = useRef(isApiDone);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    isApiDoneRef.current = isApiDone;
  }, [isApiDone]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset states whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setProgress(15);
      setIsCompleted(false);
    }
  }, [isOpen]);

  // Guaranteed step-by-step sequential animation
  useEffect(() => {
    if (!isOpen || apiError) return;

    // Progression intervals (approx 750ms per step = ~3.5s total experience)
    const stepDelays = [750, 800, 850, 800];
    const progressTargets = [35, 58, 78, 92];

    if (currentStep < 4) {
      const timer = setTimeout(() => {
        const next = currentStep + 1;
        setCurrentStep(next);
        setProgress(progressTargets[currentStep]);
      }, stepDelays[currentStep]);

      return () => clearTimeout(timer);
    }

    // When at step 4 (final step): wait for API to be completed before finishing
    if (currentStep === 4) {
      if (isApiDone) {
        setProgress(100);
        setIsCompleted(true);

        const redirectTimer = setTimeout(() => {
          onFinishedRef.current();
        }, 1100);

        return () => clearTimeout(redirectTimer);
      } else {
        setProgress(95);
      }
    }
  }, [isOpen, currentStep, isApiDone, apiError]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 select-none">
      {/* Subtle radial golden glow behind modal */}
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#c9a44c]/10 blur-[90px] pointer-events-none" />

      {/* Main Card Container */}
      <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-[#0a0c12] border border-[#c9a44c]/30 p-4 sm:p-6 shadow-2xl shadow-black space-y-4 sm:space-y-5 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Subtle top ambient gold shimmer */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-90" />

        {/* Error State */}
        {apiError ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Não foi possível emitir o laudo</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">{apiError}</p>
            </div>
            <button
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Voltar e Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            {/* Header: Badge & Plate */}
            <div className="flex flex-col items-center text-center space-y-2.5 pt-1">
              {/* Status Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/30 text-[10px] sm:text-[11px] font-bold text-[#c9a44c] uppercase tracking-wider">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Laudo Concluído</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a44c] animate-ping" />
                    <span>Auditoria em Andamento</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight font-heading">
                {isCompleted
                  ? 'Laudo Veicular Gerado com Sucesso!'
                  : 'Consultando Bases Governamentais'}
              </h2>

              {/* Mercosul Plate Representation with Laser Line */}
              <div className="w-32 sm:w-36 rounded-md overflow-hidden border border-zinc-400/90 shadow-md bg-white relative">
                <div className="bg-[#003399] px-2 py-0.5 flex items-center justify-between text-white text-[7.5px] font-black tracking-wider">
                  <span>BRASIL</span>
                  <div className="w-2.5 h-1.5 rounded-[1px] bg-[#009b3a] flex items-center justify-center">
                    <div
                      className="w-1.5 h-1 bg-[#fedf00]"
                      style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                    />
                  </div>
                </div>
                <div className="py-1 px-1 text-center font-mono font-black text-zinc-950 text-sm sm:text-base tracking-widest leading-none bg-zinc-50 relative overflow-hidden">
                  {/* Laser scan line passing over plate */}
                  <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-[#c9a44c]/60 to-transparent animate-plate-laser pointer-events-none" />
                  {formattedPlate}
                </div>
              </div>
            </div>

            {/* Progress Bar with Percentage */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">Progresso da Auditoria</span>
                <span className="font-mono font-black text-[#c9a44c] text-xs">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#b38e3a] via-[#d4b35e] to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-sm shadow-[#c9a44c]/40"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-2">
              {STEPS.map((step, idx) => {
                const isDone = idx < currentStep || (idx === 4 && isCompleted);
                const isActive = idx === currentStep && !isCompleted;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? 'bg-[#c9a44c]/[0.08] border-[#c9a44c]/40 shadow-sm'
                        : isDone
                        ? 'bg-zinc-900/40 border-emerald-500/20'
                        : 'bg-zinc-950/30 border-zinc-800/40 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Icon */}
                      <div className="shrink-0">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : isActive ? (
                          <div className="w-5 h-5 rounded-full bg-[#c9a44c]/20 border border-[#c9a44c]/50 flex items-center justify-center text-[#c9a44c]">
                            <Loader2 className="w-3 h-3 animate-spin" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-zinc-800/40 border border-zinc-700/40 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold leading-tight truncate ${
                            isActive
                              ? 'text-white'
                              : isDone
                              ? 'text-zinc-200'
                              : 'text-zinc-500'
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Badge */}
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                        isDone
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          : isActive
                          ? 'bg-[#c9a44c]/20 text-[#c9a44c] border border-[#c9a44c]/30 animate-pulse'
                          : 'text-zinc-600'
                      }`}
                    >
                      {isDone ? 'OK' : isActive ? 'BUSCANDO...' : 'FILA'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Redirection indicator when complete */}
            {isCompleted && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 pt-1 animate-in fade-in duration-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Abrindo seu laudo veicular...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
