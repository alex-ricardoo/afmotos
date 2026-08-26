'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Loader2,
  Receipt,
  Calendar,
  Tag,
  AlertCircle,
  ExternalLink,
  Bike,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatCurrency, cn } from '@/lib/utils';
import { STATUS_LABELS, ExpenseStatus } from '@/types/expenses';
import { getMotorcycleExpenseStatsAction } from '@/app/admin/(protected)/gastos/actions';

interface MotorcycleExpenseHistoryItem {
  id: string;
  title: string;
  amount: number;
  expense_date: string;
  status: ExpenseStatus;
  category?: { name: string } | { name: string }[] | null;
}

interface MotorcycleExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  motorcycleId: string | null;
  motorcycleLabel: string;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getCategoryName(category: MotorcycleExpenseHistoryItem['category']) {
  if (!category) return 'Sem categoria';
  if (Array.isArray(category)) return category[0]?.name || 'Sem categoria';
  return category.name || 'Sem categoria';
}

export function MotorcycleExpensesModal({
  isOpen,
  onClose,
  motorcycleId,
  motorcycleLabel,
}: MotorcycleExpensesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalCost: number;
    count: number;
    expenses: MotorcycleExpenseHistoryItem[];
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !motorcycleId) return;

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    getMotorcycleExpenseStatsAction(motorcycleId)
      .then((result) => {
        if (!isCancelled) setStats(result as any);
      })
      .catch(() => {
        if (!isCancelled) setError('Não foi possível carregar os gastos desta motocicleta.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, motorcycleId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl lg:max-w-3xl bg-zinc-950 border-zinc-800 text-zinc-100 rounded-3xl p-0 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-900 space-y-1.5">
          <DialogTitle className="text-lg font-extrabold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#e3c56c]" />
            Gastos Vinculados
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{motorcycleLabel}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="px-6 py-4 flex items-center justify-between bg-zinc-900/40 border-b border-zinc-900">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Custo Acumulado
            </span>
            <span className="text-2xl font-black text-[#e3c56c] tabular-nums font-mono">
              {isLoading ? '—' : formatCurrency(stats?.totalCost || 0)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Lançamentos
            </span>
            <span className="text-xl font-black text-white tabular-nums">
              {isLoading ? '—' : stats?.count || 0}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] min-h-[220px] overflow-y-auto px-6 py-4 space-y-2.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-zinc-400 gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando histórico de gastos...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 py-8 text-rose-400 text-sm justify-center">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          ) : !stats || stats.expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <Receipt className="w-8 h-8 text-zinc-600" />
              <p className="text-sm text-zinc-400">
                Nenhum gasto cadastrado para esta motocicleta ainda.
              </p>
            </div>
          ) : (
            stats.expenses.map((expense) => {
              const statusInfo = STATUS_LABELS[expense.status] || STATUS_LABELS.PAID;
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white truncate">{expense.title}</div>
                    <div className="flex items-center gap-2.5 mt-1 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {getCategoryName(expense.category)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(expense.expense_date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-sm font-black text-white tabular-nums font-mono">
                      {formatCurrency(expense.amount)}
                    </div>
                    <span
                      className={cn(
                        'inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                        statusInfo.badgeClass,
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950">
          <Link
            href="/admin/gastos"
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-[#e3c56c] transition-colors py-1.5"
          >
            <span>Ir para a Central de Gastos</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
