import React from 'react';
import { cn } from '@/lib/utils';
import { translateStatus } from '@/lib/utils/translations';

export type MotorcycleStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'SOLD'
  | 'RENTED'
  | 'MAINTENANCE'
  | 'UNAVAILABLE'
  | 'HIDDEN'
  | string;

interface StatusBadgeProps {
  status: MotorcycleStatus;
  className?: string;
}

const statusColorMap: Record<string, { classes: string; dotClass: string }> = {
  AVAILABLE: {
    classes: 'bg-[#c9a44c]/15 text-[#e3c56c] border-[#c9a44c]/40 shadow-[0_0_8px_rgba(201,164,76,0.2)]',
    dotClass: 'bg-[#e3c56c]',
  },
  RESERVED: {
    classes: 'bg-[#b8bcc2]/15 text-[#e6e8eb] border-[#b8bcc2]/40 shadow-[0_0_8px_rgba(184,188,194,0.15)]',
    dotClass: 'bg-[#b8bcc2]',
  },
  SOLD: {
    classes: 'bg-[#151515] text-[#71717a] border-[#27272a]',
    dotClass: 'bg-[#52525b]',
  },
  RENTED: {
    classes: 'bg-[#8f6d25]/20 text-[#e3c56c] border-[#8f6d25]/50 shadow-[0_0_8px_rgba(143,109,37,0.2)]',
    dotClass: 'bg-[#c9a44c]',
  },
  MAINTENANCE: {
    classes: 'bg-zinc-800/80 text-zinc-300 border-zinc-700',
    dotClass: 'bg-zinc-400',
  },
  UNAVAILABLE: {
    classes: 'bg-zinc-900 text-zinc-500 border-zinc-800',
    dotClass: 'bg-zinc-600',
  },
  HIDDEN: {
    classes: 'bg-zinc-900 text-zinc-600 border-zinc-800',
    dotClass: 'bg-zinc-700',
  },
};

export function MotorcycleStatusBadge({ status, className }: StatusBadgeProps) {
  const label = translateStatus(status);
  const normalizedKey = status ? String(status).trim().toUpperCase() : 'AVAILABLE';
  const color = statusColorMap[normalizedKey] || {
    classes: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    dotClass: 'bg-zinc-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border shadow-xs transition-colors backdrop-blur-xs',
        color.classes,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', color.dotClass)} />
      {label}
    </span>
  );
}
