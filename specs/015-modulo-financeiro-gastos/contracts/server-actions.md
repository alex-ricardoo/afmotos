# Server Actions & Query Contracts: Módulo Financeiro de Gastos

**Feature Branch**: `015-modulo-financeiro-gastos`

**Date**: 2026-08-24

## 1. Input Schemas & Validation Contracts (Zod)

### `CreateExpenseSchema`

```ts
import { z } from 'zod';

export const CreateExpenseSchema = z.object({
  title: z.string().min(2, 'O título é obrigatório (mínimo 2 caracteres)'),
  description: z.string().optional().nullable(),
  amount: z.coerce.number().positive('O valor deve ser maior que zero (R$)'),
  expense_date: z.string().min(1, 'A data do gasto é obrigatória'),
  competence_month: z.string().min(1, 'O mês de competência é obrigatório'),
  category_id: z.string().uuid('Categoria inválida'),
  expense_type: z.enum(['MOTO', 'LOJA']),
  motorcycle_id: z.string().uuid().optional().nullable(),
  payment_method: z.enum([
    'PIX', 'CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER', 'BOLETO', 'DIRECT_DEBIT', 'OTHER'
  ]).optional().nullable(),
  status: z.enum(['PAID', 'PENDING', 'CANCELLED']).default('PAID'),
  is_recurring: z.boolean().default(false),
  recurrence_type: z.enum(['NONE', 'MONTHLY', 'YEARLY']).optional().nullable(),
  recurrence_day: z.number().min(1).max(31).optional().nullable(),
  supplier_name: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((data) => {
  if (data.expense_type === 'MOTO' && !data.motorcycle_id) {
    return false;
  }
  return true;
}, {
  message: 'Selecione uma motocicleta para gastos do tipo MOTO',
  path: ['motorcycle_id'],
});
```

---

## 2. Server Action Functions

### `createExpenseAction(formData: CreateExpenseInput)`
- **Purpose**: Cadastra uma nova despesa no banco de dados.
- **Authentication**: Requer sessão de administrador autenticado via `lib/supabase/server.ts`.
- **Validation**: Valida via `CreateExpenseSchema`. Se `status === 'PAID'`, preenche `paid_at` com a hora atual.
- **Revalidation**: Revalida o caminho `/admin/gastos`.

### `updateExpenseAction(id: string, formData: UpdateExpenseInput)`
- **Purpose**: Atualiza os dados de uma despesa existente.
- **Authentication**: Requer sessão de administrador autenticado.
- **Behavior**: Atualiza campos e recalcula `updated_at`.

### `deleteExpenseAction(id: string)`
- **Purpose**: Remove fisicamente ou altera o status para `CANCELLED`.
- **Authentication**: Requer sessão de administrador autenticado.

### `updateExpenseStatusAction(id: string, status: 'PAID' | 'PENDING' | 'CANCELLED')`
- **Purpose**: Atualização rápida de status na lista ou cards.
- **Behavior**: Se `PAID`, atualiza `paid_at = now()`. Se `PENDING`, reseta `paid_at = null`.

---

## 3. Data Query Contracts

### `getExpensesQuery(filters: ExpenseFilters)`
- **Inputs**:
  - `competenceMonth?: string` (ex: "2026-08-01")
  - `search?: string` (filtra por título, descrição, fornecedor, placa ou modelo de moto)
  - `expenseType?: 'MOTO' | 'LOJA'`
  - `categoryId?: string`
  - `status?: 'PAID' | 'PENDING' | 'CANCELLED'`
  - `motorcycleId?: string`
  - `page?: number`
  - `pageSize?: number`
- **Returns**: `{ data: ExpenseWithRelations[], count: number, totalAmount: number }`

### `getExpenseSummaryQuery(competenceMonth: string)`
- **Returns**:
  ```ts
  interface ExpenseSummaryMetrics {
    totalMonth: number;
    totalPaid: number;
    totalPending: number;
    totalMoto: number;
    totalStore: number;
    count: number;
    previousMonthComparisonPercentage: number | null;
  }
  ```
