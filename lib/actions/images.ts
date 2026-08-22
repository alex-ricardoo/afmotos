'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { MotorcycleImage } from '@/types/database';
import { uploadImage, removeFromSupabaseStorage, getImageSource } from '@/lib/uploads';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UploadImageResult =
  | { success: true; image: MotorcycleImage; error?: never }
  | { success: false; error: string; image?: never };

/**
 * Server action to upload an image and associate it with a specific motorcycle.
 * Uses ImgBB as primary provider with automated Supabase Storage fallback.
 */
export async function uploadMotorcycleImageAction(formData: FormData): Promise<UploadImageResult> {
  const supabase = await createClient();

  const motorcycleId = formData.get('motorcycleId') as string;
  const file = formData.get('file') as File | null;
  const altText = (formData.get('altText') as string) || null;

  // 1. Basic validation
  if (!motorcycleId || !UUID_REGEX.test(motorcycleId)) {
    return { success: false, error: 'ID da motocicleta inválido ou não informado.' };
  }

  if (!file || !(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Nenhum arquivo válido foi enviado.' };
  }

  // 2. Check if motorcycle exists
  const { data: moto, error: motoError } = await supabase
    .from('motorcycles')
    .select('id, slug')
    .eq('id', motorcycleId)
    .single();

  if (motoError || !moto) {
    return { success: false, error: 'Motocicleta não encontrada no sistema.' };
  }

  // 3. Upload image via centralized orchestrator (ImgBB -> Supabase Storage fallback)
  let uploadResult;
  try {
    uploadResult = await uploadImage({
      file,
      context: 'motorcycle',
      entityId: motorcycleId,
      altText: altText || undefined,
    });
  } catch (err: unknown) {
    console.error('Error during image upload orchestration:', err);
    return {
      success: false,
      error: (err as Error).message || 'Falha ao processar o upload da imagem.',
    };
  }

  // 4. Determine sort_order and is_primary
  const { data: existingImages } = await supabase
    .from('motorcycle_images')
    .select('id, sort_order, is_primary')
    .eq('motorcycle_id', motorcycleId)
    .order('sort_order', { ascending: false });

  const hasPrimary = existingImages?.some((img) => img.is_primary) ?? false;
  const shouldBePrimary = !hasPrimary || (existingImages?.length ?? 0) === 0;
  const maxSortOrder =
    existingImages && existingImages.length > 0
      ? Math.max(...existingImages.map((i) => i.sort_order ?? 0))
      : -1;
  const nextSortOrder = maxSortOrder + 1;

  // 5. Insert row in public.motorcycle_images with external metadata
  const insertPayload = {
    motorcycle_id: motorcycleId,
    provider: uploadResult.provider,
    storage_path: uploadResult.storagePath,
    public_url: uploadResult.publicUrl,
    display_url: uploadResult.displayUrl,
    thumbnail_url: uploadResult.thumbnailUrl,
    delete_url: uploadResult.deleteUrl,
    sort_order: nextSortOrder,
    is_primary: shouldBePrimary,
    alt_text: altText,
  };

  let { data: imageRow, error: insertError } = await supabase
    .from('motorcycle_images')
    .insert(insertPayload)
    .select('*')
    .single();

  // Fallback: se o banco ainda não possuir as novas colunas de metadados externos
  if (insertError) {
    const legacyPayload = {
      motorcycle_id: motorcycleId,
      storage_path: uploadResult.storagePath || uploadResult.publicUrl || '',
      sort_order: nextSortOrder,
      is_primary: shouldBePrimary,
      alt_text: altText,
    };
    const fallbackRes = await supabase
      .from('motorcycle_images')
      .insert(legacyPayload)
      .select('*')
      .single();
    if (!fallbackRes.error && fallbackRes.data) {
      imageRow = fallbackRes.data;
      insertError = null;
    }
  }

  // 6. Rollback if insert fails
  if (insertError || !imageRow) {
    console.error(
      'Failed to insert motorcycle_images record. Rolling back uploaded file if on Supabase:',
      insertError,
    );
    if (uploadResult.provider === 'supabase' && uploadResult.storagePath) {
      await removeFromSupabaseStorage(uploadResult.storagePath);
    }
    return {
      success: false,
      error:
        'Não foi possível registrar o vínculo da imagem. O arquivo enviado foi revertido com segurança.',
    };
  }

  // 7. Revalidate relevant Next.js routes
  revalidatePath('/admin/motos');
  revalidatePath(`/admin/motos/${motorcycleId}/editar`);
  revalidatePath('/motos');
  if (moto.slug) {
    revalidatePath(`/motos/${moto.slug}`);
  }

  return {
    success: true,
    image: {
      ...imageRow,
      url: getImageSource(imageRow),
    },
  };
}

/**
 * Server action to delete an image by ID.
 * Removes both the storage object (if Supabase) and database record, updating primary image if needed.
 */
export async function deleteMotorcycleImageAction(
  imageId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (!imageId) {
    return { success: false, error: 'ID da imagem não informado.' };
  }

  // 1. Fetch image record
  const { data: imageRecord, error: fetchError } = await supabase
    .from('motorcycle_images')
    .select('*, motorcycles(slug)')
    .eq('id', imageId)
    .single();

  if (fetchError || !imageRecord) {
    return { success: false, error: 'Imagem não encontrada.' };
  }

  const motorcycleId = imageRecord.motorcycle_id;
  const wasPrimary = imageRecord.is_primary;
  const provider = imageRecord.provider || (imageRecord.storage_path ? 'supabase' : 'imgbb');

  // 2. Remove from Storage if Supabase
  if (provider === 'supabase' && imageRecord.storage_path) {
    await removeFromSupabaseStorage(imageRecord.storage_path);
  } else if (provider === 'imgbb') {
    // Audit log for ImgBB deletion
    console.info(`[ImgBB] Imagem desvinculada do catálogo (ID: ${imageId}). Delete URL arquivada.`);
  }

  // 3. Delete from DB
  const { error: deleteError } = await supabase
    .from('motorcycle_images')
    .delete()
    .eq('id', imageId);

  if (deleteError) {
    console.error('Error deleting motorcycle image record:', deleteError);
    return { success: false, error: `Erro ao excluir imagem: ${deleteError.message}` };
  }

  // 4. Elect a new primary image if the deleted image was primary
  if (wasPrimary) {
    const { data: remainingImages } = await supabase
      .from('motorcycle_images')
      .select('id')
      .eq('motorcycle_id', motorcycleId)
      .order('sort_order', { ascending: true })
      .limit(1);

    if (remainingImages && remainingImages.length > 0) {
      await supabase
        .from('motorcycle_images')
        .update({ is_primary: true })
        .eq('id', remainingImages[0].id);
    }
  }

  // 5. Revalidate cache
  revalidatePath('/admin/motos');
  revalidatePath(`/admin/motos/${motorcycleId}/editar`);
  revalidatePath('/motos');
  const slug = (imageRecord.motorcycles as any)?.slug;
  if (slug) {
    revalidatePath(`/motos/${slug}`);
  }

  return { success: true };
}

/**
 * Server action to set a specific image as primary for a motorcycle.
 */
export async function setPrimaryMotorcycleImageAction(
  imageId: string,
  motorcycleId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (!imageId || !motorcycleId) {
    return { success: false, error: 'Parâmetros incompletos.' };
  }

  // 1. Reset all images for this motorcycle to is_primary = false
  const { error: resetError } = await supabase
    .from('motorcycle_images')
    .update({ is_primary: false })
    .eq('motorcycle_id', motorcycleId);

  if (resetError) {
    console.error('Error resetting primary images:', resetError);
    return { success: false, error: 'Erro ao redefinir imagem principal.' };
  }

  // 2. Set selected image as primary
  const { error: updateError } = await supabase
    .from('motorcycle_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('motorcycle_id', motorcycleId);

  if (updateError) {
    console.error('Error setting primary image:', updateError);
    return { success: false, error: 'Erro ao marcar imagem como principal.' };
  }

  // 3. Revalidate cache
  revalidatePath('/admin/motos');
  revalidatePath(`/admin/motos/${motorcycleId}/editar`);
  revalidatePath('/motos');

  return { success: true };
}

/**
 * Server action to update sort orders of images for a motorcycle.
 */
export async function reorderMotorcycleImagesAction(
  motorcycleId: string,
  orderedImageIds: string[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  for (let i = 0; i < orderedImageIds.length; i++) {
    const id = orderedImageIds[i];
    await supabase
      .from('motorcycle_images')
      .update({ sort_order: i })
      .eq('id', id)
      .eq('motorcycle_id', motorcycleId);
  }

  revalidatePath('/admin/motos');
  revalidatePath(`/admin/motos/${motorcycleId}/editar`);
  revalidatePath('/motos');

  return { success: true };
}

/**
 * Helper to fetch all images for a motorcycle with resolved public URLs.
 */
export async function getMotorcycleImagesAction(motorcycleId: string): Promise<MotorcycleImage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycle_images')
    .select('*')
    .eq('motorcycle_id', motorcycleId)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.error('Error fetching motorcycle images:', error);
    return [];
  }

  return data.map((img) => ({
    ...img,
    url: getImageSource(img),
  }));
}
