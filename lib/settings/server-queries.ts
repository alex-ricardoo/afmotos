import { createClient } from '@/lib/supabase/server';
import { resolvePublicSiteSettings } from '@/lib/site-settings';

/**
 * Fetches and returns the public site settings from the database.
 * This function sanitizes the data using `resolvePublicSiteSettings` 
 * to ensure no admin-only fields are exposed.
 */
export async function getPublicSiteSettings() {
  const supabase = await createClient();

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
