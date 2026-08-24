import React from 'react';
import Image from 'next/image';
import { Bike, Calendar, Gauge, Zap } from 'lucide-react';
import { MotorcycleStatusBadge } from './motorcycle-status-badge';
import { cn } from '@/lib/utils';
import { MotorcycleCardData } from './motorcycle-card';

export interface RentalMotorcycleCardProps {
  motorcycle: MotorcycleCardData;
  onSelect: (id: string) => void;
}

export function RentalMotorcycleCard({ motorcycle, onSelect }: RentalMotorcycleCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl bg-[#151515] border shadow-sm w-full h-full transition-all duration-200',
        'group border-[#c9a44c]/20 hover:border-[#e3c56c]/60 hover:shadow-[0_0_25px_rgba(201,164,76,0.15)] sm:duration-300'
      )}
    >
      {/* Top Image Container */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[#0a0a0a] overflow-hidden">
        {motorcycle.image_url ? (
          <>
            <div className="absolute inset-0 animate-pulse bg-zinc-800/50" />
            <Image
              src={motorcycle.image_url}
              alt={`${motorcycle.brand} ${motorcycle.model}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover relative z-10 transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d0d] text-[#a6a6a1] gap-2 p-4 z-10">
            <Bike className="w-8 h-8 opacity-40 text-[#c9a44c]" />
            <span className="text-xs font-medium">Foto indisponível</span>
          </div>
        )}

        {/* Top Floating Status Badge */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <div className="backdrop-blur-md bg-black/70 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-lg">
            Disponível para Locação
          </div>
        </div>

        {/* Gradiente escuro na base da imagem */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#151515] to-transparent z-20 pointer-events-none" />
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Cabeçalho */}
        <div>
          <span className="block text-[11px] text-zinc-400 font-semibold tracking-wider uppercase mb-0.5">
            {motorcycle.brand}
          </span>
          <h3 className="text-base font-bold text-white leading-tight flex items-center gap-1.5 flex-wrap">
            {motorcycle.model}
            {motorcycle.version ? (
              <span className="font-normal text-zinc-300 text-sm whitespace-nowrap">
                {motorcycle.version}
              </span>
            ) : null}
          </h3>
        </div>

        {/* Specs Linha Única Minimalista */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[13px] text-zinc-300 font-medium">
          <div className="flex items-center gap-1.5" title="Ano">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>
              {motorcycle.year_manufacture}/{motorcycle.year_model}
            </span>
          </div>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5" title="Motor">
            <Zap className="w-3.5 h-3.5 text-zinc-500" />
            <span>{motorcycle.engine_capacity ? `${motorcycle.engine_capacity}cc` : 'Flex'}</span>
          </div>
        </div>

        {/* Preço e Call To Action */}
        <div className="pt-2 mt-auto flex flex-col gap-3">
          <div className="flex items-end gap-1.5">
            <span className="text-sm font-semibold text-zinc-400 tracking-tight leading-none">
              Planos a partir de consulta
            </span>
          </div>

          <button
            onClick={() => onSelect(motorcycle.id)}
            className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#c9a44c] hover:bg-[#e3c56c] active:bg-[#b89542] active:scale-[0.98] text-black font-bold text-sm transition-all duration-100 sm:duration-200 shadow-[0_0_20px_rgba(201,164,76,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3c56c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151515] cursor-pointer"
          >
            Alugar Esta Moto
          </button>
        </div>
      </div>
    </div>
  );
}
