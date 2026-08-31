'use client';

import React, { forwardRef, useMemo } from 'react';
import { getPlateType, normalizeBrazilianPlate } from '@/lib/vehicle-lookup/plate';

interface AdaptivePlateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export const AdaptivePlateInput = forwardRef<HTMLInputElement, AdaptivePlateInputProps>(
  ({ value, onChange, onSubmit, disabled, className = '', ...props }, ref) => {
    const plateType = useMemo(() => getPlateType(value), [value]);
    const isLegacy = plateType === 'legacy';
    const isMercosul = plateType === 'mercosul';

    return (
      <div className="relative mx-auto w-full max-w-[340px] select-none">
        {/* Physical Plate Container */}
        <div
          className={`relative overflow-hidden rounded-2xl border-[3px] shadow-2xl transition-all duration-300 focus-within:ring-4 focus-within:ring-primary/40 ${
            isLegacy
              ? 'border-slate-700 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 focus-within:border-slate-500'
              : 'border-slate-900 bg-white focus-within:border-primary'
          }`}
        >
          {/* Top Header Bar */}
          {isLegacy ? (
            /* Classic Grey Plate Header */
            <div className="relative flex h-7 items-center justify-between bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 px-3.5 shadow-inner border-b border-slate-500">
              <span className="text-[8px] font-black tracking-widest text-slate-300 font-mono">BR</span>
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-100 font-mono">BRASIL</span>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="text-[8px] font-bold text-slate-300 font-mono">CINZA</span>
              </div>
            </div>
          ) : (
            /* Official Mercosul Header */
            <div className="relative flex h-8 items-center justify-between bg-[#003399] px-3.5 shadow-inner transition-colors duration-300">
              {/* Left: Mercosul Stars Icon */}
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#facc15]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#facc15]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#facc15]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#facc15]" />
                </div>
                <span className="text-[8px] font-black tracking-widest text-white/90 font-mono">MERCOSUL</span>
              </div>

              {/* Center: BRASIL Country Name */}
              <span className="text-xs font-black tracking-[0.25em] text-white">BRASIL</span>

              {/* Right: Brazilian Flag Badge */}
              <div className="flex h-4 w-6 items-center justify-center rounded-[2px] bg-[#009b3a] p-[1.5px] shadow-xs">
                <div className="relative flex h-full w-full items-center justify-center bg-[#fedf00] clip-diamond">
                  <div className="h-2 w-2 rounded-full bg-[#002776]" />
                </div>
              </div>
            </div>
          )}

          {/* Plate Body & Real-Time Input */}
          <div
            className={`relative flex items-center justify-center py-3.5 px-4 transition-colors duration-300 ${
              isLegacy
                ? 'bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300'
                : 'bg-gradient-to-b from-slate-50 via-white to-slate-100'
            }`}
          >
            {/* Watermark QR / Hologram simulation */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
              <div
                className={`h-6 w-6 border rounded-[2px] flex items-center justify-center text-[7px] font-mono font-bold ${
                  isLegacy ? 'border-slate-700 text-slate-800' : 'border-slate-900 text-slate-900'
                }`}
              >
                {isLegacy ? 'DETRAN' : 'QR'}
              </div>
            </div>

            {/* Plate Input */}
            <input
              ref={ref}
              type="text"
              value={value}
              onChange={onChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSubmit && !disabled) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              disabled={disabled}
              placeholder={isLegacy ? 'ABC-1234' : 'ABC1D23'}
              maxLength={8}
              aria-label="Placa do Veículo"
              className={`w-full bg-transparent text-center font-mono text-3xl sm:text-4xl font-black tracking-[0.18em] text-slate-950 placeholder:text-slate-400 uppercase focus:outline-hidden disabled:opacity-60 ${className}`}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              {...props}
            />

            {/* Right side embossed seal */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-25 pointer-events-none">
              <span className="text-[9px] font-black text-slate-900 font-mono tracking-tighter">
                {isLegacy ? 'BR' : 'BR'}
              </span>
            </div>
          </div>
        </div>

        {/* Plate Bolt Screws Simulation */}
        <div
          className={`absolute -top-1.5 left-8 h-2 w-2 rounded-full border shadow-inner ${
            isLegacy ? 'bg-slate-500 border-slate-700' : 'bg-slate-400 border-slate-600'
          }`}
        />
        <div
          className={`absolute -top-1.5 right-8 h-2 w-2 rounded-full border shadow-inner ${
            isLegacy ? 'bg-slate-500 border-slate-700' : 'bg-slate-400 border-slate-600'
          }`}
        />

        {/* Dynamic Pattern Subtitle Tag */}
        <div className="flex items-center justify-center mt-2">
          {isMercosul && (
            <span className="text-[10px] font-bold text-primary tracking-wide flex items-center gap-1 animate-in fade-in duration-200">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Padrão Mercosul Identificado (ABC1D23)
            </span>
          )}
          {isLegacy && (
            <span className="text-[10px] font-bold text-slate-400 tracking-wide flex items-center gap-1 animate-in fade-in duration-200">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Padrão Cinza Clássico Identificado (ABC-1234)
            </span>
          )}
          {!isMercosul && !isLegacy && (
            <span className="text-[10px] text-muted-foreground tracking-wide">
              Digite 7 caracteres (Mercosul ou modelo cinza)
            </span>
          )}
        </div>
      </div>
    );
  }
);

AdaptivePlateInput.displayName = 'AdaptivePlateInput';

// Export alias for backward compatibility
export const MercosulPlateInput = AdaptivePlateInput;

/**
 * Adaptive License Plate Badge for Web Cards & Tables
 * Supports both Mercosul and Classic Grey plates automatically!
 */
interface AdaptivePlateBadgeWebProps {
  plate?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AdaptivePlateBadgeWeb({
  plate = '---',
  size = 'md',
  className = '',
}: AdaptivePlateBadgeWebProps) {
  const displayPlate = plate?.trim() || '---';
  const plateType = useMemo(() => getPlateType(displayPlate), [displayPlate]);
  const isLegacy = plateType === 'legacy';

  const sizeStyles = {
    sm: {
      container: 'w-[78px] rounded-[4px] border-[1px]',
      header: 'h-3 px-1 text-[6px]',
      body: 'py-0.5 text-[10px]',
    },
    md: {
      container: 'w-[96px] rounded-[5px] border-[1.2px]',
      header: 'h-3.5 px-1.5 text-[7px]',
      body: 'py-1 text-xs',
    },
    lg: {
      container: 'w-[124px] rounded-md border-[1.5px]',
      header: 'h-4.5 px-2 text-[8px]',
      body: 'py-1.5 text-sm',
    },
  }[size];

  if (isLegacy) {
    return (
      <div
        className={`inline-flex flex-col border-slate-700 bg-slate-300 overflow-hidden shadow-xs select-none ${sizeStyles.container} ${className}`}
      >
        {/* Grey Header */}
        <div
          className={`flex items-center justify-between bg-slate-700 font-black text-slate-200 font-mono tracking-wider ${sizeStyles.header}`}
        >
          <span className="opacity-80 scale-75 origin-left">BR</span>
          <span>BRASIL</span>
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        </div>

        {/* Plate Code */}
        <div
          className={`flex items-center justify-center bg-gradient-to-b from-slate-200 to-slate-300 font-mono font-black tracking-wider text-slate-900 ${sizeStyles.body}`}
        >
          {displayPlate}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex flex-col border-slate-900 bg-white overflow-hidden shadow-xs select-none ${sizeStyles.container} ${className}`}
    >
      {/* Blue Header */}
      <div
        className={`flex items-center justify-between bg-[#003399] font-black text-white font-mono tracking-wider ${sizeStyles.header}`}
      >
        <span className="opacity-80 scale-75 origin-left">BR</span>
        <span>BRASIL</span>
        <div className="h-1.5 w-2 rounded-[1px] bg-[#009b3a]" />
      </div>

      {/* Plate Code */}
      <div
        className={`flex items-center justify-center bg-white font-mono font-black tracking-wider text-slate-950 ${sizeStyles.body}`}
      >
        {displayPlate}
      </div>
    </div>
  );
}

// Export alias for backward compatibility
export const MercosulPlateBadgeWeb = AdaptivePlateBadgeWeb;
