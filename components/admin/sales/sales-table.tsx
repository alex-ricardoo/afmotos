'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bike, Download, MessageSquare, Printer, Pencil, MoreVertical, Trash2 } from 'lucide-react';
import { DeleteSaleButton } from '@/components/admin/sales/delete-sale-button';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { getWarrantyInfo } from '@/lib/warranty/calculator';

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
            <TableHead className="text-zinc-400 text-xs font-bold uppercase py-3.5 pl-5">
              Veículo & Recibo
            </TableHead>
            <TableHead className="text-zinc-400 text-xs font-bold uppercase py-3.5">
              Comprador
            </TableHead>
            <TableHead className="text-zinc-400 text-xs font-bold uppercase py-3.5">
              Valor & Pagamento
            </TableHead>
            <TableHead className="text-zinc-400 text-xs font-bold uppercase py-3.5">
              Data
            </TableHead>
            <TableHead className="text-zinc-400 text-xs font-bold uppercase py-3.5">
              Garantia
            </TableHead>
            <TableHead className="text-right text-zinc-400 text-xs font-bold uppercase py-3.5 pr-5">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-zinc-900">
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-zinc-500 text-sm">
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
                  {/* Veículo & Recibo */}
                  <TableCell className="pl-5 py-3">
                    <div className="flex items-center gap-3">
                      {primaryImage ? (
                        <div className="relative w-13 h-10 rounded-xl overflow-hidden border border-zinc-800 bg-black/40 shrink-0 shadow-xs">
                          <Image
                            src={primaryImage}
                            alt={moto?.model || 'Moto'}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-13 h-10 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0 text-zinc-600">
                          <Bike className="w-5 h-5 opacity-40" />
                        </div>
                      )}

                      <div className="min-w-0 max-w-[260px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-sm truncate">
                            {moto?.brand} {moto?.model}
                          </span>
                          {sale.is_repasse && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Repasse
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{moto?.year_model}</span>
                          {moto?.license_plate && <span>• {moto.license_plate}</span>}
                          {sale.receipt_number && (
                            <span className="font-semibold text-[#e3c56c] font-mono">
                              • {sale.receipt_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Comprador */}
                  <TableCell className="py-3">
                    <div className="font-bold text-zinc-200 text-sm truncate max-w-[190px]">
                      {sale.buyer_name || 'Não informado'}
                    </div>
                    {sale.buyer_phone && (
                      <div className="text-xs text-zinc-400 mt-0.5 font-mono">
                        {whatsappUrl ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors group"
                            title="Conversar no WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-500/80 group-hover:text-emerald-400 shrink-0" />
                            <span>{sale.buyer_phone}</span>
                          </a>
                        ) : (
                          <span>{sale.buyer_phone}</span>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Valor & Pagamento */}
                  <TableCell className="py-3">
                    <div className="font-black text-[#e3c56c] text-sm font-mono">
                      {formatCurrency(Number(sale.sale_price))}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {sale.payment_method || 'PIX'}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-extrabold border ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </TableCell>

                  {/* Data */}
                  <TableCell className="text-xs text-zinc-300 font-medium font-mono py-3">
                    {formatDate(sale.sale_date)}
                  </TableCell>

                  {/* Garantia */}
                  <TableCell className="py-3">
                    {sale.is_repasse ? (
                      <span className="text-zinc-600 font-mono text-xs">—</span>
                    ) : (() => {
                      const warranty = getWarrantyInfo(sale);
                      return (
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${warranty.badgeClass}`}
                          >
                            {warranty.label}
                          </span>
                          {warranty.formattedEndsAt ? (
                            <div className="text-[11px] text-zinc-300 font-mono whitespace-nowrap">
                              Até {warranty.formattedEndsAt}
                              {warranty.daysRemaining !== null && warranty.daysRemaining >= 0 && (
                                <span className="text-[#e3c56c] font-semibold ml-1">
                                  ({warranty.daysRemaining}d)
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-500 italic whitespace-nowrap">
                              Pendente 1ª emissão
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right py-3 pr-5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/vendas/${sale.id}/recibo`}
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className:
                            'h-8 px-2.5 rounded-xl text-xs font-bold border-[#c9a44c]/30 text-[#e3c56c] hover:bg-[#c9a44c]/10 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer shrink-0',
                        })}
                        title="Visualizar e Imprimir Recibo Oficial A4"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Recibo</span>
                      </Link>

                      <a
                        href={`/api/admin/sales/${sale.id}/receipt`}
                        download={`recibo-${sale.receipt_number || sale.id.slice(0, 8)}.pdf`}
                        className={buttonVariants({
                          variant: 'ghost',
                          size: 'icon-sm',
                          className:
                            'h-8 w-8 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer shrink-0',
                        })}
                        title="Baixar Arquivo PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 p-0 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer shrink-0"
                              title="Mais opções"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-zinc-950 border-zinc-800 text-zinc-200"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider px-2 py-1">
                              Opções da Venda
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator className="bg-zinc-800" />

                          <DropdownMenuItem
                            onClick={() => (window.location.href = `/admin/vendas/${sale.id}/editar`)}
                            className="cursor-pointer text-xs"
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                            <span>Editar Venda</span>
                          </DropdownMenuItem>

                          {whatsappUrl && (
                            <DropdownMenuItem
                              onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
                              className="cursor-pointer text-xs text-emerald-400 focus:text-emerald-300"
                            >
                              <MessageSquare className="mr-2 h-3.5 w-3.5 text-emerald-400" />
                              <span>Falar no WhatsApp</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator className="bg-zinc-800" />

                          <DeleteSaleButton
                            saleId={sale.id}
                            motorcycleId={sale.motorcycle_id}
                            receiptNumber={sale.receipt_number}
                            customTrigger={(openModal) => (
                              <DropdownMenuItem
                                onClick={openModal}
                                className="cursor-pointer text-xs text-red-400 focus:text-red-300 focus:bg-red-500/10"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5 text-red-400" />
                                <span>Excluir Venda</span>
                              </DropdownMenuItem>
                            )}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
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
