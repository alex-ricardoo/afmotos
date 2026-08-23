'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bike, Download, ArrowRight, Receipt, MessageSquare, CheckCircle2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { SaleWithDetails } from '@/lib/queries/sales';

interface RecentSalesFeedProps {
  sales: SaleWithDetails[];
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

export function RecentSalesFeed({ sales }: RecentSalesFeedProps) {
  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#e3c56c]" />
          <h3 className="font-bold text-base text-white">Últimas Vendas & Recibos Emitidos</h3>
        </div>

        <Link
          href="/admin/vendas"
          className="text-xs font-bold text-[#e3c56c] hover:text-amber-300 flex items-center gap-1 transition-colors"
        >
          <span>Ver histórico completo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {sales.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 space-y-3">
          <Bike className="w-8 h-8 mx-auto opacity-30" />
          <p className="text-sm">Nenhuma venda registrada até o momento.</p>
          <Link
            href="/admin/vendas/nova"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'border-[#c9a44c]/40 text-[#e3c56c] hover:bg-[#c9a44c]/10 rounded-xl',
            })}
          >
            + Registrar Primeira Venda
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => {
            const moto = sale.motorcycle;
            const primaryImage =
              moto?.images?.find((img) => img.is_primary)?.public_url ||
              moto?.images?.find((img) => img.is_primary)?.display_url ||
              moto?.images?.[0]?.public_url ||
              moto?.images?.[0]?.display_url;

            const cleanPhone = sale.buyer_phone ? sale.buyer_phone.replace(/\D/g, '') : '';
            const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
            const whatsappUrl = cleanPhone
              ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
                  `Olá ${sale.buyer_name || ''}, tudo bem? Falamos da AF Motos a respeito da sua compra.`,
                )}`
              : null;

            return (
              <div
                key={sale.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-[#c9a44c]/30 hover:bg-zinc-900/60 transition-all"
              >
                {/* Moto + Image */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {primaryImage ? (
                    <div className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-black/40 shadow-xs">
                      <Image
                        src={primaryImage}
                        alt={moto?.model || 'Moto'}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-12 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0">
                      <Bike className="w-5 h-5 text-zinc-600" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">
                      {moto?.brand} {moto?.model} {moto?.version || ''}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      <span>
                        Cliente:{' '}
                        <strong className="text-zinc-200">
                          {sale.buyer_name || 'Não informado'}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>{formatDate(sale.sale_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Values & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-extrabold text-[#e3c56c] font-mono">
                      {formatCurrency(Number(sale.sale_price))}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1 sm:justify-end">
                      <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-semibold text-[10px]">
                        {sale.payment_method || 'PIX'}
                      </span>
                      {sale.receipt_number && (
                        <span className="font-mono text-[10px] text-zinc-500 font-bold">
                          {sale.receipt_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/api/admin/sales/${sale.id}/receipt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'sm',
                        className:
                          'h-8 px-2.5 rounded-xl text-xs font-semibold border-amber-500/30 text-[#e3c56c] hover:bg-amber-500/10 cursor-pointer flex items-center gap-1.5',
                      })}
                      title="Baixar Recibo PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Recibo</span>
                    </a>

                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({
                          variant: 'ghost',
                          size: 'icon-sm',
                          className:
                            'rounded-xl text-emerald-400 hover:bg-emerald-500/10 cursor-pointer',
                        })}
                        title="Falar no WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
