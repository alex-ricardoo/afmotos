'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { Users, CheckCircle2, RotateCcw } from 'lucide-react';
import { AuctionDetailsCard } from '../auction-details-card';

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
                    owner.document_type === 'PJ'
                      ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                      : owner.document_type === 'PF'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {owner.document_type === 'PJ'
                      ? 'Pessoa Jurídica'
                      : owner.document_type === 'PF'
                        ? 'Pessoa Física'
                        : 'Não informado'}
                  </span>
                </div>
                <div className="text-muted-foreground font-mono font-semibold">
                  Doc: {owner.masked_document && owner.masked_document !== 'Documento não disponibilizado pela fonte' ? owner.masked_document : 'Não disponibilizado'}
                </div>
                <div className="text-muted-foreground">
                  UF: <strong className="text-foreground">{owner.state || 'SP'}</strong> • Exercício: <strong className="text-foreground">{owner.period || 'N/I'}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Passagens por Leilão Oficial (com Records, Score de Segurabilidade e Galeria de Fotos Expandível) */}
      <AuctionDetailsCard
        hasAuction={h.has_auction}
        records={h.auction_records}
        score={h.auction_score}
        photos={h.auction_photos}
      />

      {/* Sinistros & Chamados de Recall */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
          <RotateCcw className="w-5 h-5 text-blue-500" />
          <h4 className="font-bold text-foreground text-base">Sinistros & Chamados de Recall</h4>
        </div>

        {h.recalls.length === 0 && !h.has_claims ? (
          <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium py-2">
            <CheckCircle2 className="w-4 h-4" />
            Nenhum sinistro ou recall pendente registrado para este veículo nas bases governamentais e montadoras.
          </div>
        ) : (
          <div className="space-y-3">
            {h.claims_records.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Registros de Sinistro ({h.claims_records.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {h.claims_records.map((c, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{c.claim_type || 'Sinistro Cadastrado'}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                          {c.damage_level || 'Média Monta'}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Data: {c.claim_date || 'N/I'} • Seguradora: {c.insurance_company || 'Bases do Mercado'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {h.recalls.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Chamados de Fábrica / Recall ({h.recalls.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {h.recalls.map((rec, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-muted border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{rec.component}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'PENDENTE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {rec.status}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[11px]">{rec.risk_description}</div>
                      {rec.announcement_date && (
                        <div className="text-[10px] text-muted-foreground">Anunciado em: {rec.announcement_date}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
