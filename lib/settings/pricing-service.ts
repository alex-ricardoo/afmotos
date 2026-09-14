import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '../supabase/admin.ts';

export interface VehicleHistoryPricingConfig {
  versionId: string;
  publicPriceCents: number;
  apiBrasilLiveCostCents: number;
  currency: 'BRL';
  effectiveFrom: string;
  version: string | number;
  marginCents: number;
  marginPercentage: number;
}

export const DEFAULT_VEHICLE_HISTORY_PRICING: VehicleHistoryPricingConfig = {
  versionId: 'default-initial',
  publicPriceCents: 3990,
  apiBrasilLiveCostCents: 3000,
  currency: 'BRL',
  effectiveFrom: '2026-01-01T00:00:00.000Z',
  version: 1,
  marginCents: 990,
  marginPercentage: 24.8,
};

export interface VehicleHistoryPricingVersionRecord {
  id: string;
  public_price_cents: number;
  apibrasil_live_cost_cents: number;
  currency: string;
  is_active: boolean;
  effective_from?: string;
  effective_to?: string | null;
  valid_from?: string;
  valid_until?: string | null;
  version_number?: number;
  created_by?: string | null;
  created_by_admin_id?: string | null;
  change_reason: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  admin_name?: string | null;
  admin_email?: string | null;
}

/**
 * Retorna a configuração de precificação e custo vigente do Histórico Veicular.
 * Consulta vehicle_history_pricing_versions com fallback seguro e resiliente.
 */
export async function getVehicleHistoryPricingConfig(
  customClient?: SupabaseClient,
): Promise<VehicleHistoryPricingConfig> {
  const fallbackPriceCents = 3990;
  const fallbackCostCents = 3000;
  let supabase = customClient;

  try {
    if (!supabase) {
      try {
        const { createClient } = await import('../supabase/server.ts');
        supabase = await createClient();
      } catch {
        supabase = createAdminClient();
      }
    }

    const { data: activeVersion, error } = await supabase
      .from('vehicle_history_pricing_versions')
      .select('*')
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && activeVersion) {
      const publicPriceCents = activeVersion.public_price_cents || fallbackPriceCents;
      const apiBrasilLiveCostCents = activeVersion.apibrasil_live_cost_cents ?? fallbackCostCents;
      const marginCents = publicPriceCents - apiBrasilLiveCostCents;
      const marginPercentage =
        publicPriceCents > 0 ? Math.round((marginCents / publicPriceCents) * 100) : 0;

      return {
        versionId: activeVersion.id,
        publicPriceCents,
        apiBrasilLiveCostCents,
        currency: 'BRL',
        effectiveFrom: activeVersion.effective_from,
        version: activeVersion.id.substring(0, 8),
        marginCents,
        marginPercentage,
      };
    }
  } catch (err) {
    console.warn(
      '[getVehicleHistoryPricingConfig] Erro ao buscar versão ativa, aplicando fallback:',
      err,
    );
  }

  // Fallback secundário usando site_settings se a tabela ainda não tiver dados
  try {
    const db = supabase || createAdminClient();
    const { data: siteSettingsData } = await db
      .from('site_settings')
      .select('settings')
      .limit(1)
      .maybeSingle();

    const price = siteSettingsData?.settings?.vehicleHistory?.price;
    const resolvedPriceCents = price && price > 0 ? Math.round(price * 100) : fallbackPriceCents;
    const marginCents = resolvedPriceCents - fallbackCostCents;

    return {
      versionId: 'legacy-fallback',
      publicPriceCents: resolvedPriceCents,
      apiBrasilLiveCostCents: fallbackCostCents,
      currency: 'BRL',
      effectiveFrom: new Date().toISOString(),
      version: 'v1.0-fallback',
      marginCents,
      marginPercentage: Number(((marginCents / resolvedPriceCents) * 100).toFixed(1)),
    };
  } catch {
    return DEFAULT_VEHICLE_HISTORY_PRICING;
  }
}

/**
 * Lista todas as versões de precificação para exibição do histórico na tela admin.
 */
export async function listVehicleHistoryPricingVersions(
  customClient?: SupabaseClient,
): Promise<VehicleHistoryPricingVersionRecord[]> {
  try {
    let supabase = customClient;
    if (!supabase) {
      try {
        const { createClient } = await import('../supabase/server.ts');
        supabase = await createClient();
      } catch {
        supabase = createAdminClient();
      }
    }

    const { data, error } = await supabase
      .from('vehicle_history_pricing_versions')
      .select(
        `
        *,
        admin_profiles:created_by (
          name,
          email
        )
      `,
      )
      .order('effective_from', { ascending: false });

    if (error || !data) {
      return [];
    }

    const typedRows = data as unknown as Array<
      VehicleHistoryPricingVersionRecord & {
        admin_profiles?: { name?: string; email?: string } | null;
      }
    >;

    return typedRows.map((row) => ({
      ...row,
      admin_name: row.admin_profiles?.name || null,
      admin_email: row.admin_profiles?.email || null,
    }));
  } catch (err) {
    console.error('[listVehicleHistoryPricingVersions] Erro ao buscar histórico:', err);
    return [];
  }
}

export interface SetNewPricingVersionParams {
  publicPriceCents: number;
  apiBrasilLiveCostCents: number;
  adminUserId: string;
  changeReason?: string;
  dbClient?: SupabaseClient;
}

/**
 * Cria uma nova versão vigente e encerra a anterior.
 * Nunca altera retrospectivamente consultas passadas.
 */
export async function createVehicleHistoryPricingVersion(
  params: SetNewPricingVersionParams,
): Promise<{ success: boolean; versionId?: string; error?: string }> {
  const { publicPriceCents, apiBrasilLiveCostCents, adminUserId, changeReason } = params;

  if (publicPriceCents <= 0) {
    return { success: false, error: 'O preço de venda deve ser maior que zero.' };
  }
  if (apiBrasilLiveCostCents < 0) {
    return { success: false, error: 'O custo da API Brasil não pode ser negativo.' };
  }

  const adminDb = params.dbClient || createAdminClient();
  const nowIso = new Date().toISOString();

  // 1. Encerra versão ativa anterior
  const { error: deactivateError } = await adminDb
    .from('vehicle_history_pricing_versions')
    .update({
      is_active: false,
      effective_to: nowIso,
    })
    .eq('is_active', true);

  if (deactivateError) {
    console.error(
      '[createVehicleHistoryPricingVersion] Erro ao desativar versão anterior:',
      deactivateError,
    );
    return {
      success: false,
      error: `Erro ao desativar versão anterior: ${deactivateError.message}`,
    };
  }

  // 2. Insere a nova versão ativa
  const { data: newVersion, error: insertError } = await adminDb
    .from('vehicle_history_pricing_versions')
    .insert({
      public_price_cents: publicPriceCents,
      apibrasil_live_cost_cents: apiBrasilLiveCostCents,
      currency: 'BRL',
      is_active: true,
      effective_from: nowIso,
      created_by: adminUserId,
      change_reason: changeReason || null,
    })
    .select('id')
    .single();

  if (insertError || !newVersion) {
    console.error('[createVehicleHistoryPricingVersion] Erro ao criar nova versão:', insertError);
    return { success: false, error: `Erro ao criar nova versão: ${insertError?.message}` };
  }

  // 3. Sincroniza site_settings com o novo preço público para compatibilidade
  try {
    const { data: siteSettings } = await adminDb
      .from('site_settings')
      .select('id, settings')
      .limit(1)
      .maybeSingle();

    if (siteSettings) {
      const currentSettings = siteSettings.settings || {};
      const vehicleHistory = currentSettings.vehicleHistory || {};
      vehicleHistory.price = publicPriceCents / 100;
      currentSettings.vehicleHistory = vehicleHistory;

      await adminDb
        .from('site_settings')
        .update({
          settings: currentSettings,
          updated_at: nowIso,
        })
        .eq('id', siteSettings.id);
    }
  } catch (syncErr) {
    console.warn(
      '[createVehicleHistoryPricingVersion] Alerta: Falha ao sincronizar site_settings (não crítico):',
      syncErr,
    );
  }

  return {
    success: true,
    versionId: newVersion.id,
  };
}
