'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowRight,
  RotateCw,
  Search,
  ExternalLink,
  Lock,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  formatElapsedTime,
  calculateElapsedSeconds,
  calculateHonestProgress,
  type LookupUiStatus,
} from '@/lib/vehicle-lookup/ui-session';

export interface ConsultationProgressPanelProps {
  plateDisplay: string;
  startedAt: string;
  status: LookupUiStatus;
  message?: string;
  errorMessage?: string;
  onViewResult?: () => void;
  onLeave?: () => void;
  allowManualReprocess?: boolean;
  onManualReprocess?: () => void;
  compact?: boolean;
  context?: 'admin' | 'customer';
  consultationId?: string;
  supportPhone?: string | null;
}

const ROTATING_MESSAGES = [
  'Consultas oficiais podem levar alguns instantes.',
  'Estamos aguardando o retorno das fontes consultadas.',
  'Seu histórico será exibido assim que a consulta for concluída.',
  'Para sua segurança, não iniciamos uma segunda consulta enquanto esta está em andamento.',
];

export function ConsultationProgressPanel({
  plateDisplay,
  startedAt,
  status,
  message,
  errorMessage,
  onViewResult,
  onLeave,
  allowManualReprocess = false,
  onManualReprocess,
  compact = false,
  context = 'admin',
  consultationId,
  supportPhone,
}: ConsultationProgressPanelProps) {
  // Cronômetro em tempo real
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    calculateElapsedSeconds(startedAt)
  );

  // Mensagens rotativas com troca suave a cada 10s
  const [rotatingIndex, setRotatingIndex] = useState(0);

  const isTerminal = ['completed', 'failed', 'charge_status_unknown', 'manual_review'].includes(
    status
  );

  // Tique do cronômetro a cada 1s (apenas se não estiver em estado terminal com resultado já persistido)
  useEffect(() => {
    // Sincroniza imediatamente com startedAt
    setElapsedSeconds(calculateElapsedSeconds(startedAt));

    if (status === 'completed') {
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsedSeconds(startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, status]);

  // Rotação de mensagens a cada 10 segundos
  useEffect(() => {
    if (isTerminal) return;

    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isTerminal]);

  const honestProgress = useMemo(
    () => calculateHonestProgress(elapsedSeconds, status),
    [elapsedSeconds, status]
  );

  const formattedTimer = formatElapsedTime(elapsedSeconds);

  // Definição das 5 etapas da especificação
  const steps = useMemo(() => {
    const isCompleted = status === 'completed';
    const isInterrupted = ['failed', 'charge_status_unknown', 'manual_review'].includes(status);

    return [
      {
        id: 1,
        title: 'Validando a placa',
        description: 'Padrão oficial Mercosul / Nacional verificado',
        status: 'done', // Concluída localmente antes do disparo
      },
      {
        id: 2,
        title: 'Preparando consulta segura',
        description: 'Idempotência e lock exclusivo ativados',
        status: 'done',
      },
      {
        id: 3,
        title: 'Consultando fontes oficiais',
        description: 'Bases Senatran, Detran e histórico nacional',
        status: isCompleted ? 'done' : isInterrupted ? 'interrupted' : 'current',
      },
      {
        id: 4,
        title: 'Consolidando informações do veículo',
        description: 'Compilando dados cadastrais, restrições e gravames',
        status: isCompleted ? 'done' : isInterrupted ? 'pending' : elapsedSeconds > 25 ? 'current' : 'pending',
      },
      {
        id: 5,
        title: 'Preparando seu resultado',
        description: 'Emissão do laudo consolidado de procedência',
        status: isCompleted ? 'done' : 'pending',
      },
    ];
  }, [status, elapsedSeconds]);

  // Conteúdo contextual do badge e título
  const headerContent = useMemo(() => {
    switch (status) {
      case 'completed':
        return {
          badgeText: 'CONSULTA CONCLUÍDA',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          title: 'Consulta concluída com sucesso!',
          subtitle: `O histórico veicular completo da placa ${plateDisplay} está pronto para visualização.`,
        };
      case 'consultation_in_progress':
        return {
          badgeText: 'CONSULTA JÁ EM ANDAMENTO',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          title: 'Já existe uma consulta em andamento',
          subtitle: `As bases oficiais já estão sendo consultadas para a placa ${plateDisplay}. Para evitar cobrança duplicada, aguarde a finalização.`,
        };
      case 'charge_status_unknown':
      case 'manual_review':
        return {
          badgeText: 'RETORNO EM ANÁLISE',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          title: 'Consulta em verificação de retorno',
          subtitle:
            'A consulta foi enviada, mas o retorno das bases oficiais demorou além do esperado. Para sua proteção financeira, não iniciamos uma nova consulta automaticamente.',
        };
      case 'failed':
        return {
          badgeText: 'CONSULTA NÃO CONCLUÍDA',
          badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30',
          title: 'Não foi possível concluir a consulta',
          subtitle:
            errorMessage ||
            'Não foi possível concluir a consulta neste momento. Nenhuma nova tentativa automática será feita.',
        };
      case 'starting':
      case 'processing':
      default:
        return {
          badgeText: 'CONSULTA EM ANDAMENTO',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
          title: 'Estamos consultando as bases oficiais',
          subtitle: `Estamos consolidando o histórico veicular de ${plateDisplay}. Isso pode levar alguns instantes.`,
        };
    }
  }, [status, plateDisplay, errorMessage]);

  return (
    <div
      className={`rounded-3xl border border-zinc-800/90 bg-gradient-to-b from-[#0e121a] via-[#090c13] to-[#07090f] shadow-2xl backdrop-blur-2xl relative overflow-hidden transition-all duration-300 ${
        compact ? 'p-4 sm:p-6' : 'p-5 sm:p-8 max-w-2xl mx-auto'
      }`}
      role="region"
      aria-label="Painel de Acompanhamento da Consulta Veicular"
    >
      {/* Top Gold Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

      {/* Decorative Glows */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#c9a44c]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5 sm:space-y-6">
        {/* Header Block */}
        <div className="text-center space-y-3">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase select-none transition-all shadow-xs ${headerContent.badgeColor}`}
          >
            {status === 'processing' || status === 'starting' ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 motion-reduce:hidden" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span>{headerContent.badgeText}</span>
              </span>
            ) : status === 'completed' ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{headerContent.badgeText}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{headerContent.badgeText}</span>
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            {headerContent.title}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            {headerContent.subtitle}
          </p>

          {/* Destaque da Placa Estilo Mercosul / Oficial */}
          <div className="pt-1.5 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-[#c9a44c]/40 rounded-xl px-3.5 py-1.5 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">BR</span>
              <span className="h-3 w-[1px] bg-zinc-700" />
              <span className="font-mono text-sm sm:text-base font-black tracking-widest text-[#c9a44c]">
                {plateDisplay}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-xl shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c9a44c]" />
              <span>Processamento seguro</span>
            </span>
          </div>
        </div>

        {/* Cronômetro e Barra de Progresso Honesta */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 sm:p-5 space-y-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Clock className="w-4 h-4 text-[#c9a44c] shrink-0" />
              <span className="font-semibold text-zinc-200">
                Tempo decorrido:
              </span>
              <span className="font-mono font-bold text-white bg-zinc-950/80 border border-zinc-800 px-2 py-0.5 rounded-md tabular-nums text-xs">
                {formattedTimer}
              </span>
            </div>

            <div className="text-[11px] font-medium text-zinc-400">
              {status === 'completed' ? (
                <span className="text-emerald-400 font-bold">100% Concluído</span>
              ) : (
                <span className="text-amber-300/90 font-medium">Processando consulta…</span>
              )}
            </div>
          </div>

          {/* Barra de Progresso com Shimmer */}
          <div
            className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
            role="progressbar"
            aria-valuenow={honestProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da consulta veicular"
          >
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full relative ${
                status === 'completed'
                  ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-r from-amber-600 via-[#c9a44c] to-amber-300 shadow-[0_0_12px_rgba(201,164,76,0.35)]'
              }`}
              style={{ width: `${honestProgress}%` }}
            >
              {/* Shimmer Effect */}
              {status !== 'completed' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer motion-reduce:hidden" />
              )}
            </div>
          </div>

          {/* Legenda de Tempo da Especificação */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/50">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" />
              <span>Tempo normal: <strong className="text-zinc-200">45 a 90 segundos</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
              <span>Limite máximo: <strong className="text-zinc-200">até 2 minutos</strong></span>
            </span>
          </div>
        </div>

        {/* Stepper de 5 Etapas com Tags de Estado */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 text-left">
              Etapas do Processamento
            </p>
            <span className="text-[10px] text-zinc-500">
              {status === 'completed' ? '5 de 5 concluídas' : 'Processando bases'}
            </span>
          </div>

          <div className="space-y-2">
            {steps.map((st) => {
              const isDone = st.status === 'done';
              const isCurrent = st.status === 'current';
              const isPending = st.status === 'pending';
              const isInterrupted = st.status === 'interrupted';

              return (
                <div
                  key={st.id}
                  className={`flex items-start sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-200'
                      : isCurrent
                      ? 'bg-gradient-to-r from-amber-500/15 via-[#c9a44c]/10 to-transparent border-[#c9a44c]/50 text-white shadow-sm ring-1 ring-[#c9a44c]/20'
                      : isInterrupted
                      ? 'bg-amber-500/5 border-amber-500/30 text-amber-200'
                      : 'bg-zinc-900/30 border-zinc-800/40 text-zinc-500 opacity-60'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c9a44c] motion-reduce:animate-none" />
                        </div>
                      ) : isInterrupted ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-zinc-700 bg-zinc-950 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                          {st.id}
                        </div>
                      )}
                    </div>

                    <div className="text-left min-w-0">
                      <p
                        className={`text-xs font-semibold leading-tight ${
                          isCurrent ? 'text-white font-bold' : isDone ? 'text-zinc-200' : 'text-zinc-400'
                        }`}
                      >
                        {st.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug truncate sm:whitespace-normal">
                        {st.description}
                      </p>
                    </div>
                  </div>

                  {/* Status Pill na Direita */}
                  <div className="shrink-0 mt-0.5 sm:mt-0">
                    {isDone ? (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        Concluído
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[10px] font-bold text-[#c9a44c] bg-[#c9a44c]/15 border border-[#c9a44c]/30 px-2 py-0.5 rounded-md">
                        Em andamento
                      </span>
                    ) : isInterrupted ? (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        Interrompido
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                        Aguardando
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensagens Rotativas Discretas (aria-live) */}
        {!isTerminal && (
          <div
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center transition-all duration-500 shadow-inner"
            aria-live="polite"
          >
            <p className="text-xs text-zinc-300 italic flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#c9a44c] shrink-0" />
              <span>{ROTATING_MESSAGES[rotatingIndex]}</span>
            </p>
          </div>
        )}

        {/* Orientação Persistente Obrigatória com Chips Reassuradores */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-zinc-950/70 to-zinc-950/90 p-4 text-left text-xs space-y-2.5 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-xs sm:text-sm">Mantenha esta tela aberta</span>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed">
            Para sua segurança financeira e técnica, não recarregue a página, não volte no navegador e não inicie outra consulta para a mesma placa.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-500/15 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Bloqueio anti-duplicidade ativo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Resultado automático sem recarregar</span>
            </div>
          </div>
        </div>

        {/* Bloco de Ações e Respostas Terminais */}
        <div className="pt-2">
          {status === 'completed' && (
            <Button
              type="button"
              onClick={onViewResult}
              className="w-full h-11 sm:h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <span>Ver Laudo Completo</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {status === 'consultation_in_progress' && (
            <div className="space-y-3">
              <Button
                type="button"
                onClick={onViewResult || (() => window.location.reload())}
                className="w-full h-11 bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:brightness-110 text-zinc-950 font-bold rounded-xl shadow-lg shadow-[#c9a44c]/20 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <span>Acompanhar consulta em andamento</span>
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          )}

          {(status === 'charge_status_unknown' || status === 'manual_review') && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLeave}
                  className="w-full sm:flex-1 h-11 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.99] transition-transform"
                >
                  Entendi
                </Button>

                {context === 'admin' && allowManualReprocess && onManualReprocess && (
                  <Button
                    type="button"
                    onClick={onManualReprocess}
                    className="w-full sm:flex-1 h-11 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
                  >
                    <span>Reprocessar manualmente</span>
                    <RotateCw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {context === 'customer' && supportPhone && (
                <p className="text-[11px] text-zinc-400 text-center">
                  Dúvidas sobre o andamento? Entre em contato com nosso suporte via WhatsApp.
                </p>
              )}
            </div>
          )}

          {status === 'failed' && (
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={onLeave}
                className="w-full h-11 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.99] transition-transform"
              >
                Voltar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
