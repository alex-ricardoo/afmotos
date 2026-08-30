'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Lock } from 'lucide-react';

export function TabRestrictions({ dto }: { dto: InternalVehicleConsultationDto }) {
  const r = dto.restrictions;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gravame & Alienação Fiduciária */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-foreground text-base">Gravame & Financiamento</h4>
            </div>
            {r.has_active_gravamen ? (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-600">
                Alienação Ativa
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-600">
                Desalienado
              </span>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Situação do Gravame:</span>
              <span className="font-semibold text-foreground">{r.gravamen_status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agente Financeiro:</span>
              <span className="font-medium text-foreground">{r.financial_institution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Número do Contrato:</span>
              <span className="font-mono text-foreground">{r.contract_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data de Inclusão:</span>
              <span className="text-foreground">{r.inclusion_date}</span>
            </div>
          </div>
        </div>

        {/* Restrições Judiciais e Renajud */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-500" />
              <h4 className="font-bold text-foreground text-base">Restrições Judiciais (Renajud)</h4>
            </div>
            {r.has_judicial_restriction ? (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-600">
                Bloqueio Ativo
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-600">
                Sem Bloqueio
              </span>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status Renajud:</span>
              <span className="font-semibold text-foreground">{r.judicial_restriction_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vara / Tribunal:</span>
              <span className="text-foreground">{r.judicial_court}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restrição Administrativa:</span>
              <span className="text-foreground">{r.administrative_restriction_details}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alerta Roubo/Furto:</span>
              <span className={`font-semibold ${r.has_theft_robbery_alert ? 'text-red-500' : 'text-emerald-500'}`}>
                {r.theft_robbery_details}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
