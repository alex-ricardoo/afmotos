'use client';

import { Expense, ExpenseCategory } from '@/types/expenses';
import { PieChart, BarChart2, Bike, Store } from 'lucide-react';

interface ExpenseChartsProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
}

export function ExpenseCharts({ expenses, categories }: ExpenseChartsProps) {
  const validExpenses = expenses.filter((e) => e.status !== 'CANCELLED');

  if (!validExpenses || validExpenses.length === 0) {
    return null;
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // 1. Agrupar por Categoria
  const categoryTotals: Record<string, { name: string; total: number; count: number }> = {};

  validExpenses.forEach((exp) => {
    const catName = exp.category?.name || 'Sem Categoria';
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { name: catName, total: 0, count: 0 };
    }
    categoryTotals[catName].total += Number(exp.amount || 0);
    categoryTotals[catName].count += 1;
  });

  const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.total - a.total);
  const totalAmountSum = validExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // 2. Agrupar por Tipo (MOTO vs LOJA)
  const totalMoto = validExpenses
    .filter((e) => e.expense_type === 'MOTO')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalLoja = validExpenses
    .filter((e) => e.expense_type === 'LOJA')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const motoPercentage = totalAmountSum > 0 ? (totalMoto / totalAmountSum) * 100 : 0;
  const lojaPercentage = totalAmountSum > 0 ? (totalLoja / totalAmountSum) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Distribuição por Categoria (Barras Proporcionais) */}
      <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Principais Categorias
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {sortedCategories.length} categorias ativas
          </span>
        </div>

        <div className="space-y-3.5 pt-1">
          {sortedCategories.slice(0, 5).map((cat) => {
            const percentage = totalAmountSum > 0 ? (cat.total / totalAmountSum) * 100 : 0;
            return (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300 truncate max-w-[240px]">
                    {cat.name} <span className="text-slate-500">({cat.count}x)</span>
                  </span>
                  <span className="font-bold text-white font-mono">
                    {formatCurrency(cat.total)}{' '}
                    <span className="text-amber-400 font-medium ml-1">
                      {percentage.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(3, percentage))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Proporção Moto vs Loja */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            Distribuição Moto x Loja
          </h3>
        </div>

        <div className="space-y-4 py-2">
          {/* Barra Bipolar */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-l-full transition-all duration-300"
                style={{ width: `${motoPercentage}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-r-full transition-all duration-300"
                style={{ width: `${lojaPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                <Bike className="w-3.5 h-3.5" />
                <span>Motos</span>
              </div>
              <div className="mt-1 text-sm font-bold text-white font-mono">
                {formatCurrency(totalMoto)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {motoPercentage.toFixed(1)}% do total
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
                <Store className="w-3.5 h-3.5" />
                <span>Loja</span>
              </div>
              <div className="mt-1 text-sm font-bold text-white font-mono">
                {formatCurrency(totalLoja)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {lojaPercentage.toFixed(1)}% do total
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Gasto Operacional Total:</span>
          <span className="text-white font-bold font-mono">{formatCurrency(totalAmountSum)}</span>
        </div>
      </div>
    </div>
  );
}
