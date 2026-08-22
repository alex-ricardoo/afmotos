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

type MotorcyclePayload = {
  brand: string;
  model: string;
  version: string | null;
  year_manufacture: number;
  year_model: number;
  mileage: number;
  engine_capacity: number | null;
  fuel: string | null;
  transmission: string | null;
  color: string | null;
  price: number;
  description: string | null;
  ownership_type: string;
  operation_type: string;
  status: string;
  license_plate: string | null;
  featured: boolean;
};

function toMotorcyclePayload(values: any): MotorcyclePayload {
  const licensePlate = values.license_plate?.trim();
  const version = values.version?.trim();
  const color = values.color?.trim();
  const description = values.description?.trim();

  return {
    brand: values.brand,
    model: values.model,
    version: version || null,
    year_manufacture: Number(values.year_manufacture),
    year_model: Number(values.year_model),
    mileage: values.mileage ? Number(values.mileage) : 0,
    engine_capacity: values.engine_capacity ? Number(values.engine_capacity) : null,
    fuel: values.fuel || null,
    transmission: values.transmission || null,
    color: color || null,
    price: values.price ? Number(values.price) : 0,
    description: description || null,
    ownership_type: values.ownership_type,
    operation_type: values.operation_type,
    status: values.status,
    license_plate: licensePlate || null,
    featured: Boolean(values.featured),
  };
}

export async function createMotorcycleAction(data: any) {
  const supabase = await createClient();

  const { images, ...motoData } = data;
  const payload = toMotorcyclePayload(motoData);

  const slug = `${payload.brand}-${payload.model}-${payload.year_model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const internalCode =
    motoData.internal_code ||
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
    return {
      error:
        'Não foi possível salvar os dados da motocicleta. Verifique os campos e tente novamente.',
    };
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
  const payload = toMotorcyclePayload(motoData);

  const slug = `${payload.brand}-${payload.model}-${payload.year_model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const { data: updatedMoto, error } = await supabase
    .from('motorcycles')
    .update({
      ...payload,
      slug,
    })
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error('Error updating motorcycle:', error);
    return {
      error:
        'Não foi possível salvar os dados da motocicleta. Verifique os campos e tente novamente.',
    };
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

  const { error } = await supabase.from('motorcycles').update({ status: newStatus }).eq('id', id);

  if (error) {
    console.error('Error updating status:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/motos');
  return { success: true, newStatus };
}
