export type CreditLedgerEntryType =
  | 'grant'
  | 'reserve'
  | 'consume'
  | 'release'
  | 'expire'
  | 'adjustment_add'
  | 'adjustment_remove'
  | 'revoke';

export type PackageType =
  'manual_negotiated' | 'agency' | 'reseller' | 'promotional' | 'partner' | 'test';

export type PackageStatus = 'active' | 'exhausted' | 'expired' | 'suspended' | 'cancelled';

export type PaymentChannel =
  'whatsapp' | 'pix_manual' | 'bank_transfer' | 'cash' | 'invoice' | 'other';

export type ReservationStatus =
  'reserved' | 'consumed' | 'released' | 'expired' | 'revoked' | 'manual_review';

export interface CustomerCreditBalance {
  user_id: string;
  available_credits: number;
  reserved_credits: number;
  consumed_credits: number;
  updated_at: string;
  // Aliases for retrocompatibility:
  balance?: number;
}

export interface CustomerCreditPackage {
  id: string;
  user_id: string;
  package_name: string;
  package_type: PackageType;
  credits_granted: number;
  credits_remaining: number;
  status: PackageStatus;
  payment_channel: PaymentChannel;
  external_payment_reference?: string | null;
  unit_price_cents?: number | null;
  total_paid_cents?: number | null;
  currency: string;
  sales_note?: string | null;
  admin_note?: string | null;
  granted_by: string;
  granted_at: string;
  expires_at?: string | null;
  offer_id?: string | null;
  source?: CreditPackageSource;
  purchase_order_id?: string | null;
  purchase_price_cents?: number | null;
  purchase_currency?: string;
  purchased_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type CreditPackageSource =
  'manual_admin' | 'mercadopago_package' | 'promotional' | 'partner' | 'test';

export type CreditOfferType = 'standard' | 'agency' | 'reseller' | 'fleet' | 'custom';

export type CreditOrderStatus =
  | 'pending'
  | 'payment_in_process'
  | 'paid'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'manual_review';

export interface CreditPackageOffer {
  id: string;
  slug: string;
  name: string;
  short_label?: string | null;
  badge?: string | null;
  description?: string | null;
  tagline?: string | null;
  package_type: CreditOfferType;
  credits_quantity: number;
  price_cents: number;
  currency: string;
  reference_individual_price_cents?: number | null;
  discount_percent?: number | null;
  display_order: number;
  sort_order?: number;
  is_active: boolean;
  is_featured: boolean;
  highlight?: boolean;
  contact_only: boolean;
  requires_whatsapp: boolean;
  validity_days?: number | null;
  benefits?: string[] | null;
  perks?: string[] | null;
  terms_summary?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface CreditPackageOrder {
  id: string;
  user_id: string;
  offer_id: string;
  offer_name_snapshot: string;
  quantity: number;
  credits_quantity: number;
  price_cents: number;
  currency: string;
  unit_price_cents: number;
  reference_individual_price_cents?: number | null;
  discount_cents: number;
  discount_percent?: number | null;
  status: CreditOrderStatus;
  payment_transaction_id?: string | null;
  mp_preference_id?: string | null;
  mp_payment_id?: string | null;
  external_reference: string;
  idempotency_key: string;
  granted_at?: string | null;
  created_at: string;
  updated_at: string;
  paid_at?: string | null;
  cancelled_at?: string | null;
  refunded_at?: string | null;
}

export interface CustomerCreditReservation {
  id: string;
  user_id: string;
  package_id: string;
  consultation_id: string;
  status: ReservationStatus;
  quantity: number;
  reservation_idempotency_key: string;
  reserved_at: string;
  consumed_at?: string | null;
  released_at?: string | null;
  expired_at?: string | null;
  release_reason_code?: string | null;
  release_reason_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  user_id: string;
  package_id?: string | null;
  consultation_id?: string | null;
  reservation_id?: string | null;
  entry_type: CreditLedgerEntryType;
  quantity: number;
  available_effect: number;
  reserved_effect: number;
  consumed_effect: number;
  reason_code: string;
  reason_note?: string | null;
  created_by?: string | null;
  actor_type: 'admin' | 'customer' | 'system' | 'delivery_worker';
  idempotency_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
