/**
 * Types and Interfaces for Mercado Pago Checkout Pro Integration
 */

export type PaymentTransactionStatus =
  | 'pending'
  | 'approved'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'
  | 'provider_error'
  | 'pending_reconciliation';

export type ConsultationPaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type ConsultationLifecycleStatus =
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

export type ProviderFailureClass = 'transient' | 'permanent' | 'unknown';

export type DeliveryJobStatus =
  'pending' | 'processing' | 'completed' | 'retry_scheduled' | 'failed_permanent';

export interface ConsultationDeliveryJobRecord {
  id: string;
  consultation_id: string;
  transaction_id: string;
  job_type: string;
  status: DeliveryJobStatus;
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string;
  locked_at: string | null;
  locked_by: string | null;
  lock_expires_at: string | null;
  provider: string;
  last_error_code: string | null;
  last_error_message_safe: string | null;
  last_http_status: number | null;
  last_failure_class: ProviderFailureClass | null;
  last_attempt_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentRefundStatus =
  'none' | 'requested' | 'pending' | 'confirmed' | 'failed' | 'manual_review';

export interface PaymentRefundRecord {
  id: string;
  transaction_id: string;
  consultation_id: string;
  provider: string;
  provider_payment_id: string;
  provider_refund_id: string | null;
  amount_cents: number;
  currency: string;
  status: PaymentRefundStatus;
  reason_code: string;
  reason_safe: string;
  idempotency_key: string;
  request_attempts: number;
  requested_at: string;
  confirmed_at: string | null;
  failed_at: string | null;
  last_error_code: string | null;
  last_error_safe: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionRecord {
  id: string;
  consultation_id: string;
  user_id: string;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  status: PaymentTransactionStatus;
  status_detail: string | null;
  payment_method_id: string | null;
  payment_type_id: string | null;
  transaction_amount: number;
  net_received_amount: number | null;
  installments: number;
  payer_email: string | null;
  payer_identification_type?: string | null;
  payer_identification_number?: string | null;
  idempotency_key: string;
  failure_code: string | null;
  failure_message_safe: string | null;
  refund_status: 'none' | 'pending' | 'refunded' | 'failed';
  refund_amount: number | null;
  refunded_at: string | null;
  mp_refund_id: string | null;
  raw_response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePreferenceParams {
  consultationId: string;
  transactionId: string;
  userId: string;
  customerEmail: string;
  unitPrice: number;
  plate: string;
}

export interface CreatePreferenceResult {
  preferenceId: string;
  redirectUrl: string;
  initPoint: string;
  sandboxInitPoint: string;
  environment: 'test' | 'production';
}

export interface TransactionStatusResponse {
  success: boolean;
  transactionId: string;
  consultationId: string;
  status: PaymentTransactionStatus;
  statusDetail: string | null;
  consultationStatus: ConsultationLifecycleStatus;
  paymentStatus: ConsultationPaymentStatus;
  reportAvailable: boolean;
  reportUrl?: string;
  retryable: boolean;
  nextAction: 'view_report' | 'wait' | 'retry' | 'contact_support';
  customerTitle?: string;
  customerMessage?: string;
  nextRetryAt?: string | null;
  remainingRetrySeconds?: number;
  retryAttempt?: number;
  maxRetryAttempts?: number;
  canProcessDelivery?: boolean;
  refundStatus?: PaymentRefundStatus | string;
  mpRefundId?: string | null;
}

export type WebhookRejectionReason =
  | 'missing_webhook_secret'
  | 'invalid_json'
  | 'missing_resource_id'
  | 'missing_signature'
  | 'missing_request_id'
  | 'missing_signature_timestamp'
  | 'missing_signature_digest'
  | 'invalid_digest_format'
  | 'digest_length_mismatch'
  | 'signature_mismatch';

export interface WebhookVerificationResult {
  isValid: boolean;
  reason?: string;
  reasonCode?: WebhookRejectionReason;
  timestamp?: string;
  resourceId?: string;
  manifestHash?: string;
  manifestLength?: number;
  receivedDigestLength?: number;
  expectedDigestLength?: number;
}

export interface ReconciliationResponse {
  success: boolean;
  transactionId: string;
  status: PaymentTransactionStatus;
  statusDetail: string | null;
  reportUnlocked: boolean;
  reportUrl?: string;
  message: string;
}
