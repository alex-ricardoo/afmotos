import { resolvePublicSiteSettings } from '../site-settings.ts';

/**
 * Fetches and returns the public site settings from the database.
 * This function sanitizes the data using `resolvePublicSiteSettings` 
 * to ensure no admin-only fields are exposed.
 */
export async function getPublicSiteSettings() {
  let supabase;
  try {
    const { createClient } = await import('../supabase/server.ts');
    supabase = await createClient();
  } catch {
    const { createAdminClient } = await import('../supabase/admin.ts');
    supabase = createAdminClient();
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching public site settings:', error);
    return null;
  }

  // Sanitizes the raw data, exposing only what is needed for public consumption
  return resolvePublicSiteSettings(data);
}

import { getVehicleHistoryPricingConfig } from './pricing-service.ts';

/**
 * Retorna o preço oficial da consulta veicular configurado em vehicle_history_pricing_versions
 * com sincronização com site_settings.
 * Fallback seguro: 39.90.
 */
export async function getVehicleConsultationPrice(): Promise<number> {
  try {
    const pricingConfig = await getVehicleHistoryPricingConfig();
    if (pricingConfig?.publicPriceCents && pricingConfig.publicPriceCents > 0) {
      return pricingConfig.publicPriceCents / 100;
    }
    const settings = await getPublicSiteSettings();
    if (settings?.vehicleHistory?.price && settings.vehicleHistory.price > 0) {
      return settings.vehicleHistory.price;
    }
  } catch (error) {
    console.error('Error fetching vehicle consultation price:', error);
  }
  return 39.90;
}

