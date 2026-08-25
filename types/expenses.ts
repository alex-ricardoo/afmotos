import { z } from 'zod';

export type ExpenseType = 'MOTO' | 'LOJA';
export type ExpenseStatus = 'PAID' | 'PENDING' | 'CANCELLED';
export type PaymentMethod =
  'PIX' | 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'TRANSFER' | 'BOLETO' | 'DIRECT_DEBIT' | 'OTHER';
export type RecurrenceType = 'NONE' | 'MONTHLY' | 'YEARLY';

export interface ExpenseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  expense_type: ExpenseType;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  expense_date: string;
  competence_month: string;
  category_id: string;
  expense_type: ExpenseType;
  motorcycle_id?: string | null;
  payment_method?: PaymentMethod | null;
  status: ExpenseStatus;
  is_recurring: boolean;
  recurrence_type?: RecurrenceType | null;
  recurrence_day?: number | null;
  supplier_name?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  paid_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  category?: ExpenseCategory | null;
  motorcycle?: {
    id: string;
    brand: string;
    model: string;
    version?: string | null;
    year_model?: number | null;
    plate?: string | null;
    primary_image_url?: string | null;
    status: string;
  } | null;
}

export interface ExpenseFilters {
  competenceMonth?: string;
  search?: string;
  expenseType?: ExpenseType | 'ALL';
  categoryId?: string | 'ALL';
  status?: ExpenseStatus | 'ALL';
  paymentMethod?: PaymentMethod | 'ALL';
  motorcycleId?: string | 'ALL';
  isRecurring?: boolean;
}

export interface ExpenseSummaryMetrics {
  totalMonth: number;
  totalPaid: number;
  totalPending: number;
  totalMoto: number;
  totalStore: number;
  count: number;
  previousMonthTotal?: number;
  comparisonPercentage?: number | null;
}

// Zod Schemas
export const BaseExpenseSchema = z.object({
  title: z.string().min(2, 'O título é obrigatório (mínimo 2 caracteres)'),
  description: z.string().optional().nullable(),
  amount: z.coerce.number().positive('O valor deve ser maior que zero (R$)'),
  expense_date: z.string().min(1, 'A data do gasto é obrigatória'),
  competence_month: z.string().optional().nullable(),
  category_id: z.string().uuid('Categoria inválida'),
  expense_type: z.enum(['MOTO', 'LOJA']),
  motorcycle_id: z.string().uuid().optional().nullable(),
  payment_method: z
    .enum([
      'PIX',
      'CASH',
      'DEBIT_CARD',
      'CREDIT_CARD',
      'TRANSFER',
      'BOLETO',
      'DIRECT_DEBIT',
      'OTHER',
    ])
    .optional()
    .nullable(),
  status: z.enum(['PAID', 'PENDING', 'CANCELLED']).default('PAID'),
  is_recurring: z.boolean().default(false),
  recurrence_type: z.enum(['NONE', 'MONTHLY', 'YEARLY']).optional().nullable(),
  recurrence_day: z.number().min(1).max(31).optional().nullable(),
  supplier_name: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const CreateExpenseSchema = BaseExpenseSchema.refine(
  (data) => {
    if (data.expense_type === 'MOTO' && !data.motorcycle_id) {
      return false;
    }
    return true;
  },
  {
    message: 'Selecione uma motocicleta para gastos do tipo MOTO',
    path: ['motorcycle_id'],
  },
);

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

export const UpdateExpenseSchema = BaseExpenseSchema.partial().refine(
  (data) => {
    if (data.expense_type === 'MOTO' && !data.motorcycle_id) {
      return false;
    }
    return true;
  },
  {
    message: 'Selecione uma motocicleta para gastos do tipo MOTO',
    path: ['motorcycle_id'],
  },
);
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;

export const CreateExpenseCategorySchema = z.object({
  name: z.string().min(2, 'O nome da categoria é obrigatório'),
  expense_type: z.enum(['MOTO', 'LOJA']),
  description: z.string().optional().nullable(),
  sort_order: z.number().default(0),
});
export type CreateExpenseCategoryInput = z.infer<typeof CreateExpenseCategorySchema>;

// Humanized Labels Mappers
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: 'Pix',
  CASH: 'Dinheiro',
  DEBIT_CARD: 'Cartão de Débito',
  CREDIT_CARD: 'Cartão de Crédito',
  TRANSFER: 'Transferência Bancária',
  BOLETO: 'Boleto',
  DIRECT_DEBIT: 'Débito Automático',
  OTHER: 'Outro',
};

export const STATUS_LABELS: Record<ExpenseStatus, { label: string; badgeClass: string }> = {
  PAID: {
    label: 'Pago',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  PENDING: {
    label: 'Pendente',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  CANCELLED: {
    label: 'Cancelado',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
};

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, { label: string; badgeClass: string }> = {
  MOTO: {
    label: 'Gasto de Moto',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  LOJA: {
    label: 'Gasto da Loja',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
};
