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

interface OfficialReceiptPrintProps {
  sale: SaleWithDetails;
  siteSettings?: SiteSettings | null;
  onBack?: () => void;
}

export function OfficialReceiptPrint({
  sale,
  siteSettings,
  onBack,
}: OfficialReceiptPrintProps) {
  const moto = sale.motorcycle;
  const storeName = siteSettings?.site_name || 'AF Motos';
  /* CNPJ da loja (em breve): const cnpj = '58.490.871/0001-30'; */
  const address = siteSettings?.address || 'Cabo de Santo Agostinho - PE';
  const rawPhone = siteSettings?.whatsapp_phone || '81985901175';
  const phone = formatPhone(rawPhone);
  const email = siteSettings?.contact_email || 'afmotos2026@gmail.com';

  const receiptCode = sale.receipt_number || `AFM-2026-${sale.id.slice(0, 4).toUpperCase()}`;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-3 sm:py-8 px-2 sm:px-6 print:p-0 print:bg-white print:text-black">
      {/* Barra de Ações Superior (Oculta na Impressão) */}
      <div className="max-w-4xl mx-auto mb-3 sm:mb-6 flex items-center justify-between gap-2 px-1 print:hidden">
        {onBack ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 rounded-xl h-9 sm:h-10 px-3 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
        ) : (
          <Link
            href="/admin/vendas"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 rounded-xl h-9 sm:h-10 px-3 text-xs font-semibold cursor-pointer',
            })}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar para Vendas</span>
            <span className="sm:hidden">Vendas</span>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/vendas/${sale.id}/editar`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-amber-400 flex items-center gap-1.5 text-xs font-semibold cursor-pointer',
            })}
            title="Editar informações desta venda"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar Venda</span>
            <span className="sm:hidden">Editar</span>
          </Link>

          <a
            href={`/api/admin/sales/${sale.id}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 text-xs font-semibold',
            })}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Baixar</span> PDF
          </a>

          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-3.5 sm:px-6 h-9 sm:h-10 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 text-xs sm:text-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Recibo A4</span>
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
                  src="/logo.jpg"
                  alt="AF Motos Logo"
                  width={64}
                  height={64}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-none mb-1">
                  {storeName}
                </h1>
                <div className="text-[11px] sm:text-xs text-slate-600 flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-3 gap-y-0.5">
                  {/* CNPJ em breve: <span><strong>CNPJ:</strong> {cnpj}</span> */}
                  <span><strong>Endereço:</strong> {address}</span>
                  <span><strong>WhatsApp:</strong> {phone}</span>
                  {email && <span><strong>E-mail:</strong> {email}</span>}
                </div>
              </div>
            </div>

            {/* Identificador Único do Recibo */}
            <div className="w-full sm:w-auto text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between items-end sm:items-end">
              <div>
                <div className="inline-block bg-slate-950 text-amber-400 font-mono text-xs sm:text-sm font-bold px-3 py-1 rounded-lg border border-amber-500/30">
                  {receiptCode}
                </div>
                <span className="block text-[10px] text-slate-500 mt-0.5 font-mono">
                  Emissão: {emissionDate}
                </span>
              </div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-700 mt-0.5">
                Comprovante Oficial de Entrega
              </span>
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
                {/* <p><strong>CNPJ:</strong> {cnpj}</p> */}
                <p><strong>Endereço:</strong> {address}</p>
                <p><strong>Contato:</strong> {phone} • {email}</p>
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

            <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-lg border border-slate-200 text-xs">
              {/* Layout Mobile (Cards empilhados verticais sem quebra de texto) */}
              <div className="block sm:hidden print:hidden space-y-2.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200/90 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Valor Total</span>
                    <span className="text-base font-black text-slate-950 font-mono">
                      {formatCurrency(sale.sale_price)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {isPaid ? 'Quitado Integralmente' : 'Parcial / Saldo Pendente'}
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      {paymentLabels[sale.payment_method || 'PIX'] || sale.payment_method}
                    </span>
                  </div>
                </div>

                {(Number(sale.entry_amount) > 0 || Number(sale.financed_amount) > 0 || Number(sale.trade_amount) > 0) && (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 space-y-1.5 text-[11px]">
                    {Number(sale.entry_amount) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">↳ Valor Entrada:</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(sale.entry_amount)}</span>
                      </div>
                    )}
                    {Number(sale.financed_amount) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">↳ Financiamento:</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(sale.financed_amount)}</span>
                      </div>
                    )}
                    {Number(sale.trade_amount) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">↳ Moto na Troca:</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(sale.trade_amount)}</span>
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
                      <th className="pb-1.5 w-[35%]">Discriminação</th>
                      <th className="pb-1.5 w-[25%]">Forma / Modalidade</th>
                      <th className="pb-1.5 w-[22%]">Situação</th>
                      <th className="pb-1.5 w-[18%] text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-xs">
                    <tr>
                      <td className="py-2 font-bold text-slate-900">Valor Total Negociado</td>
                      <td className="py-2 text-slate-700">{paymentLabels[sale.payment_method || 'PIX'] || sale.payment_method}</td>
                      <td className="py-2 font-medium text-emerald-700">
                        {isPaid ? 'Quitado Integralmente' : 'Parcial / Saldo Pendente'}
                      </td>
                      <td className="py-2 text-right font-bold text-slate-900 font-mono text-sm">
                        {formatCurrency(sale.sale_price)}
                      </td>
                    </tr>

                    {(Number(sale.entry_amount) > 0 || Number(sale.financed_amount) > 0 || Number(sale.trade_amount) > 0) && (
                      <>
                        {Number(sale.entry_amount) > 0 && (
                          <tr className="text-slate-600 text-[11px]">
                            <td className="py-1 pl-3">↳ Valor de Entrada</td>
                            <td className="py-1">À vista (PIX / Espécie)</td>
                            <td className="py-1 text-emerald-600 font-medium">Recebido</td>
                            <td className="py-1 text-right font-mono">{formatCurrency(sale.entry_amount)}</td>
                          </tr>
                        )}
                        {Number(sale.financed_amount) > 0 && (
                          <tr className="text-slate-600 text-[11px]">
                            <td className="py-1 pl-3">↳ Saldo Financiado</td>
                            <td className="py-1">Instituição Financeira</td>
                            <td className="py-1 text-blue-600 font-medium">Aprovado</td>
                            <td className="py-1 text-right font-mono">{formatCurrency(sale.financed_amount)}</td>
                          </tr>
                        )}
                        {Number(sale.trade_amount) > 0 && (
                          <tr className="text-slate-600 text-[11px]">
                            <td className="py-1 pl-3">↳ Veículo na Troca</td>
                            <td className="py-1">Avaliação Física</td>
                            <td className="py-1 text-purple-600 font-medium">Recebido</td>
                            <td className="py-1 text-right font-mono">{formatCurrency(sale.trade_amount)}</td>
                          </tr>
                        )}
                      </>
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
          </div>

          {/* SEÇÃO 4: TERMOS LEGAIS, CTB & CLÁUSULAS */}
          <div className="mb-3.5 sm:mb-4">
            <div className="bg-slate-100 px-3 py-1.5 rounded border-l-4 border-amber-500 mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                4. Termos Legais, Vistoria & Cláusulas de Trânsito
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200 text-[10px] sm:text-[10.5px] text-slate-600 space-y-1.5 leading-relaxed text-justify">
              <p>
                <strong>4.1. Vistoria & Estado do Veículo:</strong> O adquirente declara expressamente que examinou e testou o veículo descrito na Seção 1, aprovando seu estado de conservação mecânica, elétrica, funilaria e pneus no ato do recebimento das chaves.
              </p>
              <p>
                <strong>4.2. Transferência Obrigatória (Art. 123 do CTB):</strong> Fica o adquirente expressamente obrigado a efetivar a transferência de propriedade do veículo junto ao DETRAN no prazo legal improrrogável de 30 (trinta) dias corridos, sob pena das cominações legais cabíveis.
              </p>
              <p>
                <strong>4.3. Responsabilidade por Infrações de Trânsito:</strong> A partir da data e hora da efetiva entrega física do veículo registrada neste comprovante, toda e qualquer responsabilidade civil, criminal e por multas ou infrações de trânsito é transferida integralmente ao comprador.
              </p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 5: ASSINATURAS FORMAIS */}
        <div className="pt-3 sm:pt-4 border-t border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 sm:gap-10 text-center">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 h-7 sm:h-9 flex items-end justify-center" />
              <p className="text-xs font-bold text-slate-900">{storeName}</p>
              <p className="text-[10px] text-slate-500">Vendedora / Representante Legal</p>
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
            <span>PÁGINA 1 DE 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
