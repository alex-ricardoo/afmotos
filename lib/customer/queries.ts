import { createClient } from '@/lib/supabase/server';
import type {
  CustomerProfile,
  DashboardData,
  ConsultationHistoryResult,
  ConsultationDetail,
  ConsultationStatus,
  PaymentStatus,
  PaymentMethod,
} from './types';
import { normalizeBrazilianPlate } from '@/lib/vehicle-lookup/plate';

/**
 * Get the profile of the currently authenticated customer.
 */
export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    // If auth user exists but profile row doesn't, provide fallback from auth metadata
    const metadata = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email || '',
      full_name: metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Cliente',
      phone: null,
      phone_normalized: null,
      date_of_birth: null,
      avatar_url: metadata.avatar_url || metadata.picture || null,
      address_street: null,
      address_number: null,
      address_complement: null,
      address_neighborhood: null,
      address_city: null,
      address_state: null,
      address_zip: null,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString(),
    };
  }

  return data as CustomerProfile;
}

/**
 * Get dashboard statistics, customer profile summary and recent consultations.
 */
export async function getCustomerDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch Profile
  const profile = await getCustomerProfile();

  // 2. Fetch Total Count
  const { count, error: countError } = await supabase
    .from('customer_plate_consultations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const total_consultations = countError || count === null ? 0 : count;

  // 3. Fetch Last 3 Consultations
  const { data: recent, error: recentError } = await supabase
    .from('customer_plate_consultations')
    .select('id, plate, plate_normalized, status, created_at, vehicle_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const recentConsultations =
    recentError || !recent
      ? []
      : recent.map((item) => {
          const vd = (item.vehicle_data as Record<string, unknown>) || null;
          return {
            id: item.id,
            plate: item.plate,
            plate_normalized: item.plate_normalized,
            status: item.status as ConsultationStatus,
            created_at: item.created_at,
            vehicle_data: vd
              ? {
                  brand: (vd.marca as string) || (vd.brand as string) || undefined,
                  model: (vd.modelo as string) || (vd.model as string) || undefined,
                }
              : null,
          };
        });

  return {
    profile: {
      full_name: profile?.full_name || 'Cliente',
      avatar_url: profile?.avatar_url || null,
    },
    stats: {
      total_consultations,
    },
    recent_consultations: recentConsultations,
  };
}

/**
 * Get paginated consultation history with optional plate filter.
 */
export async function getConsultationHistory(
  page = 1,
  plateFilter?: string
): Promise<ConsultationHistoryResult> {
  const pageSize = 20;
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      consultations: [],
      total_count: 0,
      page: currentPage,
      page_size: pageSize,
      total_pages: 0,
    };
  }

  let query = supabase
    .from('customer_plate_consultations')
    .select('id, plate, status, payment_status, created_at, processed_at, vehicle_data', {
      count: 'exact',
    })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (plateFilter && plateFilter.trim()) {
    const normalizedFilter = normalizeBrazilianPlate(plateFilter.trim());
    query = query.ilike('plate_normalized', `%${normalizedFilter || plateFilter.trim()}%`);
  }

  const { data, error, count } = await query.range(from, to);

  const totalCount = error || count === null ? 0 : count;
  const totalPages = Math.ceil(totalCount / pageSize);

  const consultations =
    error || !data
      ? []
      : data.map((item) => {
          const vd = (item.vehicle_data as Record<string, unknown>) || null;
          return {
            id: item.id,
            plate: item.plate,
            status: item.status as ConsultationStatus,
            payment_status: item.payment_status as PaymentStatus,
            created_at: item.created_at,
            processed_at: item.processed_at,
            vehicle_data: vd
              ? {
                  brand: (vd.marca as string) || (vd.brand as string) || undefined,
                  model: (vd.modelo as string) || (vd.model as string) || undefined,
                  year_model: (vd.ano_modelo as number) || (vd.year_model as number) || undefined,
                  color: (vd.cor as string) || (vd.color as string) || undefined,
                }
              : null,
          };
        });

  return {
    consultations,
    total_count: totalCount,
    page: currentPage,
    page_size: pageSize,
    total_pages: totalPages,
  };
}

/**
 * Get single consultation detail. Returns null if not found or not owned by the customer.
 */
export async function getConsultationDetail(
  consultationId: string
): Promise<ConsultationDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('customer_plate_consultations')
    .select('*')
    .eq('id', consultationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    plate: data.plate,
    plate_normalized: data.plate_normalized,
    status: data.status as ConsultationStatus,
    payment_status: data.payment_status as PaymentStatus,
    payment_method: data.payment_method as PaymentMethod | null,
    payment_date: data.payment_date,
    processed_at: data.processed_at,
    created_at: data.created_at,
    vehicle_data: (data.vehicle_data as Record<string, unknown>) || null,
  };
}
