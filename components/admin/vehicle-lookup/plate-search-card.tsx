'use client';

import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBrazilianPlate, isValidBrazilianPlate, normalizeBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { checkPlateCacheAction, executeVehiclePlateLookupAction } from '@/lib/actions/vehicle-lookup';
import type { VehicleConsultationSummaryDto } from '@/lib/vehicle-lookup/types';
import { ConsultationConfirmModal } from './consultation-confirm-modal';
import { RiskBadge, ModeBadge } from './consultation-badge';
import { MercosulPlateInput } from './mercosul-plate-web';
import { LoadingStepper } from './loading-stepper';

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
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    isInsufficientBalance?: boolean;
    rechargeUrl?: string;
    balance?: string;
    isTokenError?: boolean;
  } | null>(null);

  // Auto-focus on plate input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8);
    // If complete without hyphen, format nicely according to detected standard
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

  const handleExecuteConsultation = async (confirmedPlate: string) => {
    setIsExecuting(true);
    setErrorDetails(null);
    try {
      const res = await executeVehiclePlateLookupAction({
        plate: confirmedPlate,
        confirmedPlate,
      });

      if (res.error) {
        setIsExecuting(false);
        setIsModalOpen(false);

        if (res.isInsufficientBalance) {
          setErrorDetails({
            message: res.error,
            isInsufficientBalance: true,
            rechargeUrl: res.rechargeUrl,
            balance: res.balance,
          });
          toast.error('Saldo insuficiente na API Brasil. Recarregue os créditos da conta.', {
            action: {
              label: 'Recarregar Saldo',
              onClick: () => window.open(res.rechargeUrl || 'https://app.apibrasil.io/dashboard?modal=recharge', '_blank'),
            },
            duration: 10000,
          });
          return;
        }

        if (res.isTokenError) {
          setErrorDetails({
            message: res.error,
            isTokenError: true,
          });
          toast.error(res.error, { duration: 10000 });
          return;
        }

        toast.error(res.error);
        return;
      }

      if (res.isCacheHit) {
        toast.success('Consulta recuperada do cache local (Custo R$ 0,00)!');
      } else {
        toast.success(res.message || 'Consulta veicular realizada com sucesso na API Brasil!');
      }

      setIsModalOpen(false);
      router.push(`/admin/consulta-placa/${res.consultationId}`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao processar consulta veicular na API Brasil.');
      setIsExecuting(false);
    }
  };

  if (isExecuting) {
    return <LoadingStepper plateDisplay={formatBrazilianPlate(plateInput)} />;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Hero Search Box */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Diagnóstico Veicular por Placa
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Digite a placa abaixo para consultar dados oficiais do Senatran, gravames, débitos estaduais, leilão e FIPE.
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
              disabled={isCheckingCache}
            />

            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] text-foreground font-semibold">Enter</kbd> para verificar ou clique no botão abaixo.
            </p>
          </div>

          {/* Action Button - Thumb-friendly on mobile */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isCheckingCache || !plateInput.trim()}
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
                  Verificar Placa & Diagnóstico
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Error Details Banner (Insufficient balance / Token expired) */}
        {errorDetails && (
          <div className="mt-6 p-5 rounded-2xl bg-destructive/10 border border-destructive/30 animate-in fade-in slide-in-from-top-3 duration-200">
            {errorDetails.isInsufficientBalance ? (
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
                  O token de autenticação da API Brasil expirou ou é inválido. Gere um novo token no dashboard da API Brasil e atualize a variável <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">APIBRASIL_TOKEN</code> na Vercel ou contate o desenvolvedor Alex.
                </p>
              </div>
            ) : (
              <p className="text-xs text-destructive">{errorDetails.message}</p>
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
                  Ano: <strong className="text-foreground">{cachedResult.year_manufacture || '-'}/{cachedResult.year_model || '-'}</strong> • Local:{' '}
                  <strong className="text-foreground">{cachedResult.city || 'Recife'} - {cachedResult.state || 'PE'}</strong> • Consultado em:{' '}
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
