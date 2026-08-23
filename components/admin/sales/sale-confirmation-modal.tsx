'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BadgeCheck, FileText, Check, ArrowRight } from 'lucide-react';

interface SaleConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorcycleTitle: string;
  onRegisterSale: () => void;
  onSaveStatusOnly: () => void;
  loading?: boolean;
}

export function SaleConfirmationModal({
  open,
  onOpenChange,
  motorcycleTitle,
  onRegisterSale,
  onSaveStatusOnly,
  loading = false,
}: SaleConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border p-6 rounded-2xl">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <BadgeCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-foreground">
            Registrar Venda da Moto?
          </DialogTitle>
          <DialogDescription className="text-sm text-center text-muted-foreground leading-relaxed">
            Você está marcando <strong className="text-foreground">{motorcycleTitle}</strong> como{' '}
            <span className="text-amber-500 font-semibold">Vendida</span>. Deseja registrar os
            detalhes completos da venda e gerar o recibo agora?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 rounded-xl p-4 border border-border/60 my-2 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Benefícios de registrar a venda:</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc">
            <li>Histórico completo de compradores e valores negociados</li>
            <li>Geração instantânea de Recibo PDF com dados da loja</li>
            <li>Métricas consolidadas de faturamento no Dashboard</li>
          </ul>
        </div>

        <DialogFooter className="flex flex-col sm:flex-col gap-2.5 pt-2">
          <Button
            type="button"
            onClick={onRegisterSale}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold h-12 rounded-xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Preencher Dados da Venda</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onSaveStatusOnly}
            disabled={loading}
            className="w-full h-11 rounded-xl text-xs font-semibold border-border hover:bg-muted cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            Salvar apenas como vendida (sem recibo)
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
