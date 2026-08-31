'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { Coins, CheckSquare, Loader2, ShieldAlert, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConsultationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onConfirm: (confirmedPlate: string) => Promise<void>;
  plate: string;
  cost?: string;
  isMockMode?: boolean;
  isExecuting: boolean;
}

export function ConsultationConfirmModal({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  plate,
  cost,
  isMockMode = false,
  isExecuting,
}: ConsultationConfirmModalProps) {
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const formattedPlate = formatBrazilianPlate(plate);

  const handleClose = useCallback(() => {
    if (isExecuting) return;
    if (onCancel) onCancel();
    onClose();
  }, [isExecuting, onCancel, onClose]);

  // Reset checkbox whenever modal opens or plate changes
  useEffect(() => {
    if (isOpen) {
      setConfirmedCheckbox(false);
    }
  }, [isOpen, plate]);

  // Handle ESC key press safely (blocked during execution)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExecuting) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExecuting, handleClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!confirmedCheckbox || isExecuting) return;
    await onConfirm(formattedPlate);
  };

  const displayCost = cost || (isMockMode ? 'Sem Custo (Ambiente Mock)' : 'R$ 30,00* (1 Crédito)');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExecuting) {
          handleClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card border border-border/80 shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close button in top right (disabled during execution) */}
        {!isExecuting && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar"
            className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 pr-6">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/20 shadow-xs">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 id="modal-title" className="text-xl font-bold tracking-tight text-foreground">
              Confirmar Consulta Veicular Oficial
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Esta chamada integrará as bases oficiais com tarifação direta de créditos.
            </p>
          </div>
        </div>

        {/* Grid de Resumo da Consulta */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Placa a ser consultada:</span>
            <span className="font-mono font-bold text-sm text-foreground tracking-wider bg-background px-3 py-1 rounded-lg border border-border shadow-xs">
              {formattedPlate}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Serviço de Consulta:</span>
            <span className="font-semibold text-foreground">Veículos Total (API Oficial)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Custo da Requisição:</span>
            <span className="font-bold text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {displayCost}
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground">Armazenamento:</span>
            <span className="font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Cache Permanente (R$ 0,00)
            </span>
          </div>
        </div>

        {/* Card de Alerta (Aviso de Tarifação & Variação de Preços) */}
        <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs leading-relaxed text-amber-300/90">
            <p>
              <strong>Aviso de Créditos:</strong> Esta consulta consumirá cerca de <strong>R$ 30,00</strong> em créditos na API Brasil. O valor pode variar com o tempo — consulte o painel da API Brasil para conferir os preços atualizados.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Após a conclusão, o laudo completo ficará gravado no banco de dados da AF Motos para consultas futuras sem nenhum custo adicional.
            </p>
          </div>
        </div>

        {/* Trava de Segurança por Checkbox */}
        <label className="flex items-start gap-3 p-3.5 rounded-xl border border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors select-none">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
            checked={confirmedCheckbox}
            onChange={(e) => setConfirmedCheckbox(e.target.checked)}
            disabled={isExecuting}
          />
          <span className="text-xs font-semibold text-foreground leading-tight">
            Conferi a placa <strong className="text-foreground">{formattedPlate}</strong> e autorizo o consumo de créditos para gerar este laudo.
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isExecuting}
            className="rounded-xl h-11 px-5 font-semibold cursor-pointer border-border"
          >
            Cancelar
          </Button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmedCheckbox || isExecuting}
            className={`h-11 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              !confirmedCheckbox || isExecuting
                ? 'opacity-50 cursor-not-allowed bg-amber-600/50 text-slate-200'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer shadow-lg shadow-amber-500/20 active:scale-[0.98]'
            }`}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Consultando bases oficiais...
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                Confirmar & Consultar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
