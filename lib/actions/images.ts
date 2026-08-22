'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { MotorcycleImage } from '@/types/database';

const BUCKET_NAME = 'motorcycle-images';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export type UploadImageResult =
  | { success: true; image: MotorcycleImage; error?: never }
  | { success: false; error: string; image?: never };

/**
 * Server action to upload an image and associate it with a specific motorcycle.
 */
export async function uploadMotorcycleImageAction(
  formData: FormData,
): Promise<UploadImageResult> {
  const supabase = await createClient();

  const motorcycleId = formData.get('motorcycleId') as string;
  const file = formData.get('file') as File | null;
  const altText = (formData.get('altText') as string) || null;

  // 1. Validations
  if (!motorcycleId || !UUID_REGEX.test(motorcycleId)) {
    return { success: false, error: 'ID da motocicleta inválido ou não informado.' };
  }

  if (!file || !(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Nenhum arquivo válido foi enviado.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'O tamanho do arquivo excede o limite de 10MB.' };
  }

  const safeExt = ALLOWED_MIME_TYPES[file.type];
  if (!safeExt) {
    return {
      success: false,
      error: 'Formato de imagem não suportado. Use JPG, PNG, WebP ou AVIF.',
    };
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

  // 3. Build unique storage path: motorcycles/{motorcycleId}/{uuid}.{ext}
  const uniqueFilename = `${crypto.randomUUID()}.${safeExt}`;
  const storagePath = `motorcycles/${motorcycleId}/${uniqueFilename}`;

  // 4. Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: '3600',
    });

  if (uploadError || !uploadData) {
    console.error('Error uploading image to storage:', uploadError);
    return { success: false, error: `Erro no upload: ${uploadError?.message || 'Falha ao salvar no Storage'}` };
  }

  // 5. Determine sort_order and is_primary
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

  // 6. Insert row in public.motorcycle_images
  const { data: imageRow, error: insertError } = await supabase
    .from('motorcycle_images')
    .insert({
      motorcycle_id: motorcycleId,
      storage_path: uploadData.path,
      sort_order: nextSortOrder,
      is_primary: shouldBePrimary,
      alt_text: altText,
    })
    .select('*')
    .single();

  // 7. Rollback if insert fails
  if (insertError || !imageRow) {
    console.error('Failed to insert motorcycle_images record. Rolling back storage object:', insertError);
    await supabase.storage.from(BUCKET_NAME).remove([uploadData.path]);
    return {
      success: false,
      error: 'Não foi possível registrar o vínculo da imagem. O arquivo enviado foi revertido com segurança.',
    };
  }

  // 8. Generate public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(imageRow.storage_path);

  // 9. Revalidate relevant Next.js routes
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
      url: publicUrlData.publicUrl,
    },
  };
}

/**
 * Server action to delete an image by ID.
 * Removes both the storage object and database record, updating primary image if needed.
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

  // 2. Remove from Storage (if not an external URL)
  if (imageRecord.storage_path && !imageRecord.storage_path.startsWith('http')) {
    const { error: storageRemoveError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([imageRecord.storage_path]);

    if (storageRemoveError) {
      console.warn('Storage removal warning (proceeding with DB deletion):', storageRemoveError);
    }
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
export async function getMotorcycleImagesAction(
  motorcycleId: string,
): Promise<MotorcycleImage[]> {
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

  return data.map((img) => {
    let url = img.storage_path;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(img.storage_path);
      url = publicUrlData.publicUrl;
    }
    return {
      ...img,
      url,
    };
  });
}

/**
 * Diagnostic action to inspect orphan storage objects and orphan database records.
 */
export async function getOrphanedImagesDiagnosticsAction() {
  const supabase = await createClient();

  const { data: dbImages, error: dbError } = await supabase
    .from('motorcycle_images')
    .select('id, motorcycle_id, storage_path, is_primary');

  const { data: storageFiles, error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .list('general', { limit: 100 });

  return {
    dbImagesCount: dbImages?.length || 0,
    dbError: dbError?.message,
    storageGeneralCount: storageFiles?.length || 0,
    storageError: storageError?.message,
    dbImages: dbImages || [],
    storageGeneralFiles: storageFiles || [],
  };
}
