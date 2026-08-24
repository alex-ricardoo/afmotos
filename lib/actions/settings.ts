'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadImage } from '@/lib/uploads';
import { SiteSettingsData } from '@/types/site-settings';

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
  contact_email?: string | null;
  address?: string | null;
  settings: SiteSettingsData;
}

export async function saveSettingsAction(payload: SaveSettingsPayload) {
  const supabase = await createClient();

  const { id, site_name, whatsapp_phone, contact_email, address, settings } = payload;

  const dbPayload = {
    site_name,
    whatsapp_phone,
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
  revalidatePath('/admin/configuracoes');
  return { success: true };
}

/**
 * Server Action para upload seguro de Logo ou Favicon via ImgBB / Supabase Storage.
 */
export async function uploadSiteBrandingAction(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  provider?: 'imgbb' | 'supabase';
  error?: string;
}> {
  try {
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'logo';

    if (!file || file.size === 0) {
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
  } catch (err: any) {
    console.error('Erro no upload de branding:', err);
    return {
      success: false,
      error: err.message || 'Falha ao processar upload da imagem da marca.',
    };
  }
}
