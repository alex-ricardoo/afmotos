'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Sparkles, Database, ArrowRight, ShieldAlert, CheckCircle2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBrazilianPlate, isValidBrazilianPlate, normalizeBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { checkPlateCacheAction, executeVehiclePlateLookupAction } from '@/lib/actions/vehicle-lookup';
import type { VehicleConsultationSummaryDto } from '@/lib/vehicle-lookup/types';
import { ConsultationConfirmModal } from './consultation-confirm-modal';
import { RiskBadge, ModeBadge } from './consultation-badge';

interface PlateSearchCardProps {
  isMockMode: boolean;
}

export function PlateSearchCard({ isMockMode }: PlateSearchCardProps) {
  const router = useRouter();
  const [plateInput, setPlateInput] = useState('');
  const [isCheckingCache, setIsCheckingCache] = useState(false);
  const [cachedResult, setCachedResult] = useState<VehicleConsultationSummaryDto | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase();
    const formatted = formatBrazilianPlate(raw);
    setPlateInput(formatted);
    setCachedResult(null);
    setHasChecked(false);
  };

  const handleCheckPlate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const normalized = normalizeBrazilianPlate(plateInput);

    if (!isValidBrazilianPlate(normalized)) {
      toast.error('Informe uma placa válida no formato Mercosul (ex: BRA2E19) ou antigo (ex: ABC-1234).');
      return;
    }

    setIsCheckingCache(true);
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
    try {
      const res = await executeVehiclePlateLookupAction({
        plate: confirmedPlate,
        confirmedPlate,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (res.isCacheHit) {
        toast.success('Consulta recuperada do cache local (Custo R$ 0,00)!');
      } else {
        toast.success(res.message || 'Consulta veicular realizada com sucesso!');
      }

      setIsModalOpen(false);
      router.push(`/admin/consulta-placa/${res.consultationId}`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao processar consulta veicular.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Nova Consulta Veicular
            </h2>
            <ModeBadge mode={isMockMode ? 'mock' : 'live'} isMock={isMockMode} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Digite a placa do veículo para verificar a base local ou consultar o histórico oficial completo.
          </p>
        </div>
      </div>

      <form onSubmit={handleCheckPlate} className="flex flex-col sm:flex-row items-stretch gap-3">
        <div className="relative flex-1">
          <Input
            value={plateInput}
            onChange={handleInputChange}
            placeholder="Ex: BRA-2E19 ou ABC-1234"
            maxLength={8}
            className="h-12 pl-4 pr-10 font-mono text-lg uppercase tracking-wider rounded-xl border-border/80 focus-visible:ring-primary"
          />
          {plateInput && (
            <button
              type="button"
              onClick={() => {
                setPlateInput('');
                setCachedResult(null);
                setHasChecked(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              Limpar
            </button>
          )}
        </div>

        <Button
          type="submit"
          disabled={isCheckingCache || !plateInput}
          className="h-12 px-6 rounded-xl font-semibold gap-2 shadow-xs shrink-0"
        >
          {isCheckingCache ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Verificar Placa
        </Button>
      </form>

      {/* Result state: CACHE HIT */}
      {hasChecked && cachedResult && (
        <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="font-bold text-foreground text-base">
                  {cachedResult.plate_display} — {cachedResult.brand} {cachedResult.model}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Database className="w-3 h-3" /> Em Cache (R$ 0,00)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ano: {cachedResult.year_manufacture}/{cachedResult.year_model} • Local: {cachedResult.city || 'N/I'} - {cachedResult.state || 'SP'} • Consultado em:{' '}
                {new Date(cachedResult.consulted_at).toLocaleDateString('pt-BR')}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <RiskBadge level={cachedResult.risk_level} />
                {cachedResult.has_active_theft_robbery && (
                  <span className="text-xs font-semibold text-red-500">Alerta de Roubo/Furto!</span>
                )}
                {cachedResult.has_active_gravamen && (
                  <span className="text-xs font-semibold text-amber-500">Gravame Ativo</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => router.push(`/admin/consulta-placa/${cachedResult.id}`)}
                className="rounded-xl font-semibold gap-2 shadow-xs"
              >
                Abrir Histórico Salvo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result state: NOT IN CACHE */}
      {hasChecked && !cachedResult && (
        <div className="mt-5 p-4 rounded-xl bg-muted/40 border border-border/80 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <ShieldAlert className="w-4 h-4 text-primary" />
                Nenhum laudo local encontrado para a placa {formatBrazilianPlate(plateInput)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isMockMode
                  ? 'Você pode executar uma consulta simulada segura sem consumo de saldo.'
                  : 'Deseja executar a consulta oficial na API Brasil? Esta operação requer confirmação.'}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl font-semibold gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              {isMockMode ? 'Simular Consulta' : 'Consultar Histórico Oficial'}
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
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
