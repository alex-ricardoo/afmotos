'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SaleWithDetails } from '@/lib/queries/sales';
import { SiteSettings } from '@/types/database';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatKm,
  formatCpf,
  formatPhone,
  formatChassi,
  formatRenavam,
} from '@/lib/utils/formatters';
import { Printer, ArrowLeft, Download, CheckCircle2, Clock, Pencil } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { getSiteLogo, getSiteInitials } from '@/lib/site-settings';
import { formatCnpj } from '@/lib/utils/cnpj';

interface OfficialReceiptPrintProps {
  sale: SaleWithDetails;
  siteSettings?: SiteSettings | null;
  onBack?: () => void;
}

import { CONSTANTS } from '@/lib/utils/constants';

export function OfficialReceiptPrint({
  sale,
  siteSettings,
  onBack,
}: OfficialReceiptPrintProps) {
  const moto = sale.motorcycle;
  const storeName = siteSettings?.site_name || CONSTANTS.STORE_NAME;
  const logoInfo = getSiteLogo(siteSettings as any);
  const cnpj = formatCnpj(siteSettings?.cnpj);
  const address = siteSettings?.address || CONSTANTS.STORE_ADDRESS;
  const rawPhone = siteSettings?.whatsapp_phone || CONSTANTS.CONTACT_PHONE;
  const phone = formatPhone(rawPhone);
  const email = siteSettings?.contact_email || CONSTANTS.CONTACT_EMAIL;
  const siteDomain = typeof window !== 'undefined' ? window.location.host : '';
  const siteFullUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const currentYear = new Date().getFullYear();
  const receiptCode = sale.receipt_number || `${getSiteInitials(storeName)}-${currentYear}-${sale.id.slice(0, 4).toUpperCase()}`;
  const emissionDate = formatDateTime(sale.created_at || new Date().toISOString());

  // Formas de pagamento legíveis
  const paymentLabels: Record<string, string> = {
    PIX: 'PIX (À Vista)',
    FINANCIAMENTO: 'Financiamento Bancário',
    CARTAO: 'Cartão de Crédito / Débito',
    DINHEIRO: 'Dinheiro em Espécie',
    TROCA: 'Moto / Veículo na Troca',
    TRANSFERENCIA: 'Transferência Bancária / TED',
    OUTRO: 'Outras Condições',
  };

  const isPaid = sale.payment_status === 'PAID';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-3 sm:py-8 px-2 sm:px-6 print:p-0 print:bg-white print:text-black">
      {/* Barra de Ações Superior (Oculta na Impressão) */}
      <div className="max-w-4xl mx-auto mb-3 sm:mb-6 flex flex-wrap items-center justify-between gap-1.5 sm:gap-3 px-1 print:hidden">
        {onBack ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1.5 rounded-xl h-8 sm:h-10 px-2.5 sm:px-3 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Voltar</span>
          </Button>
        ) : (
          <Link
            href="/admin/vendas"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1.5 rounded-xl h-8 sm:h-10 px-2.5 sm:px-3 text-xs font-semibold cursor-pointer',
            })}
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Voltar para Vendas</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Link
            href={`/admin/vendas/${sale.id}/editar`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'h-8 sm:h-10 px-2 sm:px-3.5 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-[#e3c56c] flex items-center gap-1 sm:gap-1.5 text-xs font-semibold cursor-pointer',
            })}
            title="Editar informações desta venda"
          >
            <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Editar Venda</span>
            <span className="sm:hidden">Editar</span>
          </Link>

          <a
            href={`/api/admin/sales/${sale.id}/receipt`}
            download={`recibo-${sale.receipt_number || sale.id.slice(0, 8)}.pdf`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'h-8 sm:h-10 px-2 sm:px-3.5 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1 sm:gap-1.5 text-xs font-semibold cursor-pointer',
            })}
            title="Baixar comprovante em PDF"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Baixar </span>PDF
          </a>

          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-bold px-2.5 sm:px-5 h-8 sm:h-10 rounded-xl flex items-center gap-1 sm:gap-2 shadow-lg shadow-amber-500/20 text-xs sm:text-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Imprimir Recibo A4</span>
            <span className="sm:hidden">Imprimir</span>
          </Button>
        </div>
      </div>

      {/* DOCUMENTO A4 OFICIAL */}
      <div
        id="official-receipt-a4"
        className="w-full max-w-4xl print:max-w-none print:w-full mx-auto bg-white text-slate-900 p-4 sm:p-8 md:p-10 shadow-2xl rounded-2xl print:rounded-none print:shadow-none print:m-0 print:p-6 relative box-border font-sans leading-tight border border-slate-200 print:border-none flex flex-col justify-between"
        style={{ colorScheme: 'light' }}
      >
        <div>
          {/* CABEÇALHO INSTITUCIONAL */}
          <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-amber-600 pb-3 sm:pb-4 mb-3 sm:mb-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Logotipo Real da Loja */}
              <div className="w-13 h-13 sm:w-16 sm:h-16 relative rounded-xl overflow-hidden bg-slate-950 border border-amber-500/40 shrink-0 shadow-sm flex items-center justify-center p-1">
                <Image
                  src={logoInfo.src}
                  alt={`${storeName} Logo`}
                  width={64}
                  height={64}
                  priority
                  className="w-full h-full object-contain"
                  unoptimized={logoInfo.isCustom}
                />
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-none mb-1">
                  {storeName}
                </h1>
                <div className="text-[11px] sm:text-xs text-slate-600 flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-3 gap-y-0.5">
                  {cnpj && <span><strong>CNPJ:</strong> {cnpj}</span>}
                  <span><strong>Endereço:</strong> {address}</span>
                  <span><strong>WhatsApp:</strong> {phone}</span>
                  {email && <span><strong>E-mail:</strong> {email}</span>}
                  {siteDomain && (
                    <span>
                      <strong>Site:</strong>{' '}
                      <a
                        href={siteFullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-amber-600 print:text-slate-800"
                      >
                        {siteDomain}
                      </a>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Identificador Único do Recibo / Placa Mercosul */}
            <div className="w-full sm:w-auto text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between items-end sm:items-end">
              <div>
                {moto?.license_plate?.trim() ? (
                  <div className="inline-flex flex-col border-[1.5px] border-slate-900 rounded overflow-hidden shadow-xs bg-white">
                    <div className="bg-[#003399] px-3 py-0.5 text-center flex items-center justify-center">
                      <span className="text-[6.5px] font-black tracking-widest text-white font-mono">BRASIL</span>
                    </div>
                    <div className="bg-white px-3 py-0.5 text-center flex items-center justify-center">
                      <span className="text-xs font-mono font-black tracking-wider text-slate-900">
                        {moto.license_plate.toUpperCase().trim()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="inline-block bg-slate-950 text-amber-400 font-mono text-xs sm:text-sm font-bold px-3 py-1 rounded-lg border border-amber-500/30">
                    {receiptCode}
                  </div>
                )}
                <span className="block text-[10px] text-slate-500 mt-0.5 font-mono">
                  Emissão: {emissionDate}
                </span>
              </div>
              {sale.is_repasse ? (
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded mt-0.5">
                  Modalidade Repasse • Sem Garantia
                </span>
              ) : (
                <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-700 mt-0.5">
                  Comprovante Oficial de Entrega
                </span>
              )}
            </div>
          </div>

          {/* SEÇÃO 1: IDENTIFICAÇÃO DO VEÍCULO */}
          <div className="mb-3.5 sm:mb-4">
            <div className="bg-slate-100 px-3 py-1.5 rounded border-l-4 border-amber-500 mb-2 flex flex-wrap items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Identificação do Veículo
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Dados Técnicos & Fiscais</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-2.5 sm:gap-3 bg-slate-50/80 p-3 sm:p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Marca / Modelo / Versão</span>
                <span className="font-bold text-slate-900 text-sm">
                  {moto ? `${moto.brand} ${moto.model} ${moto.version || ''}` : 'Não informado'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">Ano Fab. / Modelo</span>
                <span className="font-semibold text-slate-800">
                  {moto ? `${moto.year_manufacture} / ${moto.year_model}` : '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">Placa</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 inline-block">
                  {moto?.license_plate || 'Em emplacamento'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">Cor Predominante</span>
                <span className="font-medium text-slate-800">{moto?.color || 'Não informada'}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">Renavam</span>
                <span className="font-mono font-semibold text-slate-900">
                  {sale.renavam || moto?.renavam ? formatRenavam(sale.renavam || moto?.renavam) : 'Não informado'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">Chassi (VIN)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {sale.chassi || moto?.chassi ? formatChassi(sale.chassi || moto?.chassi) : 'Não informado'}
                </span>
              </div>

              <div className="col-span-1 sm:col-span-2 md:col-span-3 print:col-span-3 pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-slate-500 text-[11px] mr-2">KM Registrado na Entrega:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {formatKm(sale.delivery_km ?? moto?.mileage)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Odômetro conferido pelo comprador no ato da entrega técnica.
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: IDENTIFICAÇÃO DAS PARTES */}
          <div className="mb-3.5 sm:mb-4">
            <div className="bg-slate-100 px-3 py-1.5 rounded border-l-4 border-amber-500 mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Identificação das Partes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 text-xs">
              {/* Vendedor */}
              <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block border-b border-slate-200 pb-1">
                  Vendedora (Loja)
                </span>
                <p><strong>Loja:</strong> {storeName}</p>
                {cnpj && <p><strong>CNPJ:</strong> {cnpj}</p>}
                <p><strong>Telefone / WhatsApp:</strong> {phone}</p>
                {email && <p><strong>E-mail:</strong> {email}</p>}
                <p><strong>Endereço:</strong> {address}</p>
              </div>

              {/* Comprador */}
              <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 block border-b border-slate-200 pb-1">
                  Adquirente (Comprador)
                </span>
                <p><strong>Nome Completo:</strong> {sale.buyer_name || 'Consumidor Final'}</p>
                <p><strong>CPF:</strong> {sale.buyer_document ? formatCpf(sale.buyer_document) : 'Não informado'}</p>
                <p><strong>Telefone / WhatsApp:</strong> {sale.buyer_phone ? formatPhone(sale.buyer_phone) : 'Não informado'}</p>
                <p><strong>Endereço:</strong> {sale.buyer_address || 'Endereço residencial padrão'}</p>
                {sale.buyer_email && <p><strong>E-mail:</strong> {sale.buyer_email}</p>}
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: CONDIÇÕES DE PAGAMENTO & QUITAÇÃO (100% RESPONSIVA MOBILE + PRINT) */}
          <div className="mb-3.5 sm:mb-4">
            <div className="bg-slate-100 px-3 py-1.5 rounded border-l-4 border-amber-500 mb-2 flex flex-wrap items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Condições de Pagamento & Liquidação
              </span>
              <span className="text-[10px] text-slate-500">Data da Venda: {formatDate(sale.sale_date)}</span>
            </div>

            {(() => {
              const salePrice = Number(sale.sale_price) || 0;
              const tradeAmount = Number(sale.trade_amount) || 0;
              const financedAmount = Number(sale.financed_amount) || 0;
              const entryAmount = Number(sale.entry_amount) || 0;
              const hasTradeOrFinancing = tradeAmount > 0 || financedAmount > 0;
              const directPaidAmount = entryAmount > 0 
                ? entryAmount 
                : hasTradeOrFinancing 
                  ? Math.max(0, salePrice - tradeAmount - financedAmount) 
                  : 0;

              const paymentMethodNames: Record<string, string> = {
                PIX: 'PIX',
                FINANCIAMENTO: 'Financiamento',
                CARTAO: 'Cartão de Crédito',
                DINHEIRO: 'Dinheiro',
                TROCA: 'Moto na Troca',
                TRANSFERENCIA: 'Transferência TED',
                OUTRO: 'Outro',
              };

              const rawMethod = paymentMethodNames[sale.payment_method || 'PIX'] || sale.payment_method || 'PIX';

              let compositionLabel = paymentLabels[sale.payment_method || 'PIX'] || sale.payment_method || 'À Vista';
              if (tradeAmount > 0 && financedAmount > 0) {
                compositionLabel = `Moto na Troca + Financiamento + ${rawMethod}`;
              } else if (tradeAmount > 0) {
                compositionLabel = directPaidAmount > 0 ? `Moto na Troca + ${rawMethod}` : 'Moto na Troca';
              } else if (financedAmount > 0) {
                compositionLabel = directPaidAmount > 0 ? `Financiamento + ${rawMethod}` : 'Financiamento Bancário';
              }

              return (
                <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-lg border border-slate-200 text-xs">
                  {/* Layout Mobile (Cards empilhados verticais sem quebra de texto) */}
                  <div className="block sm:hidden print:hidden space-y-2.5">
                    <div className="bg-white p-3 rounded-lg border border-slate-200/90 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Valor Total Negociado</span>
                        <span className="text-base font-black text-slate-950 font-mono">
                          {formatCurrency(sale.sale_price)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isPaid ? 'Total Liquidado' : 'Saldo Pendente'}
                        </span>
                        <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                          {compositionLabel}
                        </span>
                      </div>
                    </div>

                    {(entryAmount > 0 || financedAmount > 0 || tradeAmount > 0 || (hasTradeOrFinancing && directPaidAmount > 0)) && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 space-y-1.5 text-[11px]">
                        {tradeAmount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">↳ Moto na Troca (Entrada):</span>
                            <span className="font-mono font-bold text-purple-700">{formatCurrency(tradeAmount)}</span>
                          </div>
                        )}
                        {financedAmount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">↳ Financiamento:</span>
                            <span className="font-mono font-bold text-blue-700">{formatCurrency(financedAmount)}</span>
                          </div>
                        )}
                        {hasTradeOrFinancing && directPaidAmount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">↳ Diferença Paga via {rawMethod}:</span>
                            <span className="font-mono font-bold text-emerald-700">{formatCurrency(directPaidAmount)}</span>
                          </div>
                        )}
                        {!hasTradeOrFinancing && entryAmount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">↳ Valor de Entrada:</span>
                            <span className="font-mono font-bold text-slate-900">{formatCurrency(entryAmount)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Layout Desktop & Impressão (Tabela clássica A4 alinhada) */}
                  <div className="hidden sm:block print:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                          <th className="pb-1.5 w-[38%]">Discriminação</th>
                          <th className="pb-1.5 w-[24%]">Forma / Modalidade</th>
                          <th className="pb-1.5 w-[20%]">Situação</th>
                          <th className="pb-1.5 w-[18%] text-right">Valor (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 text-xs">
                        <tr>
                          <td className="py-2 font-bold text-slate-900">Valor Total Negociado</td>
                          <td className="py-2 font-medium text-slate-800">{compositionLabel}</td>
                          <td className="py-2 font-medium text-emerald-700">
                            {isPaid ? 'Total Liquidado' : 'Saldo Pendente'}
                          </td>
                          <td className="py-2 text-right font-bold text-slate-900 font-mono text-sm">
                            {formatCurrency(sale.sale_price)}
                          </td>
                        </tr>

                        {tradeAmount > 0 && (
                          <tr className="text-slate-600 text-[11px]">
                            <td className="py-1 pl-3 font-medium text-slate-800">↳ Veículo na Troca (Moto de Entrada)</td>
                            <td className="py-1">Avaliação Física</td>
                            <td className="py-1 text-purple-700 font-medium">Recebido / Entregue</td>
                            <td className="py-1 text-right font-mono font-semibold text-purple-800">{formatCurrency(tradeAmount)}</td>
                          </tr>
                        )}

                        {financedAmount > 0 && (
                          <tr className="text-slate-600 text-[11px]">
                            <td className="py-1 pl-3 font-medium text-slate-800">↳ Saldo Financiado</td>
                            <td className="py-1">Instituição Bancária</td>
                            <td className="py-1 text-blue-700 font-medium">Aprovado</td>
                            <td className="py-1 text-right font-mono font-semibold text-blue-800">{formatCurrency(financedAmount)}</td>
                          </tr>
                        )}

                        {hasTradeOrFinancing && directPaidAmount > 0 && (
                          <tr className="text-slate-600 text-[11px]">
                            <td className="py-1 pl-3 font-medium text-slate-800">↳ Diferença Paga via {rawMethod}</td>
                            <td className="py-1">{rawMethod} (À Vista)</td>
                            <td className="py-1 text-emerald-700 font-medium">Recebido / Quitado</td>
                            <td className="py-1 text-right font-mono font-semibold text-emerald-800">{formatCurrency(directPaidAmount)}</td>
                          </tr>
                        )}

                        {!hasTradeOrFinancing && entryAmount > 0 && (
                          <tr className="text-slate-600 text-[11px]">
                            <td className="py-1 pl-3 font-medium text-slate-800">↳ Valor de Entrada</td>
                            <td className="py-1">{rawMethod} (À Vista)</td>
                            <td className="py-1 text-emerald-700 font-medium">Recebido</td>
                            <td className="py-1 text-right font-mono font-semibold">{formatCurrency(entryAmount)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {sale.receipt_notes && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                      <strong>Observações Técnicas / Comerciais:</strong> {sale.receipt_notes}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* SEÇÃO 4: TERMOS LEGAIS (CONDICIONAL: REPASSE vs GARANTIA PADRÃO) */}
          {sale.is_repasse ? (
            <div className="mb-3.5 sm:mb-4">
              <div className="bg-amber-50/80 px-3 py-1.5 rounded border-l-4 border-amber-500 mb-2 flex flex-wrap items-center justify-between gap-1">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-950">
                  4. Termo de Venda em Modalidade Repasse & Isenção de Garantia
                </span>
                <span className="text-[10px] text-amber-800 font-mono">Venda no Estado • Preço Abaixo de Mercado • Art. 123 e 134 CTB</span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200 text-[10px] sm:text-[10.5px] text-slate-700 space-y-2 leading-relaxed text-justify">
                <p>
                  <strong>4.1. Venda na Modalidade Repasse (Preço Reduzido):</strong> O COMPRADOR declara ter plena e inequívoca ciência de que o presente negócio jurídico é celebrado estritamente sob a <strong>modalidade comercial de REPASSE</strong>, tendo o valor da motocicleta sido pactuado em <strong>patamar substancialmente inferior ao preço médio de mercado e de tabela</strong>, em virtude de sua alienação direta no estado de conservação, uso e mecânica em que se encontra (&quot;as is&quot;).
                </p>
                <p>
                  <strong>4.2. Inexistência de Garantia Comercial ou Mecânica:</strong> Em virtude do preço reduzido de repasse e da modalidade acordada, fica expressamente convencionado que a presente venda <strong>NÃO POSSUI QUALQUER GARANTIA</strong> mecânica, elétrica, estrutural, de motor, câmbio ou de quaisquer outros componentes por parte da Loja <strong>&quot;{storeName}&quot;</strong>. O COMPRADOR assume de forma irrevogável e integral todos os riscos, custos e ônus de eventuais revisões, manutenções preventivas, corretivas ou substituições de peças a partir da presente data.
                </p>
                <p>
                  <strong>4.3. Vistoria Prévia, Teste e Aceitação Irrestrita:</strong> O COMPRADOR declara formalmente que inspecionou, avaliou, testou e aprovou as condições gerais do veículo (pessoalmente ou através de mecânico de sua estrita confiança), aceitando o bem no estado de conservação, lataria, mecânica, elétrica, pneus e quilometragem em que se encontra, nada tendo a reclamar a qualquer título ou pretexto.
                </p>
                <p>
                  <strong>4.4. Transporte e Despesas de Remoção:</strong> Quaisquer despesas com transporte, guincho, combustível ou deslocamento do veículo correm por conta e responsabilidade exclusiva do COMPRADOR.
                </p>
                <p>
                  <strong>4.5. Vistoria Cautelar, Multas e Transferência DETRAN (CTB):</strong> A partir da presente data e hora da entrega física, todas as responsabilidades civis, criminais e multas/infrações de trânsito recaem exclusivamente sobre o COMPRADOR, que se obriga a efetivar a transferência no DETRAN no prazo legal de 30 (trinta) dias (Art. 123 do CTB), ficando a LOJA autorizada a realizar a devida Comunicação de Venda (Art. 134 do CTB).
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-3.5 sm:mb-4">
              <div className="bg-slate-100 px-3 py-1.5 rounded border-l-4 border-amber-500 mb-2 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                  4. Termo de Garantia (90 Dias / 3.000 KM), Vistoria & Proteção Legal
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Art. 18 e 26 CDC & Art. 123 e 134 CTB</span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200 text-[10px] sm:text-[10.5px] text-slate-700 space-y-2 leading-relaxed text-justify">
                <p>
                  <strong>4.1. Garantia Legal de 90 Dias ou 3.000 KM (Motor e Câmbio):</strong> A Loja <strong>&quot;{storeName}&quot;</strong> concede ao ADQUIRENTE garantia legal pelo prazo improrrogável de <strong>90 (noventa) dias corridos ou 3.000 (três mil) quilômetros rodados</strong>, o que primeiro ocorrer, a contar da data de entrega do veículo, nos termos do Artigo 26, Inciso II da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor). A referida garantia é <strong>restrita e exclusiva aos componentes internos banhados a óleo de MOTOR e CÂMBIO</strong>.
                </p>
                <p>
                  <strong>4.2. Exclusões Expressas por Mau Uso, Modificações e Negligência:</strong> A garantia <strong>NÃO COBRE</strong> avarias decorrentes de: 
                  <strong> a)</strong> Mau uso, sobre-rotação (&quot;corte de giro&quot;), empinar/manobras, sobrecarga de carga/passageiros ou competições; 
                  <strong> b)</strong> Falta, atraso na troca de óleo, nível insuficiente de lubrificante ou uso de combustível adulterado; 
                  <strong> c)</strong> Quedas, colisões, acidentes ou submersão em água/alagamentos; 
                  <strong> d)</strong> Instalação de escapamento esportivo, remap de injeção, corte de chicote elétrico, alarmes ou rastreadores não homologados pela LOJA.
                </p>
                <p>
                  <strong>4.3. Perda Imediata da Garantia por Intervenção de Terceiros e Prazos:</strong> Havendo suspeita de anomalia, o ADQUIRENTE deve comunicar imediatamente a LOJA e apresentar o veículo na sede da <strong>Loja &quot;{storeName}&quot;</strong>. Qualquer desmontagem, abertura de motor, rompimento de lacres ou tentativa de conserto por mecânicos terceiros sem autorização formal por escrito implicará na <strong>PERDA TOTAL E IMEDIATA DA GARANTIA</strong>. Em caso de reparo coberto, a LOJA disporá do <strong>prazo legal de até 30 (trinta) dias para solução do vício (Art. 18, § 1º do CDC)</strong>.
                </p>
                <p>
                  <strong>4.4. Transporte e Despesas de Reboque:</strong> O transporte, guincho ou reboque do veículo até a sede da Loja <strong>&quot;{storeName}&quot;</strong> para diagnóstico ou reparo é de <strong>responsabilidade e custo exclusivo do ADQUIRENTE</strong>.
                </p>
                <p>
                  <strong>4.5. Itens de Desgaste Natural e Manutenção Preventiva:</strong> Fica expressamente convencionado que <strong>NÃO</strong> são cobertos pela garantia componentes sujeitos a desgaste natural por atrito e rodagem (pneus, câmaras de ar, pastilhas/lonas de freio, relação/transmissão, cabos de embreagem/acelerador, bateria, lâmpadas, velas e filtros), cabendo sua manutenção periódica exclusivamente ao COMPRADOR.
                </p>
                <p>
                  <strong>4.6. Vistoria, Infrações e Transferência DETRAN (CTB):</strong> O COMPRADOR declara que vistoriou, testou e aprovou as condições estéticas, mecânicas e estruturais do veículo. A partir da presente data e hora da entrega física, todas as responsabilidades civis, criminais e multas/infrações de trânsito recaem exclusivamente sobre o COMPRADOR, que se obriga a efetivar a transferência no DETRAN no prazo legal de 30 (trinta) dias (Art. 123 do CTB), ficando a LOJA autorizada a realizar a devida Comunicação de Venda (Art. 134 do CTB).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 5: ASSINATURAS FORMAIS */}
        <div className="pt-3 sm:pt-4 border-t border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 sm:gap-10 text-center">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 h-7 sm:h-9 flex items-end justify-center" />
              <p className="text-xs font-bold text-slate-900">{storeName}</p>
              <p className="text-[10px] text-slate-500">Representante Legal</p>
              {cnpj && <p className="text-[10px] text-slate-500">CNPJ: {cnpj}</p>}
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 h-7 sm:h-9 flex items-end justify-center" />
              <p className="text-xs font-bold text-slate-900">{sale.buyer_name || 'Comprador'}</p>
              <p className="text-[10px] text-slate-500">
                CPF: {sale.buyer_document ? formatCpf(sale.buyer_document) : 'Documento Registrado'}
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>AUTENTICIDADE: {receiptCode} • {emissionDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
