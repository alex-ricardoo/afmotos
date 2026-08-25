'use client';

import { useState } from 'react';
import { Search, Filter, X, RotateCcw, ChevronDown, SlidersHorizontal } from 'lucide-react';
import {
  ExpenseFilters,
  ExpenseCategory,
  ExpenseType,
  ExpenseStatus,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
} from '@/types/expenses';

interface ExpenseFiltersBarProps {
  filters: ExpenseFilters;
  onFilterChange: (newFilters: ExpenseFilters) => void;
  categories: ExpenseCategory[];
  motorcycles: { id: string; brand: string; model: string; plate?: string | null }[];
}

export function ExpenseFiltersBar({
  filters,
  onFilterChange,
  categories,
  motorcycles,
}: ExpenseFiltersBarProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const activeFiltersCount = [
    filters.expenseType !== 'ALL',
    filters.categoryId !== 'ALL',
    filters.status !== 'ALL',
    filters.paymentMethod !== 'ALL',
    filters.motorcycleId !== 'ALL',
    filters.search && filters.search.trim() !== '',
  ].filter(Boolean).length;

  const handleReset = () => {
    onFilterChange({
      expenseType: 'ALL',
      categoryId: 'ALL',
      status: 'ALL',
      paymentMethod: 'ALL',
      motorcycleId: 'ALL',
      search: '',
    });
  };

  return (
    <div className="space-y-3">
      {/* Barra Desktop & Gatilho Mobile */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Campo de Busca Principal */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por título, fornecedor, placa ou nº nota..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botão Drawer Mobile */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium text-slate-300 hover:text-white hover:border-amber-500/40 transition-all cursor-pointer shadow-sm"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Filtros em linha no Desktop */}
        <div className="hidden lg:flex items-center gap-2.5 flex-wrap">
          {/* Seletor Tipo */}
          <div className="relative">
            <select
              value={filters.expenseType || 'ALL'}
              onChange={(e) =>
                onFilterChange({ ...filters, expenseType: e.target.value as ExpenseType | 'ALL' })
              }
              className="pl-3 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 hover:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 appearance-none cursor-pointer transition-all"
            >
              <option value="ALL" className="bg-slate-950">
                Todos os Tipos
              </option>
              <option value="MOTO" className="bg-slate-950">
                Gasto de Moto
              </option>
              <option value="LOJA" className="bg-slate-950">
                Gasto da Loja
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Seletor Categoria */}
          <div className="relative">
            <select
              value={filters.categoryId || 'ALL'}
              onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
              className="pl-3 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 hover:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 appearance-none cursor-pointer transition-all max-w-[200px] truncate"
            >
              <option value="ALL" className="bg-slate-950">
                Todas Categorias
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-950">
                  {c.name} ({c.expense_type === 'MOTO' ? 'Moto' : 'Loja'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Seletor Status */}
          <div className="relative">
            <select
              value={filters.status || 'ALL'}
              onChange={(e) =>
                onFilterChange({ ...filters, status: e.target.value as ExpenseStatus | 'ALL' })
              }
              className="pl-3 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 hover:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 appearance-none cursor-pointer transition-all"
            >
              <option value="ALL" className="bg-slate-950">
                Todos Status
              </option>
              <option value="PAID" className="bg-slate-950 text-emerald-400">
                Pago
              </option>
              <option value="PENDING" className="bg-slate-950 text-amber-400">
                Pendente
              </option>
              <option value="CANCELLED" className="bg-slate-950 text-rose-400">
                Cancelado
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Seletor Forma de Pagamento */}
          <div className="relative">
            <select
              value={filters.paymentMethod || 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  paymentMethod: e.target.value as PaymentMethod | 'ALL',
                })
              }
              className="pl-3 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 hover:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 appearance-none cursor-pointer transition-all"
            >
              <option value="ALL" className="bg-slate-950">
                Todas Formas
              </option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                <option key={k} value={k} className="bg-slate-950">
                  {v}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Botão Limpar Filtros */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all cursor-pointer"
              title="Limpar todos os filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Drawer Mobile de Filtros */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 lg:hidden">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">Filtrar Lançamentos</h3>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1.5">Tipo de Gasto</label>
                <select
                  value={filters.expenseType || 'ALL'}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      expenseType: e.target.value as ExpenseType | 'ALL',
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="MOTO">Gasto de Moto</option>
                  <option value="LOJA">Gasto da Loja</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1.5">Categoria</label>
                <select
                  value={filters.categoryId || 'ALL'}
                  onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                >
                  <option value="ALL">Todas as Categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.expense_type === 'MOTO' ? 'Moto' : 'Loja'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1.5">Status</label>
                <select
                  value={filters.status || 'ALL'}
                  onChange={(e) =>
                    onFilterChange({ ...filters, status: e.target.value as ExpenseStatus | 'ALL' })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="PAID">Pago</option>
                  <option value="PENDING">Pendente</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1.5">Forma de Pagamento</label>
                <select
                  value={filters.paymentMethod || 'ALL'}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      paymentMethod: e.target.value as PaymentMethod | 'ALL',
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                >
                  <option value="ALL">Todas as Formas de Pagamento</option>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1.5">Moto Específica</label>
                <select
                  value={filters.motorcycleId || 'ALL'}
                  onChange={(e) => onFilterChange({ ...filters, motorcycleId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                >
                  <option value="ALL">Todas as Motos</option>
                  {motorcycles.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.model} {m.plate ? `(${m.plate})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Resetar
              </button>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-xs font-bold text-slate-950"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
