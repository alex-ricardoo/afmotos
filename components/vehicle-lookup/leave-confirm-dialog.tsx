'use client';

import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface LeaveConfirmDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onStay: () => void;
  onLeave?: () => void;
  onConfirmLeave?: () => void;
  onOpenChange?: (open: boolean) => void;
  plateDisplay?: string;
}

export function LeaveConfirmDialog({
  isOpen,
  open,
  onStay,
  onLeave,
  onConfirmLeave,
  onOpenChange,
  plateDisplay,
}: LeaveConfirmDialogProps) {
  const isCurrentlyOpen = open !== undefined ? open : (isOpen ?? false);
  const handleLeave = onConfirmLeave || onLeave || onStay;

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    }
    if (!nextOpen) {
      onStay();
    }
  };

  return (
    <Dialog open={isCurrentlyOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[94vw] max-w-md rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-zinc-950 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        aria-describedby="leave-confirm-description"
      >
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
                Consulta em andamento
              </DialogTitle>
              {plateDisplay && (
                <p className="text-xs font-mono font-semibold text-amber-400 mt-0.5">
                  Placa: {plateDisplay}
                </p>
              )}
            </div>
          </div>

          <DialogDescription
            id="leave-confirm-description"
            className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-2 pt-1"
          >
            <span>
              Ainda estamos consultando as fontes oficiais para esta placa.
            </span>
            <span className="block text-zinc-300">
              Sair agora encerra apenas o acompanhamento nesta tela. Ao retornar, consulte o histórico para verificar o andamento.
            </span>
            <span className="block font-semibold text-amber-300/90 pt-1">
              Para evitar cobrança duplicada, não inicie uma nova consulta para esta placa.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-[11px] text-zinc-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Assim que a consulta for concluída, o resultado será exibido nesta tela. Se você sair, poderá acompanhar o status pelo histórico ao retornar.
          </span>
        </div>

        <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleLeave}
            className="w-full sm:w-auto h-10 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/80 font-medium cursor-pointer"
          >
            Sair da tela
          </Button>

          <Button
            type="button"
            onClick={onStay}
            autoFocus
            className="w-full sm:w-auto h-10 sm:h-11 px-5 rounded-xl bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:brightness-110 text-zinc-950 font-bold text-xs sm:text-sm shadow-lg shadow-[#c9a44c]/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continuar aguardando</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
