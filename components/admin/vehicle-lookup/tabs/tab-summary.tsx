'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  DollarSign,
  Building2,
  Wrench,
  Car,
} from 'lucide-react';
import { RiskBadge } from '../consultation-badge';

export function TabSummary({ dto }: { dto: InternalVehicleConsultationDto }) {
  const s = dto.summary;
  const h = dto.history;
  const raw = (dto.raw_response?.data || dto.raw_response || {}) as any;

  const pendingRecalls = h.recalls ? h.recalls.filter((r) => r.status === 'PENDENTE') : [];
  const hasPendingRecall = pendingRecalls.length > 0;

  const isLocadora = Boolean(
    raw.registroEmLocadora?.registroEmLocadora === true ||
    raw.registro_locadora === true ||
    raw.registro_em_locadora === true ||
    /LOCADORA/i.test(JSON.stringify(h.previous_owners || ''))
  );

  return (
    <div className="space-y-6">
      {/* Risk Score Highlight */}
      <div className="p-6 rounded-2xl bg-muted/40 border border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Diagnóstico Geral de Procedência
            </span>
            <RiskBadge level={s.risk_level} />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Índice de Risco Calculado: {s.risk_index} / 100
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Classificação baseada em registros de roubo/furto, restrições financeiras, judiciais, débitos estaduais e histórico de leilão.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Total de Débitos</div>
            <div className="text-lg font-bold text-foreground">
              {s.has_debts ? `R$ ${s.debts_total_amount.toFixed(2)}` : 'R$ 0,00'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 8 Security Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Roubo / Furto */}
        <div className={`p-4 rounded-2xl border ${s.has_active_theft_robbery ? 'bg-red-500/10 border-red-500/30' : 'bg-card border-border/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Roubo e Furto</span>
            {s.has_active_theft_robbery ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className={`text-base font-bold ${s.has_active_theft_robbery ? 'text-red-500' : 'text-foreground'}`}>
            {s.has_active_theft_robbery ? 'Alerta Ativo de Roubo' : 'Sem Queixa de Roubo'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Base Nacional Integrada de Segurança
          </p>
        </div>

        {/* 2. Restrição Judicial */}
        <div className={`p-4 rounded-2xl border ${s.has_judicial_restriction ? 'bg-red-500/10 border-red-500/30' : 'bg-card border-border/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Bloqueio Renajud</span>
            {s.has_judicial_restriction ? (
              <AlertOctagon className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className={`text-base font-bold ${s.has_judicial_restriction ? 'text-red-500' : 'text-foreground'}`}>
            {s.has_judicial_restriction ? 'Bloqueio Judicial Ativo' : 'Sem Bloqueios Judiciais'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sistema do Conselho Nacional de Justiça
          </p>
        </div>

        {/* 3. Gravame / Financeiro */}
        <div className={`p-4 rounded-2xl border ${s.has_active_gravamen ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card border-border/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Alienação / Gravame</span>
            {s.has_active_gravamen ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className={`text-base font-bold ${s.has_active_gravamen ? 'text-amber-500' : 'text-foreground'}`}>
            {s.has_active_gravamen ? 'Gravame Financeiro Ativo' : 'Desalienado'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sistema Nacional de Gravames (SNG)
          </p>
        </div>

        {/* 4. Leilão */}
        <div className={`p-4 rounded-2xl border ${s.has_auction_record ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card border-border/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Passagem por Leilão</span>
            {s.has_auction_record ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className={`text-base font-bold ${s.has_auction_record ? 'text-amber-500' : 'text-foreground'}`}>
            {s.has_auction_record ? 'Consta Passagem em Leilão' : 'Sem Registro de Leilão'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Bases de Leiloeiros Oficiais do Brasil
          </p>
        </div>

        {/* 5. Sinistro / Monta */}
        <div className={`p-4 rounded-2xl border ${s.has_accident_indication ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card border-border/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Registro de Sinistro</span>
            {s.has_accident_indication ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className={`text-base font-bold ${s.has_accident_indication ? 'text-amber-500' : 'text-foreground'}`}>
            {s.has_accident_indication ? 'Consta Registro de Sinistro' : 'Sem Registro de Sinistro'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Indicações de avarias em seguradoras
          </p>
        </div>

        {/* 6. Recall de Fábrica */}
        <div className={`p-4 rounded-2xl border ${hasPendingRecall ? 'bg-red-500/10 border-red-500/30' : 'bg-card border-border/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Recall de Fábrica</span>
            {hasPendingRecall ? (
              <Wrench className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className={`text-base font-bold ${hasPendingRecall ? 'text-red-500' : 'text-foreground'}`}>
            {hasPendingRecall ? `${pendingRecalls.length} Recall(s) Pendente(s)` : 'Sem Pendências'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sistema Nacional de Recalls (Senatran)
          </p>
        </div>

        {/* 7. Débitos Estaduais */}
        <div className={`p-4 rounded-2xl border ${s.has_debts ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card border-border/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Débitos & Multas</span>
            {s.has_debts ? (
              <DollarSign className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className={`text-base font-bold ${s.has_debts ? 'text-amber-500' : 'text-foreground'}`}>
            {s.has_debts ? `Pendências: R$ ${s.debts_total_amount.toFixed(2)}` : 'Débitos Quitados'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            DETRAN Estadual e órgãos autuadores
          </p>
        </div>

        {/* 8. Uso em Locadora */}
        <div className={`p-4 rounded-2xl border ${isLocadora ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card border-border/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Uso em Locadora</span>
            {isLocadora ? (
              <Building2 className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className={`text-base font-bold ${isLocadora ? 'text-amber-500' : 'text-foreground'}`}>
            {isLocadora ? 'Consta Registro em Locadora' : 'Não Consta Registro'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Histórico comercial e de frotas
          </p>
        </div>
      </div>
    </div>
  );
}
