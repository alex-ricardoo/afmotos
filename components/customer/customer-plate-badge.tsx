'use client';

import React from 'react';
import { getPlateType, formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';

interface CustomerPlateBadgeProps {
  plate: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CustomerPlateBadge({
  plate,
  size = 'sm',
  className = '',
}: CustomerPlateBadgeProps) {
  const plateType = getPlateType(plate);
  const isLegacy = plateType === 'legacy';
  const formatted = formatBrazilianPlate(plate);

  const isSm = size === 'sm';
  const isMd = size === 'md';
  const isLg = size === 'lg';

  const widthClass = isLg
    ? 'w-44 sm:w-48'
    : isMd
    ? 'w-32 sm:w-36'
    : 'w-[98px] sm:w-[108px]';

  const roundedClass = isLg ? 'rounded-xl border-2' : 'rounded-md sm:rounded-lg border';

  return (
    <div
      className={`inline-flex flex-col overflow-hidden select-none transition-transform shadow-sm group-hover:shadow-md ${roundedClass} ${
        isLegacy
          ? 'border-slate-500/80 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 text-slate-950 shadow-slate-950/40'
          : 'border-slate-800 bg-white text-zinc-950 shadow-black/50'
      } ${widthClass} ${className}`}
      title={isLegacy ? `Placa Padrão Cinza: ${formatted}` : `Placa Padrão Mercosul: ${formatted}`}
    >
      {/* Top Header Bar */}
      {isLegacy ? (
        /* Legacy / Cinza Plate Header */
        <div
          className={`flex items-center justify-between bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-slate-200 border-b border-slate-500/70 ${
            isLg
              ? 'px-3 py-1 text-[9px]'
              : isMd
              ? 'px-2 py-0.5 text-[8px]'
              : 'px-1.5 py-[1px] text-[6.5px]'
          } font-mono font-bold tracking-wider leading-none`}
        >
          <span className="text-slate-300">BR</span>
          <span className="tracking-[0.2em] font-black text-slate-100">BRASIL</span>
          <span className="text-slate-300 uppercase">CINZA</span>
        </div>
      ) : (
        /* Official Mercosul Blue Header */
        <div
          className={`flex items-center justify-between bg-[#003399] text-white ${
            isLg
              ? 'px-3 py-1 text-[10px]'
              : isMd
              ? 'px-2 py-0.5 text-[8.5px]'
              : 'px-1.5 py-[1px] text-[7.5px]'
          } font-black tracking-wider leading-none`}
        >
          <div className="flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-[#facc15]" />
            <span className="w-1 h-1 rounded-full bg-[#facc15]" />
            <span className="w-1 h-1 rounded-full bg-[#facc15]" />
            <span className="w-1 h-1 rounded-full bg-[#facc15]" />
          </div>

          <span className="tracking-[0.2em] font-black">BRASIL</span>

          {/* Miniature Brazilian Flag */}
          <div
            className={`flex items-center justify-center rounded-[1px] bg-[#009b3a] p-[0.5px] ${
              isLg ? 'w-3.5 h-2' : 'w-2.5 h-1.5'
            }`}
          >
            <div
              className="w-full h-full bg-[#fedf00] flex items-center justify-center"
              style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
            >
              <div className="w-1 h-1 rounded-full bg-[#002776]" />
            </div>
          </div>
        </div>
      )}

      {/* Plate Letters and Numbers */}
      <div
        className={`flex items-center justify-center font-mono font-black tracking-widest text-center leading-none ${
          isLegacy
            ? 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-950'
            : 'bg-zinc-50 text-zinc-950'
        } ${
          isLg
            ? 'py-2 sm:py-2.5 text-xl sm:text-2xl tracking-[0.22em]'
            : isMd
            ? 'py-1.5 text-sm sm:text-base tracking-[0.16em]'
            : 'py-1 text-xs sm:text-[13px] tracking-wider'
        }`}
      >
        <span>{formatted}</span>
      </div>
    </div>
  );
}
