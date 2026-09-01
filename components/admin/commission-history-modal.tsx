'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, Loader2, User, Clock, ArrowRight } from 'lucide-react';
import { getCommissionAuditLogsAction } from '@/lib/actions/commissions';
import { ProposalCommissionAuditLogRecord } from '@/types/commission';
import { formatCurrencyBRL } from '@/lib/reports/formatters';

interface CommissionHistoryModalProps {
  commissionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommissionHistoryModal({
  commissionId,
  open,
  onOpenChange,
}: CommissionHistoryModalProps) {
  const [logs, setLogs] = useState<ProposalCommissionAuditLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && commissionId) {
      setLoading(true);
      setError(null);
      getCommissionAuditLogsAction(commissionId)
        .then((res) => {
          if (res.success && res.logs) {
            setLogs(res.logs);
          } else {
            setError(res.error || 'Não foi possível carregar o histórico.');
          }
        })
        .catch((err) => setError(err.message || 'Erro ao buscar dados.'))
        .finally(() => setLoading(false));
    }
  }, [open, commissionId]);

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return { label: 'Criação Inicial', variant: 'outline' as const };
      case 'updated':
        return { label: 'Valores Alterados', variant: 'secondary' as const };
      case 'confirmed':
        return { label: 'Comissão Confirmada', variant: 'default' as const };
      case 'received':
        return { label: 'Recebimento / Baixa', variant: 'default' as const };
      case 'cancelled':
        return { label: 'Cancelada', variant: 'destructive' as const };
      case 'voided':
        return { label: 'Anulada / Estorno', variant: 'destructive' as const };
      default:
        return { label: action, variant: 'outline' as const };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b border-zinc-800/80 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <History className="size-5 text-amber-400" />
            Histórico e Auditoria da Comissão
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Registro cronológico imutável de todas as alterações, cálculos e justificativas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-400 gap-2">
              <Loader2 className="size-6 animate-spin text-amber-400" />
              <span className="text-xs">Carregando histórico...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs">
              Nenhuma alteração registrada até o momento.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-800">
              {logs.map((log) => {
                const actionInfo = getActionLabel(log.action);
                const prev = log.previous_snapshot as Record<string, any> | null;
                const curr = log.new_snapshot as Record<string, any>;

                return (
                  <div key={log.id} className="relative space-y-1.5 text-xs">
                    {/* Bullet pointer */}
                    <div className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-amber-400 ring-4 ring-zinc-950" />

                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={actionInfo.variant} className="text-[10px] uppercase font-mono px-1.5 py-0">
                        {actionInfo.label}
                      </Badge>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                        <Clock className="size-3" />
                        {format(new Date(log.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Snapshot comparison */}
                    <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                      {prev ? (
                        <div className="flex items-center gap-2 text-zinc-300 font-mono text-[11px]">
                          <span className="text-zinc-500">
                            {formatCurrencyBRL(prev.commission_confirmed_value || prev.commission_expected_value || 0)}
                          </span>
                          <ArrowRight className="size-3 text-zinc-600" />
                          <span className="font-bold text-amber-300">
                            {formatCurrencyBRL(curr.commission_confirmed_value || curr.commission_expected_value || 0)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-zinc-300 font-mono text-[11px]">
                          Valor inicial:{' '}
                          <span className="font-bold text-emerald-400">
                            {formatCurrencyBRL(curr.commission_expected_value || 0)}
                          </span>
                        </div>
                      )}

                      {log.reason && (
                        <p className="text-[11px] text-zinc-400 italic pt-0.5 border-t border-zinc-800/50">
                          &quot;{log.reason}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
