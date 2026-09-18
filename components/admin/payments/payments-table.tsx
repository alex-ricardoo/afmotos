'use client';

import React from 'react';
import {
  Eye,
  Undo2,
  RefreshCw,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Receipt,
  FileCheck2,
  Package,
  Coins,
} from 'lucide-react';
import { type AdminPaymentItemDTO } from '@/lib/admin/payments-service';

interface PaymentsTableProps {
  items: AdminPaymentItemDTO[];
  isLoading?: boolean;
  page: number;
  pageSize?: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
  onOpenDetails: (item: AdminPaymentItemDTO) => void;
  onOpenRefund: (item: AdminPaymentItemDTO) => void;
  onOpenReprocess: (item: AdminPaymentItemDTO) => void;
  onReconcile: (item: AdminPaymentItemDTO) => void;
  reconcilingId?: string | null;
}

function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(d);
  } catch {
    return isoString;
  }
}

function humanizePaymentMethod(methodId?: string | null): string {
  if (!methodId) return '';
  const map: Record<string, string> = {
    account_money: 'Saldo Mercado Pago',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bank_transfer: 'Pix',
    ticket: 'Boleto',
    pix: 'Pix',
  };
  return map[methodId.toLowerCase()] || methodId.toUpperCase();
}

function getPaymentBadge(status: string) {
  switch (status) {
    case 'approved':
      return {
        label: 'Aprovado',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold',
        icon: CheckCircle2,
      };
    case 'pending':
    case 'in_process':
      return {
        label: 'Pendente',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold',
        icon: Clock,
      };
    case 'refunded':
      return {
        label: 'Estornado',
        className: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40 font-bold',
        icon: Undo2,
      };
    case 'rejected':
    case 'cancelled':
      return {
        label: 'Cancelado',
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/40 font-bold',
        icon: XCircle,
      };
    default:
      return {
        label: status,
        className: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        icon: Clock,
      };
  }
}

function getDeliveryBadge(status: string, lastErrorCode?: string | null) {
  if (lastErrorCode === 'APIBRASIL_INSUFFICIENT_CREDITS') {
    return {
      label: 'Saldo Insuficiente (HTTP 402)',
      className:
        'bg-red-500/25 text-red-200 border-red-500/60 font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]',
      icon: AlertTriangle,
    };
  }

  switch (status) {
    case 'completed':
      return {
        label: 'Laudo Concluído',
        className: 'bg-[#c9a44c]/20 text-[#e3c56c] border-[#c9a44c]/50 font-bold',
        icon: FileCheck2,
      };
    case 'processing':
      return {
        label: 'Em Processamento',
        className: 'bg-sky-500/15 text-sky-300 border-sky-500/40 font-semibold',
        icon: Clock,
      };
    case 'retry_scheduled':
      return {
        label: 'Retry Agendado',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-semibold',
        icon: RefreshCw,
      };
    case 'failed_permanent':
      return {
        label: 'Falha Permanente',
        className: 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold',
        icon: XCircle,
      };
    default:
      return {
        label: 'Não Iniciado',
        className: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        icon: Clock,
      };
  }
}

function getRefundBadge(refundStatus?: string | null) {
  switch (refundStatus) {
    case 'confirmed':
      return {
        label: 'Estornado',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold',
      };
    case 'pending':
      return {
        label: 'Estorno Pendente',
        className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 font-bold animate-pulse',
      };
    case 'requested':
      return {
        label: 'Solicitado',
        className: 'bg-sky-500/15 text-sky-300 border-sky-500/40 font-semibold',
      };
    case 'failed':
      return {
        label: 'Estorno Falhou',
        className: 'bg-rose-500/25 text-rose-200 border-rose-500/60 font-bold',
      };
    default:
      return null;
  }
}

export function PaymentsTable({
  items,
  isLoading,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onOpenDetails,
  onOpenRefund,
  onOpenReprocess,
  onReconcile,
  reconcilingId,
}: PaymentsTableProps) {
  if (items.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-950/60">
        <Receipt className="h-10 w-10 text-zinc-600 mb-3" />
        <h4 className="text-sm font-bold text-zinc-200">Nenhuma transação encontrada</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          Tente alterar ou limpar os filtros de busca para visualizar outras transações.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Visão Mobile & Tablet (Cards com toque ergonômico) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
        {items.map((item) => {
          const payBadge = getPaymentBadge(item.paymentStatus);
          const PayIcon = payBadge.icon;
          const delBadge = getDeliveryBadge(item.delivery.status, item.delivery.lastErrorCode);
          const DelIcon = delBadge.icon;
          const refBadge = getRefundBadge(item.refund.status);
          const isReconciling = reconcilingId === item.transactionId;

          return (
            <div
              key={item.transactionId}
              className={`rounded-2xl border p-4 transition-all duration-200 space-y-3.5 ${
                item.flags.isInsufficientCredits
                  ? 'border-red-900/60 bg-gradient-to-b from-red-950/30 to-zinc-950 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                  : 'border-zinc-800/80 bg-zinc-950/80'
              }`}
            >
              {/* Header do Card Mobile: Placa / Pacote + Valor */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.purpose === 'credit_package' ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-inner">
                      <Package className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-mono text-xs font-black tracking-wider text-amber-200">
                        PACOTE B2B
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black border border-zinc-700 shadow-inner">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="font-mono text-xs font-black tracking-wider text-white">
                        {item.plate}
                      </span>
                    </div>
                  )}
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {formatDateTime(item.paymentCreatedAt)}
                  </span>
                </div>

                <span className="text-sm font-black text-emerald-400">{item.amountFormatted}</span>
              </div>

              {/* Informações do Cliente */}
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="font-medium truncate">{item.customer.name}</span>
                {item.customer.email && (
                  <span className="text-zinc-500 text-[11px] truncate">
                    ({item.customer.email})
                  </span>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {/* Pagamento */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border ${payBadge.className}`}
                >
                  <PayIcon className="h-3 w-3" />
                  <span>{payBadge.label}</span>
                </span>

                {/* Método */}
                {item.paymentMethodId && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                    {humanizePaymentMethod(item.paymentMethodId)}
                  </span>
                )}

                {/* Laudo ou Pacote B2B */}
                {item.purpose === 'credit_package' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border bg-indigo-500/15 text-indigo-300 border-indigo-500/40 font-semibold">
                    <Coins className="h-3 w-3" />
                    <span>Créditos em Conta</span>
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border ${delBadge.className}`}
                  >
                    <DelIcon className="h-3 w-3" />
                    <span>{delBadge.label}</span>
                  </span>
                )}

                {/* Estorno */}
                {refBadge && (
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] border ${refBadge.className}`}
                  >
                    {refBadge.label}
                  </span>
                )}
              </div>

              {/* Alerta de Saldo Insuficiente em destaque */}
              {item.flags.isInsufficientCredits && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-[11px] text-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>Crédito da API Brasil esgotado. Recarregue para entregar o laudo.</span>
                </div>
              )}

              {/* Botões de Ação para Celular (Touch-friendly 40px) */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => onOpenDetails(item)}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white font-semibold text-xs cursor-pointer active:scale-98 transition-all"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver Detalhes</span>
                </button>

                {item.flags.isReprocessEligible && (
                  <button
                    type="button"
                    onClick={() => onOpenReprocess(item)}
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-[#c9a44c] hover:bg-[#d9b45c] text-black font-bold text-xs cursor-pointer active:scale-98 transition-all shadow-xs"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Reprocessar</span>
                  </button>
                )}

                {(item.refund.status === 'pending' ||
                  item.refund.status === 'failed' ||
                  (item.purpose === 'credit_package' && item.paymentStatus === 'pending')) && (
                  <button
                    type="button"
                    onClick={() => onReconcile(item)}
                    disabled={isReconciling}
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold text-xs cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isReconciling ? 'animate-spin' : ''}`} />
                    <span>{isReconciling ? 'Consultando...' : 'Reconciliar'}</span>
                  </button>
                )}

                {item.flags.isRefundEligible && (
                  <button
                    type="button"
                    onClick={() => onOpenRefund(item)}
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer active:scale-98 transition-all shadow-[0_0_12px_rgba(225,29,72,0.3)]"
                  >
                    <Undo2 className="h-4 w-4" />
                    <span>Estornar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Visão Desktop (Tabela Elegante) */}
      <div className="hidden lg:block overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/90 text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th scope="col" className="py-3.5 px-4">
                  Data / Hora
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Origem / Placa
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Cliente
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Valor
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Mercado Pago
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Laudo Veicular
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Estorno
                </th>
                <th scope="col" className="py-3.5 px-4 text-right">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-900">
              {items.map((item) => {
                const payBadge = getPaymentBadge(item.paymentStatus);
                const PayIcon = payBadge.icon;
                const delBadge = getDeliveryBadge(
                  item.delivery.status,
                  item.delivery.lastErrorCode,
                );
                const DelIcon = delBadge.icon;
                const refBadge = getRefundBadge(item.refund.status);
                const isReconciling = reconcilingId === item.transactionId;

                return (
                  <tr
                    key={item.transactionId}
                    className={`hover:bg-zinc-900/40 transition-colors ${
                      item.flags.isInsufficientCredits ? 'bg-red-950/15' : ''
                    }`}
                  >
                    {/* Data / Hora */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-zinc-400 font-mono">
                      {formatDateTime(item.paymentCreatedAt)}
                    </td>

                    {/* Placa ou Pacote B2B */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.purpose === 'credit_package' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-inner">
                          <Package className="h-3.5 w-3.5 text-amber-400" />
                          <span className="font-mono text-xs font-black text-amber-200 tracking-wider">
                            PACOTE B2B
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black border border-zinc-700 shadow-inner">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span className="font-mono text-xs font-black text-white tracking-wider">
                            {item.plate}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col max-w-[180px]">
                        <span className="font-semibold text-zinc-200 truncate">
                          {item.customer.name}
                        </span>
                        {item.customer.email && (
                          <span
                            className="text-[11px] text-zinc-500 truncate"
                            title={item.customer.email}
                          >
                            {item.customer.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Valor */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-white">
                      {item.amountFormatted}
                    </td>

                    {/* Mercado Pago */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] border ${payBadge.className}`}
                        >
                          <PayIcon className="h-3 w-3" />
                          <span>{payBadge.label}</span>
                        </span>
                        {item.paymentMethodId && (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {humanizePaymentMethod(item.paymentMethodId)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Laudo Veicular ou Pacote B2B */}
                    <td className="py-3.5 px-4">
                      {item.purpose === 'credit_package' ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full text-[10px] border bg-indigo-500/15 text-indigo-300 border-indigo-500/40 font-semibold">
                            <Coins className="h-3 w-3" />
                            <span>Créditos B2B</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full text-[10px] border ${delBadge.className}`}
                          >
                            <DelIcon className="h-3 w-3" />
                            <span>{delBadge.label}</span>
                          </span>
                          {item.delivery.lastErrorCode &&
                            item.delivery.lastErrorCode !== 'APIBRASIL_INSUFFICIENT_CREDITS' && (
                              <span
                                className="text-[9px] text-zinc-500 font-mono truncate max-w-[160px]"
                                title={item.delivery.lastErrorCode}
                              >
                                {item.delivery.lastErrorCode}
                              </span>
                            )}
                        </div>
                      )}
                    </td>

                    {/* Estorno */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {refBadge ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${refBadge.className}`}
                        >
                          {refBadge.label}
                        </span>
                      ) : item.flags.isRefundEligible ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Elegível
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-600">-</span>
                      )}
                    </td>

                    {/* Ações com Botões Explícitos */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Principal Contextual */}
                        {item.flags.isReprocessEligible && (
                          <button
                            type="button"
                            onClick={() => onOpenReprocess(item)}
                            title="Reprocessar consulta veicular na API Brasil"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#c9a44c] hover:bg-[#d9b45c] text-black shadow-xs transition-all cursor-pointer"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            <span>Reprocessar</span>
                          </button>
                        )}

                        {item.flags.isRefundEligible && (
                          <button
                            type="button"
                            onClick={() => onOpenRefund(item)}
                            title="Solicitar estorno manual seguro"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_10px_rgba(225,29,72,0.3)] transition-all cursor-pointer"
                          >
                            <Undo2 className="h-3 w-3" />
                            <span>Estornar</span>
                          </button>
                        )}

                        {(item.refund.status === 'pending' ||
                          item.refund.status === 'failed' ||
                          (item.purpose === 'credit_package' &&
                            item.paymentStatus === 'pending')) && (
                          <button
                            type="button"
                            onClick={() => onReconcile(item)}
                            disabled={isReconciling}
                            title={
                              item.purpose === 'credit_package'
                                ? 'Reconciliar pedido no Mercado Pago'
                                : 'Reconciliar estorno no Mercado Pago'
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${isReconciling ? 'animate-spin' : ''}`}
                            />
                            <span>Reconciliar</span>
                          </button>
                        )}

                        {/* Botão Ver Detalhes */}
                        <button
                          type="button"
                          onClick={() => onOpenDetails(item)}
                          title="Ver detalhes completos e auditoria"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detalhes</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Paginação Unificada e Responsiva */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-2 text-xs text-zinc-400">
        <span>
          Mostrando página <strong className="text-zinc-100">{page}</strong> de{' '}
          <strong className="text-zinc-100">{totalPages}</strong> ({totalItems} registros no total)
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </button>

          <span className="px-2 font-mono font-bold text-zinc-300">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span>Próxima</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
