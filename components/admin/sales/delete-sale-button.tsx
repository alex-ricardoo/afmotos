'use client';

import React, { useState, useTransition } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { deleteSaleAction } from '@/lib/actions/sales';
import { buttonVariants } from '@/components/ui/button';

interface DeleteSaleButtonProps {
  saleId: string;
  motorcycleId?: string | null;
  receiptNumber?: string | null;
  /** Quando true, exibe o label textual além do ícone (modo card) */
  showLabel?: boolean;
}

export function DeleteSaleButton({
  saleId,
  motorcycleId,
  receiptNumber,
  showLabel = false,
}: DeleteSaleButtonProps) {
  const [open, setOpen] = useState(false);
  const [revert, setRevert] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteSaleAction(saleId, motorcycleId ?? undefined, revert);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Excluir Venda"
        className={buttonVariants({
          variant: 'ghost',
          size: showLabel ? 'sm' : 'icon-sm',
          className: showLabel
            ? 'h-10 rounded-xl text-xs font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center justify-center gap-1.5 cursor-pointer w-full'
            : 'rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 cursor-pointer',
        })}
      >
        <Trash2 className={showLabel ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5'} />
        {showLabel && <span>Excluir</span>}
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.65)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setOpen(false);
          }}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Excluir Venda</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {receiptNumber ? (
                    <>
                      Recibo <span className="font-mono text-amber-400">{receiptNumber}</span>
                    </>
                  ) : (
                    'Esta ação não pode ser desfeita.'
                  )}
                </p>
              </div>
            </div>

            {/* Body */}
            <p className="text-sm text-zinc-300 leading-relaxed">
              Tem certeza que deseja excluir permanentemente este registro de venda?
            </p>

            {/* Option: revert moto status */}
            {motorcycleId && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={revert}
                  onChange={(e) => setRevert(e.target.checked)}
                  disabled={isPending}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  Reverter motocicleta para{' '}
                  <span className="font-semibold text-emerald-400">Disponível</span>
                </span>
              </label>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 h-10 rounded-xl text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 h-10 rounded-xl text-sm font-bold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Venda</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
