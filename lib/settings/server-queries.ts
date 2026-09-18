import { resolvePublicSiteSettings } from '../site-settings';
import { getVehicleHistoryPricingConfig } from './pricing-service';

/**
 * Fetches and returns the public site settings from the database.
 * This function sanitizes the data using `resolvePublicSiteSettings`
 * to ensure no admin-only fields are exposed.
 */
export async function getPublicSiteSettings() {
  let supabase;
  try {
    const { createClient } = await import('@/lib/supabase/server');
    supabase = await createClient();
  } catch {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    supabase = createAdminClient();
  }

  const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();

  if (error) {
    console.error('Error fetching public site settings:', error);
    return null;
  }

  // Sanitizes the raw data, exposing only what is needed for public consumption
  return resolvePublicSiteSettings(data);
}

/**
 * Retorna o preço oficial da consulta veicular configurado em site_settings / vehicle_history_pricing_versions.
 */
export async function getVehicleConsultationPrice(): Promise<number> {
  try {
    const settings = await getPublicSiteSettings();
    if (typeof settings?.vehicleHistory?.price === 'number' && settings.vehicleHistory.price > 0) {
      return settings.vehicleHistory.price;
    }
    const pricingConfig = await getVehicleHistoryPricingConfig();
    if (pricingConfig?.publicPriceCents && pricingConfig.publicPriceCents > 0) {
      return pricingConfig.publicPriceCents / 100;
    }
  } catch (error) {
    console.error('Error fetching vehicle consultation price:', error);
  }
  return 39.9;
}
