'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, ChevronDown, Check, Filter, X } from 'lucide-react';
import { PERIOD_PRESETS } from '@/lib/reports/date-range';
import { ReportDateRange, ReportPeriodPreset } from '@/lib/reports/types';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface ReportPeriodFilterProps {
  currentDateRange: ReportDateRange;
  className?: string;
}

export function ReportPeriodFilter({ currentDateRange, className }: ReportPeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customStart, setCustomStart] = useState(currentDateRange.startDate);
  const [customEnd, setCustomEnd] = useState(currentDateRange.endDate);

  const applyPreset = (preset: ReportPeriodPreset) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', preset);
    params.delete('start_date');
    params.delete('end_date');
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const applyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd || customStart > customEnd) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', 'custom');
    params.set('start_date', customStart);
    params.set('end_date', customEnd);
    router.push(`${pathname}?${params.toString()}`);
    setIsCustomModalOpen(false);
    setIsOpen(false);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Desktop Dropdown Popover */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs font-bold text-zinc-200 hover:text-white hover:border-[#c9a44c]/60 shadow-xs transition-all cursor-pointer select-none"
        >
          <CalendarIcon className="w-4 h-4 text-[#c9a44c]" />
          <span>{currentDateRange.label}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-400 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Selecionar Período
              </div>
              <div className="space-y-0.5 max-h-72 overflow-y-auto">
                {PERIOD_PRESETS.map((preset) => {
                  const isSelected = currentDateRange.preset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        if (preset.id === 'custom') {
                          setIsCustomModalOpen(true);
                          setIsOpen(false);
                        } else {
                          applyPreset(preset.id);
                        }
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                        isSelected
                          ? 'bg-[#c9a44c]/15 text-[#e3c56c] font-bold'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80',
                      )}
                    >
                      <span>{preset.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#e3c56c]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Custom Date Range Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#0c0c0f] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Período Personalizado</h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={applyCustomRange} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Data Inicial</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-hidden focus:border-[#c9a44c]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Data Final</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-hidden focus:border-[#c9a44c]"
                  required
                />
              </div>

              {customStart && customEnd && customStart > customEnd && (
                <p className="text-xs text-rose-400 font-medium">
                  A data inicial não pode ser posterior à data final.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={Boolean(customStart && customEnd && customStart > customEnd)}
                  className="px-5 py-2 rounded-xl bg-[#c9a44c] hover:bg-[#d8b35a] text-black font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  Aplicar Período
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
