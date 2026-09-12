/**
 * Mercado Pago & Vehicle Consultation Payment Types
 */

export type MercadoPagoPaymentStatus =
  | 'pending'
  | 'approved'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';

export type RefundStatus = 'none' | 'pending' | 'refunded' | 'failed';

export type PaymentMethodType =
  'credit_card' | 'debit_card' | 'bank_transfer' | 'ticket' | 'account_money';

export interface PaymentTransaction {
  id: string;
  consultation_id: string;
  user_id: string;
  mp_payment_id: string | null;
  mp_preference_id?: string | null;
  idempotency_key?: string | null;
  status: MercadoPagoPaymentStatus;
  status_detail?: string | null;
  payment_method_id?: string | null;
  payment_type_id?: PaymentMethodType | string | null;
  transaction_amount: number;
  net_received_amount?: number | null;
  installments: number;
  payer_email?: string | null;
  payer_identification_type?: string | null;
  payer_identification_number?: string | null;
  refund_status: RefundStatus;
  refund_amount?: number | null;
  refunded_at?: string | null;
  refund_reason?: string | null;
  mp_refund_id?: string | null;
  failure_code?: string | null;
  failure_message_safe?: string | null;
  raw_response?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEventRecord {
  id: string;
  event_id?: string | null;
  event_type: string;
  action?: string | null;
  mp_resource_id?: string | null;
  signature_valid: boolean;
  processing_status: 'pending' | 'processed' | 'ignored' | 'failed';
  processing_error?: string | null;
  payload: Record<string, unknown>;
  headers?: Record<string, unknown> | null;
  processed_at?: string | null;
  created_at: string;
}

export interface ConsultationAuditLog {
  id: string;
  consultation_id: string;
  transaction_id?: string | null;
  actor_id?: string | null;
  actor_type: 'customer' | 'system' | 'admin' | 'webhook';
  event:
    | 'payment_created'
    | 'payment_approved'
    | 'payment_rejected'
    | 'lookup_started'
    | 'lookup_completed'
    | 'lookup_failed'
    | 'refund_initiated'
    | 'refund_completed'
    | 'refund_failed'
    | 'admin_reconciliation';
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface BrickPayerAddress {
  zip_code: string;
  street_name: string;
  street_number: string;
  neighborhood: string;
  city: string;
  federal_unit: string;
  complement?: string;
}

export interface PaymentPreferenceData {
  consultationId: string;
  plate: string;
  amount: number;
  publicKey: string;
  payerEmail: string;
  payerName?: string;
  payerAddress?: {
    zipCode?: string;
    streetName?: string;
    streetNumber?: string;
    neighborhood?: string;
    city?: string;
    federalUnit?: string;
    complement?: string;
  };
}

export interface BrickSubmitFormData {
  payment_method_id: string;
  token?: string;
  installments?: number;
  issuer_id?: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
    address?: BrickPayerAddress;
  };
}

export interface ProcessBrickPaymentResult {
  success: boolean;
  status: MercadoPagoPaymentStatus | 'lookup_failed_refunded';
  statusDetail?: string;
  paymentId?: string;
  consultationId: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  error?: string;
}
