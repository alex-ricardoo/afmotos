'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Loader2, Bike } from 'lucide-react';
import { deleteSaleAction } from '@/lib/actions/sales';
import { toast } from 'sonner';
import { SaleWithDetails } from '@/lib/queries/sales';
import { formatCurrency } from '@/lib/utils/formatters';

export interface DeleteSaleTarget {
  id: string;
  motorcycle_id?: string | null;
  receipt_number?: string | null;
  buyer_name?: string | null;
  sale_price?: number | null;
  motorcycle?: {
    brand?: string;
    model?: string;
    version?: string | null;
    year_model?: number | null;
  } | null;
}

interface DeleteSaleModalProps {
  sale: DeleteSaleTarget | SaleWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteSaleModal({
  sale,
  isOpen,
  onClose,
  onSuccess,
}: DeleteSaleModalProps) {
  const router = useRouter();
  const [revertMoto, setRevertMoto] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !sale) return null;

  const moto = sale.motorcycle;

  function handleDelete() {
    if (!sale) return;
    setError(null);

    startTransition(async () => {
      const result = await deleteSaleAction(
        sale.id,
        sale.motorcycle_id || undefined,
        revertMoto,
      );

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success(
          sale.receipt_number
            ? `Venda (${sale.receipt_number}) excluída com sucesso!`
            : 'Registro de venda excluído com sucesso!',
        );
        onClose();
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Excluir Venda</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {sale.receipt_number ? (
                <>
                  Recibo <span className="font-mono text-[#e3c56c] font-bold">{sale.receipt_number}</span>
                </>
              ) : (
                'Esta ação é permanente e não poderá ser desfeita.'
              )}
            </p>
          </div>
        </div>

        {/* Resumo do Veículo & Comprador */}
        {(moto || sale.buyer_name || sale.sale_price) && (
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2 text-xs">
            {moto && (
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-[#c9a44c] shrink-0" />
                <span className="font-bold text-zinc-200 truncate">
                  {moto.brand} {moto.model} {moto.version || ''}
                </span>
                {moto.year_model && (
                  <span className="text-zinc-500 font-mono">({moto.year_model})</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/50 text-zinc-400">
              <div>
                <span>Comprador: </span>
                <strong className="text-zinc-200 block truncate">
                  {sale.buyer_name || 'Não informado'}
                </strong>
              </div>
              <div>
                <span>Valor: </span>
                <strong className="text-[#e3c56c] block font-mono">
                  {sale.sale_price !== undefined && sale.sale_price !== null
                    ? formatCurrency(Number(sale.sale_price))
                    : '—'}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Aviso */}
        <p className="text-xs text-zinc-400 leading-relaxed">
          Tem certeza de que deseja excluir permanentemente este registro de venda? O recibo oficial vinculado será desativado.
        </p>

        {/* Option: Reverter status da moto */}
        {sale.motorcycle_id && (
          <label className="flex items-start gap-2.5 cursor-pointer select-none group bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl hover:border-zinc-700 transition-colors">
            <input
              type="checkbox"
              checked={revertMoto}
              onChange={(e) => setRevertMoto(e.target.checked)}
              disabled={isPending}
              className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-800 accent-[#c9a44c] cursor-pointer"
            />
            <div className="text-xs space-y-0.5">
              <span className="text-zinc-300 font-medium group-hover:text-zinc-100 transition-colors">
                Reverter status da motocicleta para{' '}
                <span className="font-bold text-emerald-400">Disponível</span>
              </span>
              <p className="text-[11px] text-zinc-500">
                A moto voltará a aparecer como disponível no catálogo de estoque.
              </p>
            </div>
          </label>
        )}

        {/* Error message */}
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 h-11 rounded-xl text-sm font-semibold bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 h-11 rounded-xl text-sm font-bold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Excluindo…</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Excluir Venda</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
