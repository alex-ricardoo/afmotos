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
          description: string | null;
          ownership_type: string;
          operation_type: string;
          status: string;
          featured: boolean;
          license_plate: string | null;
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
          description?: string | null;
          ownership_type?: string;
          operation_type?: string;
          status?: string;
          featured?: boolean;
          license_plate?: string | null;
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
          description?: string | null;
          ownership_type?: string;
          operation_type?: string;
          status?: string;
          featured?: boolean;
          license_plate?: string | null;
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
