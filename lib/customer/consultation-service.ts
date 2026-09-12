'use server';

import { createClient } from '@/lib/supabase/server';
import { normalizeBrazilianPlate, isValidBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import type { ActionResult } from './types';

/**
 * Initiates a plate consultation for an authenticated customer.
 * Reuses existing consultation if already created.
 */
export async function initiateConsultation(
  plate: string
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

  // Check if customer already has a consultation record for this plate
  const { data: existing, error: findError } = await supabase
    .from('customer_plate_consultations')
    .select('id, status, payment_status')
    .eq('user_id', user.id)
    .eq('plate_normalized', normalized)
    .maybeSingle();

  if (existing) {
    // If it was failed, allow retrying by resetting to pending
    if (existing.status === 'failed') {
      await supabase
        .from('customer_plate_consultations')
        .update({
          status: 'pending',
          payment_status: 'unpaid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    }

    return {
      success: true,
      existing: true,
      consultationId: existing.id,
      data: { consultationId: existing.id },
    };
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
