// Types for Public Vehicle Report Sharing, Security Tokens, and Audit Events

export type VehicleReportShareStatus = 'active' | 'revoked' | 'expired' | 'disabled';

export type ShareEventType =
  | 'SHARE_CREATED'
  | 'SHARE_OPENED'
  | 'SHARE_PDF_REQUESTED'
  | 'SHARE_PRINT_REQUESTED'
  | 'SHARE_REVOKED'
  | 'SHARE_INVALID_ATTEMPT';

export interface VehicleReportShareRecord {
  id: string;
  consultation_id: string;
  token_hash: string;
  status: VehicleReportShareStatus;
  created_at: string;
  created_by: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  expires_at: string | null;
  last_accessed_at: string | null;
  access_count: number;
  last_pdf_download_at: string | null;
  pdf_download_count: number;
  last_print_at: string | null;
  print_count: number;
  metadata: Record<string, unknown> | null;
  updated_at: string;
}

export interface VehicleReportShareEventRecord {
  id: string;
  share_id: string | null;
  consultation_id: string;
  event_type: ShareEventType;
  created_at: string;
  ip_hash: string | null;
  user_agent_category: 'MOBILE' | 'DESKTOP' | 'BOT' | 'OTHER';
  is_success: boolean;
  event_data: Record<string, unknown> | null;
}

export interface ShareCreationResult {
  share_id: string;
  consultation_id: string;
  share_token: string;
  share_url: string;
  created_at: string;
}

export interface ShareRevocationParams {
  share_id: string;
  reason?: string;
}

/** Sanitized DTO delivered safely to client and PDF engine (LGPD compliant) */
export interface PublicVehicleReportDto {
  share_id?: string;
  consultation_id?: string;
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
  verdict_bullets: string[];
  risk_score?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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

  is_mock: boolean;
  disclaimer: string;
  issuer: {
    company_name: string;
    trade_name: string;
    cnpj: string;
    city: string;
    state: string;
  };
}

export interface AdminVehicleShareDetailsDto {
  hasActiveShare: boolean;
  activeShare?: {
    id: string;
    status: VehicleReportShareStatus;
    createdAt: string;
    createdByName?: string;
    lastAccessedAt: string | null;
    accessCount: number;
    lastPdfDownloadAt: string | null;
    pdfDownloadCount: number;
    lastPrintAt: string | null;
    printCount: number;
  };
  latestRevocation?: {
    revokedAt: string;
    revokedByName?: string;
    reason: string | null;
  };
}
