export type CustomerSource =
  | 'manual'
  | 'website_sell_request'
  | 'website_consignment_request'
  | 'website_contact'
  | 'sale_registration'
  | 'rental_registration'
  | 'admin_proposal'
  | 'imported'
  | 'other';

export type CustomerGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  phone_normalized: string;
  whatsapp: string | null;
  whatsapp_normalized: string | null;
  email: string | null;
  email_normalized: string | null;
  cpf: string | null;
  cpf_normalized: string | null;
  rg: string | null;
  gender: CustomerGender | null;
  birth_date: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  source: CustomerSource;
  source_detail: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type CustomerInsert = Omit<
  Customer,
  'id' | 'created_at' | 'updated_at' | 'phone_normalized' | 'whatsapp_normalized' | 'email_normalized' | 'cpf_normalized'
> & {
  phone_normalized?: string;
  whatsapp_normalized?: string | null;
  email_normalized?: string | null;
  cpf_normalized?: string | null;
};

export type CustomerUpdate = Partial<CustomerInsert>;

export interface CustomerRelationshipCounts {
  sales_count: number;
  sell_requests_count: number;
  leads_count: number;
  consignments_count: number;
  rentals_count: number;
  rental_requests_count: number;
  total_relationships: number;
}

export interface CustomerWithRelationshipCounts extends Customer {
  relationships?: CustomerRelationshipCounts;
}
