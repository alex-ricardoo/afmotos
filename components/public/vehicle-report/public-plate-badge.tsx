import React from 'react';
import { getPlateType, formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';

interface PublicPlateBadgeProps {
  plate: string;
  className?: string;
}

export function PublicPlateBadge({ plate, className = '' }: PublicPlateBadgeProps) {
  const plateType = getPlateType(plate);
  const formatted = formatBrazilianPlate(plate);
  const isLegacy = plateType === 'legacy';

  return (
    <div
      className={`inline-block relative overflow-hidden rounded-xl border-2 shadow-lg select-none ${
        isLegacy
          ? 'border-slate-600 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 text-slate-900'
          : 'border-slate-900 bg-white text-slate-900'
      } ${className}`}
    >
      {/* Top Header Bar */}
      {isLegacy ? (
        <div className="flex h-5 items-center justify-between bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 px-2.5 border-b border-slate-500">
          <span className="text-[7px] font-black tracking-widest text-slate-300 font-mono">BR</span>
          <span className="text-[8px] font-black tracking-[0.2em] text-slate-100 font-mono">BRASIL</span>
          <span className="text-[7px] font-bold text-slate-300 font-mono">CINZA</span>
        </div>
      ) : (
        <div className="flex h-5 items-center justify-between bg-[#003399] px-2.5">
          <div className="flex items-center gap-0.5">
            <span className="h-1 w-1 rounded-full bg-[#facc15]" />
            <span className="h-1 w-1 rounded-full bg-[#facc15]" />
            <span className="h-1 w-1 rounded-full bg-[#facc15]" />
            <span className="h-1 w-1 rounded-full bg-[#facc15]" />
            <span className="text-[7px] font-bold tracking-widest text-white ml-0.5 font-mono">MERCOSUL</span>
          </div>
          <span className="text-[9px] font-black tracking-[0.2em] text-white">BRASIL</span>
          <div className="flex h-3 w-4.5 items-center justify-center rounded-[1px] bg-[#009b3a] p-[1px]">
            <div className="flex h-full w-full items-center justify-center bg-[#fedf00]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#002776]" />
            </div>
          </div>
        </div>
      )}

      {/* Plate Characters */}
      <div className="px-3 py-1 flex items-center justify-center">
        <span
          className="font-mono font-black text-xl sm:text-2xl tracking-wider text-slate-900 uppercase"
          style={{ fontFamily: 'monospace, sans-serif' }}
        >
          {formatted || plate}
        </span>
      </div>
    </div>
  );
}
