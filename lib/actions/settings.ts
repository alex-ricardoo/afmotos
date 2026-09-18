'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadImage } from '@/lib/uploads';
import { SiteSettingsData } from '@/types/site-settings';
import { aboutSettingsSchema, vehicleHistorySettingsSchema } from '@/lib/settings/schema';

export async function getSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  return data;
}

export interface SaveSettingsPayload {
  id?: string;
  site_name: string;
  whatsapp_phone: string;
  cnpj?: string | null;
  contact_email?: string | null;
  address?: string | null;
  settings: SiteSettingsData;
}

export async function saveSettingsAction(payload: SaveSettingsPayload) {
  const supabase = await createClient();

  const { id, site_name, whatsapp_phone, cnpj, contact_email, address, settings } = payload;

  if (settings.about) {
    // Auto-generate SEO
    settings.about.seo = {
      title: `${settings.about.heroTitle || 'Sobre'} | ${site_name}`,
      description: settings.about.description ? settings.about.description.substring(0, 155) : '',
      ogImageUrl: settings.about.storeImages?.[0]?.url || null,
    };

    const aboutValidation = aboutSettingsSchema.safeParse(settings.about);
    if (!aboutValidation.success) {
      console.error('Erro de validação em Sobre a Loja:', aboutValidation.error);
      return { error: 'Dados da seção Sobre a Loja são inválidos.' };
    }
    // Opcionalmente reatribuir settings.about com os dados limpos/validados
    settings.about = aboutValidation.data;
  }

  if (settings.vehicleHistory) {
    const vehicleHistoryValidation = vehicleHistorySettingsSchema.safeParse(
      settings.vehicleHistory,
    );
    if (!vehicleHistoryValidation.success) {
      const firstError =
        vehicleHistoryValidation.error.issues[0]?.message ||
        'Dados de Histórico Veicular inválidos.';
      console.error('Erro de validação em Histórico Veicular:', vehicleHistoryValidation.error);
      return { error: firstError };
    }
    settings.vehicleHistory = {
      ...vehicleHistoryValidation.data,
      updatedAt: new Date().toISOString(),
    };

    // Sincroniza com a tabela de versionamento de preço vehicle_history_pricing_versions
    if (typeof settings.vehicleHistory.price === 'number' && settings.vehicleHistory.price > 0) {
      try {
        const { createVehicleHistoryPricingVersion } =
          await import('@/lib/settings/pricing-service');
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminClient = createAdminClient();
        const { data: userData } = await supabase.auth.getUser();
        await createVehicleHistoryPricingVersion({
          publicPriceCents: Math.round(settings.vehicleHistory.price * 100),
          apiBrasilLiveCostCents: 3000,
          adminUserId: userData.user?.id || 'admin',
          changeReason: 'Sincronização com Configurações da Loja',
          dbClient: adminClient,
        });
      } catch (pvErr) {
        console.warn('[saveSettingsAction] Falha ao sincronizar pricing version:', pvErr);
      }
    }
  }

  const dbPayload = {
    site_name,
    whatsapp_phone,
    cnpj: cnpj || null,
    contact_email: contact_email || null,
    address: address || null,
    settings: settings || {},
    updated_at: new Date().toISOString(),
  };

  let error;

  if (id) {
    // Update existing
    const { error: updateError } = await supabase
      .from('site_settings')
      .update(dbPayload)
      .eq('id', id);
    error = updateError;
  } else {
    // Insert new
    const { error: insertError } = await supabase.from('site_settings').insert(dbPayload);
    error = insertError;
  }

  if (error) {
    console.error('Error saving settings:', error);
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/historico-veicular');
  revalidatePath('/cliente/creditos');
  revalidatePath('/cliente', 'layout');
  revalidatePath('/admin/configuracoes');
  revalidatePath('/admin/historico-veicular/configuracoes');
  return { success: true };
}

/**
 * Server Action dedicada para salvar exclusivamente configurações do Histórico Veicular,
 * preservando todas as demais configurações de loja intactas.
 */
export async function saveVehicleHistorySettingsAction(
  vehicleHistoryData: Record<string, any>,
  pricingMeta?: { apiBrasilLiveCost?: number; changeReason?: string },
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: current, error: fetchErr } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (fetchErr || !current) {
    console.error('[saveVehicleHistorySettingsAction] Erro ao buscar configurações:', fetchErr);
    return { error: 'Não foi possível carregar as configurações do sistema.' };
  }

  const existingSettings = (current.settings || {}) as SiteSettingsData;
  const currentVehicleHistory = existingSettings.vehicleHistory || {};
  const mergedVehicleHistory = {
    ...currentVehicleHistory,
    ...vehicleHistoryData,
  };

  // Se foram enviados metadados de custo ao vivo e motivo da alteração tarifária
  if (pricingMeta && typeof vehicleHistoryData.price === 'number' && vehicleHistoryData.price > 0) {
    try {
      const { createVehicleHistoryPricingVersion } = await import('@/lib/settings/pricing-service');
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = createAdminClient();
      const { data: userData } = await supabase.auth.getUser();
      const costCents =
        typeof pricingMeta.apiBrasilLiveCost === 'number' && pricingMeta.apiBrasilLiveCost >= 0
          ? Math.round(pricingMeta.apiBrasilLiveCost * 100)
          : 3000;

      await createVehicleHistoryPricingVersion({
        publicPriceCents: Math.round(vehicleHistoryData.price * 100),
        apiBrasilLiveCostCents: costCents,
        adminUserId: userData.user?.id || 'admin',
        changeReason: pricingMeta.changeReason || 'Atualização via Configurações do Histórico Veicular',
        dbClient: adminClient,
      });
    } catch (pvErr) {
      console.warn('[saveVehicleHistorySettingsAction] Falha ao registrar pricing version:', pvErr);
    }
  }

  return saveSettingsAction({
    id: current.id,
    site_name: current.site_name,
    whatsapp_phone: current.whatsapp_phone,
    cnpj: current.cnpj,
    contact_email: current.contact_email,
    address: current.address,
    settings: {
      ...existingSettings,
      vehicleHistory: mergedVehicleHistory as any,
    },
  });
}

/**
 * Server Action para upload seguro de Logo ou Favicon via Supabase Storage / ImgBB fallback.
 */
export async function uploadSiteBrandingAction(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  provider?: 'imgbb' | 'supabase';
  error?: string;
}> {
  try {
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'logo';

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: 'Nenhum arquivo enviado.' };
    }

    const uploaded = await uploadImage({
      file,
      context: 'site_settings',
      fileName: `site-${type}-${Date.now()}`,
    });

    return {
      success: true,
      url: uploaded.publicUrl,
      provider: uploaded.provider,
    };
  } catch (err: unknown) {
    console.error('Erro no upload de branding:', err);
    return {
      success: false,
      error: (err as Error).message || 'Falha ao processar upload da imagem da marca.',
    };
  }
}
