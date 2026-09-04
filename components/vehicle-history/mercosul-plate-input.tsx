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
    <div className={cn('w-full max-w-sm mx-auto space-y-2.5', className)}>
      {/* Outer Chrome Bezel Frame & Carbon Fiber Backdrop shadow */}
      <div
        className={cn(
          'relative rounded-2xl p-[3px] transition-all duration-300 shadow-2xl select-none',
          'bg-gradient-to-b from-slate-200 via-slate-400 to-slate-700',
          isFocused
            ? 'ring-4 ring-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.45)] scale-[1.02]'
            : error
              ? 'ring-4 ring-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
              : 'shadow-[0_12px_32px_rgba(0,0,0,0.85)] hover:scale-[1.01]',
        )}
      >
        {/* Inner Plate Bevel */}
        <div className="relative rounded-[13px] overflow-hidden border border-slate-950/40 bg-zinc-900 shadow-inner">
          {/* Satin Anodized Blue Header */}
          <div className="relative bg-gradient-to-r from-[#002277] via-[#0038a8] to-[#002277] px-4 py-1.5 flex items-center justify-between text-white shadow-md border-b border-black/30">
            {/* Subtle Metallic Sheen on Blue Bar */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none" />

            <div className="relative z-10 flex items-center gap-1.5">
              {/* Enameled Mercosul Star Circle Icon */}
              <div className="w-4 h-4 rounded-full border border-amber-400/90 bg-blue-950/80 shadow-[0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-center">
                <span className="text-[8px] text-amber-300 font-bold leading-none">★</span>
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                MERCOSUL
              </span>
            </div>

            <span className="relative z-10 text-xs font-black tracking-widest text-white uppercase drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
              BRASIL
            </span>

            {/* Enameled Brazil Flag Badge */}
            <div className="relative z-10 w-5 h-3.5 bg-[#009b3a] rounded-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden border border-white/40">
              <div className="w-3 h-2 bg-[#fedf00] rotate-45 transform" />
              <div className="w-1.5 h-1.5 bg-[#002776] rounded-full absolute" />
            </div>
          </div>

          {/* Stamped Metal Body with Realistic Brushed Texture & Specular Highlight */}
          <div
            className="relative px-4 py-3.5 sm:py-4 flex items-center justify-center overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, #e4e7eb 0%, #cbd2d9 25%, #f1f3f5 45%, #b8c2cc 55%, #e1e7ec 75%, #cfd7df 100%)',
              boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.18), inset 0 -2px 4px rgba(0,0,0,0.22)',
            }}
          >
            {/* Fine Brushed Metal Lines Overlay */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
              }}
            />

            {/* Specular Diagonal Reflection Sheen */}
            <div className="absolute -inset-full w-[250%] h-[250%] bg-gradient-to-tr from-transparent via-white/35 to-transparent rotate-12 pointer-events-none" />

            {/* Embossed Stamped 3D Characters Input - Mercosul DIN / FE-Schrift Font */}
            <input
              type="text"
              id="mercosul-plate-field"
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
              style={{
                fontFamily: 'var(--font-mercosul-plate), "Oswald", "Arial Black", sans-serif',
                letterSpacing: '0.22em',
                // Multi-layered metallic chamfer & stamped emboss border
                textShadow: `
                  -1px -1px 0px rgba(255, 255, 255, 0.75),
                  1px -1px 0px rgba(255, 255, 255, 0.5),
                  -1px 1px 0px rgba(0, 0, 0, 0.6),
                  1px 1px 0px rgba(0, 0, 0, 0.9),
                  0px 2px 2px rgba(0, 0, 0, 0.7),
                  0px 4px 6px rgba(0, 0, 0, 0.35)
                `,
                WebkitTextStroke: '0.8px rgba(180, 195, 210, 0.7)',
              }}
              className={cn(
                'relative z-10 w-full text-center text-4xl sm:text-5xl font-extrabold bg-transparent outline-none uppercase cursor-text select-all',
                'text-[#0e1116] placeholder:text-zinc-400 placeholder:opacity-50',
                'drop-shadow-[0_2px_1px_rgba(255,255,255,0.9)]',
              )}
            />


            {/* Validation Status Indicator */}
            {value.length >= 7 && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                {isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in" />
                )}
              </div>
            )}
          </div>

          {/* Plate Sub-bar: Matte Gunmetal with Laser Engraved Text */}
          <div className="relative bg-gradient-to-r from-zinc-300 via-zinc-200 to-zinc-300 border-t border-zinc-400/80 px-3 py-1.5 flex items-center justify-between text-[10px] font-bold text-zinc-700 shadow-inner">
            <span className="drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
              {(siteName || 'AF Motos').toUpperCase()} • CONSULTA OFICIAL
            </span>
            <span className="font-extrabold uppercase tracking-wider text-zinc-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
              {plateType === 'mercosul'
                ? 'Padrão Mercosul'
                : plateType === 'legacy'
                  ? 'Padrão Cinza Antigo'
                  : 'Digite 7 caracteres'}
            </span>
          </div>
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

