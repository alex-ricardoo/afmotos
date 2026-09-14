'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  FileText,
  Radio,
  Undo2,
  Clock,
  AlertTriangle,
  Play,
  RefreshCw,
} from 'lucide-react';
import { type AdminPaymentItemDTO, type AuditTimelineItem } from '@/lib/admin/payments-service';
import { maskId } from '@/lib/mercadopago/observability';

interface PaymentDetailDrawerProps {
  isOpen: boolean;
  item: AdminPaymentItemDTO | null;
  onClose: () => void;
  onOpenRefund: (item: AdminPaymentItemDTO) => void;
  onOpenReprocess: (item: AdminPaymentItemDTO) => void;
  onReconcile: (item: AdminPaymentItemDTO) => void;
  isReconciling?: boolean;
}

function humanizePaymentMethod(methodId?: string | null): string {
  if (!methodId) return 'Não informado';
  const map: Record<string, string> = {
    account_money: 'Saldo Mercado Pago',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bank_transfer: 'Pix',
    ticket: 'Boleto',
    pix: 'Pix',
  };
  return map[methodId.toLowerCase()] || methodId.toUpperCase();
}

function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function PaymentDetailDrawer({
  isOpen,
  item,
  onClose,
  onOpenRefund,
  onOpenReprocess,
  onReconcile,
  isReconciling,
}: PaymentDetailDrawerProps) {
  if (!isOpen || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative h-full w-full max-w-2xl bg-[#0c0c10] border-l border-zinc-800/80 p-5 sm:p-6 overflow-y-auto text-zinc-100 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/30 shrink-0">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Transação e Consulta</h2>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black border border-zinc-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="font-mono text-xs font-black tracking-wider text-white">
                    {item.plate}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                ID Transação:{' '}
                <span className="font-mono text-zinc-300">{maskId(item.transactionId)}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar gaveta"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Banner de Ação Necessária caso haja */}
        {item.flags.requiresAttention && (
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/60 flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="block font-bold text-red-300">
                Atenção Operacional Requerida
              </strong>
              <p className="text-zinc-300 mt-0.5 leading-relaxed">{item.flags.attentionReason}</p>
            </div>
          </div>
        )}

        {/* Bloco 1: Consulta Veicular */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e3c56c] flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Dados da Consulta Veicular</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block">ID da Consulta:</span>
              <span className="font-mono text-zinc-300">{maskId(item.consultationId)}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Status da Consulta:</span>
              <span className="font-semibold text-white capitalize">{item.consultationStatus}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Laudo Entregue:</span>
              <span
                className={`font-semibold ${item.hasReportData ? 'text-emerald-400' : 'text-zinc-400'}`}
              >
                {item.hasReportData ? 'Sim (Disponível)' : 'Não'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Cliente:</span>
              <span className="font-semibold text-zinc-200">{item.customer.name}</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Pagamento Mercado Pago */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e3c56c] flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Detalhes do Pagamento</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Valor Cobrado:</span>
              <span className="font-bold text-emerald-400 text-sm">{item.amountFormatted}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Status Mercado Pago:</span>
              <span className="font-bold text-white capitalize">{item.paymentStatus}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Forma de Pagamento:</span>
              <span className="font-semibold text-zinc-200">
                {humanizePaymentMethod(item.paymentMethodId)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Data do Pagamento:</span>
              <span className="text-zinc-300 font-mono">
                {formatDateTime(item.paymentCreatedAt)}
              </span>
            </div>
            <div className="col-span-2 pt-1 border-t border-zinc-900">
              <span className="text-zinc-500 block">ID Pagamento Mercado Pago:</span>
              <span className="font-mono text-zinc-200 text-xs">
                {item.mpPaymentId || 'Não gerado / Pendente'}
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 3: API Brasil / Entrega */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e3c56c] flex items-center gap-2">
            <Radio className="h-4 w-4" />
            <span>Status Técnico da Entrega (API Brasil)</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Status da Entrega:</span>
              <span className="font-bold text-white capitalize">{item.delivery.status}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Tentativas Realizadas:</span>
              <span className="text-zinc-300 font-mono">
                {item.delivery.attemptCount} de {item.delivery.maxAttempts}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Último HTTP Status:</span>
              <span className="font-mono text-zinc-300">
                {item.delivery.lastHttpStatus ? `HTTP ${item.delivery.lastHttpStatus}` : '-'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Código da Falha:</span>
              <span
                className={`font-bold ${item.flags.isInsufficientCredits ? 'text-red-400' : 'text-zinc-300'}`}
              >
                {item.delivery.lastErrorCode || 'Nenhum'}
              </span>
            </div>
          </div>

          {item.delivery.lastErrorMessageSafe && (
            <div className="pt-2 border-t border-zinc-900 text-xs">
              <span className="text-zinc-500 block mb-1">Diagnóstico do Provedor:</span>
              <p className="text-zinc-300 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] leading-relaxed">
                {item.delivery.lastErrorMessageSafe}
              </p>
            </div>
          )}
        </div>

        {/* Bloco 4: Estorno */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e3c56c] flex items-center gap-2">
            <Undo2 className="h-4 w-4" />
            <span>Situação de Estorno</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Status do Estorno:</span>
              <span className="font-bold text-white uppercase">{item.refund.status}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Elegibilidade:</span>
              <span
                className={`font-bold ${item.flags.isRefundEligible ? 'text-emerald-400' : 'text-zinc-500'}`}
              >
                {item.flags.isRefundEligible ? 'Elegível para estorno' : 'Não elegível'}
              </span>
            </div>
            {item.refund.reasonCode && (
              <div className="col-span-2 pt-1 border-t border-zinc-900">
                <span className="text-zinc-500 block">Motivo Registrado:</span>
                <span className="text-zinc-200">
                  {item.refund.reasonSafe || item.refund.reasonCode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bloco 5: Linha do Tempo de Auditoria */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e3c56c] flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Linha do Tempo de Auditoria</span>
          </h3>

          <TimelineView transactionId={item.transactionId} />
        </div>

        {/* Ações de Rodapé (Botões Touch de Altura 44px) */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-zinc-900">
          {item.flags.isReprocessEligible && (
            <button
              type="button"
              onClick={() => onOpenReprocess(item)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-xs font-bold bg-[#c9a44c] hover:bg-[#d9b45c] text-black shadow-md transition-all cursor-pointer flex-1 sm:flex-initial"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Reprocessar Entrega</span>
            </button>
          )}

          {(item.refund.status === 'pending' || item.refund.status === 'failed') && (
            <button
              type="button"
              onClick={() => onReconcile(item)}
              disabled={isReconciling}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial"
            >
              <RefreshCw className={`h-4 w-4 ${isReconciling ? 'animate-spin' : ''}`} />
              <span>{isReconciling ? 'Sincronizando...' : 'Reconciliar no Mercado Pago'}</span>
            </button>
          )}

          {item.flags.isRefundEligible && (
            <button
              type="button"
              onClick={() => onOpenRefund(item)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.35)] transition-all cursor-pointer flex-1 sm:flex-initial"
            >
              <Undo2 className="h-4 w-4" />
              <span>Solicitar Estorno</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineView({ transactionId }: { transactionId: string }) {
  const [timeline, setTimeline] = useState<AuditTimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/admin/payments/${transactionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success && data.data?.timeline) {
            setTimeline(data.data.timeline);
          }
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          console.error('Erro ao carregar timeline:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [transactionId]);

  if (isLoading) {
    return (
      <div className="py-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-[#c9a44c]" />
        <span>Carregando histórico de auditoria...</span>
      </div>
    );
  }

  if (timeline.length === 0) {
    return <p className="text-xs text-zinc-500">Nenhum evento registrado nesta transação.</p>;
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
      {timeline.map((event) => (
        <div key={event.id} className="relative text-xs space-y-1">
          <span className="absolute -left-6 top-1.5 h-2 w-2 rounded-full bg-[#c9a44c]" />
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>{new Date(event.timestamp).toLocaleString('pt-BR')}</span>
            <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400">
              ator: {event.actorType}
            </span>
          </div>
          <p className="font-semibold text-zinc-200">{event.summary}</p>
        </div>
      ))}
    </div>
  );
}
