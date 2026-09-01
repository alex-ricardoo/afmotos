'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  Bike,
  Store,
  DollarSign,
  Calendar,
  CreditCard,
  Building,
  FileText,
  Clock,
  ExternalLink,
  Receipt,
  Tag,
} from 'lucide-react';
import {
  Expense,
  STATUS_LABELS,
  EXPENSE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/types/expenses';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense;
}

export function ExpenseDetailModal({ isOpen, onClose, expense }: ExpenseDetailModalProps) {
  if (!isOpen || !expense) return null;

  const statusInfo = STATUS_LABELS[expense.status] || STATUS_LABELS.PAID;
  const typeInfo = EXPENSE_TYPE_LABELS[expense.expense_type] || EXPENSE_TYPE_LABELS.LOJA;
  const paymentLabel = expense.payment_method
    ? PAYMENT_METHOD_LABELS[expense.payment_method]
    : 'Não informado';

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#c9a44c] flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Comprovante de Gasto</h3>
              <p className="text-xs text-zinc-400">Detalhamento financeiro e auditoria do lançamento.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar text-xs">
          {/* Header Card de Destaque Financeiro */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeInfo.badgeClass}`}
                >
                  {typeInfo.label}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">{expense.title}</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(expense.amount)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Competência: {formatDate(expense.competence_month)}
              </div>
            </div>
          </div>

          {/* Moto Vinculada (se tipo MOTO) */}
          {expense.expense_type === 'MOTO' && expense.motorcycle && (
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
              <span className="text-xs font-bold text-[#e3c56c] uppercase tracking-wider flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-[#c9a44c]" />
                <span>Motocicleta Vinculada</span>
              </span>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-12 relative rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-800">
                    {expense.motorcycle.primary_image_url ? (
                      <Image
                        src={expense.motorcycle.primary_image_url}
                        alt={expense.motorcycle.model}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Bike className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      {expense.motorcycle.brand} {expense.motorcycle.model}
                    </div>
                    {expense.motorcycle.version && (
                      <div className="text-xs text-zinc-400 truncate">{expense.motorcycle.version}</div>
                    )}
                    {expense.motorcycle.plate && (
                      <span className="inline-block mt-1 bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] text-[#e3c56c] font-mono">
                        {expense.motorcycle.plate}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/admin/motos?id=${expense.motorcycle.id}`}
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0"
                  title="Ver moto no painel"
                >
                  <span>Ver Moto</span>
                  <ExternalLink className="w-3 h-3 text-[#c9a44c]" />
                </Link>
              </div>
            </div>
          )}

          {/* Grid de Informações Classificatórias */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Categoria
              </span>
              <span className="text-xs font-semibold text-white block">
                {expense.category?.name || 'Geral'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Data do Gasto
              </span>
              <span className="text-xs font-semibold text-white block">
                {formatDate(expense.expense_date)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Forma de Pagamento
              </span>
              <span className="text-xs font-semibold text-white block">{paymentLabel}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Recorrência
              </span>
              <span className="text-xs font-semibold text-white block">
                {expense.is_recurring
                  ? `Sim (${expense.recurrence_type || 'Mensal'} - Dia ${expense.recurrence_day || 10})`
                  : 'Gasto Único'}
              </span>
            </div>
          </div>

          {/* Dados de Fornecedor & Comprovante */}
          {(expense.supplier_name || expense.invoice_number) && (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#c9a44c]" />
                <span>Dados do Fornecedor / Documento</span>
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {expense.supplier_name && (
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Fornecedor</span>
                    <span className="font-semibold text-white">{expense.supplier_name}</span>
                  </div>
                )}
                {expense.invoice_number && (
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Nº da Nota / Recibo</span>
                    <span className="font-semibold text-white">{expense.invoice_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações */}
          {expense.notes && (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Observações
              </span>
              <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{expense.notes}</p>
            </div>
          )}

          {/* Auditoria */}
          <div className="pt-3 border-t border-zinc-850 text-[11px] text-zinc-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Cadastrado em:</span>
              <span className="text-zinc-300 font-medium">{formatDateTime(expense.created_at)}</span>
            </div>
            {expense.paid_at && (
              <div className="flex justify-between">
                <span>Pago em:</span>
                <span className="text-emerald-400 font-medium">{formatDateTime(expense.paid_at)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Última atualização:</span>
              <span className="text-zinc-300 font-medium">{formatDateTime(expense.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
