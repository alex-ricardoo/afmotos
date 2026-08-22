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
    <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-[#c9a44c]" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Comparativo de Preços
          </span>
        </div>
        {motorcycleTitle && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {motorcycleTitle}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Preço Anunciado */}
        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Preço Anunciado</span>
          <p className="text-base font-extrabold text-foreground mt-0.5">
            {advertisedPrice ? formatFipeCurrency(advertisedPrice) : 'Não informado'}
          </p>
        </div>

        {/* Valor de Referência FIPE */}
        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Referência FIPE</span>
          <p className="text-base font-extrabold text-[#e3c56c] mt-0.5">
            {formatFipeCurrency(fipePrice)}
          </p>
        </div>

        {/* Diferença */}
        <div
          className={`rounded-lg border p-3 ${
            diff.direction === 'above'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : diff.direction === 'below'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : diff.direction === 'equal'
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                  : 'border-border/60 bg-background/60 text-muted-foreground'
          }`}
        >
          <span className="text-[11px] font-medium opacity-80">Diferença</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {diff.direction === 'above' && <ArrowUpRight className="h-4 w-4 text-amber-400" />}
            {diff.direction === 'below' && <ArrowDownRight className="h-4 w-4 text-emerald-400" />}
            {diff.direction === 'equal' && <Minus className="h-4 w-4 text-blue-400" />}
            <span className="text-base font-extrabold">
              {diff.amount !== null
                ? `${diff.amount > 0 ? '+' : ''}${formatFipeCurrency(diff.amount)}`
                : '—'}
            </span>
          </div>
          <span className="text-[10px] font-medium opacity-90 block mt-0.5">{diff.label}</span>
        </div>
      </div>
    </div>
  );
}
