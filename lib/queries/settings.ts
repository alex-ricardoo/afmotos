import { createClient } from '@/lib/supabase/server';
import { SiteSettings } from '@/types/database';

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }

  return data;
}
