import { createClient } from '@/lib/supabase/server';
import { normalizeBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import {
  toInternalVehicleConsultationDto,
  toVehicleConsultationSummaryDto,
} from '@/lib/vehicle-lookup/adapters/vehicle-summary';
import type {
  InternalVehicleConsultationDto,
  VehicleConsultationRecord,
  VehicleConsultationSummaryDto,
} from '@/lib/vehicle-lookup/types';

export interface GetConsultationsFilters {
  search?: string;
  brand?: string;
  riskLevel?: string;
  mode?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface GetConsultationsListResult {
  consultations: VehicleConsultationSummaryDto[];
  totalCount: number;
}

/**
 * Retrieves paginated list of vehicle consultations WITHOUT loading the heavy raw_response column.
 */
export async function getVehicleConsultationsList(
  filters: GetConsultationsFilters = {}
): Promise<GetConsultationsListResult> {
  const supabase = await createClient();
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  let query = supabase
    .from('vehicle_plate_consultations')
    .select(
      `
      id,
      plate_display,
      plate_normalized,
      brand,
      model,
      vehicle_type,
      year_manufacture,
      year_model,
      state,
      city,
      risk_level,
      has_active_theft_robbery,
      has_judicial_restriction,
      has_financial_restriction,
      has_active_gravamen,
      has_auction_record,
      has_accident_indication,
      has_debts,
      debts_total_amount,
      mode,
      is_mock,
      charged_amount,
      status,
      consulted_at,
      motorcycle_id,
      sell_request_id
    `,
      { count: 'exact' }
    );

  if (filters.search) {
    const term = filters.search.trim().toUpperCase();
    const normalized = normalizeBrazilianPlate(term);
    if (normalized) {
      query = query.or(`plate_normalized.ilike.%${normalized}%,brand.ilike.%${term}%,model.ilike.%${term}%`);
    } else {
      query = query.or(`brand.ilike.%${term}%,model.ilike.%${term}%`);
    }
  }

  if (filters.brand) {
    query = query.ilike('brand', `%${filters.brand}%`);
  }

  if (filters.riskLevel && filters.riskLevel !== 'ALL') {
    query = query.eq('risk_level', filters.riskLevel);
  }

  if (filters.mode && filters.mode !== 'ALL') {
    query = query.eq('mode', filters.mode);
  }

  if (filters.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status);
  }

  const { data, count, error } = await query
    .order('consulted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching vehicle consultations:', error);
    return { consultations: [], totalCount: 0 };
  }

  const summaries: VehicleConsultationSummaryDto[] = (data || []).map((row: any) =>
    toVehicleConsultationSummaryDto(row as VehicleConsultationRecord)
  );

  return {
    consultations: summaries,
    totalCount: count || 0,
  };
}

/**
 * Retrieves full consultation record by ID and parses it into InternalVehicleConsultationDto for the 9 tabs.
 */
export async function getVehicleConsultationById(
  id: string
): Promise<InternalVehicleConsultationDto | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vehicle_plate_consultations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const dto = toInternalVehicleConsultationDto(data as VehicleConsultationRecord);

  // Self-heal stale summary columns if raw_response exists and differs from cached DB fields
  if (
    data.raw_response &&
    (data.has_auction_record !== dto.summary.has_auction_record ||
      data.has_accident_indication !== dto.summary.has_accident_indication ||
      data.risk_level !== dto.summary.risk_level ||
      data.risk_index !== dto.summary.risk_index ||
      data.has_active_gravamen !== dto.summary.has_active_gravamen)
  ) {
    void Promise.resolve(
      supabase
        .from('vehicle_plate_consultations')
        .update({
          has_auction_record: dto.summary.has_auction_record,
          has_accident_indication: dto.summary.has_accident_indication,
          risk_level: dto.summary.risk_level,
          risk_index: dto.summary.risk_index,
          has_active_gravamen: dto.summary.has_active_gravamen,
        })
        .eq('id', id)
    ).catch((err: any) => console.warn('[VEHICLE_LOOKUP] Failed to self-heal consultation record:', err));
  }

  return dto;
}

/**
 * Fast lookup to check if a consultation already exists in cache for a given plate.
 */
export async function checkCacheForPlate(
  plate: string
): Promise<VehicleConsultationSummaryDto | null> {
  const supabase = await createClient();
  const normalized = normalizeBrazilianPlate(plate);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('vehicle_plate_consultations')
    .select(
      `
      id,
      plate_display,
      plate_normalized,
      brand,
      model,
      vehicle_type,
      year_manufacture,
      year_model,
      state,
      city,
      risk_level,
      has_active_theft_robbery,
      has_judicial_restriction,
      has_financial_restriction,
      has_active_gravamen,
      has_auction_record,
      has_accident_indication,
      has_debts,
      debts_total_amount,
      mode,
      is_mock,
      charged_amount,
      status,
      consulted_at,
      motorcycle_id,
      sell_request_id
    `
    )
    .eq('plate_normalized', normalized)
    .eq('status', 'COMPLETED')
    .order('mode', { ascending: false }) // live first
    .order('consulted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return toVehicleConsultationSummaryDto(data as VehicleConsultationRecord);
}

/**
 * Fetches motorcycle inventory for linking
 */
export async function getMotorcyclesForLinking(): Promise<
  Array<{ id: string; brand: string; model: string; year_model: number; license_plate: string | null }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('motorcycles')
    .select('id, brand, model, year_model, license_plate')
    .order('created_at', { ascending: false })
    .limit(100);

  return (data || []) as any;
}
