'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bike, Download, MessageSquare, Printer, FileText, Pencil } from 'lucide-react';
import { DeleteSaleButton } from '@/components/admin/sales/delete-sale-button';
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
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { CONSTANTS } from '@/lib/utils/constants';

interface SalesTableProps {
  sales: SaleWithDetails[];
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

export function SalesTable({ sales }: SalesTableProps) {
  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-zinc-900/60 border-b border-zinc-800">
          <TableRow className="hover:bg-transparent border-zinc-800">
            <TableHead className="w-[70px] text-zinc-400 text-xs font-bold uppercase">
              Foto
            </TableHead>
            <TableHead className="text-zinc-400 text-xs font-bold uppercase">Veículo</TableHead>
            <TableHead className="text-zinc-400 text-xs font-bold uppercase">Comprador</TableHead>
            <TableHead className="text-zinc-400 text-xs font-bold uppercase">
              Valor da Venda
            </TableHead>
            <TableHead className="text-zinc-400 text-xs font-bold uppercase">Pagamento</TableHead>
            <TableHead className="text-zinc-400 text-xs font-bold uppercase">Data</TableHead>
            <TableHead className="text-zinc-400 text-xs font-bold uppercase">Nº Recibo</TableHead>
            <TableHead className="text-right text-zinc-400 text-xs font-bold uppercase">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-zinc-900">
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-zinc-500 text-sm">
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
              const storeName = CONSTANTS.STORE_NAME;
              const whatsappUrl = cleanPhone
                ? `https://wa.me/${formattedCleanPhone}?text=${encodeURIComponent(
                    `Olá ${sale.buyer_name || ''}, tudo bem? Falamos da ${storeName} sobre a sua compra da ${moto?.brand || ''} ${moto?.model || ''}.`,
                  )}`
                : null;

              const statusBadge = getPaymentStatusBadge(sale.payment_status);

              return (
                <TableRow
                  key={sale.id}
                  className="hover:bg-zinc-900/40 transition-colors border-zinc-900"
                >
                  {/* Foto */}
                  <TableCell>
                    {primaryImage ? (
                      <div className="relative w-14 h-11 rounded-xl overflow-hidden border border-zinc-800 bg-black/40 shrink-0 shadow-xs">
                        <Image
                          src={primaryImage}
                          alt={moto?.model || 'Moto'}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-11 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0">
                        <Bike className="w-4 h-4 text-zinc-600" />
                      </div>
                    )}
                  </TableCell>

                  {/* Veículo */}
                  <TableCell>
                    <div className="font-bold text-white text-sm">
                      {moto?.brand} {moto?.model} {moto?.version || ''}
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span>{moto?.year_model}</span>
                      {moto?.license_plate && <span>• {moto.license_plate}</span>}
                    </div>
                  </TableCell>

                  {/* Comprador */}
                  <TableCell>
                    <div className="font-bold text-zinc-200 text-sm">
                      {sale.buyer_name || 'Não informado'}
                    </div>
                    {sale.buyer_phone && (
                      <div className="text-xs text-zinc-400 mt-0.5 font-mono">
                        {sale.buyer_phone}
                      </div>
                    )}
                  </TableCell>

                  {/* Valor */}
                  <TableCell>
                    <div className="font-black text-[#e3c56c] text-sm font-mono">
                      {formatCurrency(Number(sale.sale_price))}
                    </div>
                  </TableCell>

                  {/* Pagamento */}
                  <TableCell>
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {sale.payment_method || 'PIX'}
                      </span>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Data */}
                  <TableCell className="text-xs text-zinc-300 font-medium font-mono">
                    {formatDate(sale.sale_date)}
                  </TableCell>

                  {/* Recibo */}
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {sale.receipt_number || '-'}
                    </span>
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <DeleteSaleButton
                        saleId={sale.id}
                        motorcycleId={sale.motorcycle_id}
                        receiptNumber={sale.receipt_number}
                      />

                      <Link
                        href={`/admin/vendas/${sale.id}/editar`}
                        className={buttonVariants({
                          variant: 'ghost',
                          size: 'icon-sm',
                          className:
                            'rounded-xl text-zinc-400 hover:text-[#e3c56c] hover:bg-zinc-800 cursor-pointer',
                        })}
                        title="Editar Dados da Venda e Recibo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        href={`/admin/vendas/${sale.id}/recibo`}
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className:
                            'h-8 px-2.5 rounded-xl text-xs font-bold border-[#c9a44c]/30 text-[#e3c56c] hover:bg-[#c9a44c]/10 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer',
                        })}
                        title="Visualizar e Imprimir Recibo Oficial A4"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir A4</span>
                      </Link>

                      <a
                        href={`/api/admin/sales/${sale.id}/receipt`}
                        download={`recibo-${sale.receipt_number || sale.id.slice(0, 8)}.pdf`}
                        className={buttonVariants({
                          variant: 'ghost',
                          size: 'icon-sm',
                          className:
                            'rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer',
                        })}
                        title="Baixar Arquivo PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
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
                              'rounded-xl text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 cursor-pointer',
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
