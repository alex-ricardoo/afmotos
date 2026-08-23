'use client';

import React from 'react';
import Image from 'next/image';
import { Bike, Download, MessageSquare } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SaleWithDetails } from '@/lib/queries/sales';

interface SalesTableProps {
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

export function SalesTable({ sales }: SalesTableProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-muted/50 border-b border-border">
          <TableRow>
            <TableHead className="w-[80px]">Foto</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Comprador</TableHead>
            <TableHead>Valor da Venda</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Nº Recibo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                Nenhuma venda encontrada com os filtros aplicados.
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => {
              const moto = sale.motorcycle;
              const primaryImage =
                moto?.images?.find((img) => img.is_primary)?.public_url ||
                moto?.images?.find((img) => img.is_primary)?.display_url ||
                moto?.images?.[0]?.public_url ||
                moto?.images?.[0]?.display_url;

              const cleanPhone = sale.buyer_phone ? sale.buyer_phone.replace(/\D/g, '') : '';
              const formattedCleanPhone = cleanPhone.startsWith('55')
                ? cleanPhone
                : `55${cleanPhone}`;
              const whatsappUrl = cleanPhone
                ? `https://wa.me/${formattedCleanPhone}?text=${encodeURIComponent(
                    `Olá ${sale.buyer_name || ''}, tudo bem? Falamos da AF Motos sobre a sua compra da ${moto?.brand || ''} ${moto?.model || ''}.`,
                  )}`
                : null;

              const statusBadge = getPaymentStatusBadge(sale.payment_status);

              return (
                <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                  {/* Foto */}
                  <TableCell>
                    {primaryImage ? (
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-border bg-black/20 shrink-0 shadow-xs">
                        <Image
                          src={primaryImage}
                          alt={moto?.model || 'Moto'}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
                        <Bike className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </TableCell>

                  {/* Veículo */}
                  <TableCell>
                    <div className="font-bold text-foreground text-sm">
                      {moto?.brand} {moto?.model} {moto?.version || ''}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{moto?.year_model}</span>
                      {moto?.license_plate && <span>• {moto.license_plate}</span>}
                    </div>
                  </TableCell>

                  {/* Comprador */}
                  <TableCell>
                    <div className="font-semibold text-foreground text-sm">
                      {sale.buyer_name || 'Não informado'}
                    </div>
                    {sale.buyer_phone && (
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {sale.buyer_phone}
                      </div>
                    )}
                  </TableCell>

                  {/* Valor */}
                  <TableCell>
                    <div className="font-extrabold text-amber-500 text-sm">
                      {formatCurrency(Number(sale.sale_price))}
                    </div>
                  </TableCell>

                  {/* Pagamento */}
                  <TableCell>
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-foreground border border-border">
                        {sale.payment_method || 'PIX'}
                      </span>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Data */}
                  <TableCell className="text-xs text-foreground font-medium">
                    {formatDate(sale.sale_date)}
                  </TableCell>

                  {/* Recibo */}
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {sale.receipt_number || '-'}
                    </span>
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/api/admin/sales/${sale.id}/receipt`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className:
                            'h-8 px-2.5 rounded-lg text-xs font-semibold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 flex items-center gap-1.5 cursor-pointer',
                        })}
                        title="Gerar / Baixar Recibo PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Recibo</span>
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
                              'rounded-lg text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 cursor-pointer',
                          })}
                          title="Falar com Comprador no WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
