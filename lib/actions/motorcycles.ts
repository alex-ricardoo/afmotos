'use server';

import { createClient } from '@/lib/supabase/server';

export async function getMotorcycles() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .neq('status', 'HIDDEN')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching motorcycles:', error);
    return [];
  }

  return data;
}

export async function getMotorcycleBySlug(slug: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching motorcycle:', error);
    return null;
  }

  return data;
}

export async function createMotorcycleAction(data: any) {
  const supabase = await createClient();

  // Create slug from brand, model, and year
  const slug = `${data.brand}-${data.model}-${data.year_model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  // Generate random internal code if not provided
  const internalCode = data.internal_code || `MOTO-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  const { error } = await supabase.from("motorcycles").insert({
    ...data,
    slug,
    internal_code: internalCode,
  });

  if (error) {
    console.error("Error creating motorcycle:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function updateMotorcycleAction(id: string, data: any) {
  const supabase = await createClient();

  const slug = `${data.brand}-${data.model}-${data.year_model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const { error } = await supabase.from("motorcycles").update({
    ...data,
    slug,
  }).eq("id", id);

  if (error) {
    console.error("Error updating motorcycle:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteMotorcycleAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("motorcycles").delete().eq("id", id);

  if (error) {
    console.error("Error deleting motorcycle:", error);
    return { error: error.message };
  }

  return { success: true };
}
