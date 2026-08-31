'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { Coins, CheckSquare, Loader2, ShieldAlert, X, ChevronDown, CheckCircle2 } from 'lucide-react';
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
  const [isNoticeExpanded, setIsNoticeExpanded] = useState(false);
  const formattedPlate = formatBrazilianPlate(plate);

  const handleClose = useCallback(() => {
    if (isExecuting) return;
    if (onCancel) onCancel();
    onClose();
  }, [isExecuting, onCancel, onClose]);

  // Reset states whenever modal opens or plate changes
  useEffect(() => {
    if (isOpen) {
      setConfirmedCheckbox(false);
      setIsNoticeExpanded(false);
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExecuting) {
          handleClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header - Fixed at Top */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/20 shadow-xs">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 id="modal-title" className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-snug">
                Confirmar Consulta Oficial
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Integração direta com bases oficiais da API Brasil.
              </p>
            </div>
          </div>

          {!isExecuting && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar"
              className="p-2 -mr-1 -mt-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Grid de Resumo da Consulta */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
              <span className="text-muted-foreground text-xs">Placa:</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-foreground tracking-wider bg-background px-2.5 py-1 rounded-lg border border-border shadow-xs">
                {formattedPlate}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
              <span className="text-muted-foreground text-xs">Serviço:</span>
              <span className="font-semibold text-foreground text-right text-xs">Veículos Total (API Oficial)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
              <span className="text-muted-foreground text-xs">Custo Requisição:</span>
              <span className="font-bold text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-right">
                {displayCost}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 gap-2">
              <span className="text-muted-foreground text-xs">Armazenamento:</span>
              <span className="font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-right">
                Cache Permanente (R$ 0,00)
              </span>
            </div>
          </div>

          {/* Collapse / Accordion de Aviso de Créditos */}
          <div className="rounded-xl sm:rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsNoticeExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 text-left text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer gap-2"
              aria-expanded={isNoticeExpanded}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Entenda os créditos e tarifação</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-amber-400 transition-transform duration-200 ${
                  isNoticeExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isNoticeExpanded && (
              <div className="px-3.5 pb-3.5 pt-1 space-y-2 text-[11px] sm:text-xs leading-relaxed text-amber-200/90 border-t border-amber-500/15 animate-in fade-in duration-200">
                <p>
                  Esta consulta consumirá cerca de <strong className="text-amber-100">R$ 30,00</strong> em créditos na API Brasil. O valor exato pode oscilar conforme as tabelas da provedora oficial.
                </p>
                <div className="flex items-start gap-1.5 text-muted-foreground pt-1 border-t border-amber-500/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Após a emissão, o laudo fica armazenado na nuvem da AF Motos para consultas futuras instantâneas e sem custo.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Trava de Segurança por Checkbox */}
          <label
            className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              confirmedCheckbox
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-border/60 bg-muted/20 hover:bg-muted/40'
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer shrink-0"
              checked={confirmedCheckbox}
              onChange={(e) => setConfirmedCheckbox(e.target.checked)}
              disabled={isExecuting}
            />
            <span className="text-[11px] sm:text-xs font-medium text-foreground leading-snug">
              Conferi a placa <strong className="font-bold text-amber-400">{formattedPlate}</strong> e autorizo o consumo de créditos para gerar este laudo completo.
            </span>
          </label>
        </div>

        {/* Footer Actions - Fixed at Bottom */}
        <div className="p-3 sm:p-4 sm:px-6 bg-muted/20 border-t border-border/40 flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2 sm:gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isExecuting}
            className="w-full sm:w-auto rounded-xl h-10 sm:h-11 px-5 font-semibold cursor-pointer border-border text-xs sm:text-sm"
          >
            Cancelar
          </Button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmedCheckbox || isExecuting}
            className={`w-full sm:w-auto h-10 sm:h-11 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              !confirmedCheckbox || isExecuting
                ? 'opacity-50 cursor-not-allowed bg-amber-600/50 text-slate-200'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer shadow-lg shadow-amber-500/20 active:scale-[0.98]'
            }`}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Consultando bases oficiais...</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                <span>Confirmar & Consultar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

