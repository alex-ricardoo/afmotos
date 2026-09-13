'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { findExistingConsultation, executeVehiclePlateLookup } from '@/lib/vehicle-lookup/service';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';
import { type ActionResult, type PaymentMethod } from './types';
import { paymentConfirmationSchema } from './schemas';

/**
 * Confirms simulated payment for a plate consultation and triggers vehicle lookup.
 */
export async function confirmPayment(
  consultationId: string,
  paymentMethod: PaymentMethod,
): Promise<ActionResult<{ consultationId: string }>> {
  const parseResult = paymentConfirmationSchema.safeParse({
    consultationId,
    paymentMethod,
  });

  if (!parseResult.success) {
    return {
      error: parseResult.error.issues[0]?.message || 'Parâmetros de pagamento inválidos',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuário não autenticado.' };
  }

  // 1. Fetch consultation
  const { data: consultation, error: fetchError } = await supabase
    .from('customer_plate_consultations')
    .select('*')
    .eq('id', consultationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError || !consultation) {
    return { error: 'Consulta veicular não encontrada.' };
  }

  // If already completed, return immediately
  if (consultation.status === 'completed' && consultation.vehicle_data) {
    return {
      success: true,
      consultationId: consultation.id,
      data: { consultationId: consultation.id },
    };
  }

  const nowIso = new Date().toISOString();
  const consultationPrice = await getVehicleConsultationPrice();

  // 2. Insert payment simulation audit record
  const { error: paymentError } = await supabase.from('payment_simulations').insert({
    consultation_id: consultation.id,
    user_id: user.id,
    amount: consultationPrice,
    payment_method: paymentMethod,
    status: 'confirmed',
    simulated_at: nowIso,
    confirmed_at: nowIso,
    metadata: {
      plate: consultation.plate,
      plate_normalized: consultation.plate_normalized,
      mode: 'simulation',
    },
  });

  if (paymentError) {
    console.error('[confirmPayment] Error recording payment simulation:', paymentError);
  }

  // 3. Mark consultation as paid & processing
  await supabase
    .from('customer_plate_consultations')
    .update({
      payment_status: 'paid',
      payment_method: paymentMethod,
      payment_date: nowIso,
      status: 'processing',
      updated_at: nowIso,
    })
    .eq('id', consultation.id);

  // 4. Vehicle Plate Lookup (Cache-first via findExistingConsultation / executeVehiclePlateLookup)
  // We use the adminClient because vehicle_plate_consultations table has RLS policies restricted to admin users
  try {
    const adminClient = createAdminClient();
    const cached = await findExistingConsultation(consultation.plate_normalized, adminClient);

    if (cached && cached.status === 'COMPLETED' && cached.raw_response) {
      await supabase
        .from('customer_plate_consultations')
        .update({
          vehicle_data: cached.raw_response,
          source_consultation_id: cached.id,
          status: 'completed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', consultation.id);
    } else {
      // Live lookup or mock fallback orchestrated by executeVehiclePlateLookup
      const lookupResult = await executeVehiclePlateLookup(
        {
          plate: consultation.plate_normalized,
          userId: user.id,
          confirmedPlate: consultation.plate_normalized,
        },
        adminClient,
      );

      if (lookupResult.success && lookupResult.record) {
        await supabase
          .from('customer_plate_consultations')
          .update({
            vehicle_data: lookupResult.record.raw_response,
            source_consultation_id: lookupResult.record.id,
            status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', consultation.id);
      } else {
        await supabase
          .from('customer_plate_consultations')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', consultation.id);

        return {
          error:
            lookupResult.message ||
            'Não foi possível obter os dados do veículo nesta placa. Verifique os dados e tente novamente.',
        };
      }
    }
  } catch (lookupErr) {
    console.error('[confirmPayment] Lookup error:', lookupErr);
    await supabase
      .from('customer_plate_consultations')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultation.id);

    const errorMessage =
      lookupErr instanceof Error ? lookupErr.message : 'Falha na consulta veicular.';
    return { error: errorMessage };
  }

  revalidatePath('/cliente');
  revalidatePath('/cliente/consultas');
  revalidatePath(`/cliente/consultas/${consultation.id}`);

  return {
    success: true,
    consultationId: consultation.id,
    data: { consultationId: consultation.id },
  };
}
