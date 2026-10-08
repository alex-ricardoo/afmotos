'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import {
  Coins,
  CheckSquare,
  Loader2,
  ShieldAlert,
  X,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
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
  storeName?: string;
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
  storeName = 'AF Veículos PE',
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
        className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-950 border border-border/80 shadow-2xl animate-in zoom-in-95 duration-200"
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
              <h3 id="modal-title" className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                Confirmar Consulta Veicular Oficial
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                Bases oficiais Senatran e Detran para qualquer veículo no Brasil.
              </p>
            </div>
          </div>

          {!isExecuting && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar"
              className="p-2 -mr-1 -mt-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Grid de Resumo da Consulta com Placa em Destaque */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between py-1 border-b border-zinc-800/80 gap-2">
              <span className="text-zinc-400 text-xs font-medium">Placa a consultar:</span>
              <div className="inline-flex items-center gap-2 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-[#c9a44c]/40 rounded-xl px-3 py-1 shadow-inner">
                <span className="text-[10px] font-bold text-zinc-400">BR</span>
                <span className="h-3 w-[1px] bg-zinc-700" />
                <span className="font-mono font-black text-sm sm:text-base text-[#c9a44c] tracking-widest">
                  {formattedPlate}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-800/80 gap-2">
              <span className="text-zinc-400 text-xs">Serviço:</span>
              <span className="font-semibold text-white text-right text-xs">Veículos Total (Bases Nacionais)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-800/80 gap-2">
              <span className="text-zinc-400 text-xs">Custo Requisição:</span>
              <span className="font-bold text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-right">
                {displayCost}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 gap-2">
              <span className="text-zinc-400 text-xs">Armazenamento:</span>
              <span className="font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-right">
                Cache Permanente (R$ 0,00)
              </span>
            </div>
          </div>

          {/* Card de Orientações Obrigatórias de Tempo e Segurança (Requisito 1 UX) */}
          <div className="rounded-xl sm:rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 space-y-2.5 text-amber-200">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Tempo de Processamento Oficial</span>
            </div>
            <div className="space-y-1.5 text-[11px] sm:text-xs leading-relaxed text-zinc-300">
              <p>
                • <strong className="text-amber-200">Tempo esperado:</strong> O retorno normalmente leva entre <strong>45 e 90 segundos</strong>.
              </p>
              <p>
                • <strong className="text-amber-200">Limite máximo:</strong> Em alguns casos, pode levar até <strong>2 minutos</strong>.
              </p>
              <p>
                • <strong className="text-amber-200">Orientação:</strong> Mantenha esta tela aberta enquanto buscamos as informações.
              </p>
              <p className="text-amber-300 font-semibold pt-1">
                ⚠️ Evite recarregar a página, voltar no navegador ou iniciar outra consulta para a mesma placa.
              </p>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-amber-500/20 text-[11px] text-zinc-400">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Para evitar cobrança duplicada, o sistema bloqueia novas consultas para esta placa enquanto esta estiver em andamento.
              </span>
            </div>
          </div>

          {/* Collapse / Accordion de Detalhes de Créditos */}
          <div className="rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsNoticeExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-900/80 transition-colors cursor-pointer gap-2"
              aria-expanded={isNoticeExpanded}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Entenda os créditos e tarifação</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                  isNoticeExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isNoticeExpanded && (
              <div className="px-3.5 pb-3.5 pt-1 space-y-2 text-[11px] sm:text-xs leading-relaxed text-zinc-300 border-t border-zinc-800/80 animate-in fade-in duration-200">
                <p>
                  Esta consulta consumirá cerca de <strong className="text-amber-300">R$ 30,00</strong> em créditos na API Brasil. O valor exato pode oscilar conforme as tabelas da provedora oficial.
                </p>
                <div className="flex items-start gap-1.5 text-zinc-400 pt-1 border-t border-zinc-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Após a emissão, o laudo fica armazenado na nuvem da {storeName} para consultas futuras instantâneas e sem custo.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Checkbox Obrigatório conforme Requisito 1 de UX */}
          <label
            className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer select-none ${
              confirmedCheckbox
                ? 'border-[#c9a44c]/60 bg-[#c9a44c]/10 shadow-sm ring-1 ring-[#c9a44c]/30'
                : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60'
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-zinc-700 text-[#c9a44c] focus:ring-[#c9a44c] accent-[#c9a44c] cursor-pointer shrink-0"
              checked={confirmedCheckbox}
              onChange={(e) => setConfirmedCheckbox(e.target.checked)}
              disabled={isExecuting}
            />
            <span className="text-[11px] sm:text-xs font-semibold text-white leading-snug">
              Entendi que devo aguardar nesta tela durante o processamento.
            </span>
          </label>
        </div>

        {/* Footer Actions - Fixed at Bottom */}
        <div className="p-3 sm:p-4 sm:px-6 bg-zinc-900/60 border-t border-zinc-800/80 flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2 sm:gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isExecuting}
            className="w-full sm:w-auto rounded-xl h-10 sm:h-11 px-5 font-semibold cursor-pointer border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs sm:text-sm"
          >
            Cancelar
          </Button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmedCheckbox || isExecuting}
            className={`w-full sm:w-auto h-10 sm:h-11 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              !confirmedCheckbox || isExecuting
                ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500 border border-zinc-700'
                : 'bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:brightness-110 text-zinc-950 font-bold cursor-pointer shadow-lg shadow-[#c9a44c]/20 active:scale-[0.98]'
            }`}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Iniciando consulta oficial...</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                <span>Iniciar consulta oficial</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
