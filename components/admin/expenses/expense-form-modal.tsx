'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Bike,
  Store,
  DollarSign,
  Calendar,
  AlertCircle,
  Check,
  Receipt,
  FileText,
  Clock,
  Layers,
  CreditCard,
  Tag,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Expense,
  ExpenseCategory,
  ExpenseType,
  ExpenseStatus,
  PaymentMethod,
  CreateExpenseSchema,
  PAYMENT_METHOD_LABELS,
} from '@/types/expenses';

interface MotorcycleOption {
  id: string;
  brand: string;
  model: string;
  version?: string | null;
  year_model?: number | null;
  plate?: string | null;
  license_plate?: string | null;
  primary_image_url?: string | null;
}

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: Expense | null;
  categories: ExpenseCategory[];
  motorcycles: MotorcycleOption[];
  defaultCompetenceMonth: string;
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  motorcycles,
  defaultCompetenceMonth,
}: ExpenseFormModalProps) {
  const isEditing = !!initialData?.id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType>('MOTO');
  const [motorcycleId, setMotorcycleId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('PIX');
  const [status, setStatus] = useState<ExpenseStatus>('PAID');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'NONE' | 'MONTHLY' | 'YEARLY'>('NONE');
  const [recurrenceDay, setRecurrenceDay] = useState<number>(10);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setAmount(initialData.amount ? String(initialData.amount) : '');
        setExpenseDate(initialData.expense_date || new Date().toISOString().split('T')[0]);
        setCategoryId(initialData.category_id || '');
        setExpenseType(initialData.expense_type || 'MOTO');
        setMotorcycleId(initialData.motorcycle_id || '');
        setPaymentMethod(initialData.payment_method || 'PIX');
        setStatus(initialData.status || 'PAID');
        setIsRecurring(initialData.is_recurring || false);
        setRecurrenceType(initialData.recurrence_type || 'NONE');
        setRecurrenceDay(initialData.recurrence_day || 10);
        setNotes(initialData.notes || '');
      } else {
        setTitle('');
        setDescription('');
        setAmount('');
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setExpenseType('MOTO');
        setMotorcycleId('');
        setPaymentMethod('PIX');
        setStatus('PAID');
        setIsRecurring(false);
        setRecurrenceType('NONE');
        setRecurrenceDay(10);
        setNotes('');

        // Selecionar primeira categoria adequada por padrão
        const firstCategory = categories.find((c) => c.expense_type === 'MOTO') || categories[0];
        if (firstCategory) setCategoryId(firstCategory.id);
      }
      setErrors({});
    }
  }, [isOpen, initialData, categories]);

  // Atualizar lista de categorias filtradas conforme o tipo escolhido
  const filteredCategories = categories.filter((c) => c.expense_type === expenseType);

  const selectedMotorcycle = motorcycles.find((m) => m.id === motorcycleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const numericAmount = parseFloat(amount.replace(',', '.'));

    // Calcular mês de competência automaticamente a partir da data do gasto (YYYY-MM-01)
    const [year, month] = (expenseDate || new Date().toISOString().split('T')[0]).split('-');
    const computedCompetenceMonth = `${year}-${month}-01`;

    const rawData = {
      title,
      description: description || null,
      amount: isNaN(numericAmount) ? 0 : numericAmount,
      expense_date: expenseDate,
      competence_month: computedCompetenceMonth,
      category_id: categoryId,
      expense_type: expenseType,
      motorcycle_id: expenseType === 'MOTO' ? motorcycleId || null : null,
      payment_method: paymentMethod || null,
      status,
      is_recurring: isRecurring,
      recurrence_type: isRecurring ? recurrenceType : 'NONE',
      recurrence_day: isRecurring ? recurrenceDay : null,
      supplier_name: null,
      invoice_number: null,
      notes: notes || null,
    };

    const validation = CreateExpenseSchema.safeParse(rawData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(rawData);
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Erro ao salvar o gasto' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#c9a44c] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isEditing ? 'Editar Gasto' : 'Adicionar Novo Gasto'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30">
                  {expenseType === 'MOTO' ? 'Moto' : 'Loja'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Preencha os dados e vincule despesas operacionais ou custos de veículos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1"
        >
          {errors.form && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-medium">{errors.form}</span>
            </div>
          )}

          {/* 1. SELEÇÃO DE TIPO & MOTO */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-3">
              <div className="w-7 h-7 rounded-lg bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#c9a44c] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bike className="w-4 h-4 text-[#c9a44c]" />
                  Identificação do Gasto & Veículo
                </h4>
                <p className="text-xs text-zinc-400">
                  Defina se este custo pertence a uma motocicleta específica ou à infraestrutura da
                  loja.
                </p>
              </div>
            </div>

            {/* Segmented Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setExpenseType('MOTO');
                  const firstCat = categories.find((c) => c.expense_type === 'MOTO');
                  if (firstCat) setCategoryId(firstCat.id);
                }}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  expenseType === 'MOTO'
                    ? 'bg-[#c9a44c]/15 border-[#c9a44c]/40 text-[#e3c56c] shadow-[0_0_15px_rgba(201,164,76,0.1)]'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    expenseType === 'MOTO'
                      ? 'bg-[#c9a44c] text-zinc-950 font-bold'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Gasto de Motocicleta</div>
                  <div className="text-xs text-zinc-400">
                    Peças, revisão, documentos, preparação
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpenseType('LOJA');
                  setMotorcycleId('');
                  const firstCat = categories.find((c) => c.expense_type === 'LOJA');
                  if (firstCat) setCategoryId(firstCat.id);
                }}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  expenseType === 'LOJA'
                    ? 'bg-[#c9a44c]/15 border-[#c9a44c]/40 text-[#e3c56c] shadow-[0_0_15px_rgba(201,164,76,0.1)]'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    expenseType === 'LOJA'
                      ? 'bg-[#c9a44c] text-zinc-950 font-bold'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Gasto Geral da Loja</div>
                  <div className="text-xs text-zinc-400">
                    Aluguel, energia, salários, marketing
                  </div>
                </div>
              </button>
            </div>

            {/* Seletor de Motocicleta em Estoque */}
            {expenseType === 'MOTO' && (
              <div className="pt-2">
                {selectedMotorcycle ? (
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-12 relative rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-800">
                        {selectedMotorcycle.primary_image_url ? (
                          <Image
                            src={selectedMotorcycle.primary_image_url}
                            alt={selectedMotorcycle.model}
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
                          {selectedMotorcycle.brand} {selectedMotorcycle.model}{' '}
                          {selectedMotorcycle.version || ''}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-zinc-400">
                          {selectedMotorcycle.year_model && (
                            <span>Ano: {selectedMotorcycle.year_model}</span>
                          )}
                          {(selectedMotorcycle.plate || selectedMotorcycle.license_plate) && (
                            <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] text-[#e3c56c] font-mono">
                              {selectedMotorcycle.plate || selectedMotorcycle.license_plate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMotorcycleId('')}
                      className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                    >
                      Trocar moto
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300 block">
                      Motocicleta em Estoque (Opcional ou Específica)
                    </label>
                    <select
                      value={motorcycleId}
                      onChange={(e) => setMotorcycleId(e.target.value)}
                      className="w-full h-12 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-[#c9a44c] transition-all cursor-pointer"
                    >
                      <option value="">Selecione uma moto em estoque (opcional)...</option>
                      {motorcycles.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.brand} {m.model} {m.version || ''}{' '}
                          {m.plate || m.license_plate
                            ? `(Placa: ${m.plate || m.license_plate})`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. INFORMAÇÕES FINANCEIRAS PRINCIPAIS */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-3">
              <div className="w-7 h-7 rounded-lg bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#c9a44c] flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#c9a44c]" />
                  Valores & Categorização
                </h4>
                <p className="text-xs text-zinc-400">
                  Informe o título descritivo, categoria financeira e valores correspondentes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300 block">
                  Título do Gasto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Troca de óleo Motul, Aluguel do mês, Pintura"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 transition-all"
                />
                {errors.title && (
                  <p className="text-xs text-rose-400 font-medium">{errors.title}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300 block">
                  Categoria <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 transition-all cursor-pointer"
                >
                  <option value="" disabled>
                    Selecione uma categoria...
                  </option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-xs text-rose-400 font-medium">{errors.category_id}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300 block">
                  Valor (R$) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-sm placeholder-zinc-500 focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 transition-all"
                />
                {errors.amount && (
                  <p className="text-xs text-rose-400 font-medium">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300 block">
                  Data do Gasto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 transition-all cursor-pointer"
                />
                {errors.expense_date && (
                  <p className="text-xs text-rose-400 font-medium">{errors.expense_date}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300 block">
                  Status do Pagamento <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
                  className="w-full h-12 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 transition-all cursor-pointer"
                >
                  <option value="PAID">Pago / Quitado</option>
                  <option value="PENDING">Pendente de Pagamento</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300 block">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full h-12 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 transition-all cursor-pointer"
                >
                  <option value="">Não informado</option>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. RECORRÊNCIA E OBSERVACÕES */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-3">
              <div className="w-7 h-7 rounded-lg bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#c9a44c] flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#c9a44c]" />
                  Recorrência & Observações
                </h4>
                <p className="text-xs text-zinc-400">
                  Configure repetições periódicas ou adicione detalhes complementares.
                </p>
              </div>
            </div>

            {/* Recorrência Switch */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white block">Gasto Recorrente</span>
                  <span className="text-xs text-zinc-400 block">
                    Marque se esta despesa se repete periodicamente (ex: Aluguel, Internet,
                    Software)
                  </span>
                </div>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={(checked) => {
                    setIsRecurring(checked);
                    if (checked && recurrenceType === 'NONE') {
                      setRecurrenceType('MONTHLY');
                    }
                  }}
                />
              </div>

              {isRecurring && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-800 animate-in fade-in-50">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-medium">Frequência</label>
                    <select
                      value={recurrenceType}
                      onChange={(e) => setRecurrenceType(e.target.value as any)}
                      className="w-full h-11 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:border-[#c9a44c] focus:outline-none"
                    >
                      <option value="MONTHLY">Mensal</option>
                      <option value="YEARLY">Anual</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-medium">Dia de Vencimento</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={recurrenceDay}
                      onChange={(e) => setRecurrenceDay(parseInt(e.target.value, 10) || 1)}
                      className="w-full h-11 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-bold focus:border-[#c9a44c] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300 block">
                Observações Adicionais
              </label>
              <textarea
                rows={2}
                placeholder="Detalhes adicionais, peças substituídas, termos de garantia ou acordos..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 transition-all resize-none custom-scrollbar"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3 sticky bottom-0 bg-zinc-950 py-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Gasto' : 'Salvar Novo Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
