'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RefreshCw,
  FolderCog,
  Sparkles,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Expense,
  ExpenseCategory,
  ExpenseFilters,
  ExpenseSummaryMetrics,
  ExpenseStatus,
} from '@/types/expenses';
import {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
  updateExpenseStatusAction,
  duplicateExpenseAction,
  getExpensesAction,
  getExpenseSummaryAction,
  getExpenseCategoriesAction,
  getMotorcyclesForExpenseSelectAction,
} from './actions';
import { ExpenseDashboardSummary } from '@/components/admin/expenses/expense-dashboard-summary';
import { ExpenseList } from '@/components/admin/expenses/expense-list';
import { ExpenseFormModal } from '@/components/admin/expenses/expense-form-modal';
import { ExpenseFiltersBar } from '@/components/admin/expenses/expense-filters';
import { ExpenseDetailModal } from '@/components/admin/expenses/expense-detail-modal';
import { CategoryManagerModal } from '@/components/admin/expenses/category-manager-modal';
import { ExpenseCharts } from '@/components/admin/expenses/expense-charts';

// Formatar mês de competência (YYYY-MM-01) para exibição por extenso (ex: "Agosto de 2026")
function formatCompetenceMonthLabel(competenceStr: string): string {
  if (!competenceStr) return '';
  const [yearStr, monthStr] = competenceStr.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const monthName = date.toLocaleString('pt-BR', { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${date.getFullYear()}`;
}

// Obter o primeiro dia do mês atual no formato YYYY-MM-01
function getCurrentCompetenceMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export default function AdminExpensesPage() {
  const [competenceMonth, setCompetenceMonth] = useState<string>(getCurrentCompetenceMonth());
  const [filters, setFilters] = useState<ExpenseFilters>({
    expenseType: 'ALL',
    categoryId: 'ALL',
    status: 'ALL',
    paymentMethod: 'ALL',
    search: '',
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummaryMetrics>({
    totalMonth: 0,
    totalPaid: 0,
    totalPending: 0,
    totalMoto: 0,
    totalStore: 0,
    count: 0,
  });
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [motorcycles, setMotorcycles] = useState<
    { id: string; brand: string; model: string; plate?: string | null; primary_image_url?: string | null }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Carregar dados de resumo e lista
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [expensesRes, summaryRes, categoriesRes, motosRes] = await Promise.all([
        getExpensesAction({ ...filters, competenceMonth }),
        getExpenseSummaryAction(competenceMonth),
        getExpenseCategoriesAction(),
        getMotorcyclesForExpenseSelectAction(),
      ]);

      if (expensesRes && expensesRes.data) {
        setExpenses(expensesRes.data);
      }
      if (summaryRes) {
        setSummary(summaryRes);
      }
      if (categoriesRes) {
        setCategories(categoriesRes);
      }
      if (motosRes) {
        setMotorcycles(motosRes);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar dados financeiros.');
    } finally {
      setIsLoading(false);
    }
  }, [competenceMonth, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Avançar / retroceder mês de competência
  const handlePrevMonth = () => {
    const [yearStr, monthStr] = competenceMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) - 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    setCompetenceMonth(`${year}-${String(month).padStart(2, '0')}-01`);
  };

  const handleNextMonth = () => {
    const [yearStr, monthStr] = competenceMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    setCompetenceMonth(`${year}-${String(month).padStart(2, '0')}-01`);
  };

  const handleSaveExpense = async (data: any) => {
    let result;
    if (selectedExpense?.id) {
      result = await updateExpenseAction(selectedExpense.id, data);
    } else {
      result = await createExpenseAction(data);
    }

    if (!result.success) {
      toast.error(result.error || 'Erro ao salvar o gasto.');
      throw new Error(result.error);
    }

    toast.success(
      selectedExpense?.id ? 'Gasto atualizado com sucesso!' : 'Novo gasto cadastrado com sucesso!',
    );
    loadData();
  };

  const handleToggleStatus = async (id: string, newStatus: ExpenseStatus) => {
    const res = await updateExpenseStatusAction(id, newStatus);
    if (res.success) {
      toast.success(newStatus === 'PAID' ? 'Gasto marcado como Pago' : 'Gasto alterado para Pendente');
      loadData();
    } else {
      toast.error(res.error || 'Erro ao alterar status');
    }
  };

  const handleDuplicate = async (id: string) => {
    const res = await duplicateExpenseAction(id);
    if (res.success) {
      toast.success('Gasto duplicado com sucesso!');
      loadData();
    } else {
      toast.error(res.error || 'Erro ao duplicar gasto');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    const res = await deleteExpenseAction(expenseToDelete.id);
    if (res.success) {
      toast.success('Gasto excluído com sucesso.');
      setExpenseToDelete(null);
      loadData();
    } else {
      toast.error(res.error || 'Erro ao excluir o gasto.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto select-none animate-in fade-in duration-150">
      {/* Breadcrumb de Navegação */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
        <Link href="/admin" className="hover:text-white transition-colors">
          Admin
        </Link>
        <span>/</span>
        <span className="text-zinc-500">Financeiro</span>
        <span>/</span>
        <span className="text-[#e3c56c] font-semibold">Central de Gastos</span>
      </div>

      {/* 1. Header do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#e3c56c] flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Central de Gastos
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30">
                  Financeiro
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Controle detalhado de despesas operacionais da loja e custos acumulados por motocicleta.
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Ação e Competência */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seletor de Competência Mensal */}
          <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3.5 text-xs font-bold text-white min-w-[150px] justify-center">
              <CalendarIcon className="w-3.5 h-3.5 text-[#c9a44c]" />
              <span>{formatCompetenceMonthLabel(competenceMonth)}</span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
          >
            <FolderCog className="w-4 h-4 text-[#c9a44c]" />
            <span className="hidden sm:inline">Gerenciar Categorias</span>
          </button>

          <button
            onClick={() => {
              setSelectedExpense(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Gasto</span>
          </button>
        </div>
      </div>

      {/* 2. Cards de Resumo Financeiro (Dashboard) */}
      <ExpenseDashboardSummary
        summary={summary}
        selectedMonthLabel={formatCompetenceMonthLabel(competenceMonth)}
      />

      {/* 3. Gráficos Analíticos */}
      <ExpenseCharts expenses={expenses} categories={categories} />

      {/* 4. Barra de Filtros e Busca */}
      <ExpenseFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        categories={categories}
        motorcycles={motorcycles}
      />

      {/* 5. Lista de Gastos (Tabela Desktop / Cards Mobile) */}
      <ExpenseList
        expenses={expenses}
        onEdit={(exp) => {
          setSelectedExpense(exp);
          setIsFormOpen(true);
        }}
        onView={(exp) => {
          setSelectedExpense(exp);
          setIsDetailOpen(true);
        }}
        onDelete={(exp) => setExpenseToDelete(exp)}
        onToggleStatus={handleToggleStatus}
        onDuplicate={handleDuplicate}
        onAddNew={() => {
          setSelectedExpense(null);
          setIsFormOpen(true);
        }}
        isLoading={isLoading}
      />

      {/* Modais */}
      {isFormOpen && (
        <ExpenseFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveExpense}
          initialData={selectedExpense}
          categories={categories}
          motorcycles={motorcycles}
          defaultCompetenceMonth={competenceMonth}
        />
      )}

      {isDetailOpen && selectedExpense && (
        <ExpenseDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          expense={selectedExpense}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onCategoryCreated={loadData}
        />
      )}

      {/* Modal de Confirmação de Exclusão com Estilo Luxury */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-zinc-950/95 border border-zinc-800 p-6 space-y-4 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Confirmar Exclusão</h3>
                <p className="text-xs text-zinc-400">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/80">
              Tem certeza que deseja excluir o gasto{' '}
              <strong className="text-white font-bold">"{expenseToDelete.title}"</strong> no valor
              de{' '}
              <strong className="text-[#e3c56c] font-black">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  expenseToDelete.amount,
                )}
              </strong>
              ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-500 transition-all shadow-md cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
