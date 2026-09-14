'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireActiveAdmin } from '@/lib/admin/admin-auth';
import {
  getVehicleHistoryPricingConfig,
  createVehicleHistoryPricingVersion,
  listVehicleHistoryPricingVersions,
} from '@/lib/settings/pricing-service';
import { createAdminClient } from '@/lib/supabase/admin';

const updateVehicleHistoryPricingSchema = z.object({
  publicPrice: z
    .number({ message: 'Preço de venda é obrigatório.' })
    .positive('Preço de venda deve ser maior que zero.')
    .max(1000, 'Preço de venda não pode exceder R$ 1.000,00.'),
  apiBrasilLiveCost: z
    .number({ message: 'Custo da API Brasil é obrigatório.' })
    .nonnegative('Custo não pode ser negativo.')
    .max(500, 'Custo não pode exceder R$ 500,00.'),
  changeReason: z.string().max(500, 'Motivo deve ter no máximo 500 caracteres.').optional(),
});

export type UpdateVehicleHistoryPricingInput = z.infer<typeof updateVehicleHistoryPricingSchema>;

export async function updateVehicleHistoryPricingAction(
  rawInput: UpdateVehicleHistoryPricingInput,
) {
  try {
    const adminCtx = await requireActiveAdmin();

    const validation = updateVehicleHistoryPricingSchema.safeParse(rawInput);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Dados de precificação inválidos.';
      return { success: false, error: firstError };
    }

    const { publicPrice, apiBrasilLiveCost, changeReason } = validation.data;
    const newPublicPriceCents = Math.round(publicPrice * 100);
    const newApiBrasilCostCents = Math.round(apiBrasilLiveCost * 100);

    const currentConfig = await getVehicleHistoryPricingConfig();

    const createResult = await createVehicleHistoryPricingVersion({
      publicPriceCents: newPublicPriceCents,
      apiBrasilLiveCostCents: newApiBrasilCostCents,
      adminUserId: adminCtx.userId,
      changeReason,
    });

    if (!createResult.success) {
      return { success: false, error: createResult.error };
    }

    // Auditoria estruturada
    const adminDb = createAdminClient();
    await adminDb.from('consultation_audit_logs').insert({
      actor_id: adminCtx.userId,
      actor_type: 'admin',
      event: 'vehicle_history_pricing.updated',
      details: {
        previous_version_id: currentConfig.versionId,
        new_version_id: createResult.versionId,
        previous_public_price_cents: currentConfig.publicPriceCents,
        new_public_price_cents: newPublicPriceCents,
        previous_apibrasil_cost_cents: currentConfig.apiBrasilLiveCostCents,
        new_apibrasil_cost_cents: newApiBrasilCostCents,
        change_reason: changeReason || null,
        admin_name: adminCtx.name || 'Administrador',
      },
    });

    revalidatePath('/admin/configuracoes');
    revalidatePath('/admin/relatorios');
    revalidatePath('/historico-veicular');

    return {
      success: true,
      versionId: createResult.versionId,
      publicPriceCents: newPublicPriceCents,
      apiBrasilLiveCostCents: newApiBrasilCostCents,
      marginCents: newPublicPriceCents - newApiBrasilCostCents,
    };
  } catch (err) {
    console.error('[updateVehicleHistoryPricingAction] Erro inesperado:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro interno ao atualizar precificação.',
    };
  }
}

export async function getVehicleHistoryPricingAdminDataAction() {
  try {
    await requireActiveAdmin();
    const [config, versions] = await Promise.all([
      getVehicleHistoryPricingConfig(),
      listVehicleHistoryPricingVersions(),
    ]);

    return {
      success: true,
      config,
      versions,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao carregar dados de precificação.',
    };
  }
}
