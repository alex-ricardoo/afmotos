export type ConsultationStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'completed'
  | 'retry_scheduled'
  | 'failed'
  | 'failed_permanent'
  | 'refund_pending'
  | 'refunded'
  | 'manual_review';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto';

export type PaymentSimulationStatus = 'pending' | 'confirmed' | 'cancelled';

export const CONSULTATION_PRICE_BRL = 39.9;

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  phone_normalized: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerPlateConsultation {
  id: string;
  user_id: string;
  plate: string;
  plate_normalized: string;
  vehicle_data: Record<string, unknown> | null;
  status: ConsultationStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_date: string | null;
  processed_at: string | null;
  source_consultation_id: string | null;
  latest_payment_transaction_id?: string | null;
  auto_refund_attempted?: boolean | null;
  lookup_error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentSimulation {
  id: string;
  consultation_id: string;
  user_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentSimulationStatus;
  simulated_at: string;
  confirmed_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface DashboardData {
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
  stats: {
    total_consultations: number;
    completed_consultations?: number;
  };
  recent_consultations: Array<{
    id: string;
    plate: string;
    plate_normalized: string;
    status: ConsultationStatus;
    created_at: string;
    vehicle_data: {
      brand?: string;
      model?: string;
      year?: string;
      color?: string;
      risk_level?: string;
    } | null;
  }>;
}

export interface ConsultationHistoryItem {
  id: string;
  plate: string;
  status: ConsultationStatus;
  payment_status: PaymentStatus;
  created_at: string;
  processed_at: string | null;
  vehicle_data: {
    brand?: string;
    model?: string;
    year_model?: number;
    color?: string;
  } | null;
}

export interface ConsultationHistoryResult {
  consultations: ConsultationHistoryItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ConsultationDetail {
  id: string;
  plate: string;
  plate_normalized: string;
  status: ConsultationStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_date: string | null;
  processed_at: string | null;
  created_at: string;
  vehicle_data: Record<string, unknown> | null;
  latest_payment_transaction_id?: string | null;
  auto_refund_attempted?: boolean | null;
  lookup_error_message?: string | null;
}

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  existing?: boolean;
  consultationId?: string;
}
