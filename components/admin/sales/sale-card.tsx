'use client';

import React from 'react';
import Image from 'next/image';
import { Bike, Download, MessageSquare } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { SaleWithDetails } from '@/lib/queries/sales';

interface SaleCardProps {
  sale: SaleWithDetails;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const getPaymentStatusBadge = (status?: string | null) => {
  switch (status) {
    case 'PAID':
      return {
        label: 'Pago',
        className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      };
    case 'PARTIAL':
      return {
        label: 'Parcial',
        className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      };
    case 'PENDING':
    default:
      return {
        label: 'Pendente',
        className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      };
  }
};

export function SaleCard({ sale }: SaleCardProps) {
  const moto = sale.motorcycle;
  const primaryImage =
    moto?.images?.find((img) => img.is_primary)?.public_url ||
    moto?.images?.find((img) => img.is_primary)?.display_url ||
    moto?.images?.[0]?.public_url ||
    moto?.images?.[0]?.display_url;

  const cleanPhone = sale.buyer_phone ? sale.buyer_phone.replace(/\D/g, '') : '';
  const formattedCleanPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${formattedCleanPhone}?text=${encodeURIComponent(
        `Olá ${sale.buyer_name || ''}, tudo bem? Falamos da AF Motos a respeito da sua compra da ${moto?.brand || ''} ${moto?.model || ''}.`,
      )}`
    : null;

  const statusBadge = getPaymentStatusBadge(sale.payment_status);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-4 hover:border-[#c9a44c]/40 transition-colors">
      {/* Top: Image + Moto Details */}
      <div className="flex items-center gap-3.5">
        {primaryImage ? (
          <div className="relative w-24 h-18 rounded-xl overflow-hidden shrink-0 border border-border bg-black/20 shadow-xs">
            <Image
              src={primaryImage}
              alt={moto?.model || 'Moto'}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-18 rounded-xl border border-border bg-muted flex flex-col items-center justify-center shrink-0 text-muted-foreground">
            <Bike className="w-6 h-6 opacity-40" />
            <span className="text-[9px] mt-0.5">Sem foto</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-foreground truncate">
            {moto?.brand} {moto?.model} {moto?.version || ''}
          </h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{moto?.year_model}</span>
            {moto?.license_plate && <span>• {moto.license_plate}</span>}
          </div>
          <div className="text-sm font-extrabold text-amber-500 mt-1">
            {formatCurrency(Number(sale.sale_price))}
          </div>
        </div>
      </div>

      {/* Buyer & Payment Info */}
      <div className="bg-muted/40 rounded-xl p-3 border border-border/50 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Comprador:</span>
          <span className="font-semibold text-foreground truncate max-w-[180px]">
            {sale.buyer_name || 'Não informado'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Pagamento:</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-background text-foreground border border-border">
              {sale.payment_method || 'PIX'}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Data:</span>
          <span className="font-medium text-foreground">{formatDate(sale.sale_date)}</span>
        </div>

        {sale.receipt_number && (
          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <span className="text-muted-foreground">Recibo:</span>
            <span className="font-mono font-bold text-foreground text-[11px]">
              {sale.receipt_number}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <a
          href={`/api/admin/sales/${sale.id}/receipt`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className:
              'h-10 rounded-xl text-xs font-semibold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 flex items-center justify-center gap-1.5 cursor-pointer',
          })}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Recibo PDF</span>
        </a>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'h-10 rounded-xl text-xs font-semibold border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer',
            })}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        ) : (
          <span className="h-10 rounded-xl text-xs text-muted-foreground/50 flex items-center justify-center border border-border/40">
            Sem WhatsApp
          </span>
        )}
      </div>
    </div>
  );
}
