import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { MetricConfidence } from '@/lib/reports/types';
import { ReportDataStatusBadge } from './report-data-status-badge';
import { cn } from '@/lib/utils';

interface ReportKpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  confidence?: MetricConfidence;
  confidenceReason?: string;
  comparisonPercentage?: number | null;
  previousValueFormatted?: string | null;
  tooltipFormula?: string;
  className?: string;
}

export function ReportKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-[#c9a44c]',
  confidence = 'confirmed',
  confidenceReason,
  comparisonPercentage,
  previousValueFormatted,
  tooltipFormula,
  className,
}: ReportKpiCardProps) {
  const hasComparison = comparisonPercentage !== null && comparisonPercentage !== undefined && !isNaN(comparisonPercentage);
  const isPositive = hasComparison && comparisonPercentage > 0;
  const isNegative = hasComparison && comparisonPercentage < 0;
  const isNeutral = hasComparison && comparisonPercentage === 0;

  return (
    <div
      className={cn(
        'relative bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-zinc-700/80 transition-all group',
        className,
      )}
    >
      {/* Top row: Title + Icon + Formula Tooltip */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs font-bold text-zinc-400 truncate tracking-tight">
            {title}
          </span>
          {tooltipFormula && (
            <span
              title={`Fórmula: ${tooltipFormula}`}
              className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-help shrink-0"
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <div
          className={cn(
            'w-9 h-9 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform',
          )}
        >
          <Icon className={cn('w-4.5 h-4.5', iconColor)} />
        </div>
      </div>

      {/* Main Value Display */}
      <div className="mt-3 space-y-1">
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-zinc-500 font-medium truncate">{subtitle}</p>
        )}
      </div>

      {/* Bottom row: Comparison % + Confidence Badge */}
      <div className="mt-4 pt-3 border-t border-zinc-900/80 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div>
          {hasComparison ? (
            <div
              className={cn(
                'inline-flex items-center gap-1 font-bold text-[11px]',
                isPositive && 'text-emerald-400',
                isNegative && 'text-rose-400',
                isNeutral && 'text-zinc-400',
              )}
              title={previousValueFormatted ? `Período anterior: ${previousValueFormatted}` : undefined}
            >
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {isNeutral && <Minus className="w-3 h-3" />}
              <span>{`${isPositive ? '+' : ''}${comparisonPercentage.toFixed(1)}%`}</span>
              <span className="text-[10px] text-zinc-500 font-normal">vs anterior</span>
            </div>
          ) : (
            <span className="text-[10px] text-zinc-600 font-medium">Sem dados comparativos</span>
          )}
        </div>

        <ReportDataStatusBadge
          confidence={confidence}
          customReason={confidenceReason}
        />
      </div>
    </div>
  );
}
