'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Lock } from 'lucide-react';

export function TabRestrictions({ dto }: { dto: InternalVehicleConsultationDto }) {
  const r = dto.restrictions;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Gravame & Alienação Fiduciária */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60 gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary shrink-0" />
              <h4 className="font-bold text-foreground text-sm sm:text-base">Gravame & Financiamento</h4>
            </div>
            {r.has_active_gravamen ? (
              <span className="px-2 py-0.5 rounded text-[11px] sm:text-xs font-semibold bg-amber-500/20 text-amber-500 shrink-0">
                Alienação Ativa
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] sm:text-xs font-semibold bg-emerald-500/20 text-emerald-500 shrink-0">
                Desalienado
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 pb-2.5 border-b border-border/30">
              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Situação do Gravame:</span>
              <span className="font-semibold text-foreground text-xs sm:text-sm sm:text-right break-words leading-relaxed">
                {r.gravamen_status}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 pb-2.5 border-b border-border/30">
              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Agente Financeiro:</span>
              <span className="font-medium text-foreground text-xs sm:text-sm sm:text-right break-words leading-relaxed">
                {r.financial_institution}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 pb-2.5 border-b border-border/30">
              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Número do Contrato:</span>
              <span className="font-mono text-foreground text-xs sm:text-sm sm:text-right break-words leading-relaxed">
                {r.contract_number}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Data de Inclusão:</span>
              <span className="text-foreground text-xs sm:text-sm sm:text-right break-words leading-relaxed">
                {r.inclusion_date}
              </span>
            </div>
          </div>
        </div>

        {/* Restrições Judiciais e Renajud */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60 gap-2">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-500 shrink-0" />
              <h4 className="font-bold text-foreground text-sm sm:text-base">Restrições Judiciais (Renajud)</h4>
            </div>
            {r.has_judicial_restriction ? (
              <span className="px-2 py-0.5 rounded text-[11px] sm:text-xs font-semibold bg-red-500/20 text-red-500 shrink-0">
                Bloqueio Ativo
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] sm:text-xs font-semibold bg-emerald-500/20 text-emerald-500 shrink-0">
                Sem Bloqueio
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 pb-2.5 border-b border-border/30">
              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Status Renajud:</span>
              <span className="font-semibold text-foreground text-xs sm:text-sm sm:text-right break-words leading-relaxed">
                {r.judicial_restriction_type}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 pb-2.5 border-b border-border/30">
              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Vara / Tribunal:</span>
              <span className="text-foreground text-xs sm:text-sm sm:text-right break-words leading-relaxed">
                {r.judicial_court}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 pb-2.5 border-b border-border/30">
              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Restrição Administrativa:</span>
              <span className="text-foreground text-xs sm:text-sm sm:text-right break-words leading-relaxed">
                {r.administrative_restriction_details}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Alerta Roubo/Furto:</span>
              <span
                className={`font-semibold text-xs sm:text-sm sm:text-right break-words leading-relaxed ${
                  r.has_theft_robbery_alert ? 'text-red-500' : 'text-emerald-500'
                }`}
              >
                {r.theft_robbery_details}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
