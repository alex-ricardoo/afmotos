import { createClient } from '@/lib/supabase/server';
import { Customer, CustomerWithRelationshipCounts, CustomerRelationshipCounts } from '@/types/customer';
import { CustomerSearchParams } from '@/lib/validations/customer';
import { cleanNumeric } from '@/lib/utils/customer-normalizers';

export interface GetCustomersResult {
  data: CustomerWithRelationshipCounts[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getCustomers(params: CustomerSearchParams): Promise<GetCustomersResult> {
  const supabase = await createClient();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' });

  // 1. Filtro de Status Ativo/Inativo
  if (params.status === 'active') {
    query = query.eq('is_active', true);
  } else if (params.status === 'inactive') {
    query = query.eq('is_active', false);
  }

  // 2. Filtro de Origem
  if (params.source && params.source !== 'all') {
    query = query.eq('source', params.source);
  }

  // 3. Filtro de Sexo
  if (params.gender && params.gender !== 'all') {
    query = query.eq('gender', params.gender);
  }

  // 4. Filtro de Data
  if (params.date_range && params.date_range !== 'all') {
    const now = new Date();
    if (params.date_range === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte('created_at', startOfDay);
    } else if (params.date_range === '7d') {
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', d7);
    } else if (params.date_range === '30d') {
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', d30);
    } else if (params.date_range === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte('created_at', startOfMonth);
    }
  }

  // 5. Busca por texto livre (nome, telefone, email, cpf)
  if (params.q && params.q.trim().length > 0) {
    const term = params.q.trim();
    const digits = cleanNumeric(term);

    if (digits.length >= 3) {
      query = query.or(
        `full_name.ilike.%${term}%,phone_normalized.like.%${digits}%,cpf_normalized.like.%${digits}%,email_normalized.ilike.%${term}%`,
      );
    } else {
      query = query.or(`full_name.ilike.%${term}%,email_normalized.ilike.%${term}%`);
    }
  }

  // Ordenação e paginação
  query = query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching customers:', error);
    return { data: [], totalCount: 0, page, limit, totalPages: 0 };
  }

  const customersList = (data || []) as Customer[];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Buscar contagens de relacionamentos para a página atual se houver registros
  const customersWithCounts: CustomerWithRelationshipCounts[] = await Promise.all(
    customersList.map(async (c) => {
      const counts = await getCustomerRelationshipCounts(c.id, supabase);
      return {
        ...c,
        relationships: counts,
      };
    }),
  );

  return {
    data: customersWithCounts,
    totalCount,
    page,
    limit,
    totalPages,
  };
}

export async function getCustomerRelationshipCounts(
  customerId: string,
  client?: any,
): Promise<CustomerRelationshipCounts> {
  const supabase = client || (await createClient());

  const [salesRes, sellReqRes, leadsRes, rentalsRes, rentalReqRes] = await Promise.all([
    supabase.from('sales').select('id', { count: 'exact', head: true }).eq('customer_id', customerId),
    supabase.from('sell_requests').select('id', { count: 'exact', head: true }).eq('customer_id', customerId),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('customer_id', customerId),
    supabase.from('rentals').select('id', { count: 'exact', head: true }).eq('customer_id', customerId),
    supabase.from('rental_requests').select('id', { count: 'exact', head: true }).eq('customer_id', customerId),
  ]);

  const sales_count = salesRes.count || 0;
  const sell_requests_count = sellReqRes.count || 0;
  const leads_count = leadsRes.count || 0;
  const rentals_count = rentalsRes.count || 0;
  const rental_requests_count = rentalReqRes.count || 0;
  const consignments_count = 0; // Calculado se aplicável

  const total_relationships =
    sales_count + sell_requests_count + leads_count + rentals_count + rental_requests_count + consignments_count;

  return {
    sales_count,
    sell_requests_count,
    leads_count,
    consignments_count,
    rentals_count,
    rental_requests_count,
    total_relationships,
  };
}

export interface CustomerFullDetails extends CustomerWithRelationshipCounts {
  sales: any[];
  sell_requests: any[];
  leads: any[];
  rentals: any[];
  rental_requests: any[];
}

export async function getCustomerById(id: string): Promise<CustomerFullDetails | null> {
  const supabase = await createClient();

  const { data: customerData, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !customerData) {
    return null;
  }

  const customer = customerData as Customer;

  // Carregar dados de relacionamentos em paralelo
  const [salesRes, sellReqRes, leadsRes, rentalsRes, rentalReqRes] = await Promise.all([
    supabase
      .from('sales')
      .select('*, motorcycle:motorcycles(id, brand, model, year_model, price, status, license_plate)')
      .eq('customer_id', id)
      .order('sale_date', { ascending: false }),
    supabase
      .from('sell_requests')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('leads')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('rentals')
      .select('*, motorcycle:motorcycles(id, brand, model, year_model)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('rental_requests')
      .select('*, motorcycle:motorcycles(id, brand, model, year_model)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const sales = salesRes.data || [];
  const sell_requests = sellReqRes.data || [];
  const leads = leadsRes.data || [];
  const rentals = rentalsRes.data || [];
  const rental_requests = rentalReqRes.data || [];

  const counts: CustomerRelationshipCounts = {
    sales_count: sales.length,
    sell_requests_count: sell_requests.length,
    leads_count: leads.length,
    consignments_count: 0,
    rentals_count: rentals.length,
    rental_requests_count: rental_requests.length,
    total_relationships:
      sales.length + sell_requests.length + leads.length + rentals.length + rental_requests.length,
  };

  return {
    ...customer,
    relationships: counts,
    sales,
    sell_requests,
    leads,
    rentals,
    rental_requests,
  };
}

export async function searchCustomersForSale(term: string): Promise<Customer[]> {
  if (!term || term.trim().length < 2) {
    return [];
  }

  const supabase = await createClient();
  const cleanTerm = term.trim();
  const digits = cleanNumeric(cleanTerm);

  let query = supabase
    .from('customers')
    .select('*')
    .eq('is_active', true);

  if (digits.length >= 3) {
    query = query.or(
      `full_name.ilike.%${cleanTerm}%,phone_normalized.like.%${digits}%,cpf_normalized.like.%${digits}%,email_normalized.ilike.%${cleanTerm}%`,
    );
  } else {
    query = query.or(`full_name.ilike.%${cleanTerm}%,email_normalized.ilike.%${cleanTerm}%`);
  }

  const { data, error } = await query
    .order('full_name', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error searching customers for sale:', error);
    return [];
  }

  return (data || []) as Customer[];
}

export interface CustomerMetrics {
  total: number;
  active: number;
  buyers: number;
  newThisMonth: number;
}

export async function getCustomerMetrics(): Promise<CustomerMetrics> {
  const supabase = await createClient();

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [totalRes, activeRes, monthRes, salesRes] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('sales').select('customer_id').not('customer_id', 'is', null),
  ]);

  const uniqueBuyers = new Set((salesRes.data || []).map((s: any) => s.customer_id)).size;

  return {
    total: totalRes.count || 0,
    active: activeRes.count || 0,
    buyers: uniqueBuyers,
    newThisMonth: monthRes.count || 0,
  };
}

