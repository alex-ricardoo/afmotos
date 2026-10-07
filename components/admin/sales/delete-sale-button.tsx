'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { DeleteSaleModal, DeleteSaleTarget } from '@/components/admin/sales/delete-sale-modal';
import { SaleWithDetails } from '@/lib/queries/sales';

interface DeleteSaleButtonProps {
  sale?: SaleWithDetails | DeleteSaleTarget | null;
  saleId?: string;
  motorcycleId?: string | null;
  receiptNumber?: string | null;
  /** Quando true, exibe o label textual além do ícone (modo card) */
  showLabel?: boolean;
  customTrigger?: (openModal: () => void) => React.ReactNode;
}

export function DeleteSaleButton({
  sale,
  saleId,
  motorcycleId,
  receiptNumber,
  showLabel = false,
  customTrigger,
}: DeleteSaleButtonProps) {
  const [open, setOpen] = useState(false);

  const targetSale: DeleteSaleTarget | null = sale
    ? {
        id: sale.id,
        motorcycle_id: sale.motorcycle_id,
        receipt_number: sale.receipt_number,
        buyer_name: sale.buyer_name,
        sale_price: sale.sale_price,
        motorcycle: sale.motorcycle,
      }
    : saleId
      ? {
          id: saleId,
          motorcycle_id: motorcycleId ?? null,
          receipt_number: receiptNumber ?? null,
        }
      : null;

  if (!targetSale) return null;

  return (
    <>
      {customTrigger ? (
        customTrigger(() => setOpen(true))
      ) : (
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
          <Trash2 className="w-3.5 h-3.5" />
          {showLabel && <span>Excluir</span>}
        </button>
      )}

      <DeleteSaleModal
        sale={targetSale}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
