'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  saveFipeConsultationSchema,
  updateFipeNotesSchema,
  linkFipeMotorcycleSchema,
} from '@/lib/validations/fipe-consultation';
import { FipeQuote } from '@/lib/fipex/types';

export type ActionResponse<T = unknown> = {
  data?: T;
  error?: string;
};

/**
 * Salva uma nova consulta FIPE no banco de dados.
 */
export async function saveFipeConsultation(input: {
  quote: FipeQuote;
  queryPayload?: Record<string, unknown>;
  motorcycleId?: string | null;
  notes?: string | null;
}): Promise<ActionResponse<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: 'Sessão expirada. Faça login novamente para salvar a consulta.',
    };
  }

  const payloadToValidate = {
    motorcycle_id: input.motorcycleId || null,
    provider: input.quote.provider || 'fipex',
    provider_label: input.quote.providerLabel || 'fipeX',
    vehicle_type_id: input.quote.vehicleTypeId || 'motocicletas',
    vehicle_type_label: input.quote.vehicleTypeLabel || 'Motocicletas',
    brand_id: input.quote.brandId || null,
    brand_name: input.quote.brandName || 'Marca',
    model_id: input.quote.modelId || null,
    model_name: input.quote.modelName || 'Modelo',
    version_name: input.quote.versionName || null,
    model_year: input.quote.year ?? null,
    is_zero_km: Boolean(input.quote.isZeroKm),
    fuel_id: input.quote.fuelId || null,
    fuel_name: input.quote.fuelName || null,
    fuel_acronym: input.quote.fuelAcronym || null,
    reference_period_id: input.quote.referencePeriodId || null,
    reference_month: input.quote.referenceMonth ?? null,
    reference_year: input.quote.referenceYear ?? null,
    reference_label: input.quote.referenceLabel || null,
    fipe_code: input.quote.fipeCode || null,
    fipe_price: input.quote.priceReais ?? null,
    currency: 'BRL',
    query_payload: input.queryPayload || {},
    response_snapshot: (input.quote.rawResponse as Record<string, unknown>) || {},
    notes: input.notes || null,
  };

  const parsed = saveFipeConsultationSchema.safeParse(payloadToValidate);
  if (!parsed.success) {
    console.error('Validation error on saveFipeConsultation:', parsed.error);
    return {
      error: parsed.error.issues[0]?.message || 'Dados da consulta inválidos.',
    };
  }

  const { data, error } = await supabase
    .from('fipe_consultations')
    .insert({
      ...parsed.data,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving FIPE consultation to DB:', error);
    return { error: `Erro no banco: ${error.message}` };
  }

  revalidatePath('/admin/fipe');
  return { data: { id: data.id } };
}

/**
 * Atualiza notas de uma consulta existente.
 */
export async function updateFipeConsultationNotes(
  id: string,
  notes: string | null,
): Promise<ActionResponse<{ success: boolean }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Sessão expirada. Faça login novamente.' };
  }

  const parsed = updateFipeNotesSchema.safeParse({ id, notes });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos.' };
  }

  const { error } = await supabase
    .from('fipe_consultations')
    .update({ notes: parsed.data.notes })
    .eq('id', parsed.data.id);

  if (error) {
    console.error('Error updating FIPE consultation notes:', error);
    return { error: `Erro ao atualizar notas: ${error.message}` };
  }

  revalidatePath('/admin/fipe');
  return { data: { success: true } };
}

/**
 * Vincula uma consulta FIPE a uma motocicleta do inventário.
 */
export async function linkFipeConsultationToMotorcycle(
  consultationId: string,
  motorcycleId: string,
): Promise<ActionResponse<{ success: boolean }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Sessão expirada. Faça login novamente.' };
  }

  const parsed = linkFipeMotorcycleSchema.safeParse({
    consultation_id: consultationId,
    motorcycle_id: motorcycleId,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || 'Dados de vínculo inválidos.',
    };
  }

  const { error } = await supabase
    .from('fipe_consultations')
    .update({ motorcycle_id: parsed.data.motorcycle_id })
    .eq('id', parsed.data.consultation_id);

  if (error) {
    console.error('Error linking FIPE consultation to motorcycle:', error);
    return { error: `Erro ao vincular: ${error.message}` };
  }

  revalidatePath('/admin/fipe');
  return { data: { success: true } };
}

/**
 * Exclui uma consulta do histórico.
 */
export async function deleteFipeConsultation(
  id: string,
): Promise<ActionResponse<{ success: boolean }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Sessão expirada. Faça login novamente.' };
  }

  const { error } = await supabase.from('fipe_consultations').delete().eq('id', id);

  if (error) {
    console.error('Error deleting FIPE consultation:', error);
    return { error: `Erro ao excluir: ${error.message}` };
  }

  revalidatePath('/admin/fipe');
  return { data: { success: true } };
}
