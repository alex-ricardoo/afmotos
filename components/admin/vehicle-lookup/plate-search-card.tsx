'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Search,
  Sparkles,
  Database,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  RotateCw,
  Zap,
  FileCheck2,
  CreditCard,
  KeyRound,
  ExternalLink,
  WifiOff,
  RotateCcw,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  formatBrazilianPlate,
  isValidBrazilianPlate,
  normalizeBrazilianPlate,
} from '@/lib/vehicle-lookup/plate';
import {
  checkPlateCacheAction,
  executeVehiclePlateLookupAction,
  syncConsultationStatusAction,
} from '@/lib/actions/vehicle-lookup';
import type { VehicleConsultationSummaryDto } from '@/lib/vehicle-lookup/types';
import { ConsultationConfirmModal } from './consultation-confirm-modal';
import { RiskBadge, ModeBadge } from './consultation-badge';
import { MercosulPlateInput } from './mercosul-plate-web';
import { ConsultationProgressPanel } from '@/components/vehicle-lookup/consultation-progress-panel';
import { LeaveConfirmDialog } from '@/components/vehicle-lookup/leave-confirm-dialog';
import {
  saveActiveLookupSession,
  getActiveLookupSession,
  clearActiveLookupSession,
  listActiveLookupSessions,
  logLookupUiEvent,
  type LookupUiStatus,
  type ActiveLookupSession,
} from '@/lib/vehicle-lookup/ui-session';

interface PlateSearchCardProps {
  isMockMode: boolean;
  onNavigateToHistory?: () => void;
}

export function PlateSearchCard({ isMockMode, onNavigateToHistory }: PlateSearchCardProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [plateInput, setPlateInput] = useState('');
  const [isCheckingCache, setIsCheckingCache] = useState(false);
  const [cachedResult, setCachedResult] = useState<VehicleConsultationSummaryDto | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReprocessConfirmOpen, setIsReprocessConfirmOpen] = useState(false);
  const [reprocessReason, setReprocessReason] = useState('');

  // Estados da consulta em andamento e persistência de sessão
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStatus, setActiveStatus] = useState<LookupUiStatus>('starting');
  const [activeSession, setActiveSession] = useState<ActiveLookupSession | null>(null);
  const [activeConsultationId, setActiveConsultationId] = useState<string | undefined>(undefined);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    isInsufficientBalance?: boolean;
    rechargeUrl?: string;
    balance?: string;
    isTokenError?: boolean;
    isProviderUnavailable?: boolean;
    isConsultationInProgress?: boolean;
    isChargeStatusUnknown?: boolean;
    userGuidance?: string;
    attempts?: number;
    failedPlate?: string;
    canManualReprocess?: boolean;
  } | null>(null);

  // Auto-focus on plate input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 1. Restauração de Sessão em Caso de Refresh / Navegação
  useEffect(() => {
    const existingSessions = listActiveLookupSessions('admin');
    if (existingSessions.length === 0) return;

    const session = existingSessions[0];
    if (!session || !session.plateNormalized) return;

    logLookupUiEvent('vehicle_lookup_ui_restore_processing', {
      context: 'admin_panel',
      plateMasked: session.plateNormalized,
      status: session.status,
    });

    setActiveSession(session);
    setPlateInput(session.plateDisplay);
    setIsExecuting(true);
    setActiveStatus(session.status);

    // Consulta backend para sincronizar estado real
    syncConsultationStatusAction(session.plateNormalized).then((res) => {
      if (res.status === 'completed' && res.consultationId) {
        setActiveStatus('completed');
        setActiveConsultationId(res.consultationId);
        clearActiveLookupSession(session.plateNormalized, 'admin');
        toast.success('Consulta finalizada com sucesso nas bases oficiais!');
      } else if (res.status === 'processing') {
        setActiveStatus('processing');
      } else if (res.status === 'charge_status_unknown') {
        setActiveStatus('charge_status_unknown');
        setErrorDetails({
          message:
            'A consulta foi enviada, mas o retorno demorou além do limite de 120s. Para evitar cobrança duplicada, o sistema não iniciou nova consulta automática.',
          isChargeStatusUnknown: true,
          canManualReprocess: true,
          failedPlate: session.plateNormalized,
        });
        clearActiveLookupSession(session.plateNormalized, 'admin');
      } else if (res.status === 'not_found') {
        // Sessão antiga sem correspondência ativa no backend
        clearActiveLookupSession(session.plateNormalized, 'admin');
        setIsExecuting(false);
        setActiveSession(null);
      }
    }).catch(() => {
      // Mantém exibição do painel local caso haja oscilação de rede
    });
  }, []);

  // 2. Proteção de beforeunload durante consulta ativa
  useEffect(() => {
    const isTerminal = activeStatus ? ['completed', 'failed', 'charge_status_unknown', 'manual_review'].includes(activeStatus) : false;
    if (!isExecuting || isTerminal) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isExecuting, activeStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isExecuting) return;
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8);
    const normalized = raw.replace(/[^A-Z0-9]/g, '');
    let displayValue = raw;
    if (normalized.length === 7) {
      displayValue = formatBrazilianPlate(normalized);
    }
    setPlateInput(displayValue);
    setCachedResult(null);
    setHasChecked(false);
    setErrorDetails(null);
  };

  const handleCheckPlate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isExecuting) return;

    const normalized = normalizeBrazilianPlate(plateInput);

    if (!isValidBrazilianPlate(normalized)) {
      toast.error('Informe uma placa válida no formato Mercosul (ex: BRA2E19) ou antigo (ex: ABC-1234).');
      inputRef.current?.focus();
      return;
    }

    setIsCheckingCache(true);
    setErrorDetails(null);
    try {
      const res = await checkPlateCacheAction(normalized);
      setHasChecked(true);
      if (res.data) {
        setCachedResult(res.data);
        toast.info('Veículo já consultado no banco local! Custo adicional R$ 0,00.');
      } else {
        setCachedResult(null);
      }
    } catch (err: any) {
      toast.error('Erro ao verificar cache da placa.');
    } finally {
      setIsCheckingCache(false);
    }
  };

  const handleExecuteConsultation = async (
    confirmedPlate: string,
    options?: {
      isManualReprocess?: boolean;
      confirmedManualReprocess?: boolean;
      manualReprocessReason?: string;
    }
  ) => {
    const normalized = normalizeBrazilianPlate(confirmedPlate);
    const displayPlate = formatBrazilianPlate(confirmedPlate);
    const startedAtIso = new Date().toISOString();

    const session: ActiveLookupSession = {
      plateNormalized: normalized,
      plateDisplay: displayPlate,
      startedAt: startedAtIso,
      status: 'starting',
      context: 'admin',
    };

    saveActiveLookupSession(session);
    setActiveSession(session);
    setIsExecuting(true);
    setActiveStatus('starting');
    setIsModalOpen(false);
    setErrorDetails(null);

    logLookupUiEvent('vehicle_lookup_ui_started', {
      context: 'admin_panel',
      plateMasked: normalized,
      status: 'starting',
    });

    // Transição suave para 'processing'
    const statusTimer = setTimeout(() => {
      setActiveStatus('processing');
      saveActiveLookupSession({ ...session, status: 'processing' });
    }, 1200);

    try {
      const response = await fetch('/api/admin/vehicle-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: normalized,
          confirmedPlate: displayPlate,
          isManualReprocess: options?.isManualReprocess,
          confirmedManualReprocess: options?.confirmedManualReprocess,
          forceRefresh: options?.confirmedManualReprocess,
          manualReprocessReason: options?.manualReprocessReason,
          logicalRequestId: session.logicalRequestId,
        }),
      });

      const res = await response.json();

      clearTimeout(statusTimer);

      if (res.error) {
        if (res.isConsultationInProgress || res.statusCode === 409) {
          setActiveStatus('consultation_in_progress');
          saveActiveLookupSession({ ...session, status: 'consultation_in_progress' });
          setErrorDetails({
            message:
              'Já existe uma consulta em andamento para esta placa. Para evitar cobrança duplicada, aguarde a conclusão.',
            isConsultationInProgress: true,
          });
          toast.warning(
            'Já existe uma consulta em andamento para esta placa. Para evitar cobrança duplicada, aguarde a conclusão.',
            { duration: 10000 }
          );
          logLookupUiEvent('vehicle_lookup_ui_waiting', {
            context: 'admin_panel',
            plateMasked: normalized,
            status: 'consultation_in_progress',
          });
          return;
        }

        if (res.isChargeStatusUnknown || res.isAmbiguousAttempt) {
          setActiveStatus('charge_status_unknown');
          clearActiveLookupSession(normalized, 'admin');
          setErrorDetails({
            message: res.error,
            isChargeStatusUnknown: true,
            canManualReprocess: true,
            failedPlate: displayPlate,
          });
          toast.error(res.error, { duration: 12000 });
          logLookupUiEvent('vehicle_lookup_ui_charge_unknown', {
            context: 'admin_panel',
            plateMasked: normalized,
            status: 'charge_status_unknown',
          });
          return;
        }

        if (res.isInsufficientBalance) {
          setActiveStatus('failed');
          clearActiveLookupSession(normalized, 'admin');
          setErrorDetails({
            message: res.error,
            isInsufficientBalance: true,
            rechargeUrl: res.rechargeUrl,
            balance: res.balance,
          });
          toast.error('Saldo insuficiente na API Brasil. Recarregue os créditos da conta.', {
            action: {
              label: 'Recarregar Saldo',
              onClick: () =>
                window.open(
                  res.rechargeUrl || 'https://app.apibrasil.io/dashboard?modal=recharge',
                  '_blank'
                ),
            },
            duration: 10000,
          });
          return;
        }

        if (res.isTokenError) {
          setActiveStatus('failed');
          clearActiveLookupSession(normalized, 'admin');
          setErrorDetails({
            message: res.error,
            isTokenError: true,
          });
          toast.error(res.error, { duration: 10000 });
          return;
        }

        if (res.isProviderUnavailable) {
          setActiveStatus('failed');
          clearActiveLookupSession(normalized, 'admin');
          setErrorDetails({
            message: res.error,
            isProviderUnavailable: true,
            userGuidance: res.userGuidance,
            attempts: 1,
            failedPlate: displayPlate,
            canManualReprocess: true,
          });
          toast.error(
            'Bases oficiais ou API Brasil temporariamente indisponíveis. Retentativas automáticas desligadas.',
            { duration: 8000 }
          );
          return;
        }

        setActiveStatus('failed');
        clearActiveLookupSession(normalized, 'admin');
        setErrorDetails({
          message: res.error,
          failedPlate: displayPlate,
          canManualReprocess: true,
        });
        toast.error(res.error);
        return;
      }

      // Sucesso garantido
      setActiveStatus('completed');
      setActiveConsultationId(res.consultationId);
      clearActiveLookupSession(normalized, 'admin');

      logLookupUiEvent('vehicle_lookup_ui_completed', {
        context: 'admin_panel',
        plateMasked: normalized,
        status: 'completed',
        consultationIdMasked: res.consultationId,
      });

      if (res.isCacheHit) {
        toast.success('Consulta recuperada do cache local (Custo R$ 0,00)!');
      } else {
        toast.success(res.message || 'Consulta veicular realizada com sucesso na API Brasil!');
      }

      // Redirecionamento automático suave após conclusão
      setTimeout(() => {
        router.push(`/admin/consulta-placa/${res.consultationId}`);
      }, 1500);
    } catch (err: any) {
      clearTimeout(statusTimer);
      setActiveStatus('failed');
      clearActiveLookupSession(normalized, 'admin');
      toast.error(err?.message || 'Erro ao processar consulta veicular na API Brasil.');
    }
  };

  const handlePromptLeave = () => {
    setIsLeaveDialogOpen(true);
  };

  const handleConfirmLeave = () => {
    setIsLeaveDialogOpen(false);
    setIsExecuting(false);
    setActiveSession(null);
    logLookupUiEvent('vehicle_lookup_ui_leave_attempted', {
      context: 'admin_panel',
      plateMasked: activeSession?.plateNormalized || plateInput,
      status: activeStatus,
      action: 'leave_confirmed',
    });
  };

  const handleViewResult = () => {
    if (activeConsultationId) {
      router.push(`/admin/consulta-placa/${activeConsultationId}`);
    } else {
      window.location.reload();
    }
  };

  // Se houver consulta em execução ou sessão ativa, renderiza o Painel Estável de Progresso
  if (isExecuting || activeSession) {
    const currentPlate = activeSession?.plateDisplay || formatBrazilianPlate(plateInput);
    const currentStartedAt = activeSession?.startedAt || new Date().toISOString();

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <ConsultationProgressPanel
          plateDisplay={currentPlate}
          startedAt={currentStartedAt}
          status={activeStatus}
          message={errorDetails?.message}
          errorMessage={errorDetails?.message}
          onViewResult={handleViewResult}
          onLeave={handlePromptLeave}
          allowManualReprocess={Boolean(errorDetails?.canManualReprocess)}
          onManualReprocess={() => setIsReprocessConfirmOpen(true)}
          context="admin"
          consultationId={activeConsultationId}
        />

        <LeaveConfirmDialog
          isOpen={isLeaveDialogOpen}
          onStay={() => setIsLeaveDialogOpen(false)}
          onLeave={handleConfirmLeave}
          plateDisplay={currentPlate}
        />

        {/* Modal de Reprocessamento Manual com Justificativa Obrigatória */}
        {isReprocessConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-3xl border border-destructive/40 bg-zinc-950 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-destructive/15 text-destructive shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base">
                    Confirmar Reprocessamento Manual
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Atenção: Esta ação forçará uma nova chamada tarifável à API Brasil no valor estimado de{' '}
                    <strong className="text-white">R$ 30,00</strong>.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 space-y-2 text-xs text-zinc-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-400">Placa a consultar:</span>
                  <span className="font-mono font-bold text-white">
                    {formatBrazilianPlate(errorDetails?.failedPlate || plateInput)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-400">Tarifa estimada:</span>
                  <span className="font-bold text-amber-400">R$ 30,00</span>
                </div>
              </div>

              {/* Justificativa Obrigatória para Auditoria (Bloqueador 7) */}
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Justificativa do reprocessamento (obrigatória)
                </label>
                <textarea
                  value={reprocessReason}
                  onChange={(e) => setReprocessReason(e.target.value)}
                  placeholder="Ex: Verificado no painel da API Brasil que a consulta anterior não debitou créditos ou necessita nova emissão."
                  className="w-full h-20 p-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-amber-400 resize-none"
                />
                <p className="text-[10px] text-zinc-500">Mínimo de 10 caracteres para auditoria.</p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReprocessConfirmOpen(false)}
                  className="w-full sm:w-auto rounded-xl text-xs font-semibold border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={reprocessReason.trim().length < 10}
                  onClick={async () => {
                    const plateToUse = errorDetails?.failedPlate || plateInput;
                    const reasonToUse = reprocessReason.trim();
                    setIsReprocessConfirmOpen(false);
                    setReprocessReason('');
                    await handleExecuteConsultation(plateToUse, {
                      isManualReprocess: true,
                      confirmedManualReprocess: true,
                      manualReprocessReason: reasonToUse,
                    });
                  }}
                  className="w-full sm:w-auto rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  Confirmar Reprocessamento (R$ 30,00)
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Hero Search Box */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <span>Bases Nacionais • Motos, Carros, Caminhões e Utilitários</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Consulta Veicular por Placa
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Válido para qualquer tipo de veículo com placa registrada em território nacional. Consulte dados oficiais estaduais, gravames, débitos, leilão e FIPE.
          </p>
        </div>

        {/* Mercosul Plate Input Form */}
        <form onSubmit={handleCheckPlate} className="space-y-6">
          <div className="flex flex-col items-center justify-center">
            <MercosulPlateInput
              ref={inputRef}
              value={plateInput}
              onChange={handleInputChange}
              onSubmit={() => handleCheckPlate()}
              disabled={isCheckingCache || isExecuting}
            />

            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Padrão Mercosul ou antigo de qualquer estado do Brasil. Pressione{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] text-foreground font-semibold">
                Enter
              </kbd>{' '}
              para verificar ou clique no botão abaixo.
            </p>
          </div>

          {/* Action Button - Disabled while executing */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isCheckingCache || isExecuting || !plateInput.trim()}
              size="lg"
              className="w-full h-13 rounded-2xl text-sm sm:text-base font-bold shadow-lg gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {isCheckingCache ? (
                <>
                  <RotateCw className="w-5 h-5 animate-spin" />
                  Verificando Disponibilidade no Banco Local...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Verificar Placa & Diagnóstico Nacional
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Error Details Banner */}
        {errorDetails && (
          <div className="mt-6 p-5 rounded-2xl bg-destructive/10 border border-destructive/30 animate-in fade-in slide-in-from-top-3 duration-200">
            {errorDetails.isConsultationInProgress ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-amber-500 font-bold text-sm">
                  <Clock className="w-5 h-5 shrink-0" />
                  Consulta em Andamento
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Já existe uma consulta em andamento para esta placa. Para evitar cobrança duplicada, aguarde a conclusão.
                </p>
              </div>
            ) : errorDetails.isChargeStatusUnknown ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-amber-500 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  Tempo Limite Esgotado (Cobrança Desconhecida)
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A requisição foi enviada à API Brasil, mas o tempo limite de espera (120s) expirou sem resposta do gateway. Para garantir a sua segurança financeira, o reenvio automático foi estritamente bloqueado.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setIsReprocessConfirmOpen(true)}
                    className="rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reprocessar Manualmente
                  </Button>
                </div>
              </div>
            ) : errorDetails.isInsufficientBalance ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-destructive font-bold text-sm">
                  <CreditCard className="w-5 h-5 shrink-0" />
                  Saldo Insuficiente na API Brasil (Saldo Atual: {errorDetails.balance || 'R$ 0,00'})
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Para realizar esta consulta veicular oficial, recarregue seus créditos no painel da API Brasil.
                </p>
                <div className="pt-1">
                  <a
                    href={errorDetails.rechargeUrl || 'https://app.apibrasil.io/dashboard?modal=recharge'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Recarregar Saldo na API Brasil
                  </a>
                </div>
              </div>
            ) : errorDetails.isTokenError ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-destructive font-bold text-sm">
                  <KeyRound className="w-5 h-5 shrink-0" />
                  Token de Acesso Expirado ou Inválido
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O token de autenticação da API Brasil expirou ou é inválido. Gere um novo token no dashboard da API Brasil e atualize a variável{' '}
                  <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">
                    APIBRASIL_TOKEN
                  </code>{' '}
                  na Vercel ou contate o desenvolvedor Alex.
                </p>
              </div>
            ) : errorDetails.isProviderUnavailable ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-amber-500 font-bold text-sm">
                  <WifiOff className="w-5 h-5 shrink-0" />
                  Bases Oficiais Temporariamente Indisponíveis
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {errorDetails.userGuidance ||
                    'Não foi possível concluir a consulta veicular no momento devido a instabilidade temporária nas bases do SENATRAN / DETRAN ou na API Brasil. Retentativas automáticas foram desligadas.'}
                </p>
                <div className="pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsReprocessConfirmOpen(true)}
                    className="rounded-xl text-xs font-bold gap-2 cursor-pointer border-amber-500/40 text-amber-500 hover:bg-amber-500/10 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reprocessar Consulta
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-destructive">{errorDetails.message}</p>
                {errorDetails.canManualReprocess && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsReprocessConfirmOpen(true)}
                      className="rounded-xl text-xs font-bold gap-2 cursor-pointer border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reprocessar Consulta
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result state: CACHE HIT */}
        {hasChecked && cachedResult && (
          <div className="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-bold text-foreground text-base">
                    {cachedResult.brand} {cachedResult.model}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Database className="w-3.5 h-3.5" /> Salvo em Cache (Custo R$ 0,00)
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Ano:{' '}
                  <strong className="text-foreground">
                    {cachedResult.year_manufacture || '-'}/{cachedResult.year_model || '-'}
                  </strong>{' '}
                  • Local:{' '}
                  <strong className="text-foreground">
                    {cachedResult.city || 'Recife'} - {cachedResult.state || 'PE'}
                  </strong>{' '}
                  • Consultado em:{' '}
                  <strong className="text-foreground">
                    {new Date(cachedResult.consulted_at).toLocaleDateString('pt-BR')}
                  </strong>
                </p>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <RiskBadge level={cachedResult.risk_level} />
                  {cachedResult.has_active_theft_robbery && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      Alerta de Roubo
                    </span>
                  )}
                  {cachedResult.has_active_gravamen && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Gravame Ativo
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  onClick={() => router.push(`/admin/consulta-placa/${cachedResult.id}`)}
                  className="rounded-xl font-bold gap-2 shadow-xs w-full sm:w-auto h-11 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  Abrir Laudo Salvo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Result state: NOT IN CACHE */}
        {hasChecked && !cachedResult && (
          <div className="mt-6 p-5 rounded-2xl bg-muted/40 border border-border/80 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                  <ShieldAlert className="w-4.5 h-4.5 text-primary" />
                  Nenhum laudo local para a placa {formatBrazilianPlate(plateInput)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta consulta integrará a API Brasil e consumirá créditos da conta corporativa.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl font-bold gap-2 shrink-0 h-11 shadow-xs cursor-pointer bg-primary hover:bg-primary/90"
              >
                <Sparkles className="w-4 h-4" />
                Consultar Histórico Oficial
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConsultationConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleExecuteConsultation}
        plate={plateInput}
        isMockMode={isMockMode}
        isExecuting={isExecuting}
      />
    </div>
  );
}
