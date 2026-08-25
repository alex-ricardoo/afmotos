'use client';

import { useState } from 'react';
import { X, Plus, FolderPlus, Bike, Store, AlertCircle, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { ExpenseCategory, ExpenseType } from '@/types/expenses';
import { createExpenseCategoryAction } from '@/app/admin/(protected)/gastos/actions';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onCategoryCreated: () => void;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onCategoryCreated,
}: CategoryManagerModalProps) {
  const [name, setName] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType>('MOTO');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da categoria é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createExpenseCategoryAction({
        name,
        expense_type: expenseType,
        description: description || null,
        sort_order: categories.length + 1,
      });

      if (res.success) {
        toast.success('Nova categoria criada com sucesso!');
        setName('');
        setDescription('');
        onCategoryCreated();
      } else {
        setError(res.error || 'Erro ao criar categoria.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao criar categoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const motoCategories = categories.filter((c) => c.expense_type === 'MOTO');
  const storeCategories = categories.filter((c) => c.expense_type === 'LOJA');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Gerenciar Categorias</h3>
              <p className="text-xs text-slate-400">Classifique despesas por tipo de moto ou operação da loja.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-xs">
          {/* Formulário de Criação Rápida */}
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
          >
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              <span>Nova Categoria</span>
            </h4>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nome da categoria (ex: Lavagem)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
              />

              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
                className="h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all cursor-pointer"
              >
                <option value="MOTO">Gasto de Moto</option>
                <option value="LOJA">Gasto da Loja</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Descrição opcional..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-md cursor-pointer disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </form>

          {/* Listagem de Categorias Existentes */}
          <div className="space-y-4">
            {/* Categorias de Moto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bike className="w-4 h-4" />
                  <span>Categorias de Motos</span>
                </h5>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {motoCategories.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {motoCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 font-medium truncate flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorias da Loja */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-4 h-4" />
                  <span>Categorias Gerais da Loja</span>
                </h5>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {storeCategories.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {storeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 font-medium truncate flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
