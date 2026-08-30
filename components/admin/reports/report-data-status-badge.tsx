import React from 'react';
import { MetricConfidence } from '@/lib/reports/types';
import { getConfidenceBadgeProps } from '@/lib/reports/formatters';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface ReportDataStatusBadgeProps {
  confidence: MetricConfidence;
  customReason?: string;
  className?: string;
  showIcon?: boolean;
}

export function ReportDataStatusBadge({
  confidence,
  customReason,
  className,
  showIcon = true,
}: ReportDataStatusBadgeProps) {
  const { label, variant, description } = getConfidenceBadgeProps(confidence);
  const tooltipText = customReason || description;

  return (
    <span
      title={tooltipText}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight border transition-colors cursor-help select-none',
        variant === 'emerald' &&
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15',
        variant === 'amber' &&
          'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/15',
        variant === 'zinc' &&
          'bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:bg-zinc-800',
        className,
      )}
    >
      {showIcon && (
        <>
          {variant === 'emerald' && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
          {variant === 'amber' && <AlertCircle className="w-2.5 h-2.5 shrink-0" />}
          {variant === 'zinc' && <HelpCircle className="w-2.5 h-2.5 shrink-0" />}
        </>
      )}
      <span>{label}</span>
    </span>
  );
}
