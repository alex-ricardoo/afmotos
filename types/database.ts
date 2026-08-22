export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface MotorcycleImage {
  id: string;
  motorcycle_id: string;
  storage_path: string;
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
