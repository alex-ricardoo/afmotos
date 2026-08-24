'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';

interface HoursTabProps {
  form: UseFormReturn<any>;
}

const DAYS = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const;

export function HoursTab({ form }: HoursTabProps) {
  const businessHours = form.watch('settings.businessHours') || {};

  const handleToggleOpen = (dayKey: string, isOpen: boolean) => {
    const currentDay = businessHours[dayKey] || { isOpen: false, periods: [] };
    const defaultPeriods = isOpen && (!currentDay.periods || currentDay.periods.length === 0)
      ? [{ opensAt: '08:00', closesAt: dayKey === 'saturday' ? '13:00' : '18:00' }]
      : currentDay.periods || [];

    form.setValue(`settings.businessHours.${dayKey}`, {
      isOpen,
      periods: defaultPeriods,
    }, { shouldDirty: true });
  };

  const handlePeriodChange = (
    dayKey: string,
    periodIndex: number,
    field: 'opensAt' | 'closesAt',
    value: string,
  ) => {
    const currentDay = businessHours[dayKey] || { isOpen: true, periods: [] };
    const newPeriods = [...(currentDay.periods || [])];
    if (!newPeriods[periodIndex]) {
      newPeriods[periodIndex] = { opensAt: '08:00', closesAt: '18:00' };
    }
    newPeriods[periodIndex] = {
      ...newPeriods[periodIndex],
      [field]: value,
    };

    form.setValue(`settings.businessHours.${dayKey}.periods`, newPeriods, { shouldDirty: true });
  };

  const handleAddPeriod = (dayKey: string) => {
    const currentDay = businessHours[dayKey] || { isOpen: true, periods: [] };
    const newPeriods = [...(currentDay.periods || []), { opensAt: '14:00', closesAt: '18:00' }];
    form.setValue(`settings.businessHours.${dayKey}.periods`, newPeriods, { shouldDirty: true });
  };

  const handleRemovePeriod = (dayKey: string, periodIndex: number) => {
    const currentDay = businessHours[dayKey] || { isOpen: true, periods: [] };
    const newPeriods = (currentDay.periods || []).filter((_: any, idx: number) => idx !== periodIndex);
    form.setValue(`settings.businessHours.${dayKey}.periods`, newPeriods, { shouldDirty: true });
  };

  // Preenchimento rápido padrão
  const applyStandardHours = () => {
    const standard = {
      monday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '18:00' }] },
      tuesday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '18:00' }] },
      wednesday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '18:00' }] },
      thursday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '18:00' }] },
      friday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '18:00' }] },
      saturday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '13:00' }] },
      sunday: { isOpen: false, periods: [] },
    };
    form.setValue('settings.businessHours', standard, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Horários de Atendimento</h3>
            <p className="text-xs text-zinc-400">
              Configure a grade semanal de funcionamento exibida no rodapé e nos detalhes das motos.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={applyStandardHours}
          className="border-zinc-800 bg-zinc-900 text-xs text-amber-400 hover:bg-zinc-800 cursor-pointer"
        >
          Aplicar Horário Comercial Padrão
        </Button>
      </div>

      {/* Grade de Dias */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const dayData = businessHours[day.key] ?? {
            isOpen: day.key !== 'sunday',
            periods: day.key === 'sunday' ? [] : [{ opensAt: '08:00', closesAt: day.key === 'saturday' ? '13:00' : '18:00' }],
          };

          const isOpen = Boolean(dayData.isOpen);
          const periods = dayData.periods || [];

          return (
            <div
              key={day.key}
              className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
            >
              {/* Dia + Switch */}
              <div className="flex items-center justify-between md:justify-start gap-4 min-w-[200px]">
                <span className="font-bold text-sm text-zinc-200">{day.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={(e) => handleToggleOpen(day.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-semibold text-zinc-400">
                    {isOpen ? (
                      <span className="text-emerald-400">Aberto</span>
                    ) : (
                      <span className="text-zinc-500">Fechado</span>
                    )}
                  </span>
                </label>
              </div>

              {/* Períodos de Horário */}
              {isOpen ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 justify-end flex-wrap">
                  {periods.map((period: any, pIdx: number) => (
                    <div key={pIdx} className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                      <input
                        type="time"
                        value={period.opensAt || '08:00'}
                        onChange={(e) => handlePeriodChange(day.key, pIdx, 'opensAt', e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-zinc-400">às</span>
                      <input
                        type="time"
                        value={period.closesAt || '18:00'}
                        onChange={(e) => handlePeriodChange(day.key, pIdx, 'closesAt', e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                      />

                      {periods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePeriod(day.key, pIdx)}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                          title="Remover período"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {periods.length < 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddPeriod(day.key)}
                      className="text-xs text-amber-400 hover:bg-zinc-900 cursor-pointer h-8"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      <span>2º Período</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic md:text-right">
                  Sem atendimento presencial ou comercial neste dia.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
