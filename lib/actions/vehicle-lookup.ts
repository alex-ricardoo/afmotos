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
    console.log(`[VEHICLE_LOOKUP] [checkPlateCacheAction] Checando cache para a placa: "${plate}" (normalizada: "${normalized}")`);
    if (!isValidBrazilianPlate(normalized)) {
      console.warn(`[VEHICLE_LOOKUP] [checkPlateCacheAction] Placa inválida: "${plate}"`);
      return { data: null, error: 'Placa inválida.' };
    }
    const cached = await checkCacheForPlate(normalized);
    if (cached) {
      console.log(`[VEHICLE_LOOKUP] [checkPlateCacheAction] ✅ Placa "${normalized}" encontrada no cache (ID: ${cached.id}, Status: ${cached.status})`);
    } else {
      console.log(`[VEHICLE_LOOKUP] [checkPlateCacheAction] ℹ️ Placa "${normalized}" não encontrada no cache local.`);
    }
    return { data: cached, error: null };
  } catch (err: any) {
    console.error(`[VEHICLE_LOOKUP] [checkPlateCacheAction] ❌ Erro ao checar cache da placa "${plate}":`, err);
    return { data: null, error: err?.message || 'Erro ao verificar cache da placa.' };
  }
}

export async function executeVehiclePlateLookupAction(input: ExecuteLookupActionInput) {
  console.log(`[VEHICLE_LOOKUP] [executeAction] 🚀 Recebida solicitação de consulta veicular para a placa: "${input.plate}"`);
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[VEHICLE_LOOKUP] [executeAction] ❌ Erro de autenticação: usuário não logado ou sessão expirada.', authError?.message);
      return { error: 'Usuário não autenticado ou sessão expirada.' };
    }

    const normalized = normalizeBrazilianPlate(input.plate);
    console.log(`[VEHICLE_LOOKUP] [executeAction] Usuário: ${user.id} (${user.email || 'sem email'}) | Placa normalizada: "${normalized}"`);

    if (!isValidBrazilianPlate(normalized)) {
      console.warn(`[VEHICLE_LOOKUP] [executeAction] ❌ Placa com formato inválido: "${input.plate}"`);
      return { error: `A placa "${input.plate}" não possui formato válido (antigo ou Mercosul).` };
    }

    console.log(`[VEHICLE_LOOKUP] [executeAction] Chamando executeVehiclePlateLookup...`);
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

    console.log(`[VEHICLE_LOOKUP] [executeAction] ✅ Consulta processada com sucesso! ID: ${result.record.id} | CacheHit: ${result.isCacheHit} | isMock: ${result.record.is_mock}`);
    revalidatePath('/admin/consulta-placa');

    return {
      success: true,
      consultationId: result.record.id,
      isCacheHit: result.isCacheHit,
      message: result.message,
      isMock: result.record.is_mock,
    };
  } catch (err: any) {
    console.error('[VEHICLE_LOOKUP] [executeAction] ❌ Erro durante a execução da consulta veicular:', err);

    if (err?.name === 'InsufficientBalanceError') {
      console.warn(`[VEHICLE_LOOKUP] [executeAction] ⚠️ Saldo insuficiente na API Brasil: ${err.balance}`);
      return {
        error: err.message,
        isInsufficientBalance: true,
        rechargeUrl: err.rechargeUrl || 'https://app.apibrasil.io/dashboard?modal=recharge',
        balance: err.balance || 'R$ 0,00',
      };
    }

    if (err?.name === 'InvalidTokenError') {
      console.error(`[VEHICLE_LOOKUP] [executeAction] ❌ Token inválido ou expirado da API Brasil`);
      return {
        error: err.message,
        isTokenError: true,
      };
    }

    return {
      error: err?.message || 'Ocorreu um erro interno ao processar a consulta veicular na API Brasil.',
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
