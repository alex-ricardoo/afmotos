'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
  CreateExpenseCategorySchema,
  ExpenseStatus,
  ExpenseFilters,
} from '@/types/expenses';
import {
  getExpensesQuery,
  getExpenseSummaryQuery,
  getExpenseCategoriesQuery,
  getMotorcyclesForExpenseSelectQuery,
} from '@/lib/expenses';

interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Actions para buscar dados no lado do cliente
 */
export async function getExpensesAction(filters: ExpenseFilters) {
  return await getExpensesQuery(filters);
}

export async function getExpenseSummaryAction(competenceMonth: string) {
  return await getExpenseSummaryQuery(competenceMonth);
}

export async function getExpenseCategoriesAction() {
  return await getExpenseCategoriesQuery();
}

export async function getMotorcyclesForExpenseSelectAction() {
  return await getMotorcyclesForExpenseSelectQuery();
}

/**
 * Auxiliar para verificar autenticação de admin
 */
async function getAuthenticatedAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Sessão expirada ou não autenticada.');
  }

  // Verificar perfil admin se aplicável
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('role, is_active')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  return { supabase, user, profile };
}

/**
 * Action para criar novo gasto
 */
export async function createExpenseAction(formData: unknown): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedAdmin();

    const validatedData = CreateExpenseSchema.parse(formData);

    const paid_at = validatedData.status === 'PAID' ? new Date().toISOString() : null;

    const payload = {
      ...validatedData,
      paid_at,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('expenses').insert(payload).select().single();

    if (error) {
      console.error('Erro ao inserir gasto:', error);
      return { success: false, error: 'Falha ao salvar o gasto no banco de dados.' };
    }

    revalidatePath('/admin/gastos');
    return { success: true, data };
  } catch (err: any) {
    console.error('Erro em createExpenseAction:', err);
    return {
      success: false,
      error: err.errors?.[0]?.message || err.message || 'Erro inesperado ao salvar o gasto.',
    };
  }
}

/**
 * Action para atualizar gasto existente
 */
export async function updateExpenseAction(
  id: string,
  formData: unknown,
): Promise<ActionResult> {
  try {
    const { supabase } = await getAuthenticatedAdmin();

    if (!id) return { success: false, error: 'ID do gasto não informado.' };

    const validatedData = UpdateExpenseSchema.parse(formData);

    // Ajustar paid_at dependendo do status se foi alterado
    let extraPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.status === 'PAID') {
      extraPayload.paid_at = new Date().toISOString();
    } else if (validatedData.status === 'PENDING' || validatedData.status === 'CANCELLED') {
      extraPayload.paid_at = null;
    }

    const payload = {
      ...validatedData,
      ...extraPayload,
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar gasto:', error);
      return { success: false, error: 'Falha ao atualizar o gasto.' };
    }

    revalidatePath('/admin/gastos');
    return { success: true, data };
  } catch (err: any) {
    console.error('Erro em updateExpenseAction:', err);
    return {
      success: false,
      error: err.errors?.[0]?.message || err.message || 'Erro inesperado ao atualizar.',
    };
  }
}

/**
 * Action para atualizar rapidamente o status (PAID / PENDING / CANCELLED)
 */
export async function updateExpenseStatusAction(
  id: string,
  newStatus: ExpenseStatus,
): Promise<ActionResult> {
  try {
    const { supabase } = await getAuthenticatedAdmin();

    if (!id) return { success: false, error: 'ID inválido.' };

    const paid_at = newStatus === 'PAID' ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('expenses')
      .update({
        status: newStatus,
        paid_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao alterar status:', error);
      return { success: false, error: 'Falha ao alterar o status do gasto.' };
    }

    revalidatePath('/admin/gastos');
    return { success: true, data };
  } catch (err: any) {
    console.error('Erro em updateExpenseStatusAction:', err);
    return { success: false, error: err.message || 'Erro inesperado ao alterar status.' };
  }
}

/**
 * Action para excluir fisicamente um gasto (ou cancelar)
 */
export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getAuthenticatedAdmin();

    if (!id) return { success: false, error: 'ID inválido.' };

    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir gasto:', error);
      return { success: false, error: 'Falha ao excluir o registro.' };
    }

    revalidatePath('/admin/gastos');
    return { success: true };
  } catch (err: any) {
    console.error('Erro em deleteExpenseAction:', err);
    return { success: false, error: err.message || 'Erro inesperado ao excluir o gasto.' };
  }
}

/**
 * Action para duplicar um gasto para um novo mês de competência
 */
export async function duplicateExpenseAction(
  id: string,
  targetCompetenceMonth?: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedAdmin();

    const { data: original, error: fetchErr } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !original) {
      return { success: false, error: 'Gasto original não encontrado para duplicação.' };
    }

    // Definir novo mês de competência (ou o mesmo)
    let newCompetence = targetCompetenceMonth || original.competence_month;
    if (!targetCompetenceMonth) {
      // Avançar 1 mês por padrão
      const [y, m] = original.competence_month.split('-');
      const date = new Date(parseInt(y, 10), parseInt(m, 10), 1);
      newCompetence = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    }

    const newExpense = {
      title: `${original.title} (Cópia)`,
      description: original.description,
      amount: original.amount,
      expense_date: new Date().toISOString().split('T')[0],
      competence_month: newCompetence,
      category_id: original.category_id,
      expense_type: original.expense_type,
      motorcycle_id: original.motorcycle_id,
      payment_method: original.payment_method,
      status: 'PENDING' as ExpenseStatus, // duplicatas iniciam como PENDING por padrão
      is_recurring: original.is_recurring,
      recurrence_type: original.recurrence_type,
      recurrence_day: original.recurrence_day,
      supplier_name: original.supplier_name,
      invoice_number: original.invoice_number,
      notes: original.notes,
      paid_at: null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('expenses').insert(newExpense).select().single();

    if (error) {
      console.error('Erro ao duplicar gasto:', error);
      return { success: false, error: 'Falha ao gerar duplicata do gasto.' };
    }

    revalidatePath('/admin/gastos');
    return { success: true, data };
  } catch (err: any) {
    console.error('Erro em duplicateExpenseAction:', err);
    return { success: false, error: err.message || 'Erro ao duplicar gasto.' };
  }
}

/**
 * Action para criar nova categoria de gasto
 */
export async function createExpenseCategoryAction(formData: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await getAuthenticatedAdmin();

    const validatedData = CreateExpenseCategorySchema.parse(formData);

    const slug = validatedData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const payload = {
      ...validatedData,
      slug,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expense_categories')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      return { success: false, error: 'Falha ao criar nova categoria de gasto.' };
    }

    revalidatePath('/admin/gastos');
    return { success: true, data };
  } catch (err: any) {
    console.error('Erro em createExpenseCategoryAction:', err);
    return { success: false, error: err.message || 'Erro ao criar categoria.' };
  }
}
