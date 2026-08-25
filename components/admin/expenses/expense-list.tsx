'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Copy,
  CheckCircle2,
  Clock,
  Bike,
  Store,
  Calendar,
  AlertCircle,
  Plus,
  RefreshCw,
  Tag,
} from 'lucide-react';
import {
  Expense,
  STATUS_LABELS,
  EXPENSE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  ExpenseStatus,
} from '@/types/expenses';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onView: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onToggleStatus: (id: string, newStatus: ExpenseStatus) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onAddNew: () => void;
  isLoading?: boolean;
}

export function ExpenseList({
  expenses,
  onEdit,
  onView,
  onDelete,
  onToggleStatus,
  onDuplicate,
  onAddNew,
  isLoading = false,
}: ExpenseListProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleStatusClick = async (id: string, currentStatus: ExpenseStatus) => {
    const nextStatus: ExpenseStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    setActionLoadingId(id);
    try {
      await onToggleStatus(id, nextStatus);
    } finally {
      setActionLoadingId(null);
      setActiveMenuId(null);
    }
  };

  const handleDuplicateClick = async (id: string) => {
    setActionLoadingId(id);
    try {
      await onDuplicate(id);
    } finally {
      setActionLoadingId(null);
      setActiveMenuId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center shadow-xl">
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span className="text-sm font-medium text-slate-300">Carregando lançamentos de gastos...</span>
        </div>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center flex flex-col items-center justify-center shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Nenhum gasto registrado neste período</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-md">
          Adicione um novo lançamento para acompanhar os custos operacionais da loja ou as despesas vinculadas a cada moto.
        </p>
        <button
          onClick={onAddNew}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Primeiro Gasto</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Visão Mobile (Cards Responsivos) */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {expenses.map((expense) => {
          const statusInfo = STATUS_LABELS[expense.status] || STATUS_LABELS.PAID;
          const typeInfo = EXPENSE_TYPE_LABELS[expense.expense_type] || EXPENSE_TYPE_LABELS.LOJA;
          const isMenuOpen = activeMenuId === expense.id;
          const isItemLoading = actionLoadingId === expense.id;

          return (
            <div
              key={expense.id}
              className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-xl hover:border-slate-700 transition-all"
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${typeInfo.badgeClass}`}
                    >
                      {expense.expense_type === 'MOTO' ? (
                        <Bike className="w-3 h-3 mr-1 inline" />
                      ) : (
                        <Store className="w-3 h-3 mr-1 inline" />
                      )}
                      {typeInfo.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                    {expense.is_recurring && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        Recorrente
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{expense.title}</h4>
                </div>

                <div className="relative shrink-0">
                  <button
                    onClick={() => setActiveMenuId(isMenuOpen ? null : expense.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 top-9 z-30 w-44 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl py-1.5 text-xs animate-in fade-in-50">
                      <button
                        onClick={() => {
                          onView(expense);
                          setActiveMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ver Comprovante</span>
                      </button>
                      <button
                        onClick={() => {
                          onEdit(expense);
                          setActiveMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleStatusClick(expense.id, expense.status)}
                        disabled={isItemLoading}
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                      >
                        {expense.status === 'PAID' ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Marcar Pendente</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Marcar Pago</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDuplicateClick(expense.id)}
                        disabled={isItemLoading}
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicar Gasto</span>
                      </button>
                      <div className="my-1 border-t border-slate-800" />
                      <button
                        onClick={() => {
                          onDelete(expense);
                          setActiveMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Moto Vinculada (se houver) */}
              {expense.expense_type === 'MOTO' && expense.motorcycle && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  {expense.motorcycle.primary_image_url ? (
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                      <Image
                        src={expense.motorcycle.primary_image_url}
                        alt={`${expense.motorcycle.brand} ${expense.motorcycle.model}`}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                      <Bike className="w-4 h-4" />
                    </div>
                  )}
                  <div className="text-xs truncate">
                    <div className="font-bold text-white truncate">
                      {expense.motorcycle.brand} {expense.motorcycle.model}
                    </div>
                    {expense.motorcycle.plate && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Placa: {expense.motorcycle.plate}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Detalhes de Rodapé */}
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatDate(expense.expense_date)}</span>
                  {expense.category && (
                    <span className="text-slate-500 truncate max-w-[120px]">
                      • {expense.category.name}
                    </span>
                  )}
                </div>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Visão Desktop (Tabela Completa) */}
      <div className="hidden lg:block overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4">Descrição / Título</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Moto Vinculada</th>
                <th className="py-3.5 px-4">Forma Pagto</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {expenses.map((expense) => {
                const statusInfo = STATUS_LABELS[expense.status] || STATUS_LABELS.PAID;
                const typeInfo =
                  EXPENSE_TYPE_LABELS[expense.expense_type] || EXPENSE_TYPE_LABELS.LOJA;
                const paymentLabel = expense.payment_method
                  ? PAYMENT_METHOD_LABELS[expense.payment_method]
                  : '-';

                return (
                  <tr key={expense.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 font-medium text-slate-400 whitespace-nowrap">
                      {formatDate(expense.expense_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{expense.title}</div>
                      {expense.supplier_name && (
                        <div className="text-[11px] text-slate-500">
                          {expense.supplier_name}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-500" />
                        {expense.category?.name || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${typeInfo.badgeClass}`}
                      >
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {expense.expense_type === 'MOTO' && expense.motorcycle ? (
                        <div className="flex items-center gap-2.5">
                          {expense.motorcycle.primary_image_url && (
                            <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                              <Image
                                src={expense.motorcycle.primary_image_url}
                                alt={expense.motorcycle.model}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="truncate max-w-[170px]">
                            <span className="font-semibold text-white block truncate">
                              {expense.motorcycle.brand} {expense.motorcycle.model}
                            </span>
                            {expense.motorcycle.plate && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {expense.motorcycle.plate}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">{paymentLabel}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusClick(expense.id, expense.status)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${statusInfo.badgeClass}`}
                        title="Clique para alterar status"
                      >
                        {statusInfo.label}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400 font-mono whitespace-nowrap text-sm">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center relative whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onView(expense)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Ver comprovante"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                        <button
                          onClick={() => onEdit(expense)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateClick(expense.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Duplicar gasto"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(expense)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
