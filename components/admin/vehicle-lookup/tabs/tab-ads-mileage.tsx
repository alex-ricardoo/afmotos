'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { Gauge, Radio, ExternalLink } from 'lucide-react';

export function TabAdsMileage({ dto }: { dto: InternalVehicleConsultationDto }) {
  const am = dto.ads_mileage;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Histórico de Quilometragem */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
          <Gauge className="w-5 h-5 text-primary" />
          <h4 className="font-bold text-foreground text-base">Histórico de Quilometragem</h4>
        </div>

        {am.mileage_records.length === 0 ? (
          <div className="text-xs text-muted-foreground">Nenhum registro de odômetro registrado nas vistorias.</div>
        ) : (
          <div className="space-y-2.5">
            {am.mileage_records.map((rec, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 text-xs">
                <div>
                  <div className="font-bold text-foreground">{Number(rec.mileage || 0).toLocaleString('pt-BR')} km</div>
                  <div className="text-muted-foreground">{rec.source || 'Registro de Vistoria'}</div>
                </div>
                <div className="text-muted-foreground">{rec.date || 'N/I'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de Anúncios */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
          <Radio className="w-5 h-5 text-primary" />
          <h4 className="font-bold text-foreground text-base">Anúncios Anteriores em Portais</h4>
        </div>

        {am.ads_records.length === 0 ? (
          <div className="text-xs text-muted-foreground">Nenhum anúncio público prévio indexado.</div>
        ) : (
          <div className="space-y-2.5">
            {am.ads_records.map((ad, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-muted/40 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>{ad.portal || 'Portal Automotivo'}</span>
                  <span>R$ {Number(ad.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-muted-foreground flex justify-between">
                  <span>Km anunciada: {Number(ad.mileage || 0).toLocaleString('pt-BR')} km</span>
                  <span>Data: {ad.date || 'N/I'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
