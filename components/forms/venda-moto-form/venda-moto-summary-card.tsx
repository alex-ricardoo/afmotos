'use client';

import React from 'react';
import {
  Bike,
  MapPin,
  Camera,
  CheckCircle2,
  DollarSign,
  Palette,
  Gauge,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

import { CONSTANTS } from '@/lib/utils/constants';

export interface VendaMotoSummaryCardProps {
  brand?: string;
  model?: string;
  yearModel?: number;
  yearManufacture?: number;
  color?: string | null;
  mileage?: number;

  city?: string;
  desiredPrice?: number | null;
  photosCount?: number;
  currentStep?: number;
  siteName?: string;
}

export function VendaMotoSummaryCard({
  brand,
  model,
  yearModel,
  yearManufacture,
  color,
  mileage,
  city,
  desiredPrice,
  photosCount = 0,
  currentStep = 1,
  siteName,
}: VendaMotoSummaryCardProps) {
  const hasMotorcycle = Boolean(brand && model);
  const storeName = siteName || CONSTANTS.STORE_NAME;

  return (
    <div className="sticky top-24 space-y-4">
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5">
        {/* Subtle Top Luxury Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-none">Resumo da Proposta</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Venda direta para a {storeName}</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700">
            Etapa {currentStep}/4
          </span>
        </div>

        {/* Motorcycle Info */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Motocicleta
            </span>
            <div className="text-sm font-extrabold text-white">
              {hasMotorcycle ? (
                <div className="space-y-1">
                  <p className="text-amber-400 font-black text-base">
                    {brand} {model}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-300 font-normal">
                    {(yearManufacture || yearModel) && (
                      <span className="inline-flex items-center gap-1 bg-zinc-950/60 px-2 py-0.5 rounded-md border border-zinc-800">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>
                          {yearManufacture ? `${yearManufacture}/` : ''}
                          {yearModel || 'Ano a definir'}
                        </span>
                      </span>
                    )}
                    {mileage != null && mileage > 0 && (
                      <span className="inline-flex items-center gap-1 bg-zinc-950/60 px-2 py-0.5 rounded-md border border-zinc-800">
                        <Gauge className="w-3 h-3 text-amber-400" />
                        <span>{mileage.toLocaleString('pt-BR')} km</span>
                      </span>
                    )}
                    {color && (
                      <span className="inline-flex items-center gap-1 bg-zinc-950/60 px-2 py-0.5 rounded-md border border-zinc-800">
                        <Palette className="w-3 h-3 text-amber-400" />
                        <span>{color}</span>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-zinc-500 text-xs italic">Selecione os dados da moto...</p>
              )}
            </div>
          </div>

          {city && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{city}, PE</span>
            </div>
          )}
        </div>

        {/* Expectativa de Valor (se informada) */}
        {desiredPrice != null && desiredPrice > 0 && (
          <div className="bg-zinc-950/80 rounded-2xl p-3.5 border border-zinc-800/90 space-y-1">
            <span className="text-zinc-400 text-xs flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Sua expectativa:</span>
            </span>
            <span className="font-extrabold text-white text-base font-mono block">
              {formatCurrency(desiredPrice)}
            </span>
          </div>
        )}

        {/* Photos Indicator */}
        <div className="flex items-center justify-between text-xs px-1 text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Fotos anexadas:</span>
          </span>
          <span className={cn('font-bold', photosCount > 0 ? 'text-amber-400' : 'text-zinc-600')}>
            {photosCount}/5
          </span>
        </div>

        {/* Trust Badges in Summary */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-2 text-[11px] text-zinc-400">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>Avaliação física transparente e justa</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>Pagamento rápido direto via PIX</span>
          </div>
        </div>
      </div>
    </div>
  );
}
