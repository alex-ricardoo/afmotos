import React from 'react';
import type { RiskLevel, VehicleLookupMode, VehicleConsultationStatus } from '@/lib/vehicle-lookup/types';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Clock, HelpCircle, XCircle } from 'lucide-react';

export function RiskBadge({ level }: { level: RiskLevel | null | undefined }) {
  switch (level) {
    case 'LOW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Risco Baixo
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          Risco Médio
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          Risco Alto
        </span>
      );
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
          <AlertOctagon className="w-3.5 h-3.5" />
          Risco Crítico
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          Indefinido
        </span>
      );
  }
}

export function ModeBadge({ mode, isMock }: { mode: VehicleLookupMode; isMock?: boolean }) {
  if (isMock || mode === 'mock') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        Simulação (Mock)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
      Oficial (Live)
    </span>
  );
}

export function StatusBadge({ status }: { status: VehicleConsultationStatus }) {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Concluída
        </span>
      );
    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          Processando
        </span>
      );
    case 'CHARGE_STATUS_UNKNOWN':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
          <HelpCircle className="w-3.5 h-3.5" />
          Status Incerto
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
          <XCircle className="w-3.5 h-3.5" />
          Falha
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          Pendente
        </span>
      );
  }
}
