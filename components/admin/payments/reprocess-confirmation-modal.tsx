'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Play, Loader2, Check } from 'lucide-react';
import { type AdminPaymentItemDTO } from '@/lib/admin/payments-service';

interface ReprocessConfirmationModalProps {
  isOpen: boolean;
  item: AdminPaymentItemDTO | null;
  onClose: () => void;
  onConfirmReprocess: (params: {
    transactionId: string;
    confirmProviderFunded: boolean;
    adminNote?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function ReprocessConfirmationModal({
  isOpen,
  item,
  onClose,
  onConfirmReprocess,
  isSubmitting,
}: ReprocessConfirmationModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reprocess-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <ReprocessDialogContent
        key={item.transactionId}
        item={item}
        onClose={onClose}
        onConfirmReprocess={onConfirmReprocess}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

function ReprocessDialogContent({
  item,
  onClose,
  onConfirmReprocess,
  isSubmitting,
}: {
  item: AdminPaymentItemDTO;
  onClose: () => void;
  onConfirmReprocess: (params: {
    transactionId: string;
    confirmProviderFunded: boolean;
    adminNote?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const [confirmFunded, setConfirmFunded] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isInsufficientCredits = item.flags.isInsufficientCredits;
  const canSubmit = (!isInsufficientCredits || confirmFunded) && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setErrorMsg(null);
    try {
      await onConfirmReprocess({
        transactionId: item.transactionId,
        confirmProviderFunded: confirmFunded,
        adminNote: adminNote.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao reprocessar entrega.';
      setErrorMsg(message);
    }
  };

  return (
    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#c9a44c]/40 bg-[#0d0d12] p-6 text-zinc-100 shadow-[0_0_50px_rgba(201,164,76,0.15)]">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/30">
            <Play className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h2 id="reprocess-modal-title" className="text-base font-bold text-white">
              Reprocessar Entrega de Laudo
            </h2>
            <p className="text-xs text-zinc-400">
              Executa uma nova tentativa de consulta na API Brasil.
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
            <span>Placa:</span>
            <span className="font-mono font-bold text-white">{item.plate}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Status do Laudo:</span>
            <span className="font-semibold text-zinc-300 capitalize">{item.delivery.status}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Tentativas Anteriores:</span>
            <span className="font-mono text-zinc-300">{item.delivery.attemptCount}</span>
          </div>
          {item.delivery.lastErrorCode && (
            <div className="flex items-center justify-between text-zinc-400">
              <span>Último Erro:</span>
              <span className="font-mono text-rose-400 font-medium">
                {item.delivery.lastErrorCode}
              </span>
            </div>
          )}
        </div>

        {/* Alerta de Saldo / Créditos API Brasil */}
        {isInsufficientCredits ? (
          <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-4 space-y-3">
            <div className="flex items-start gap-2 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>
                Esta consulta falhou por{' '}
                <strong>saldo insuficiente na API Brasil (HTTP 402)</strong>. Antes de reprocessar,
                confirme se os créditos foram recarregados no painel da API Brasil.
              </span>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-rose-900/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmFunded}
                onChange={(e) => setConfirmFunded(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-rose-700 bg-zinc-900 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs font-semibold text-rose-200">
                Confirmo que recarreguei os créditos da API Brasil e desejo retentar a consulta
                agora.
              </span>
            </label>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3.5 text-xs text-zinc-400">
            Uma nova requisição será despachada imediatamente ao provedor veicular. O resultado
            atualizará o status da consulta e o laudo ficará disponível ao cliente.
          </div>
        )}

        {/* Nota Opcional */}
        <div className="space-y-1.5">
          <label htmlFor="reprocess-admin-note" className="text-xs font-semibold text-zinc-300">
            Nota Administrativa <span className="text-zinc-500 font-normal">(opcional)</span>
          </label>
          <textarea
            id="reprocess-admin-note"
            rows={2}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Ex.: Recarga efetuada via Pix; reprocessando consulta..."
            disabled={isSubmitting}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#c9a44c] resize-none"
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#c9a44c] hover:bg-[#d9b45c] text-black shadow-[0_0_20px_rgba(201,164,76,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Consultando API Brasil...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Confirmar Reprocessamento</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
