export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface MotorcycleImage {
  id: string;
  motorcycle_id: string;
  provider?: 'imgbb' | 'supabase' | string;
  storage_path?: string | null;
  public_url?: string | null;
  display_url?: string | null;
  thumbnail_url?: string | null;
  delete_url?: string | null;
  sort_order: number;
  is_primary: boolean;
  alt_text: string | null;
  created_at: string;
  updated_at?: string;
  url?: string;
}

export interface UploadMotorcycleImageInput {
  motorcycleId: string;
  file: File;
  altText?: string;
}

export interface Lead {
  id: string;
  type: string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  status: string;
  metadata?: any;
  created_at: string;
  updated_at?: string;
}

export interface RentalRequest {
  id: string;
  name: string;
  phone: string;
  age: number;
  has_cnh_a: 'Sim' | 'Provisória' | 'Não';
  purpose_of_use: string;
  motorcycle_id?: string | null;
  desired_plan: string;
  expected_start_date: string;
  status: 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED' | string;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SellRequest {
  id: string;
  lead_id?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  license_plate?: string | null;
  motorcycle_data?: Json;
  brand?: string | null;
  model?: string | null;
  year_manufacture?: number | null;
  year_model?: number | null;
  color?: string | null;
  mileage?: number | null;
  desired_price?: number | null;
  state?: string | null;
  city?: string | null;
  notes?: string | null;
  status: string;
  fipe_provider?: string | null;
  fipe_vehicle_type_id?: string | null;
  fipe_brand_id?: string | null;
  fipe_brand_name?: string | null;
  fipe_model_id?: string | null;
  fipe_model_name?: string | null;
  fipe_year_id?: string | null;
  fipe_year_label?: string | null;
  fipe_fuel_id?: string | null;
  fipe_fuel_name?: string | null;
  fipe_code?: string | null;
  fipe_price?: number | null;
  fipe_reference_period?: string | null;
  fipe_queried_at?: string | null;
  fipe_snapshot?: Json;
  offer_percentage?: number | null;
  estimated_offer?: number | null;
  offered_amount?: number | null;
  accepted_amount?: number | null;
  created_at: string;
  updated_at: string;
}

export interface SellRequestImage {
  id: string;
  sell_request_id: string;
  storage_path?: string | null;
  provider: string;
  public_url: string;
  delete_url?: string | null;
  sort_order: number;
  created_at: string;
}

export interface FipeConsultation {
  id: string;
  created_by: string;
  motorcycle_id: string | null;
  provider: string;
  provider_label: string;
  vehicle_type_id: string;
  vehicle_type_label: string | null;
  brand_id: string | null;
  brand_name: string;
  model_id: string | null;
  model_name: string;
  version_name: string | null;
  model_year: number | null;
  is_zero_km: boolean;
  fuel_id: string | null;
  fuel_name: string | null;
  fuel_acronym: string | null;
  reference_period_id: string | null;
  reference_month: number | null;
  reference_year: number | null;
  reference_label: string | null;
  fipe_code: string | null;
  fipe_price: number | null;
  currency: string;
  query_payload: Json;
  response_snapshot: Json;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  motorcycle_id: string;
  sale_price: number;
  sale_date: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  buyer_document: string | null;
  buyer_address: string | null;
  buyer_cep?: string | null;
  buyer_street?: string | null;
  buyer_number?: string | null;
  buyer_complement?: string | null;
  buyer_neighborhood?: string | null;
  buyer_city?: string | null;
  buyer_state?: string | null;
  payment_method: string | null;
  payment_status: string | null;
  amount_paid: number | null;
  entry_amount?: number | null;
  financed_amount?: number | null;
  trade_amount?: number | null;
  delivery_km?: number | null;
  renavam?: string | null;
  chassi?: string | null;
  legal_terms_accepted?: boolean;
  receipt_number: string | null;
  receipt_notes: string | null;
  consignment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  whatsapp_phone: string;
  contact_email?: string | null;
  address?: string | null;
  settings?: Json;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      motorcycles: {
        Row: {
          id: string;
          slug: string;
          internal_code: string;
          brand: string;
          model: string;
          version: string | null;
          year_manufacture: number;
          year_model: number;
          mileage: number | null;
          engine_capacity: number | null;
          fuel: string | null;
          transmission: string | null;
          color: string | null;
          price: number | null;
          fipe_price: number | null;
          description: string | null;
          ownership_type: string;
          operation_type: string;
          status: string;
          featured: boolean;
          license_plate: string | null;
          renavam?: string | null;
          chassi?: string | null;
          location: string | null;
          daily_rate: number | null;
          weekly_rate: number | null;
          monthly_rate: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          internal_code: string;
          brand: string;
          model: string;
          version?: string | null;
          year_manufacture: number;
          year_model: number;
          mileage?: number | null;
          engine_capacity?: number | null;
          fuel?: string | null;
          transmission?: string | null;
          color?: string | null;
          price?: number | null;
          fipe_price?: number | null;
          description?: string | null;
          ownership_type?: string;
          operation_type?: string;
          status?: string;
          featured?: boolean;
          license_plate?: string | null;
          renavam?: string | null;
          chassi?: string | null;
          location?: string | null;
          daily_rate?: number | null;
          weekly_rate?: number | null;
          monthly_rate?: number | null;
        };
        Update: {
          id?: string;
          slug?: string;
          internal_code?: string;
          brand?: string;
          model?: string;
          version?: string | null;
          year_manufacture?: number;
          year_model?: number;
          mileage?: number | null;
          engine_capacity?: number | null;
          fuel?: string | null;
          transmission?: string | null;
          color?: string | null;
          price?: number | null;
          fipe_price?: number | null;
          description?: string | null;
          ownership_type?: string;
          operation_type?: string;
          status?: string;
          featured?: boolean;
          license_plate?: string | null;
          renavam?: string | null;
          chassi?: string | null;
          location?: string | null;
          daily_rate?: number | null;
          weekly_rate?: number | null;
          monthly_rate?: number | null;
        };
      };
      motorcycle_images: {
        Row: MotorcycleImage;
        Insert: {
          id?: string;
          motorcycle_id: string;
          storage_path: string;
          sort_order?: number;
          is_primary?: boolean;
          alt_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          motorcycle_id?: string;
          storage_path?: string;
          sort_order?: number;
          is_primary?: boolean;
          alt_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: Lead;
        Insert: {
          id?: string;
          type: string;
          name: string;
          phone: string;
          email?: string | null;
          message?: string | null;
          status?: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          message?: string | null;
          status?: string;
          metadata?: any;
        };
      };
      sell_requests: {
        Row: SellRequest;
        Insert: {
          id?: string;
          lead_id?: string | null;
          name: string;
          phone: string;
          email?: string | null;
          license_plate?: string | null;
          motorcycle_data?: Json;
          brand?: string | null;
          model?: string | null;
          year_manufacture?: number | null;
          year_model?: number | null;
          color?: string | null;
          mileage?: number | null;
          desired_price?: number | null;
          state?: string | null;
          city?: string | null;
          notes?: string | null;
          status?: string;
          fipe_provider?: string | null;
          fipe_vehicle_type_id?: string | null;
          fipe_brand_id?: string | null;
          fipe_brand_name?: string | null;
          fipe_model_id?: string | null;
          fipe_model_name?: string | null;
          fipe_year_id?: string | null;
          fipe_year_label?: string | null;
          fipe_fuel_id?: string | null;
          fipe_fuel_name?: string | null;
          fipe_code?: string | null;
          fipe_price?: number | null;
          fipe_reference_period?: string | null;
          fipe_queried_at?: string | null;
          fipe_snapshot?: Json;
          offer_percentage?: number | null;
          estimated_offer?: number | null;
          offered_amount?: number | null;
          accepted_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          name?: string;
          phone?: string;
          email?: string | null;
          license_plate?: string | null;
          motorcycle_data?: Json;
          brand?: string | null;
          model?: string | null;
          year_manufacture?: number | null;
          year_model?: number | null;
          color?: string | null;
          mileage?: number | null;
          desired_price?: number | null;
          state?: string | null;
          city?: string | null;
          notes?: string | null;
          status?: string;
          fipe_provider?: string | null;
          fipe_vehicle_type_id?: string | null;
          fipe_brand_id?: string | null;
          fipe_brand_name?: string | null;
          fipe_model_id?: string | null;
          fipe_model_name?: string | null;
          fipe_year_id?: string | null;
          fipe_year_label?: string | null;
          fipe_fuel_id?: string | null;
          fipe_fuel_name?: string | null;
          fipe_code?: string | null;
          fipe_price?: number | null;
          fipe_reference_period?: string | null;
          fipe_queried_at?: string | null;
          fipe_snapshot?: Json;
          offer_percentage?: number | null;
          estimated_offer?: number | null;
          offered_amount?: number | null;
          accepted_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sell_request_images: {
        Row: SellRequestImage;
        Insert: {
          id?: string;
          sell_request_id: string;
          storage_path?: string | null;
          provider?: string;
          public_url: string;
          delete_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sell_request_id?: string;
          storage_path?: string | null;
          provider?: string;
          public_url?: string;
          delete_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      fipe_consultations: {
        Row: FipeConsultation;
        Insert: {
          id?: string;
          created_by: string;
          motorcycle_id?: string | null;
          provider?: string;
          provider_label?: string;
          vehicle_type_id: string;
          vehicle_type_label?: string | null;
          brand_id?: string | null;
          brand_name: string;
          model_id?: string | null;
          model_name: string;
          version_name?: string | null;
          model_year?: number | null;
          is_zero_km?: boolean;
          fuel_id?: string | null;
          fuel_name?: string | null;
          fuel_acronym?: string | null;
          reference_period_id?: string | null;
          reference_month?: number | null;
          reference_year?: number | null;
          reference_label?: string | null;
          fipe_code?: string | null;
          fipe_price?: number | null;
          currency?: string;
          query_payload?: Json;
          response_snapshot?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          motorcycle_id?: string | null;
          provider?: string;
          provider_label?: string;
          vehicle_type_id?: string;
          vehicle_type_label?: string | null;
          brand_id?: string | null;
          brand_name?: string;
          model_id?: string | null;
          model_name?: string;
          version_name?: string | null;
          model_year?: number | null;
          is_zero_km?: boolean;
          fuel_id?: string | null;
          fuel_name?: string | null;
          fuel_acronym?: string | null;
          reference_period_id?: string | null;
          reference_month?: number | null;
          reference_year?: number | null;
          reference_label?: string | null;
          fipe_code?: string | null;
          fipe_price?: number | null;
          currency?: string;
          query_payload?: Json;
          response_snapshot?: Json;
          notes?: string | null;
          created_at?: string;
        };
      };
      sales: {
        Row: Sale;
        Insert: {
          id?: string;
          motorcycle_id: string;
          sale_price: number;
          sale_date?: string;
          buyer_name?: string | null;
          buyer_phone?: string | null;
          buyer_email?: string | null;
          buyer_document?: string | null;
          buyer_address?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          amount_paid?: number | null;
          receipt_number?: string | null;
          receipt_notes?: string | null;
          consignment_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          motorcycle_id?: string;
          sale_price?: number;
          sale_date?: string;
          buyer_name?: string | null;
          buyer_phone?: string | null;
          buyer_email?: string | null;
          buyer_document?: string | null;
          buyer_address?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          amount_paid?: number | null;
          receipt_number?: string | null;
          receipt_notes?: string | null;
          consignment_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_settings: {
        Row: SiteSettings;
        Insert: {
          id?: string;
          site_name?: string;
          whatsapp_phone?: string;
          contact_email?: string | null;
          address?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_name?: string;
          whatsapp_phone?: string;
          contact_email?: string | null;
          address?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      rental_requests: {
        Row: RentalRequest;
        Insert: {
          id?: string;
          name: string;
          phone: string;
          age: number;
          has_cnh_a: 'Sim' | 'Provisória' | 'Não';
          purpose_of_use: string;
          motorcycle_id?: string | null;
          desired_plan: string;
          expected_start_date: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          age?: number;
          has_cnh_a?: 'Sim' | 'Provisória' | 'Não';
          purpose_of_use?: string;
          motorcycle_id?: string | null;
          desired_plan?: string;
          expected_start_date?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };

    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
