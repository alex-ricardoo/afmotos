'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createShareRecord,
  revokeShareRecord,
  getAdminShareDetailsByConsultationId,
} from '@/lib/vehicle-lookup/share-service';
import type {
  ShareCreationResult,
  AdminVehicleShareDetailsDto,
} from '@/lib/vehicle-lookup/share-types';

/**
 * Server Action: Generates a secure public vehicle report share link for an admin user.
 */
export async function createVehicleReportShareAction(params: {
  consultationId: string;
  forceRevokeExisting?: boolean;
}): Promise<{
  success: boolean;
  data?: ShareCreationResult;
  error?: string;
  hasActiveShareConflict?: boolean;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Acesso não autorizado. Faça login como administrador.' };
    }

    const result = await createShareRecord({
      consultationId: params.consultationId,
      adminUserId: user.id,
      forceRevokeExisting: params.forceRevokeExisting,
    });

    revalidatePath(`/admin/consulta-placa/${params.consultationId}`);

    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    const message = err?.message || 'Falha ao gerar o link de compartilhamento.';
    const isConflict = message.includes('já possui um link público ativo');
    return {
      success: false,
      error: message,
      hasActiveShareConflict: isConflict,
    };
  }
}

/**
 * Server Action: Revokes a public vehicle report share link immediately.
 */
export async function revokeVehicleReportShareAction(params: {
  shareId: string;
  consultationId: string;
  reason?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Acesso não autorizado. Faça login como administrador.' };
    }

    await revokeShareRecord({
      shareId: params.shareId,
      adminUserId: user.id,
      reason: params.reason,
    });

    revalidatePath(`/admin/consulta-placa/${params.consultationId}`);

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Falha ao revogar o link de compartilhamento.',
    };
  }
}

/**
 * Server Action: Fetches updated admin share details for real-time drawer/modal sync.
 */
export async function getVehicleReportShareDetailsAction(params: {
  consultationId: string;
}): Promise<{
  success: boolean;
  data?: AdminVehicleShareDetailsDto;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Não autorizado.' };
    }

    const details = await getAdminShareDetailsByConsultationId(params.consultationId);
    return { success: true, data: details };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao carregar detalhes.' };
  }
}
