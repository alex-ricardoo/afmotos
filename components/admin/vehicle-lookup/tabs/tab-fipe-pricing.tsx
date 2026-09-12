'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { Tag, TrendingDown, DollarSign } from 'lucide-react';

export function TabFipePricing({ dto }: { dto: InternalVehicleConsultationDto }) {
  const f = dto.fipe;
  const latestAd = dto.ads_mileage?.ads_records?.find((a) => (a.price || 0) > 0) || dto.ads_mileage?.ads_records?.[0];
  const adPrice = latestAd?.price || 0;

  return (
    <div className="space-y-6">
      {/* Official FIPE Card */}
      <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Referência Oficial FIPE
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground">{f.model_name}</h3>
          <div className="text-xs text-muted-foreground mt-0.5">
            Código FIPE: <strong className="font-mono text-foreground">{f.code}</strong> • Mês de Referência: {f.reference_month}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left md:text-right">
          {adPrice > 0 && (
            <div className="p-3 rounded-xl bg-muted/60 border border-border/60 text-left">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Último Anúncio Web
              </span>
              <span className="text-base font-black text-amber-500 block">
                R$ {adPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {f.price > 0 ? `${Math.round((adPrice / f.price) * 100)}% da Tabela FIPE` : (latestAd?.portal || 'Web')}
              </span>
            </div>
          )}

          <div>
            <div className="text-xs text-muted-foreground">Valor Médio FIPE</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              R$ {f.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Variations & Price History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Versions / Variations */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-3">
          <h4 className="font-bold text-foreground text-sm">Versões e Variações FIPE</h4>
          {f.variations.length === 0 ? (
            <div className="text-xs text-muted-foreground">Nenhuma variação adicional encontrada.</div>
          ) : (
            <div className="space-y-2.5">
              {f.variations.map((v, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-3.5 rounded-xl bg-muted/40 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground leading-snug">{v.model}</div>
                    <div className="text-muted-foreground font-mono text-[11px] mt-0.5">
                      {v.code} • {v.fuel || 'Gasolina'}
                    </div>
                  </div>
                  <div className="font-bold text-foreground text-xs sm:text-sm shrink-0 sm:text-right pt-1 sm:pt-0 border-t sm:border-t-0 border-border/30">
                    R$ {Number(v.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-3">
          <h4 className="font-bold text-foreground text-sm">Histórico de Preços</h4>
          {f.price_history.length === 0 ? (
            <div className="text-xs text-muted-foreground">Histórico de desvalorização não disponível.</div>
          ) : (
            <div className="space-y-2.5">
              {f.price_history.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-muted/40 text-xs"
                >
                  <span className="font-medium text-foreground">{h.reference}</span>
                  <span className="font-bold text-foreground text-xs sm:text-sm shrink-0 text-right">
                    R$ {Number(h.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
