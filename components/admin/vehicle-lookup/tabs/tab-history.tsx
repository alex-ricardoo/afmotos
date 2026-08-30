'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { Users, Gavel, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

export function TabHistory({ dto }: { dto: InternalVehicleConsultationDto }) {
  const h = dto.history;

  return (
    <div className="space-y-6">
      {/* Owners count & list */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/60">
          <Users className="w-5 h-5 text-primary" />
          <h4 className="font-bold text-foreground text-base">
            Histórico de Proprietários ({h.owners_count})
          </h4>
        </div>

        {h.previous_owners.length === 0 ? (
          <div className="text-xs text-muted-foreground">Nenhum registro detalhado de proprietários anteriores.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {h.previous_owners.map((owner, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Proprietário #{idx + 1}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    owner.document_type === 'PJ' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' : 'bg-muted text-muted-foreground'
                  }`}>
                    {owner.document_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </span>
                </div>
                <div className="text-muted-foreground font-mono font-semibold">
                  Doc: {owner.masked_document || '***'}
                </div>
                <div className="text-muted-foreground">
                  UF: <strong className="text-foreground">{owner.state || 'SP'}</strong> • Exercício: <strong className="text-foreground">{owner.period || 'N/I'}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leilões & Sinistros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leilão */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <Gavel className="w-5 h-5 text-orange-500" />
            <h4 className="font-bold text-foreground text-base">Passagens por Leilão</h4>
          </div>

          {!h.has_auction || h.auction_records.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium py-2">
              <CheckCircle2 className="w-4 h-4" />
              Nenhum registro de leilão identificado nas bases conveniadas.
            </div>
          ) : (
            <div className="space-y-3">
              {h.auction_records.map((auc, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs space-y-1">
                  <div className="font-bold text-foreground">{auc.auctioneer || 'Leiloeiro Oficial'}</div>
                  <div className="text-muted-foreground">Lote: {auc.lot || 'N/I'} • Data: {auc.auction_date || 'N/I'}</div>
                  <div className="text-muted-foreground">Condição: {auc.condition || 'Arrematado'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sinistros / Recalls */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <RotateCcw className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-foreground text-base">Sinistros & Chamados de Recall</h4>
          </div>

          {h.recalls.length === 0 && !h.has_claims ? (
            <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium py-2">
              <CheckCircle2 className="w-4 h-4" />
              Nenhum sinistro ou recall pendente registrado para este veículo.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {h.recalls.map((rec, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-muted border space-y-0.5">
                  <div className="font-semibold text-foreground">{rec.component} ({rec.status})</div>
                  <div className="text-muted-foreground">{rec.risk_description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
