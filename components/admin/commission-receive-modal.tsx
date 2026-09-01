'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, CircleDollarSign, Loader2, Calendar, CreditCard, FileText } from 'lucide-react';
import { receiveCommissionAction } from '@/lib/actions/commissions';
import { ProposalCommissionRecord } from '@/types/commission';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CommissionReceiveModalProps {
  commission: ProposalCommissionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: ProposalCommissionRecord) => void;
}

export function CommissionReceiveModal({
  commission,
  open,
  onOpenChange,
  onSuccess,
}: CommissionReceiveModalProps) {
  const initialValue =
    commission?.commission_confirmed_value ?? commission?.commission_expected_value ?? 0;

  const [receivedValue, setReceivedValue] = useState<number>(initialValue);
  const [receivedAt, setReceivedAt] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (commission) {
      setReceivedValue(
        commission.commission_confirmed_value ?? commission.commission_expected_value ?? 0,
      );
    }
  }, [commission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commission) return;

    if (receivedValue <= 0) {
      setError('O valor recebido deve ser maior que zero.');
      return;
    }

    if (!paymentMethod.trim()) {
      setError('Informe a forma de recebimento.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await receiveCommissionAction({
        id: commission.id,
        received_value: Number(receivedValue),
        received_at: receivedAt,
        received_payment_method: paymentMethod.trim(),
        received_reference: reference.trim() || null,
        notes: notes.trim() || null,
      });

      if (!res.success || !res.commission) {
        throw new Error(res.error || 'Falha ao registrar recebimento.');
      }

      toast.success('Recebimento de comissão registrado com sucesso!');
      onSuccess(res.commission);
      onOpenChange(false);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Erro ao registrar baixa.');
      toast.error('Erro ao baixar comissão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800/80 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <CheckCircle2 className="size-5 text-emerald-400" />
            Registrar Recebimento de Comissão
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Realiza a baixa financeira da comissão no caixa da AF Motos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="received-value" className="flex items-center gap-1.5 text-xs text-zinc-300">
              <CircleDollarSign className="size-3.5 text-emerald-400" />
              Valor Efetivamente Recebido (R$)
            </Label>
            <Input
              id="received-value"
              type="number"
              step={0.01}
              min={0.01}
              value={receivedValue}
              onChange={(e) => setReceivedValue(Number(e.target.value || 0))}
              className="h-10 bg-zinc-900 border-zinc-800 font-mono font-bold text-emerald-400 focus:border-emerald-500/50"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="received-date" className="flex items-center gap-1.5 text-xs text-zinc-300">
                <Calendar className="size-3.5 text-zinc-400" />
                Data de Recebimento
              </Label>
              <Input
                id="received-date"
                type="date"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
                className="h-10 bg-zinc-900 border-zinc-800 text-xs focus:border-zinc-700"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment-method" className="flex items-center gap-1.5 text-xs text-zinc-300">
                <CreditCard className="size-3.5 text-zinc-400" />
                Forma de Pagamento
              </Label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              >
                <option value="PIX">PIX</option>
                <option value="TED">Transferência TED / DOC</option>
                <option value="DINHEIRO">Dinheiro em Espécie</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="OUTRO">Outro Método</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reference" className="flex items-center gap-1.5 text-xs text-zinc-300">
              <FileText className="size-3.5 text-zinc-400" />
              Referência / ID do Comprovante (Opcional)
            </Label>
            <Input
              id="reference"
              placeholder="Ex.: ID transação PIX ou Nº Recibo"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-10 bg-zinc-900 border-zinc-800 text-xs focus:border-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs text-zinc-300">
              Observações Internas
            </Label>
            <Textarea
              id="notes"
              placeholder="Anotações adicionais sobre o recebimento..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-xs resize-none focus:border-zinc-700"
            />
          </div>

          {error && (
            <Alert className="border-red-500/30 bg-red-500/10 text-red-200 py-2 rounded-xl">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-2 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  Confirmar Recebimento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
