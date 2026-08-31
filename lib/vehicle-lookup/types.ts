// Types for Vehicle Plate Lookup Domain, Database Entities, and DTOs

export type VehicleLookupMode = 'mock' | 'live';

export type VehicleConsultationStatus =
  | 'PENDING_CONFIRMATION'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CHARGE_STATUS_UNKNOWN';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface VehicleConsultationRecord {
  id: string;
  plate_normalized: string;
  plate_display: string;
  consultation_type: string;
  provider: string;
  raw_response: Record<string, unknown>;
  response_schema_version: string;
  status: VehicleConsultationStatus;
  provider_status_code: number | null;
  provider_error: boolean;
  provider_message: string | null;
  mode: VehicleLookupMode;
  is_mock: boolean;
  is_chargeable: boolean;
  charged_amount: number;
  provider_balance_before: number | null;
  provider_balance_after: number | null;
  provider_tax: number | null;
  vehicle_type: string | null;
  brand: string | null;
  model: string | null;
  vehicle_description: string | null;
  year_manufacture: number | null;
  year_model: number | null;
  color: string | null;
  state: string | null;
  city: string | null;
  chassis_masked: string | null;
  renavam_masked: string | null;
  risk_level: RiskLevel | null;
  risk_index: number | null;
  has_active_theft_robbery: boolean | null;
  has_judicial_restriction: boolean | null;
  has_financial_restriction: boolean | null;
  has_active_gravamen: boolean | null;
  has_auction_record: boolean | null;
  has_accident_indication: boolean | null;
  has_debts: boolean | null;
  debts_total_amount: number | null;
  confirmation_at: string | null;
  confirmed_by: string | null;
  confirmation_plate: string | null;
  confirmation_message_version: string | null;
  motorcycle_id: string | null;
  sell_request_id: string | null;
  consignment_id: string | null;
  lead_id: string | null;
  consulted_at: string;
  consulted_by: string;
  pdf_generated_at: string | null;
  pdf_generation_count: number;
  created_at: string;
  updated_at: string;
}

/** Lightweight DTO for administrative listing without heavy JSON payload */
export interface VehicleConsultationSummaryDto {
  id: string;
  plate_display: string;
  plate_normalized: string;
  brand: string;
  model: string;
  vehicle_type: string | null;
  year_manufacture: number | null;
  year_model: number | null;
  color?: string | null;
  state: string | null;
  city: string | null;
  risk_level: RiskLevel;
  has_active_theft_robbery: boolean;
  has_judicial_restriction: boolean;
  has_financial_restriction: boolean;
  has_active_gravamen: boolean;
  has_auction_record: boolean;
  has_accident_indication: boolean;
  has_debts: boolean;
  debts_total_amount: number;
  mode: VehicleLookupMode;
  is_mock: boolean;
  charged_amount: number;
  status: VehicleConsultationStatus;
  consulted_at: string;
  motorcycle_id: string | null;
  sell_request_id: string | null;
}

/** Structured internal DTO for Admin 9-Tabs Detail View */
export interface InternalVehicleConsultationDto {
  id: string;
  plate_display: string;
  plate_normalized: string;
  status: VehicleConsultationStatus;
  mode: VehicleLookupMode;
  is_mock: boolean;
  charged_amount: number;
  consulted_at: string;
  consulted_by: string;
  pdf_generated_at: string | null;
  pdf_generation_count: number;

  // Domain links
  motorcycle_id: string | null;
  sell_request_id: string | null;
  consignment_id: string | null;
  lead_id: string | null;

  // Tab 1: Summary & Risk Matrix
  summary: {
    brand: string;
    model: string;
    version: string;
    year_fab_mod: string;
    color: string;
    city_state: string;
    risk_level: RiskLevel;
    risk_index: number;
    has_active_theft_robbery: boolean;
    has_judicial_restriction: boolean;
    has_financial_restriction: boolean;
    has_active_gravamen: boolean;
    has_auction_record: boolean;
    has_accident_indication: boolean;
    has_debts: boolean;
    debts_total_amount: number;
  };

  // Tab 2: Vehicle Data
  vehicle_data: {
    plate: string;
    chassis: string;
    chassis_masked: string;
    renavam: string;
    renavam_masked: string;
    engine_number: string;
    engine_masked: string;
    brand: string;
    model: string;
    vehicle_type: string;
    species: string;
    fuel: string;
    power: string;
    displacement: string;
    color: string;
    year_manufacture: number | null;
    year_model: number | null;
    state: string;
    city: string;
    origin: string;
    seat_capacity: number | null;
  };

  // Tab 3: Debts & Financial state
  debts: {
    total_amount: number;
    has_ipva_debts: boolean;
    ipva_amount: number;
    has_licensing_debts: boolean;
    licensing_amount: number;
    has_fines: boolean;
    fines_amount: number;
    fines_count: number;
    fines_list: Array<{
      id?: string;
      auto_infraction?: string;
      description?: string;
      organ?: string;
      date?: string;
      amount?: number;
      status?: string;
    }>;
    ipva_list: Array<{
      year?: number;
      quota?: string;
      amount?: number;
      status?: string;
    }>;
  };

  // Tab 4: Restrictions & Gravames
  restrictions: {
    has_financial_restriction: boolean;
    financial_restriction_type: string;
    has_active_gravamen: boolean;
    gravamen_status: string;
    financial_institution: string;
    contract_number: string;
    inclusion_date: string;
    has_judicial_restriction: boolean;
    judicial_restriction_type: string;
    judicial_court: string;
    has_administrative_restriction: boolean;
    administrative_restriction_details: string;
    has_theft_robbery_alert: boolean;
    theft_robbery_details: string;
  };

  // Tab 5: History, Owners, Auction & Claims
  history: {
    owners_count: number;
    previous_owners: Array<{
      state?: string;
      period?: string;
      document_type?: 'PF' | 'PJ';
      masked_document?: string;
    }>;
    has_auction: boolean;
    auction_records: Array<{
      auctioneer?: string;
      auction_date?: string;
      lot?: string;
      condition?: string;
      category?: string;
    }>;
    has_claims: boolean;
    claims_records: Array<{
      claim_type?: string;
      claim_date?: string;
      damage_level?: 'PEQUENA' | 'MEDIA' | 'GRANDE';
      insurance_company?: string;
    }>;
    recalls: Array<{
      announcement_date?: string;
      component?: string;
      risk_description?: string;
      status?: 'PENDENTE' | 'ATENDIDO';
    }>;
  };

  // Tab 6: FIPE Pricing
  fipe: {
    code: string;
    model_name: string;
    price: number;
    reference_month: string;
    currency: string;
    variations: Array<{
      code?: string;
      model?: string;
      price?: number;
      fuel?: string;
    }>;
    price_history: Array<{
      reference?: string;
      price?: number;
    }>;
  };

  // Tab 7: Ads & Mileage
  ads_mileage: {
    mileage_records: Array<{
      date?: string;
      mileage?: number;
      source?: string;
    }>;
    ads_records: Array<{
      portal?: string;
      date?: string;
      price?: number;
      mileage?: number;
      url?: string;
    }>;
  };

  // Tab 8: Technical Specs
  technical_specs: {
    gearbox: string;
    traction: string;
    axles: number | null;
    gross_weight: string;
    max_traction_capacity: string;
    body_type: string;
    category: string;
  };

  // Tab 9: Raw JSON for technical inspection
  raw_response: Record<string, unknown>;
}

/** Customer-facing DTO for Clean, Safe & Comprehensive Institutional PDF */
export interface CustomerVehicleReportDto {
  consultation_id: string;
  consulted_at: string;
  plate_display: string;
  brand: string;
  model: string;
  version?: string;
  vehicle_type: string;
  species?: string;
  year_manufacture: number | null;
  year_model: number | null;
  color: string;
  fuel: string;
  power?: string;
  displacement?: string;
  engine_capacity: string;
  city_state: string;
  chassis_masked: string;
  renavam_masked: string;
  engine_masked: string;
  origin?: string;
  seat_capacity?: number;
  gearbox?: string;
  traction?: string;
  body_type?: string;

  procedural_verdict: 'APPROVED' | 'ATTENTION' | 'RESTRICTED';
  verdict_label: string;
  verdict_description: string;
  verdict_bullets?: string[];
  risk_score?: number;
  risk_level?: RiskLevel;

  risk_summary: {
    theft_robbery_clear: boolean;
    judicial_clear: boolean;
    financial_clear: boolean;
    auction_clear: boolean;
    accident_clear: boolean;
    recall_clear: boolean;
    debts_clear: boolean;
  };

  fipe_reference?: {
    code: string;
    model: string;
    price: number;
    reference_month: string;
  };
  fipe_variations?: Array<{
    code?: string;
    model?: string;
    price?: number;
    fuel?: string;
  }>;
  fipe_price_history?: Array<{
    reference?: string;
    price?: number;
  }>;

  debts_summary?: {
    total_debts: number;
    ipva_pending: number;
    licensing_pending: number;
    fines_pending: number;
    fines_count?: number;
  };

  gravamen_details?: {
    has_active_gravamen: boolean;
    status_label: string;
    agent?: string;
    contract?: string;
    inclusion_date?: string;
    financial_restriction?: string;
    judicial_restriction?: string;
    administrative_restriction?: string;
    theft_robbery_status?: string;
  };

  auction_details?: {
    has_auction: boolean;
    status_label: string;
    description?: string;
    records: Array<{
      auctioneer?: string;
      auction_date?: string;
      lot?: string;
      condition?: string;
      category?: string;
    }>;
  };

  claims_details?: {
    has_claims: boolean;
    status_label: string;
    description?: string;
    records: Array<{
      claim_type?: string;
      claim_date?: string;
      damage_level?: string;
      insurance_company?: string;
    }>;
  };

  owners_history?: {
    owners_count: number;
    records: Array<{
      state?: string;
      period?: string;
      document_type?: 'PF' | 'PJ';
      masked_document?: string;
    }>;
  };

  mileage_history?: Array<{
    date?: string;
    mileage?: number;
    source?: string;
  }>;

  ads_history?: Array<{
    portal?: string;
    date?: string;
    price?: number;
    mileage?: number;
  }>;

  recalls?: Array<{
    announcement_date?: string;
    component?: string;
    risk_description?: string;
    status?: 'PENDENTE' | 'ATENDIDO';
  }>;

  recalls_summary?: {
    total_count: number;
    pending_count: number;
    status_label: string;
  };

  latest_km_record?: {
    mileage: number;
    date?: string;
    source?: string;
    announced_price?: number;
  };

  commercial_indicators?: {
    has_rental_record: boolean;
    rental_label: string;
    sale_communication: string;
    has_sale_communication: boolean;
    vehicle_status: string;
  };

  disclaimer: string;
  issuer: {
    company_name: string;
    trade_name: string;
    cnpj: string;
    city: string;
    state: string;
  };
}
