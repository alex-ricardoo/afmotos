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

  // 2. Fetch Total Count & Completed Count
  const [totalRes, completedRes] = await Promise.all([
    supabase
      .from('customer_plate_consultations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('customer_plate_consultations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed'),
  ]);

  const total_consultations = totalRes.count || 0;
  const completed_consultations = completedRes.count || 0;

  // 3. Fetch Last 4 Consultations for Rich Dashboard
  const { data: recent, error: recentError } = await supabase
    .from('customer_plate_consultations')
    .select('id, plate, plate_normalized, status, created_at, vehicle_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(4);

  const recentConsultations =
    recentError || !recent
      ? []
      : recent.map((item) => {
          const raw = (item.vehicle_data as any) || {};
          const d = raw.data || raw.dados || raw.dadosBasicosDoVeiculo || raw;

          let brand = d.marca || d.brand || d.dadosBasicosDoVeiculo?.marca;
          let model = d.modelo || d.model || d.dadosBasicosDoVeiculo?.modelo;
          if (!brand && d.marcaModelo && typeof d.marcaModelo === 'string') {
            const parts = d.marcaModelo.split('/');
            brand = parts[0]?.trim();
            model = parts[1]?.trim();
          }

          const year = d.anoModelo || d.ano_modelo || d.dadosBasicosDoVeiculo?.anoModelo;
          const color = d.corVeiculo || d.cor || d.baseEstadual?.cor;
          const riskLevel = d.analiseRisco?.classificacaoRisco || d.risk_level;

          return {
            id: item.id,
            plate: item.plate,
            plate_normalized: item.plate_normalized,
            status: item.status as ConsultationStatus,
            created_at: item.created_at,
            vehicle_data: (brand || model)
              ? {
                  brand: brand || undefined,
                  model: model || undefined,
                  year: year ? String(year) : undefined,
                  color: color || undefined,
                  risk_level: riskLevel || undefined,
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
      completed_consultations,
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
          const raw = (item.vehicle_data as any) || {};
          const d = raw.data || raw.dados || raw.dadosBasicosDoVeiculo || raw;

          let brand = d.marca || d.brand || d.dadosBasicosDoVeiculo?.marca;
          let model = d.modelo || d.model || d.dadosBasicosDoVeiculo?.modelo;
          if (!brand && d.marcaModelo && typeof d.marcaModelo === 'string') {
            const parts = d.marcaModelo.split('/');
            brand = parts[0]?.trim();
            model = parts[1]?.trim();
          }

          const year = d.anoModelo || d.ano_modelo || d.dadosBasicosDoVeiculo?.anoModelo;
          const color = d.corVeiculo || d.cor || d.baseEstadual?.cor;

          return {
            id: item.id,
            plate: item.plate,
            status: item.status as ConsultationStatus,
            payment_status: item.payment_status as PaymentStatus,
            created_at: item.created_at,
            processed_at: item.processed_at,
            vehicle_data: (brand || model)
              ? {
                  brand: brand || undefined,
                  model: model || undefined,
                  year_model: year ? parseInt(String(year), 10) : undefined,
                  color: color || undefined,
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

/**
 * Retrieves consultation record along with its parsed InternalVehicleConsultationDto (same as admin panel).
 */
export async function getCustomerConsultationWithDto(consultationId: string): Promise<{
  consultation: ConsultationDetail;
  dto: import('@/lib/vehicle-lookup/types').InternalVehicleConsultationDto | null;
} | null> {
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

  const consultation: ConsultationDetail = {
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

  let dto: import('@/lib/vehicle-lookup/types').InternalVehicleConsultationDto | null = null;

  if (data.status === 'completed') {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const { toInternalVehicleConsultationDto } = await import(
      '@/lib/vehicle-lookup/adapters/vehicle-summary'
    );
    const adminClient = createAdminClient();

    let vpcRecord: import('@/lib/vehicle-lookup/types').VehicleConsultationRecord | null = null;

    if (data.source_consultation_id) {
      const { data: vpc } = await adminClient
        .from('vehicle_plate_consultations')
        .select('*')
        .eq('id', data.source_consultation_id)
        .maybeSingle();

      if (vpc) {
        vpcRecord = vpc as import('@/lib/vehicle-lookup/types').VehicleConsultationRecord;
      }
    }

    if (!vpcRecord && data.vehicle_data) {
      vpcRecord = {
        id: data.id,
        plate_normalized: data.plate_normalized,
        plate_display: data.plate,
        consultation_type: 'veiculos-total',
        provider: 'apibrasil',
        raw_response: data.vehicle_data,
        response_schema_version: '1.0',
        status: 'COMPLETED',
        provider_status_code: 200,
        provider_error: false,
        provider_message: null,
        mode: 'mock',
        is_mock: true,
        is_chargeable: false,
        charged_amount: 0,
        provider_balance_before: null,
        provider_balance_after: null,
        provider_tax: null,
        vehicle_type: 'AUTOMOVEL',
        brand: 'VEÍCULO',
        model: 'CONSULTADO',
        vehicle_description: null,
        year_manufacture: 2021,
        year_model: 2022,
        color: 'N/I',
        state: 'SP',
        city: 'São Paulo',
        chassis_masked: null,
        renavam_masked: null,
        risk_level: 'LOW',
        risk_index: 10,
        has_active_theft_robbery: false,
        has_judicial_restriction: false,
        has_financial_restriction: false,
        has_active_gravamen: false,
        has_auction_record: false,
        has_accident_indication: false,
        has_debts: false,
        debts_total_amount: 0,
        confirmation_at: data.created_at,
        confirmed_by: user.id,
        confirmation_plate: data.plate,
        confirmation_message_version: 'v1.0',
        motorcycle_id: null,
        sell_request_id: null,
        consignment_id: null,
        lead_id: null,
        consulted_at: data.processed_at || data.created_at,
        consulted_by: user.id,
        pdf_generated_at: null,
        pdf_generation_count: 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }

    if (vpcRecord) {
      dto = toInternalVehicleConsultationDto(vpcRecord);
    }
  }

  return {
    consultation,
    dto,
  };
}
