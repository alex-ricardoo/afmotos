/**
 * Interface Contract: Public Forms and Server Action Mutations
 * File: specs/006-public-experience-evolution/contracts/leads-actions.contract.ts
 */

export interface CreateLeadPayload {
  type:
    | 'MOTORCYCLE_INTEREST'
    | 'SELL_MOTORCYCLE'
    | 'CONSIGNMENT'
    | 'RENTAL'
    | 'MOTORCYCLE_REQUEST'
    | 'GENERAL_CONTACT';
  name: string;
  phone: string;
  email?: string;
  motorcycle_id?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface CustomRentalRequestPayload {
  name: string;
  phone: string;
  email?: string;
  duration: string; // e.g. "1 mês", "3 meses", "6 meses", "1 ano", "Outro"
  start_date?: string;
  motorcycle_id?: string;
  preferred_model?: string;
  message?: string;
}

export interface SellMotorcyclePayload {
  name: string;
  phone: string;
  email?: string;
  brand: string;
  model: string;
  year_manufacture: number;
  year_model: number;
  mileage?: number;
  desired_price?: number;
  color?: string;
  notes?: string;
  images?: string[]; // storage paths or public URLs
}

export interface ActionResponse<T = undefined> {
  success?: boolean;
  data?: T;
  error?: string;
}
