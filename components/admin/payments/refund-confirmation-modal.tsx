'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, ShieldAlert, Check, Loader2 } from 'lucide-react';
import { type AdminPaymentItemDTO } from '@/lib/admin/payments-service';
import { maskId } from '@/lib/mercadopago/observability';

interface RefundConfirmationModalProps {
  isOpen: boolean;
  item: AdminPaymentItemDTO | null;
  onClose: () => void;
  onConfirmRefund: (params: {
    transactionId: string;
    reasonCode: string;
    adminNote?: string;
    confirmationText: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const REASON_OPTIONS = [
  { value: 'APIBRASIL_INSUFFICIENT_CREDITS', label: 'Saldo insuficiente na API Brasil (HTTP 402)' },
  { value: 'APIBRASIL_PROVIDER_UNAVAILABLE', label: 'Provedor indisponível / Timeout persistente' },
  { value: 'APIBRASIL_RETRIES_EXHAUSTED', label: 'Tentativas de entrega esgotadas' },
  { value: 'APIBRASIL_AUTH_ERROR', label: 'Erro de autenticação no provedor' },
  { value: 'LAUDO_NAO_ENTREGAVEL', label: 'Dados veiculares não encontrados / Inexistentes' },
  { value: 'DECISAO_MANUAL_SUPORTE', label: 'Decisão do suporte ao cliente (WhatsApp)' },
  { value: 'OUTRO', label: 'Outro motivo (requer nota administrativa)' },
];

export function RefundConfirmationModal({
  isOpen,
  item,
  onClose,
  onConfirmRefund,
  isSubmitting,
}: RefundConfirmationModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <RefundDialogContent
        key={item.transactionId}
        item={item}
        onClose={onClose}
        onConfirmRefund={onConfirmRefund}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

function RefundDialogContent({
  item,
  onClose,
  onConfirmRefund,
  isSubmitting,
}: {
  item: AdminPaymentItemDTO;
  onClose: () => void;
  onConfirmRefund: (params: {
    transactionId: string;
    reasonCode: string;
    adminNote?: string;
    confirmationText: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const [reasonCode, setReasonCode] = useState(
    item.flags.isInsufficientCredits ? 'APIBRASIL_INSUFFICIENT_CREDITS' : 'DECISAO_MANUAL_SUPORTE',
  );
  const [adminNote, setAdminNote] = useState('');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  const isConfirmationValid = confirmationInput.trim() === 'ESTORNAR';
  const isNoteValid = reasonCode !== 'OUTRO' || adminNote.trim().length >= 10;
  const canSubmit = isConfirmationValid && isNoteValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setErrorMsg(null);
    try {
      await onConfirmRefund({
        transactionId: item.transactionId,
        reasonCode,
        adminNote: adminNote.trim() || undefined,
        confirmationText: confirmationInput.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao processar estorno.';
      setErrorMsg(message);
    }
  };

  return (
    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-rose-900/60 bg-[#0d0d12] p-6 text-zinc-100 shadow-[0_0_50px_rgba(244,63,94,0.15)]">
      {/* Header com Alerta */}
      <div className="flex items-start justify-between pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 id="refund-modal-title" className="text-base font-bold text-white">
              Confirmar Estorno Manual
            </h2>
            <p className="text-xs text-zinc-400">
              Esta ação devolverá o valor integral via Mercado Pago.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Resumo da Transação */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Placa Consultada:</span>
            <span className="font-mono font-bold text-white">{item.plate}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Valor a Estornar:</span>
            <span className="font-bold text-rose-400 text-sm">{item.amountFormatted}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>ID Mercado Pago:</span>
            <span className="font-mono text-zinc-300">
              {item.mpPaymentId ? maskId(item.mpPaymentId) : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Cliente:</span>
            <span className="text-zinc-300 truncate max-w-[200px]">
              {item.customer.name || item.customer.phone || 'Anônimo'}
            </span>
          </div>
        </div>

        {/* Motivo do Estorno */}
        <div className="space-y-1.5">
          <label htmlFor="reason-code-select" className="text-xs font-semibold text-zinc-300">
            Motivo do Estorno <span className="text-rose-400">*</span>
          </label>
          <select
            id="reason-code-select"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nota Administrativa */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="admin-note-input" className="text-xs font-semibold text-zinc-300">
              Nota Administrativa{' '}
              {reasonCode === 'OUTRO' && <span className="text-rose-400">* (mín. 10 chars)</span>}
            </label>
            <span className="text-[10px] text-zinc-500">Auditoria interna</span>
          </div>
          <textarea
            id="admin-note-input"
            rows={2}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Descreva o contexto do estorno para o histórico..."
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Alerta de Verificação de Texto */}
        <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-4 space-y-3">
          <div className="flex items-start gap-2 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>
              Para prevenir estornos acidentais, digite exatamente{' '}
              <strong className="text-rose-400 font-mono underline">ESTORNAR</strong> abaixo:
            </span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="Digite ESTORNAR"
            autoComplete="off"
            className="w-full rounded-xl bg-black/60 border border-rose-900/60 px-3 py-2 font-mono text-sm font-bold text-rose-200 placeholder:text-zinc-700 tracking-wider focus:outline-none focus:border-rose-400"
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando ao Mercado Pago...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Confirmar estorno de {item.amountFormatted}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
