'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bike, Download, MessageSquare, Phone, Printer, Pencil } from 'lucide-react';
import { DeleteSaleButton } from '@/components/admin/sales/delete-sale-button';
import { buttonVariants } from '@/components/ui/button';
import { SaleWithDetails } from '@/lib/queries/sales';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { CONSTANTS } from '@/lib/utils/constants';

interface SaleCardProps {
  sale: SaleWithDetails;
}

const getPaymentStatusBadge = (status?: string | null) => {
  switch (status) {
    case 'PAID':
      return {
        label: 'Pago',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    case 'PARTIAL':
      return {
        label: 'Parcial',
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };
    case 'PENDING':
    default:
      return {
        label: 'Pendente',
        className: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      };
  }
};

export function SaleCard({ sale }: SaleCardProps) {
  const moto = sale.motorcycle;
  const storeName = CONSTANTS.STORE_NAME;
  const primaryImage =
    moto?.images?.find((img) => img.is_primary)?.public_url ||
    moto?.images?.find((img) => img.is_primary)?.display_url ||
    moto?.images?.[0]?.public_url ||
    moto?.images?.[0]?.display_url;

  const cleanPhone = sale.buyer_phone ? sale.buyer_phone.replace(/\D/g, '') : '';
  const formattedCleanPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${formattedCleanPhone}?text=${encodeURIComponent(
        `Olá ${sale.buyer_name || ''}, tudo bem? Falamos da ${storeName} a respeito da sua compra da ${moto?.brand || ''} ${moto?.model || ''}.`,
      )}`
    : null;

  const statusBadge = getPaymentStatusBadge(sale.payment_status);

  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-4.5 shadow-sm space-y-4 hover:border-[#c9a44c]/40 transition-colors">
      {/* Top: Image + Moto Details */}
      <div className="flex items-center gap-3.5">
        {primaryImage ? (
          <div className="relative w-24 h-18 rounded-2xl overflow-hidden shrink-0 border border-zinc-800 bg-black/40 shadow-xs">
            <Image
              src={primaryImage}
              alt={moto?.model || 'Moto'}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-18 rounded-2xl border border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center shrink-0 text-zinc-600">
            <Bike className="w-6 h-6 opacity-40" />
            <span className="text-[9px] mt-0.5">Sem foto</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-white truncate">
            {moto?.brand} {moto?.model} {moto?.version || ''}
          </h4>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 font-mono">
            <span>{moto?.year_model}</span>
            {moto?.license_plate && <span>• {moto.license_plate}</span>}
          </div>
          <div className="text-base font-black text-[#e3c56c] mt-1 font-mono">
            {formatCurrency(Number(sale.sale_price))}
          </div>
        </div>
      </div>

      {/* Buyer & Payment Info */}
      <div className="bg-zinc-900/60 rounded-2xl p-3.5 border border-zinc-800/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Comprador:</span>
          <span className="font-bold text-white truncate max-w-[180px]">
            {sale.buyer_name || 'Não informado'}
          </span>
        </div>

        {sale.buyer_phone && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Telefone:</span>
            <span className="font-mono text-zinc-300 font-semibold">{sale.buyer_phone}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Pagamento:</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
              {sale.payment_method || 'PIX'}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Data:</span>
          <span className="font-mono text-zinc-300">{formatDate(sale.sale_date)}</span>
        </div>

        {sale.receipt_number && (
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
            <span className="text-zinc-400">Recibo:</span>
            <span className="font-mono font-black text-[#e3c56c] text-xs">
              {sale.receipt_number}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          href={`/admin/vendas/${sale.id}/recibo`}
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className:
              'h-10 rounded-xl text-xs font-bold border-[#c9a44c]/30 text-[#e3c56c] hover:bg-[#c9a44c]/10 flex items-center justify-center gap-1.5 cursor-pointer',
          })}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir A4</span>
        </Link>

        <Link
          href={`/admin/vendas/${sale.id}/editar`}
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className:
              'h-10 rounded-xl text-xs font-bold border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer',
          })}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Editar Venda</span>
        </Link>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'h-9 rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer',
            })}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        ) : (
          <a
            href={`/api/admin/sales/${sale.id}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'h-9 rounded-xl text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 border border-zinc-800/80',
            })}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </a>
        )}

        <DeleteSaleButton
          saleId={sale.id}
          motorcycleId={sale.motorcycle_id}
          receiptNumber={sale.receipt_number}
          showLabel
        />
      </div>
    </div>
  );
}
