import { SupabaseClient } from '@supabase/supabase-js';
import { Customer, CustomerSource } from '@/types/customer';
import {
  normalizeCpf,
  normalizePhone,
  normalizeEmail,
  cleanNumeric,
} from '@/lib/utils/customer-normalizers';

export interface DuplicateCheckInput {
  cpf?: string | null;
  phone?: string | null;
  email?: string | null;
  excludeId?: string | null;
}

export interface DuplicateCandidatesResult {
  cpfMatch: Customer | null;
  phoneMatches: Customer[];
  emailMatches: Customer[];
  hasExactCpfMatch: boolean;
  hasPhoneMatch: boolean;
  hasEmailMatch: boolean;
}

export async function findDuplicateCandidates(
  supabase: SupabaseClient,
  input: DuplicateCheckInput,
): Promise<DuplicateCandidatesResult> {
  const normCpf = normalizeCpf(input.cpf);
  const normPhone = normalizePhone(input.phone);
  const normEmail = normalizeEmail(input.email);

  let cpfMatch: Customer | null = null;
  let phoneMatches: Customer[] = [];
  let emailMatches: Customer[] = [];

  // 1. CPF (identificador forte)
  if (normCpf && normCpf.length === 11) {
    let query = supabase
      .from('customers')
      .select('*')
      .eq('cpf_normalized', normCpf);

    if (input.excludeId) {
      query = query.neq('id', input.excludeId);
    }

    const { data } = await query.limit(1);
    if (data && data.length > 0) {
      cpfMatch = data[0] as Customer;
    }
  }

  // 2. Telefone (identificador de contato)
  if (normPhone && normPhone.length >= 8) {
    let query = supabase
      .from('customers')
      .select('*')
      .eq('phone_normalized', normPhone);

    if (input.excludeId) {
      query = query.neq('id', input.excludeId);
    }

    const { data } = await query.limit(5);
    if (data) {
      phoneMatches = data as Customer[];
    }
  }

  // 3. E-mail (identificador informativo)
  if (normEmail) {
    let query = supabase
      .from('customers')
      .select('*')
      .eq('email_normalized', normEmail);

    if (input.excludeId) {
      query = query.neq('id', input.excludeId);
    }

    const { data } = await query.limit(5);
    if (data) {
      emailMatches = data as Customer[];
    }
  }

  return {
    cpfMatch,
    phoneMatches,
    emailMatches,
    hasExactCpfMatch: cpfMatch !== null,
    hasPhoneMatch: phoneMatches.length > 0,
    hasEmailMatch: emailMatches.length > 0,
  };
}

export interface FindOrCreateCustomerInput {
  full_name: string;
  phone: string;
  email?: string | null;
  cpf?: string | null;
  rg?: string | null;
  whatsapp?: string | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  source_detail?: string | null;
}

export interface FindOrCreateCustomerResult {
  customer: Customer;
  created: boolean;
  matchedBy?: 'cpf' | 'phone' | 'email';
}

export async function findOrCreateCustomer(
  supabase: SupabaseClient,
  input: FindOrCreateCustomerInput,
  defaultSource: CustomerSource = 'manual',
  adminUserId?: string | null,
): Promise<{ customer: Customer | null; created: boolean; matchedBy?: 'cpf' | 'phone' | 'email'; error?: string }> {
  const normCpf = normalizeCpf(input.cpf);
  const normPhone = normalizePhone(input.phone);
  const normEmail = normalizeEmail(input.email);
  const normWhatsapp = input.whatsapp ? normalizePhone(input.whatsapp) : null;

  // 1. Tentar encontrar por CPF se válido
  if (normCpf && normCpf.length === 11) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('cpf_normalized', normCpf)
      .limit(1);

    if (data && data.length > 0) {
      return { customer: data[0] as Customer, created: false, matchedBy: 'cpf' };
    }
  }

  // 2. Tentar encontrar por Telefone normalizado
  if (normPhone && normPhone.length >= 8) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_normalized', normPhone)
      .limit(1);

    if (data && data.length > 0) {
      return { customer: data[0] as Customer, created: false, matchedBy: 'phone' };
    }
  }

  // 3. Tentar encontrar por E-mail normalizado
  if (normEmail) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('email_normalized', normEmail)
      .limit(1);

    if (data && data.length > 0) {
      return { customer: data[0] as Customer, created: false, matchedBy: 'email' };
    }
  }

  // 4. Se não encontrar, criar novo registro
  const insertPayload = {
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    phone_normalized: normPhone || cleanNumeric(input.phone),
    whatsapp: input.whatsapp?.trim() || null,
    whatsapp_normalized: normWhatsapp,
    email: input.email?.trim() || null,
    email_normalized: normEmail,
    cpf: input.cpf?.trim() || null,
    cpf_normalized: normCpf,
    rg: input.rg?.trim() || null,
    cep: input.cep?.trim() || null,
    street: input.street?.trim() || null,
    number: input.number?.trim() || null,
    complement: input.complement?.trim() || null,
    neighborhood: input.neighborhood?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state ? input.state.trim().toUpperCase().slice(0, 2) : null,
    source: defaultSource,
    source_detail: input.source_detail?.trim() || null,
    notes: input.notes?.trim() || null,
    is_active: true,
    created_by: adminUserId || null,
  };

  const { data: inserted, error } = await supabase
    .from('customers')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    // Tratar race condition de CPF único
    if (error.code === '23505' && normCpf) {
      const { data: existing } = await supabase
        .from('customers')
        .select('*')
        .eq('cpf_normalized', normCpf)
        .single();

      if (existing) {
        return { customer: existing as Customer, created: false, matchedBy: 'cpf' };
      }
    }

    console.error('Error creating customer:', error);
    return { customer: null, created: false, error: error.message };
  }

  return { customer: inserted as Customer, created: true };
}
