'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Customer } from '@/types/customer';
import {
  customerCreateSchema,
  customerUpdateSchema,
  CustomerFormValues,
  CustomerUpdateValues,
} from '@/lib/validations/customer';
import {
  normalizeCpf,
  normalizePhone,
  normalizeEmail,
  cleanNumeric,
} from '@/lib/utils/customer-normalizers';
import {
  findDuplicateCandidates,
  DuplicateCheckInput,
  DuplicateCandidatesResult,
} from '@/lib/domain/customer-dedup';

export async function checkDuplicatesAction(
  input: DuplicateCheckInput,
): Promise<DuplicateCandidatesResult> {
  const supabase = await createClient();
  return findDuplicateCandidates(supabase, input);
}

export async function createCustomerAction(rawData: CustomerFormValues) {
  const supabase = await createClient();

  const parsed = customerCreateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  const data = parsed.data;
  const normCpf = normalizeCpf(data.cpf);
  const normPhone = normalizePhone(data.phone);
  const normEmail = normalizeEmail(data.email);
  const normWhatsapp = data.whatsapp ? normalizePhone(data.whatsapp) : null;

  // 1. Checagem de CPF duplicado (bloqueio estrito)
  if (normCpf && normCpf.length === 11) {
    const { data: existingCpf } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('cpf_normalized', normCpf)
      .limit(1);

    if (existingCpf && existingCpf.length > 0) {
      return {
        error: `Já existe um cliente cadastrado com este CPF (${existingCpf[0].full_name}).`,
        existingCustomerId: existingCpf[0].id,
      };
    }
  }

  // 2. Obter usuário autenticado atual para autoria
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const insertPayload = {
    full_name: data.full_name.trim(),
    phone: data.phone.trim(),
    phone_normalized: normPhone || cleanNumeric(data.phone),
    whatsapp: data.whatsapp?.trim() || null,
    whatsapp_normalized: normWhatsapp,
    email: data.email?.trim() || null,
    email_normalized: normEmail,
    cpf: data.cpf?.trim() || null,
    cpf_normalized: normCpf,
    rg: data.rg?.trim() || null,
    gender: data.gender || null,
    birth_date: data.birth_date || null,
    cep: data.cep?.trim() || null,
    street: data.street?.trim() || null,
    number: data.number?.trim() || null,
    complement: data.complement?.trim() || null,
    neighborhood: data.neighborhood?.trim() || null,
    city: data.city?.trim() || null,
    state: data.state ? data.state.trim().toUpperCase().slice(0, 2) : null,
    source: data.source || 'manual',
    source_detail: data.source_detail?.trim() || null,
    notes: data.notes?.trim() || null,
    is_active: data.is_active ?? true,
    created_by: user?.id || null,
  };

  const { data: inserted, error } = await supabase
    .from('customers')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error) {
    console.error('Error inserting customer:', error);
    if (error.code === '23505') {
      return { error: 'Já existe um cliente com este CPF na base de dados.' };
    }
    return { error: 'Não foi possível cadastrar o cliente. Verifique os dados e tente novamente.' };
  }

  revalidatePath('/admin/clientes');
  revalidatePath('/admin');

  return { success: true, id: inserted.id };
}

export async function updateCustomerAction(id: string, rawData: CustomerUpdateValues) {
  const supabase = await createClient();

  const parsed = customerUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  const data = parsed.data;
  const normCpf = data.cpf !== undefined ? normalizeCpf(data.cpf) : undefined;
  const normPhone = data.phone !== undefined ? normalizePhone(data.phone) : undefined;
  const normEmail = data.email !== undefined ? normalizeEmail(data.email) : undefined;
  const normWhatsapp = data.whatsapp !== undefined ? (data.whatsapp ? normalizePhone(data.whatsapp) : null) : undefined;

  // 1. Checagem de CPF duplicado se o CPF estiver sendo alterado
  if (normCpf && normCpf.length === 11) {
    const { data: existingCpf } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('cpf_normalized', normCpf)
      .neq('id', id)
      .limit(1);

    if (existingCpf && existingCpf.length > 0) {
      return {
        error: `Já existe outro cliente cadastrado com este CPF (${existingCpf[0].full_name}).`,
        existingCustomerId: existingCpf[0].id,
      };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
    updated_by: user?.id || null,
  };

  if (data.full_name !== undefined) updatePayload.full_name = data.full_name.trim();
  if (data.phone !== undefined) {
    updatePayload.phone = data.phone.trim();
    updatePayload.phone_normalized = normPhone || cleanNumeric(data.phone);
  }
  if (data.whatsapp !== undefined) {
    updatePayload.whatsapp = data.whatsapp ? data.whatsapp.trim() : null;
    updatePayload.whatsapp_normalized = normWhatsapp;
  }
  if (data.email !== undefined) {
    updatePayload.email = data.email ? data.email.trim() : null;
    updatePayload.email_normalized = normEmail;
  }
  if (data.cpf !== undefined) {
    updatePayload.cpf = data.cpf ? data.cpf.trim() : null;
    updatePayload.cpf_normalized = normCpf;
  }
  if (data.rg !== undefined) updatePayload.rg = data.rg ? data.rg.trim() : null;
  if (data.gender !== undefined) updatePayload.gender = data.gender || null;
  if (data.birth_date !== undefined) updatePayload.birth_date = data.birth_date || null;
  if (data.cep !== undefined) updatePayload.cep = data.cep ? data.cep.trim() : null;
  if (data.street !== undefined) updatePayload.street = data.street ? data.street.trim() : null;
  if (data.number !== undefined) updatePayload.number = data.number ? data.number.trim() : null;
  if (data.complement !== undefined) updatePayload.complement = data.complement ? data.complement.trim() : null;
  if (data.neighborhood !== undefined) updatePayload.neighborhood = data.neighborhood ? data.neighborhood.trim() : null;
  if (data.city !== undefined) updatePayload.city = data.city ? data.city.trim() : null;
  if (data.state !== undefined) updatePayload.state = data.state ? data.state.trim().toUpperCase().slice(0, 2) : null;
  if (data.source !== undefined) updatePayload.source = data.source;
  if (data.source_detail !== undefined) updatePayload.source_detail = data.source_detail ? data.source_detail.trim() : null;
  if (data.notes !== undefined) updatePayload.notes = data.notes ? data.notes.trim() : null;
  if (data.is_active !== undefined) updatePayload.is_active = data.is_active;

  const { error } = await supabase
    .from('customers')
    .update(updatePayload)
    .eq('id', id);

  if (error) {
    console.error('Error updating customer:', error);
    if (error.code === '23505') {
      return { error: 'Já existe outro cliente com este CPF.' };
    }
    return { error: 'Não foi possível atualizar o cliente.' };
  }

  revalidatePath('/admin/clientes');
  revalidatePath(`/admin/clientes/${id}`);
  revalidatePath(`/admin/clientes/${id}/editar`);

  return { success: true, id };
}

export async function setCustomerActiveStatusAction(id: string, is_active: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('customers')
    .update({
      is_active,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating customer active status:', error);
    return { error: 'Não foi possível alterar o status do cliente.' };
  }

  revalidatePath('/admin/clientes');
  revalidatePath(`/admin/clientes/${id}`);

  return { success: true };
}

export async function searchCustomersForSaleAction(term: string) {
  const supabase = await createClient();
  const cleanTerm = term.trim();
  if (!cleanTerm) return [];

  const digits = cleanNumeric(cleanTerm);

  let query = supabase
    .from('customers')
    .select('id, full_name, phone, cpf, email, street, number, neighborhood, complement, city, state, cep, is_active')
    .eq('is_active', true)
    .limit(10);

  if (digits.length >= 3) {
    query = query.or(`full_name.ilike.%${cleanTerm}%,phone_normalized.ilike.%${digits}%,cpf_normalized.ilike.%${digits}%`);
  } else {
    query = query.ilike('full_name', `%${cleanTerm}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error searching customers for sale:', error);
    return [];
  }

  return (data || []) as Customer[];
}

