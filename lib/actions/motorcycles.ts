'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

  const { data, error } = await supabase.from('motorcycles').select('*').eq('slug', slug).single();

  if (error) {
    console.error('Error fetching motorcycle:', error);
    return null;
  }

  return data;
}

function prepareMotorcyclePayload(motoData: any) {
  const licensePlate = motoData.license_plate?.trim();
  const version = motoData.version?.trim();
  const color = motoData.color?.trim();
  const description = motoData.description?.trim();

  return {
    ...motoData,
    license_plate: licensePlate ? licensePlate : null,
    version: version ? version : null,
    color: color ? color : null,
    description: description ? description : null,
    fuel: motoData.fuel || null,
    transmission: motoData.transmission || null,
    mileage: motoData.mileage !== undefined && motoData.mileage !== '' ? Number(motoData.mileage) : 0,
    engine_capacity: motoData.engine_capacity ? Number(motoData.engine_capacity) : null,
    price: motoData.price !== undefined && motoData.price !== '' ? Number(motoData.price) : 0,
    daily_rate: motoData.daily_rate ? Number(motoData.daily_rate) : null,
    weekly_rate: motoData.weekly_rate ? Number(motoData.weekly_rate) : null,
    monthly_rate: motoData.monthly_rate ? Number(motoData.monthly_rate) : null,
  };
}

export async function createMotorcycleAction(data: any) {
  const supabase = await createClient();

  const { images, ...motoData } = data;
  const payload = prepareMotorcyclePayload(motoData);

  const slug = `${payload.brand}-${payload.model}-${payload.year_model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const internalCode =
    payload.internal_code ||
    `MOTO-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`;

  const { data: insertedMoto, error } = await supabase
    .from('motorcycles')
    .insert({
      ...payload,
      slug,
      internal_code: internalCode,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating motorcycle:', error);
    return { error: error.message };
  }

  if (images && images.length > 0) {
    const imagesToInsert = images.map((img: any, index: number) => ({
      motorcycle_id: insertedMoto.id,
      storage_path: img.path,
      is_primary: index === 0,
      sort_order: index,
    }));
    const { error: imagesError } = await supabase.from('motorcycle_images').insert(imagesToInsert);
    if (imagesError) {
      console.error('Error inserting images:', imagesError);
    }
  }

  revalidatePath('/admin/motos');
  return { success: true };
}

export async function updateMotorcycleAction(id: string, data: any) {
  const supabase = await createClient();

  const { images, ...motoData } = data;
  const payload = prepareMotorcyclePayload(motoData);

  const slug = `${payload.brand}-${payload.model}-${payload.year_model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const { error } = await supabase
    .from('motorcycles')
    .update({
      ...payload,
      slug,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating motorcycle:', error);
    return { error: error.message };
  }

  await supabase.from('motorcycle_images').delete().eq('motorcycle_id', id);

  if (images && images.length > 0) {
    const imagesToInsert = images.map((img: any, index: number) => ({
      motorcycle_id: id,
      storage_path: img.path,
      is_primary: index === 0,
      sort_order: index,
    }));
    const { error: imagesError } = await supabase.from('motorcycle_images').insert(imagesToInsert);
    if (imagesError) {
      console.error('Error inserting images:', imagesError);
    }
  }

  revalidatePath('/admin/motos');
  return { success: true };
}

export async function deleteMotorcycleAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('motorcycles').delete().eq('id', id);

  if (error) {
    console.error('Error deleting motorcycle:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/motos');
  return { success: true };
}

export async function toggleMotorcycleStatus(id: string, currentStatus: string) {
  const supabase = await createClient();
  const newStatus = currentStatus === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

  const { error } = await supabase
    .from('motorcycles')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('Error updating status:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/motos');
  return { success: true, newStatus };
}
