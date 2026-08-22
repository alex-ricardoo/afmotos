'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is fine initially
    console.error('Error fetching settings:', error);
    return null;
  }

  return data;
}

export async function saveSettingsAction(data: any) {
  const supabase = await createClient();

  const { id, site_name, whatsapp_phone, contact_email, address, ...restSettings } = data;

  const payload = {
    site_name,
    whatsapp_phone,
    contact_email,
    address,
    settings: restSettings,
  };

  let error;

  if (id) {
    // Update existing
    const { error: updateError } = await supabase
      .from('site_settings')
      .update(payload)
      .eq('id', id);
    error = updateError;
  } else {
    // Insert new
    const { error: insertError } = await supabase
      .from('site_settings')
      .insert(payload);
    error = insertError;
  }

  if (error) {
    console.error('Error saving settings:', error);
    return { error: error.message };
  }

  revalidatePath('/', 'layout'); // Revalidate everything to reflect setting changes globally
  return { success: true };
}
