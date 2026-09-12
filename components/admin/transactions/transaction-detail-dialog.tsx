'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  RefreshCw,
  CreditCard,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { retryPaymentRefundAction, reconcilePaymentWithMercadoPagoAction } from '@/lib/admin/transaction-actions';

interface TransactionDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  detail: any;
  onRefresh: () => void;
}

export function TransactionDetailDialog({
  isOpen,
  onClose,
  detail,
  onRefresh,
}: TransactionDetailDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!detail) return null;

  const { transaction, consultation, customer, timeline } = detail;

  const handleRetryRefund = () => {
    startTransition(async () => {
      try {
        const res = await retryPaymentRefundAction(transaction.id, 'Retentativa manual via modal');
        if (res.success) {
          toast.success('Estorno processado com sucesso no Mercado Pago!');
          onRefresh();
          onClose();
        } else {
          toast.error(res.error || 'Falha ao processar estorno.');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Erro inesperado ao tentar estorno.');
      }
    });
  };

  const handleReconcile = () => {
    if (!transaction.mp_payment_id) {
      toast.error('Transação sem ID do Mercado Pago.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await reconcilePaymentWithMercadoPagoAction(transaction.mp_payment_id);
        if (res.success) {
          toast.success(`Sincronizado! Status atual no MP: ${res.updatedStatus}`);
          onRefresh();
        } else {
          toast.error(res.error || 'Falha ao sincronizar.');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao sincronizar.');
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-950 border border-zinc-800 text-zinc-100">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <span>Transação {transaction.mp_payment_id ? `#${transaction.mp_payment_id}` : transaction.id.slice(0, 8)}</span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {consultation?.plate || 'S/ Placa'}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-1">
                Criada em {new Date(transaction.created_at).toLocaleString('pt-BR')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Status and Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <span className="text-[11px] text-zinc-400 block">Status Pagamento</span>
              <span className="text-sm font-semibold capitalize text-white">
                {transaction.status}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <span className="text-[11px] text-zinc-400 block">Valor</span>
              <span className="text-sm font-semibold text-amber-400">
                {Number(transaction.transaction_amount).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <span className="text-[11px] text-zinc-400 block">Meio de Pagamento</span>
              <span className="text-sm font-semibold text-zinc-200 uppercase">
                {transaction.payment_method_id || '---'}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <span className="text-[11px] text-zinc-400 block">Status Estorno</span>
              <span
                className={`text-sm font-semibold capitalize ${
                  transaction.refund_status === 'refunded'
                    ? 'text-emerald-400'
                    : transaction.refund_status === 'failed'
                    ? 'text-red-400'
                    : 'text-zinc-400'
                }`}
              >
                {transaction.refund_status}
              </span>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2 text-xs">
            <h4 className="font-semibold text-zinc-200 text-sm mb-2">Dados do Pagador</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
              <div><strong>Nome:</strong> {customer?.full_name || 'Não informado'}</div>
              <div><strong>E-mail:</strong> {transaction.payer_email || customer?.email || 'Não informado'}</div>
              <div><strong>Parcelas:</strong> {transaction.installments}x</div>
              <div><strong>ID Mercado Pago:</strong> {transaction.mp_payment_id || 'Não gerado'}</div>
              {transaction.refund_reason && (
                <div className="sm:col-span-2 text-amber-400/90">
                  <strong>Motivo de Estorno:</strong> {transaction.refund_reason}
                </div>
              )}
            </div>
          </div>

          {/* Consultation Info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2 text-xs">
            <h4 className="font-semibold text-zinc-200 text-sm mb-2">Status da Consulta Veicular</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
              <div><strong>Status:</strong> {consultation?.status}</div>
              <div><strong>Pagamento Consulta:</strong> {consultation?.payment_status}</div>
              {consultation?.lookup_error_message && (
                <div className="sm:col-span-2 text-red-400">
                  <strong>Erro na Consulta:</strong> {consultation.lookup_error_message}
                </div>
              )}
            </div>
          </div>

          {/* Timeline of Audit Events */}
          <div>
            <h4 className="font-semibold text-zinc-200 text-sm mb-3">Linha do Tempo de Auditoria</h4>
            {timeline.length === 0 ? (
              <p className="text-xs text-zinc-500">Nenhum evento registrado no log de auditoria.</p>
            ) : (
              <div className="space-y-2 border-l-2 border-zinc-800 pl-4 ml-2">
                {timeline.map((log: any) => (
                  <div key={log.id} className="relative text-xs space-y-0.5">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span className="font-semibold text-zinc-200 uppercase tracking-wide">
                        {log.event.replace(/_/g, ' ')}
                      </span>
                      <span>{new Date(log.created_at).toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <p className="text-zinc-400">
                      Ator: <span className="text-zinc-300 font-medium">{log.actor_type}</span>
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="text-[10px] bg-zinc-900 p-2 rounded text-zinc-400 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 pt-4">
            {transaction.mp_payment_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReconcile}
                disabled={isPending}
                className="text-xs border-zinc-700 hover:bg-zinc-800"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPending ? 'animate-spin' : ''}`} />
                Sincronizar com Mercado Pago
              </Button>
            )}

            {(transaction.refund_status === 'failed' || (transaction.status === 'approved' && consultation?.status !== 'completed')) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRetryRefund}
                disabled={isPending}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Retentar Estorno Manual
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
