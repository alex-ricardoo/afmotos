'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface OcrFieldConflict {
  fieldKey: string;
  fieldLabel: string;
  currentValue: string | number;
  newValue: string | number;
}

interface MotorcycleOcrConflictModalProps {
  isOpen: boolean;
  conflicts: OcrFieldConflict[];
  onConfirmOverwrite: () => void;
  onKeepManual: () => void;
  onCancel: () => void;
}

export function MotorcycleOcrConflictModal({
  isOpen,
  conflicts,
  onConfirmOverwrite,
  onKeepManual,
  onCancel,
}: MotorcycleOcrConflictModalProps) {
  if (!isOpen || conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in-50">
      <div className="w-full max-w-lg rounded-2xl border border-amber-500/40 bg-zinc-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Campos com valores preenchidos</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Alguns campos já possuem valores digitados. Como deseja proceder?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Conflitos */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {conflicts.map((c) => (
            <div
              key={c.fieldKey}
              className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs space-y-1.5"
            >
              <div className="font-semibold text-zinc-300">{c.fieldLabel}</div>
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="line-through text-zinc-500 truncate max-w-[140px]">
                  {String(c.currentValue) || '(vazio)'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 truncate max-w-[180px]">
                  {String(c.newValue)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="w-full sm:w-auto text-xs text-zinc-400 hover:text-zinc-200"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onKeepManual}
            className="w-full sm:w-auto text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-300"
          >
            Manter o que digitei
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onConfirmOverwrite}
            className="w-full sm:w-auto text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Substituir valores
          </Button>
        </div>
      </div>
    </div>
  );
}
