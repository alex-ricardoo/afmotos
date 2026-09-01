'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  normalizeBrazilianPlate,
  formatBrazilianPlate,
  isValidBrazilianPlate,
  getPlateType,
} from '@/lib/vehicle-lookup/plate';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface MercosulPlateInputProps {
  value: string;
  onChange: (normalizedPlate: string) => void;
  error?: string | null;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  siteName?: string;
}

export function MercosulPlateInput({
  value,
  onChange,
  error,
  className,
  disabled = false,
  autoFocus = false,
  siteName = 'AF Motos',
}: MercosulPlateInputProps) {
  const [displayValue, setDisplayValue] = useState(formatBrazilianPlate(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setDisplayValue(formatBrazilianPlate(value));
  }, [value]);

  const plateType = getPlateType(value);
  const isValid = isValidBrazilianPlate(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const normalized = normalizeBrazilianPlate(rawInput);
    onChange(normalized);
    setDisplayValue(formatBrazilianPlate(normalized));
  };

  return (
    <div className={cn('w-full max-w-sm mx-auto space-y-2', className)}>
      {/* Plate Card */}
      <div
        className={cn(
          'relative rounded-2xl border-4 transition-all duration-300 overflow-hidden shadow-2xl bg-white select-none',
          isFocused
            ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)] scale-[1.02]'
            : error
              ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
              : 'border-zinc-800 hover:border-zinc-700',
        )}
      >
        {/* Mercosul Blue Header */}
        <div className="bg-[#003399] px-4 py-1.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5">
            {/* Mercosul Star Circle Icon */}
            <div className="w-3.5 h-3.5 rounded-full border border-amber-300/80 flex items-center justify-center">
              <span className="text-[7px] text-amber-300 font-bold leading-none">★</span>
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase">MERCOSUL</span>
          </div>

          <span className="text-xs font-black tracking-widest text-white uppercase drop-shadow-sm">
            BRASIL
          </span>

          {/* Mini Brazil Flag Badge */}
          <div className="w-5 h-3.5 bg-[#009b3a] rounded-[2px] relative flex items-center justify-center overflow-hidden border border-white/20">
            <div className="w-3 h-2 bg-[#fedf00] rotate-45 transform" />
            <div className="w-1.5 h-1.5 bg-[#002776] rounded-full absolute" />
          </div>
        </div>

        {/* Plate Body & Input */}
        <div className="relative bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200 px-4 py-3 sm:py-4 flex items-center justify-center">
          <input
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="ABC1D23"
            maxLength={8}
            disabled={disabled}
            autoFocus={autoFocus}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Placa da moto para consulta de histórico veicular"
            aria-invalid={!!error}
            className="w-full text-center text-3xl sm:text-4xl font-black font-mono tracking-widest text-zinc-950 bg-transparent outline-none placeholder:text-zinc-400 placeholder:opacity-50 uppercase drop-shadow-sm cursor-text"
          />

          {/* Validation Status Indicator */}
          {value.length >= 7 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-in fade-in zoom-in" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 animate-in fade-in zoom-in" />
              )}
            </div>
          )}
        </div>

        {/* Plate Sub-bar with Type Indicator */}
        <div className="bg-zinc-200/90 border-t border-zinc-300/80 px-3 py-1 flex items-center justify-between text-[10px] text-zinc-600 font-medium">
          <span>{(siteName || 'AF Motos').toUpperCase()} • CONSULTA OFICIAL</span>
          <span className="font-bold uppercase tracking-wider text-zinc-700">
            {plateType === 'mercosul'
              ? 'Padrão Mercosul'
              : plateType === 'legacy'
                ? 'Padrão Cinza Antigo'
                : 'Digite 7 caracteres'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p
          role="alert"
          className="text-xs font-semibold text-red-400 flex items-center justify-center gap-1.5 animate-in fade-in"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
