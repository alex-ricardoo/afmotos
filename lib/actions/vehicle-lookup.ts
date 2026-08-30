'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { executeVehiclePlateLookup } from '@/lib/vehicle-lookup/service';
import { checkCacheForPlate } from '@/lib/queries/vehicle-lookup';
import { normalizeBrazilianPlate, isValidBrazilianPlate } from '@/lib/vehicle-lookup/plate';

export interface ExecuteLookupActionInput {
  plate: string;
  confirmedPlate: string;
  confirmationMessageVersion?: string;
  motorcycleId?: string | null;
  sellRequestId?: string | null;
  forceRefresh?: boolean;
}

export async function checkPlateCacheAction(plate: string) {
  try {
    const normalized = normalizeBrazilianPlate(plate);
    if (!isValidBrazilianPlate(normalized)) {
      return { data: null, error: 'Placa inválida.' };
    }
    const cached = await checkCacheForPlate(normalized);
    return { data: cached, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Erro ao verificar cache da placa.' };
  }
}

export async function executeVehiclePlateLookupAction(input: ExecuteLookupActionInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Usuário não autenticado ou sessão expirada.' };
    }

    const normalized = normalizeBrazilianPlate(input.plate);
    if (!isValidBrazilianPlate(normalized)) {
      return { error: `A placa "${input.plate}" não possui formato válido (antigo ou Mercosul).` };
    }

    const result = await executeVehiclePlateLookup(
      {
        plate: normalized,
        userId: user.id,
        confirmedPlate: input.confirmedPlate || input.plate,
        confirmationMessageVersion: input.confirmationMessageVersion || 'v1.0',
        motorcycleId: input.motorcycleId,
        sellRequestId: input.sellRequestId,
        forceRefresh: input.forceRefresh,
      },
      supabase
    );

    revalidatePath('/admin/consulta-placa');

    return {
      success: true,
      consultationId: result.record.id,
      isCacheHit: result.isCacheHit,
      message: result.message,
      isMock: result.record.is_mock,
    };
  } catch (err: any) {
    console.error('Failed to execute vehicle plate lookup:', err);
    return {
      error: err?.message || 'Ocorreu um erro interno ao processar a consulta veicular.',
    };
  }
}

export async function linkVehicleConsultationAction(params: {
  consultationId: string;
  motorcycleId?: string | null;
  sellRequestId?: string | null;
  consignmentId?: string | null;
  leadId?: string | null;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Usuário não autenticado.' };
    }

    const updatePayload: Record<string, any> = {};
    if (params.motorcycleId !== undefined) updatePayload.motorcycle_id = params.motorcycleId;
    if (params.sellRequestId !== undefined) updatePayload.sell_request_id = params.sellRequestId;
    if (params.consignmentId !== undefined) updatePayload.consignment_id = params.consignmentId;
    if (params.leadId !== undefined) updatePayload.lead_id = params.leadId;

    const { error: updateError } = await supabase
      .from('vehicle_plate_consultations')
      .update(updatePayload)
      .eq('id', params.consultationId);

    if (updateError) {
      return { error: `Erro ao vincular consulta: ${updateError.message}` };
    }

    revalidatePath('/admin/consulta-placa');
    revalidatePath(`/admin/consulta-placa/${params.consultationId}`);

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao vincular consulta.' };
  }
}
