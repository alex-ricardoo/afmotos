import { Json } from './database';

export type PurchaseAgreementPaymentStatus = 'PAID_FULL' | 'PAID_PARTIAL' | 'PENDING';
export type PurchaseAgreementTransferStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXEMPT';
export type PurchaseAgreementDocumentStatus = 'draft' | 'generated' | 'signed' | 'cancelled' | 'superseded';

export interface PurchaseAgreementStoreSnapshot {
  name: string;
  cnpj?: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  phone: string;
  email?: string | null;
  legal_representative?: string | null;
}

export interface PurchaseAgreementSellerSnapshot {
  customer_id?: string | null;
  person_type: 'PF' | 'PJ';
  full_name: string;
  document: string;
  rg?: string | null;
  phone: string;
  email?: string | null;
  address: string;
}

export interface PurchaseAgreementMotorcycleSnapshot {
  id?: string | null;
  brand: string;
  model: string;
  version?: string | null;
  year_manufacture: number;
  year_model: number;
  color?: string | null;
  fuel?: string | null;
  engine_capacity?: number | null;
  license_plate: string;
  renavam?: string | null;
  chassi?: string | null;
  engine_number?: string | null;
  mileage_at_delivery: number;
  fipe_code?: string | null;
  fipe_price?: number | null;
  fipe_reference?: string | null;
}

export interface PurchaseAgreementCommercialSnapshot {
  purchase_amount: number;
  paid_amount: number;
  payment_status: PurchaseAgreementPaymentStatus;
  payment_status_label: string;
  payment_method: string;
  payment_date: string;
  is_full_discharge: boolean;
  discharge_statement: string;
}

export interface PurchaseAgreementDeliverySnapshot {
  delivery_datetime: string;
  delivery_location: string;
  delivery_km: number;
  keys_count: number;
  has_manual: boolean;
  has_spare_key: boolean;
  documents_delivered: string[];
  accessories_delivered: string[];
  apparent_condition_notes?: string | null;
}

export interface PurchaseAgreementTransferSnapshot {
  transfer_status: PurchaseAgreementTransferStatus;
  transfer_deadline_date: string;
  transfer_deadline_days: number;
  legal_provisions: string;
}

export interface PurchaseAgreementDeclarationsSnapshot {
  legitimate_ownership_confirmed: boolean;
  civil_capacity_confirmed: boolean;
  no_undisclosed_debts_confirmed: boolean;
  no_judicial_or_financial_restrictions_confirmed: boolean;
  no_theft_sinister_auction_record_confirmed: boolean;
  engine_and_chassis_integrity_confirmed: boolean;
  cooperation_for_transfer_confirmed: boolean;
}

export interface PurchaseAgreementVehicleLookupSnapshot {
  consultation_id?: string | null;
  consulted_at?: string | null;
  risk_level?: string | null;
  summary_notes?: string | null;
}

export interface PurchaseAgreementSignaturesSnapshot {
  seller_name: string;
  seller_document: string;
  seller_role: string;
  buyer_name: string;
  buyer_document?: string | null;
  buyer_role: string;
  witness_1_name?: string | null;
  witness_1_document?: string | null;
  witness_2_name?: string | null;
  witness_2_document?: string | null;
}

export interface PurchaseAgreementSnapshot {
  schema_version: '1.0';
  generated_at: string;
  generated_by: {
    user_id: string;
    name?: string | null;
    email?: string | null;
  };
  store: PurchaseAgreementStoreSnapshot;
  seller: PurchaseAgreementSellerSnapshot;
  motorcycle: PurchaseAgreementMotorcycleSnapshot;
  commercial_terms: PurchaseAgreementCommercialSnapshot;
  delivery_and_possession: PurchaseAgreementDeliverySnapshot;
  transfer_and_compliance: PurchaseAgreementTransferSnapshot;
  seller_declarations: PurchaseAgreementDeclarationsSnapshot;
  vehicle_lookup_reference?: PurchaseAgreementVehicleLookupSnapshot | null;
  signatures: PurchaseAgreementSignaturesSnapshot;
}

export interface MotorcyclePurchaseAgreementRecord {
  id: string;
  motorcycle_id?: string | null;
  seller_customer_id?: string | null;
  sell_request_id?: string | null;
  vehicle_consultation_id?: string | null;
  agreement_number: string;
  agreement_version: number;
  previous_agreement_id?: string | null;
  replacement_reason?: string | null;
  purchase_amount: number;
  paid_amount: number;
  payment_status: PurchaseAgreementPaymentStatus;
  payment_method: string;
  payment_date: string;
  delivery_datetime: string;
  delivery_km?: number | null;
  keys_count: number;
  has_manual: boolean;
  has_spare_key: boolean;
  documents_delivered: string[];
  accessories_delivered: string[];
  apparent_condition_notes?: string | null;
  transfer_status: PurchaseAgreementTransferStatus;
  transfer_deadline_date: string;
  transfer_notes?: string | null;
  vehicle_condition_summary: Json;
  seller_declarations: Json;
  contract_snapshot: PurchaseAgreementSnapshot;
  pdf_storage_path: string;
  status: PurchaseAgreementDocumentStatus;
  signed_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseAgreementPrepareInput {
  motorcycle_id?: string | null;
  sell_request_id?: string | null;
  seller_customer_id?: string | null;
  vehicle_consultation_id?: string | null;

  seller_name: string;
  seller_document: string;
  seller_rg?: string | null;
  seller_phone: string;
  seller_email?: string | null;
  seller_address: string;

  brand: string;
  model: string;
  version?: string | null;
  year_manufacture: number;
  year_model: number;
  color?: string | null;
  fuel?: string | null;
  engine_capacity?: number | null;
  license_plate: string;
  renavam?: string | null;
  chassi?: string | null;
  engine_number?: string | null;
  mileage: number;
  fipe_code?: string | null;
  fipe_price?: number | null;

  purchase_amount: number;
  paid_amount: number;
  payment_status: PurchaseAgreementPaymentStatus;
  payment_method: string;
  payment_date: string;
  is_full_discharge_confirmed: boolean;

  delivery_datetime: string;
  delivery_km: number;
  keys_count: number;
  has_manual: boolean;
  has_spare_key: boolean;
  documents_delivered?: string[];
  accessories_delivered?: string[];
  apparent_condition_notes?: string | null;

  transfer_deadline_date: string;
  transfer_notes?: string | null;

  confirmed_data_accurate: boolean;
  confirmed_payment_realized: boolean;
  confirmed_vehicle_received: boolean;
}
