'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { Gauge, Radio, DollarSign, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

export function TabAdsMileage({ dto }: { dto: InternalVehicleConsultationDto }) {
  const am = dto.ads_mileage;
  const fipePrice = dto.fipe?.price || 0;

  // Find latest ad with price
  const latestAdWithPrice = am.ads_records.find((a) => (a.price || 0) > 0) || am.ads_records[0];
  const latestAdPrice = latestAdWithPrice?.price || 0;

  // Find latest mileage
  const latestMileage = am.mileage_records[0]?.mileage || latestAdWithPrice?.mileage || 0;
  const latestMileageDate = am.mileage_records[0]?.date || latestAdWithPrice?.date;
  const latestMileageSource = am.mileage_records[0]?.source || latestAdWithPrice?.portal || 'Odômetro';

  // FIPE comparison
  const diffFromFipe = latestAdPrice && fipePrice ? latestAdPrice - fipePrice : 0;
  const percentageFromFipe = latestAdPrice && fipePrice ? Math.round((latestAdPrice / fipePrice) * 100) : null;

  return (
    <div className="space-y-6">
      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Preço do Último Anúncio */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              Último Preço Anunciado
            </span>
            {percentageFromFipe && (
              <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${
                diffFromFipe <= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {diffFromFipe <= 0 ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                {percentageFromFipe}% da FIPE
              </span>
            )}
          </div>

          <div className="text-2xl font-black text-foreground tracking-tight">
            {latestAdPrice > 0
              ? `R$ ${latestAdPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'Não registrado'}
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
            <span>Origem: {latestAdWithPrice?.portal || 'Portal Web'}</span>
            <span>{latestAdWithPrice?.date ? `Data: ${latestAdWithPrice.date}` : 'Registro recente'}</span>
          </div>
        </div>

        {/* 2. Última Km Registrada */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-primary" />
              Último Odômetro / Km
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {latestMileageSource}
            </span>
          </div>

          <div className="text-2xl font-black text-foreground tracking-tight">
            {latestMileage > 0
              ? `${Number(latestMileage).toLocaleString('pt-BR')} km`
              : '0 km'}
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
            <span>Histórico de Leitura</span>
            <span>{latestMileageDate ? `Data: ${latestMileageDate}` : 'Vistoria recente'}</span>
          </div>
        </div>

        {/* 3. Referência Tabela FIPE Comparada */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" />
              Tabela FIPE de Referência
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {dto.fipe?.code || 'Oficial'}
            </span>
          </div>

          <div className="text-2xl font-black text-foreground tracking-tight">
            {fipePrice > 0
              ? `R$ ${fipePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'Não disponível'}
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
            <span>Mês: {dto.fipe?.reference_month || 'Atual'}</span>
            <span>
              {latestAdPrice > 0 && fipePrice > 0
                ? diffFromFipe < 0
                  ? `- R$ ${Math.abs(diffFromFipe).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vs FIPE`
                  : diffFromFipe > 0
                  ? `+ R$ ${diffFromFipe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vs FIPE`
                  : 'Preço idêntico à FIPE'
                : 'Sem comparação'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid com Histórico Detalhado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Histórico de Quilometragem */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-foreground text-base">Histórico de Quilometragem</h4>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {am.mileage_records.length} registro(s)
            </span>
          </div>

          {am.mileage_records.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              Nenhum registro de odômetro registrado nas vistorias estaduais.
            </div>
          ) : (
            <div className="space-y-2.5">
              {am.mileage_records.map((rec, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 text-xs">
                  <div>
                    <div className="font-bold text-foreground">{Number(rec.mileage || 0).toLocaleString('pt-BR')} km</div>
                    <div className="text-muted-foreground">{rec.source || 'Registro de Vistoria'}</div>
                  </div>
                  <div className="text-muted-foreground font-medium">{rec.date || 'N/I'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico de Anúncios */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-foreground text-base">Anúncios Anteriores em Portais</h4>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {am.ads_records.length} anúncio(s)
            </span>
          </div>

          {am.ads_records.length === 0 ? (
            <div className="text-xs text-muted-foreground">Nenhum anúncio público prévio indexado.</div>
          ) : (
            <div className="space-y-2.5">
              {am.ads_records.map((ad, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-muted/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span className="text-primary font-bold">{ad.portal || 'Portal Automotivo'}</span>
                    <span className="text-sm font-black">
                      {ad.price ? `R$ ${Number(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sob consulta'}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex justify-between pt-1 border-t border-border/30">
                    <span>Km anunciada: <strong>{Number(ad.mileage || 0).toLocaleString('pt-BR')} km</strong></span>
                    <span>Data: {ad.date || 'N/I'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
