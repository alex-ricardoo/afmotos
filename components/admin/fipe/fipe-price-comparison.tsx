import { calculatePriceDifference, formatFipeCurrency } from '@/lib/domain/fipe-price';
import { ArrowDownRight, ArrowUpRight, Minus, Scale } from 'lucide-react';

interface FipePriceComparisonProps {
  advertisedPrice: number | null | undefined;
  fipePrice: number | null | undefined;
  motorcycleTitle?: string;
}

export function FipePriceComparison({
  advertisedPrice,
  fipePrice,
  motorcycleTitle,
}: FipePriceComparisonProps) {
  const diff = calculatePriceDifference(advertisedPrice, fipePrice);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Comparativo de Preços
          </span>
        </div>
        {motorcycleTitle && (
          <span className="text-xs text-slate-400 truncate max-w-[240px] font-medium">
            {motorcycleTitle}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Preço Anunciado */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Preço Anunciado</span>
          <p className="text-base font-extrabold text-white mt-1 font-mono">
            {advertisedPrice ? formatFipeCurrency(advertisedPrice) : 'Não informado'}
          </p>
        </div>

        {/* Valor de Referência FIPE */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Referência FIPE</span>
          <p className="text-base font-extrabold text-amber-400 mt-1 font-mono">
            {formatFipeCurrency(fipePrice)}
          </p>
        </div>

        {/* Diferença */}
        <div
          className={`rounded-xl border p-3.5 ${
            diff.direction === 'above'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : diff.direction === 'below'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : diff.direction === 'equal'
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
          }`}
        >
          <span className="text-[11px] font-medium opacity-80 block">Diferença</span>
          <div className="flex items-center gap-1.5 mt-1 font-mono">
            {diff.direction === 'above' && <ArrowUpRight className="h-4 w-4 text-amber-400" />}
            {diff.direction === 'below' && <ArrowDownRight className="h-4 w-4 text-emerald-400" />}
            {diff.direction === 'equal' && <Minus className="h-4 w-4 text-blue-400" />}
            <span className="text-base font-extrabold">
              {diff.amount !== null
                ? `${diff.amount > 0 ? '+' : ''}${formatFipeCurrency(diff.amount)}`
                : '—'}
            </span>
          </div>
          <span className="text-[10px] font-medium opacity-90 block mt-1">{diff.label}</span>
        </div>
      </div>
    </div>
  );
}
