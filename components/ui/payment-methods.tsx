import React from 'react';
import { Banknote, Bike, CreditCard, Landmark, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodsProps {
  /** 'compact' = small pills inline (for cards), 'full' = richer block (for detail page) */
  variant?: 'compact' | 'full';
  className?: string;
}

export function PaymentMethods({ variant = 'compact', className }: PaymentMethodsProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center flex-wrap gap-1.5', className)}>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[10px] font-semibold text-zinc-300">
          <Banknote className="w-3 h-3 text-emerald-400 shrink-0" />
          Dinheiro
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[10px] font-semibold text-zinc-300">
          <Smartphone className="w-3 h-3 text-sky-400 shrink-0" />
          PIX
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-bold text-amber-300">
          <CreditCard className="w-3 h-3 shrink-0" />
          Cartão até 18x
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-[10px] font-bold text-sky-300">
          <Landmark className="w-3 h-3 shrink-0" />
          Financiamento
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold text-emerald-300">
          <Bike className="w-3 h-3 shrink-0" />
          Moto na entrada
        </span>
      </div>
    );
  }

  // variant === 'full'
  return (
    <div className={cn('space-y-2.5', className)}>
      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
        Formas de Pagamento
      </span>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {/* Dinheiro */}
        <div className="min-w-0 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="break-words text-[11px] font-bold text-zinc-200 leading-tight">Dinheiro</span>
        </div>

        {/* PIX */}
        <div className="min-w-0 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-center">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-sky-400" />
          </div>
          <span className="break-words text-[11px] font-bold text-zinc-200 leading-tight">PIX</span>
        </div>

        {/* Cartão */}
        <div className="min-w-0 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-amber-500/8 border border-amber-500/30 text-center">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <span className="break-words text-[11px] font-bold text-amber-300 leading-tight">Cartão</span>
        </div>

        {/* Financiamento */}
        <div className="min-w-0 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-sky-500/8 border border-sky-500/25 text-center">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-sky-400" />
          </div>
          <span className="break-words text-[11px] font-bold text-sky-300 leading-tight">Financiamento</span>
        </div>

        {/* Moto na entrada */}
        <div className="min-w-0 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-emerald-500/8 border border-emerald-500/25 text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Bike className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="break-words text-[11px] font-bold text-emerald-300 leading-tight">
            Moto na entrada
          </span>
        </div>
      </div>

      {/* Cartão note */}
      <p className="text-[10px] text-zinc-500 leading-snug flex items-start gap-1.5">
        <CreditCard className="w-3 h-3 text-amber-500/60 shrink-0 mt-0.5" />
        <span>
          <span className="font-semibold text-amber-400/80">Aceitamos cartões</span> de crédito em{' '}
          <span className="font-bold text-amber-400">até 18×</span> com acréscimo da maquineta.
          Consulte as condições de financiamento e a avaliação da sua moto como entrada.
        </span>
      </p>
    </div>
  );
}
