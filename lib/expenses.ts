import { createClient } from '@/lib/supabase/server';
import { Expense, ExpenseCategory, ExpenseFilters, ExpenseSummaryMetrics } from '@/types/expenses';

/**
 * Buscas todas as categorias de gastos ativas ordenadas
 */
export async function getExpenseCategoriesQuery(): Promise<ExpenseCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar categorias de gastos:', error);
    return [];
  }

  return (data as ExpenseCategory[]) || [];
}

/**
 * Busca lista simplificada de motos ativas/relevantes para o dropdown do formulário
 */
export async function getMotorcyclesForExpenseSelectQuery() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select(
      `
      id,
      brand,
      model,
      version,
      year_manufacture,
      year_model,
      price,
      status,
      license_plate,
      color,
      images:motorcycle_images(
        id,
        public_url,
        display_url,
        is_primary,
        storage_path
      )
    `,
    )
    .order('brand', { ascending: true })
    .order('model', { ascending: true });

  if (error) {
    console.error('Erro ao buscar motocicletas para gastos:', error);
    return [];
  }

  const rawMotos = data || [];
  return rawMotos.map((m: any) => {
    let primaryImageUrl = null;
    const primaryImg = (m.images || []).find((img: any) => img.is_primary) || (m.images || [])[0];
    if (primaryImg) {
      let url = primaryImg.display_url || primaryImg.public_url || primaryImg.storage_path;
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        const { data: publicUrlData } = supabase.storage
          .from('motorcycle-images')
          .getPublicUrl(primaryImg.storage_path || url);
        url = publicUrlData.publicUrl;
      }
      primaryImageUrl = url;
    }

    return {
      id: m.id,
      brand: m.brand,
      model: m.model,
      version: m.version,
      year_manufacture: m.year_manufacture,
      year_model: m.year_model,
      price: m.price,
      status: m.status,
      license_plate: m.license_plate,
      plate: m.license_plate,
      color: m.color,
      primary_image_url: primaryImageUrl,
    };
  });
}

/**
 * Busca lista de gastos filtrada com paginação e relacionamentos
 */
export async function getExpensesQuery(filters: ExpenseFilters) {
  const supabase = await createClient();

  let query = supabase.from('expenses').select(
    `
      *,
      category:expense_categories(*),
      motorcycle:motorcycles(
        id,
        brand,
        model,
        version,
        year_model,
        license_plate,
        status,
        images:motorcycle_images(public_url, display_url, is_primary, storage_path)
      )
    `,
    { count: 'exact' },
  );

  // Filtro por mês de competência
  if (filters.competenceMonth) {
    query = query.eq('competence_month', filters.competenceMonth);
  }

  // Filtro por tipo
  if (filters.expenseType && filters.expenseType !== 'ALL') {
    query = query.eq('expense_type', filters.expenseType);
  }

  // Filtro por categoria
  if (filters.categoryId && filters.categoryId !== 'ALL') {
    query = query.eq('category_id', filters.categoryId);
  }

  // Filtro por status
  if (filters.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status);
  }

  // Filtro por forma de pagamento
  if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
    query = query.eq('payment_method', filters.paymentMethod);
  }

  // Filtro por moto específica
  if (filters.motorcycleId && filters.motorcycleId !== 'ALL') {
    query = query.eq('motorcycle_id', filters.motorcycleId);
  }

  // Filtro por recorrência
  if (filters.isRecurring !== undefined) {
    query = query.eq('is_recurring', filters.isRecurring);
  }

  // Busca textual por título ou observações
  if (filters.search && filters.search.trim() !== '') {
    const searchTerm = `%${filters.search.trim()}%`;
    query = query.or(
      `title.ilike.${searchTerm},supplier_name.ilike.${searchTerm},notes.ilike.${searchTerm}`,
    );
  }

  // Ordenar pelos lançamentos mais recentes
  query = query
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  const { data, count, error } = await query;

  if (error) {
    console.error('Erro ao buscar lista de gastos:', error);
    return { data: [], count: 0, totalAmount: 0 };
  }

  const rawExpenses = (data as any[]) || [];
  const expenses = rawExpenses.map((exp) => {
    let moto = exp.motorcycle;
    if (moto) {
      let primaryImageUrl = null;
      const primaryImg = (moto.images || []).find((img: any) => img.is_primary) || (moto.images || [])[0];
      if (primaryImg) {
        let url = primaryImg.display_url || primaryImg.public_url || primaryImg.storage_path;
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          const { data: publicUrlData } = supabase.storage
            .from('motorcycle-images')
            .getPublicUrl(primaryImg.storage_path || url);
          url = publicUrlData.publicUrl;
        }
        primaryImageUrl = url;
      }
      moto = {
        ...moto,
        plate: moto.license_plate,
        primary_image_url: primaryImageUrl,
      };
    }
    return {
      ...exp,
      motorcycle: moto,
    } as Expense;
  });

  const totalAmount = expenses
    .filter((e) => e.status !== 'CANCELLED')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return {
    data: expenses,
    count: count || expenses.length,
    totalAmount,
  };
}

/**
 * Calcula os totais e métricas para o resumo do mês
 */
export async function getExpenseSummaryQuery(
  competenceMonth: string,
): Promise<ExpenseSummaryMetrics> {
  const supabase = await createClient();

  // Buscar todos os gastos da competência atual
  const { data: currentData, error: currentError } = await supabase
    .from('expenses')
    .select('amount, status, expense_type')
    .eq('competence_month', competenceMonth);

  if (currentError) {
    console.error('Erro ao buscar resumo de gastos:', currentError);
    return {
      totalMonth: 0,
      totalPaid: 0,
      totalPending: 0,
      totalMoto: 0,
      totalStore: 0,
      count: 0,
    };
  }

  const expenses = currentData || [];
  const validExpenses = expenses.filter((e) => e.status !== 'CANCELLED');

  const totalMonth = validExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalPaid = validExpenses
    .filter((e) => e.status === 'PAID')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalPending = validExpenses
    .filter((e) => e.status === 'PENDING')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalMoto = validExpenses
    .filter((e) => e.expense_type === 'MOTO')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalStore = validExpenses
    .filter((e) => e.expense_type === 'LOJA')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Calcular comparação com o mês anterior
  const [yearStr, monthStr] = competenceMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const prevMonthDate = new Date(year, month - 2, 1);
  const prevCompetenceMonth = `${prevMonthDate.getFullYear()}-${String(
    prevMonthDate.getMonth() + 1,
  ).padStart(2, '0')}-01`;

  const { data: prevData } = await supabase
    .from('expenses')
    .select('amount, status')
    .eq('competence_month', prevCompetenceMonth);

  let previousMonthTotal = 0;
  let comparisonPercentage: number | null = null;

  if (prevData && prevData.length > 0) {
    previousMonthTotal = prevData
      .filter((e) => e.status !== 'CANCELLED')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    if (previousMonthTotal > 0) {
      comparisonPercentage = ((totalMonth - previousMonthTotal) / previousMonthTotal) * 100;
    }
  }

  return {
    totalMonth,
    totalPaid,
    totalPending,
    totalMoto,
    totalStore,
    count: validExpenses.length,
    previousMonthTotal,
    comparisonPercentage,
  };
}

/**
 * Calcula os custos acumulados de uma motocicleta específica (no admin)
 */
export async function getMotorcycleExpenseStatsQuery(motorcycleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('expenses')
    .select('id, title, amount, expense_date, status, category:expense_categories(name)')
    .eq('motorcycle_id', motorcycleId)
    .neq('status', 'CANCELLED')
    .order('expense_date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar histórico de custos da moto:', error);
    return { totalCost: 0, count: 0, expenses: [] };
  }

  const items = data || [];
  const totalCost = items.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return {
    totalCost,
    count: items.length,
    expenses: items,
  };
}
