'use server';

import { createClient } from '@/lib/supabase/server';
import { normalizeBrazilianPlate, isValidBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import type { ActionResult } from './types';

export interface ExistingConsultationInfo {
  id: string;
  plate: string;
  status: string;
  payment_status: string;
  created_at: string;
  brand?: string;
  model?: string;
}

/**
 * Checks if the authenticated customer has already consulted this plate in the past.
 */
export async function checkExistingCustomerConsultation(
  plate: string
): Promise<ActionResult<{
  exists: boolean;
  consultation?: ExistingConsultationInfo;
}>> {
  const normalized = normalizeBrazilianPlate(plate);

  if (!isValidBrazilianPlate(normalized)) {
    return { success: true, data: { exists: false } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuário não autenticado.' };
  }

  const { data: existing, error } = await supabase
    .from('customer_plate_consultations')
    .select('id, plate, status, payment_status, created_at, vehicle_data')
    .eq('user_id', user.id)
    .eq('plate_normalized', normalized)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !existing) {
    return { success: true, data: { exists: false } };
  }

  const vehicleData = existing.vehicle_data as Record<string, unknown> | null;

  return {
    success: true,
    data: {
      exists: true,
      consultation: {
        id: existing.id,
        plate: existing.plate,
        status: existing.status,
        payment_status: existing.payment_status,
        created_at: existing.created_at,
        brand: (vehicleData?.brand as string) || undefined,
        model: (vehicleData?.model as string) || undefined,
      },
    },
  };
}

/**
 * Initiates a plate consultation for an authenticated customer.
 * If forceNew is true, creates a fresh consultation record even if a previous one exists,
 * keeping the historical consultation untouched.
 */
export async function initiateConsultation(
  plate: string,
  options?: { forceNew?: boolean }
): Promise<ActionResult<{ consultationId: string }>> {
  const normalized = normalizeBrazilianPlate(plate);

  if (!isValidBrazilianPlate(normalized)) {
    return {
      error: 'Placa inválida. Informe uma placa no formato Mercosul (ex: ABC1D23) ou padrão cinza (ex: ABC-1234).',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Faça login para continuar com a consulta veicular.' };
  }

  // Ensure customer profile row exists to prevent foreign key constraint violations
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = createAdminClient();
    await adminClient.from('customer_profiles').upsert(
      {
        id: user.id,
        email: user.email || '',
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Cliente',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  } catch (syncErr) {
    console.warn('[initiateConsultation] profile sync warning:', syncErr);
  }

  // If NOT forcing new, check if there's an active unpaid/pending consultation to reuse
  if (!options?.forceNew) {
    const { data: existing } = await supabase
      .from('customer_plate_consultations')
      .select('id, status, payment_status')
      .eq('user_id', user.id)
      .eq('plate_normalized', normalized)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && (existing.status === 'pending' || existing.payment_status === 'unpaid')) {
      return {
        success: true,
        existing: true,
        consultationId: existing.id,
        data: { consultationId: existing.id },
      };
    }
  }

  // Create new consultation record
  const { data: inserted, error: insertError } = await supabase
    .from('customer_plate_consultations')
    .insert({
      user_id: user.id,
      plate: plate.toUpperCase().trim(),
      plate_normalized: normalized,
      status: 'pending',
      payment_status: 'unpaid',
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    return {
      error: insertError?.message || 'Erro ao registrar intenção de consulta.',
    };
  }

  return {
    success: true,
    consultationId: inserted.id,
    data: { consultationId: inserted.id },
  };
}
