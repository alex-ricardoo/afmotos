'use client';

import React, { useState } from 'react';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { AlertCircle, CheckSquare, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConsultationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedPlate: string) => Promise<void>;
  plate: string;
  isMockMode: boolean;
  isExecuting: boolean;
}

export function ConsultationConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  plate,
  isMockMode,
  isExecuting,
}: ConsultationConfirmModalProps) {
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const formattedPlate = formatBrazilianPlate(plate);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!confirmedCheckbox || isExecuting) return;
    await onConfirm(formattedPlate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card border border-border/80 shadow-2xl p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              Confirmar consulta veicular paga
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Verifique a placa com atenção antes de continuar a execução.
            </p>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3 mb-5">
          <div className="flex items-center justify-between text-sm py-1 border-b border-border/40">
            <span className="text-muted-foreground">Placa a consultar:</span>
            <span className="font-mono font-bold text-base text-foreground tracking-wider bg-background px-2 py-0.5 rounded border">
              {formattedPlate}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm py-1 border-b border-border/40">
            <span className="text-muted-foreground">Tipo de consulta:</span>
            <span className="font-medium text-foreground">Histórico Veicular Completo (Veículos Total)</span>
          </div>
          <div className="flex items-center justify-between text-sm py-1 border-b border-border/40">
            <span className="text-muted-foreground">Custo estimado:</span>
            <span className="font-bold text-foreground">
              {isMockMode ? 'R$ 0,00 (Ambiente de Teste)' : 'R$ 30,00'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm py-1">
            <span className="text-muted-foreground">Modo do sistema:</span>
            <span className={`font-semibold ${isMockMode ? 'text-amber-500' : 'text-blue-500'}`}>
              {isMockMode ? 'Consulta Simulada (Mock)' : 'Consulta Oficial (Live)'}
            </span>
          </div>
        </div>

        {/* Informative text */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-5">
          {isMockMode ? (
            <span className="text-amber-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> O modo de simulação está ativo. Nenhum crédito real será consumido da conta da AF Motos.
            </span>
          ) : (
            'Esta consulta consumirá saldo da conta corporativa da AF Motos. O laudo resultante ficará salvo no sistema e poderá ser visualizado, baixado ou impresso novamente sem uma nova cobrança.'
          )}
        </p>

        {/* Obligatory Checkbox */}
        <label className="flex items-start gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors mb-6 select-none">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
            checked={confirmedCheckbox}
            onChange={(e) => setConfirmedCheckbox(e.target.checked)}
            disabled={isExecuting}
          />
          <span className="text-xs font-medium text-foreground leading-tight">
            Conferi a placa <strong>{formattedPlate}</strong> e entendo que esta consulta poderá gerar cobrança e ficará gravada no histórico.
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExecuting}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmedCheckbox || isExecuting}
            className="rounded-xl font-semibold gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                Confirmar e Consultar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
