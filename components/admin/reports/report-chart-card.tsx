import React from 'react';
import { cn } from '@/lib/utils';

interface ReportChartCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ReportChartCard({
  title,
  subtitle,
  badge,
  headerAction,
  children,
  className,
}: ReportChartCardProps) {
  return (
    <div
      className={cn(
        'bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5',
        className,
      )}
    >
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full bg-[#c9a44c]" />
            <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Chart Body */}
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}
