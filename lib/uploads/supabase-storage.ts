import { createClient } from '@/lib/supabase/server';
import { SUPABASE_STORAGE_BUCKETS } from './constants';
import { StorageFallbackError } from './errors';
import { UploadedImage, UploadImageInput } from './types';
import { validateImageFile } from './validation';

/**
 * Generates an organized storage path based on upload context.
 */
export function generateStoragePath(
  context: UploadImageInput['context'],
  entityId?: string,
  extension: string = 'jpg',
): string {
  const uniqueId = crypto.randomUUID();
  const safeExt = extension.replace(/^\./, '');

  switch (context) {
    case 'motorcycle':
      return entityId
        ? `motorcycles/${entityId}/${uniqueId}.${safeExt}`
        : `motorcycles/temp/${uniqueId}.${safeExt}`;
    case 'sell_request':
      return entityId
        ? `sell-requests/${entityId}/${uniqueId}.${safeExt}`
        : `sell-requests/${Date.now()}-${uniqueId.substring(0, 8)}.${safeExt}`;
    case 'consignment_request':
      return entityId
        ? `consignment-requests/${entityId}/${uniqueId}.${safeExt}`
        : `consignment-requests/${Date.now()}-${uniqueId.substring(0, 8)}.${safeExt}`;
    case 'site_settings':
      return `site-settings/${uniqueId}.${safeExt}`;
    case 'profile':
      return entityId
        ? `profiles/${entityId}/${uniqueId}.${safeExt}`
        : `profiles/${uniqueId}.${safeExt}`;
    default:
      return `uploads/${uniqueId}.${safeExt}`;
  }
}

/**
 * Upload an image to Supabase Storage as a fallback or direct method.
 * Runs on the server and respects RLS policies.
 */
export async function uploadToSupabaseStorage(input: UploadImageInput): Promise<UploadedImage> {
  const validation = validateImageFile(input.file);
  if (!validation.valid) {
    throw new StorageFallbackError(
      validation.error || 'Arquivo inválido para upload no Supabase Storage.',
    );
  }

  const supabase = await createClient();
  const bucketName = SUPABASE_STORAGE_BUCKETS.MOTORCYCLE_IMAGES;
  const storagePath = generateStoragePath(
    input.context,
    input.entityId,
    validation.extension || 'jpg',
  );

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, input.file, {
      upsert: false,
      contentType: (input.file as File).type || 'image/jpeg',
      cacheControl: '3600',
    });

  if (uploadError || !uploadData) {
    console.error('Supabase Storage upload error:', uploadError);
    throw new StorageFallbackError(
      `Falha no upload para Supabase Storage: ${uploadError?.message || 'Erro desconhecido'}`,
      uploadError,
    );
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

  return {
    provider: 'supabase',
    publicUrl: publicUrlData.publicUrl,
    displayUrl: publicUrlData.publicUrl,
    thumbnailUrl: null,
    storagePath: uploadData.path,
    deleteUrl: null,
    originalName: validation.sanitizedName || input.fileName || null,
    mimeType: (input.file as File).type || 'image/jpeg',
    sizeBytes: input.file.size,
  };
}

/**
 * Remove an image object from Supabase Storage by its relative path.
 */
export async function removeFromSupabaseStorage(storagePath: string): Promise<boolean> {
  if (!storagePath || storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return true;
  }

  try {
    const supabase = await createClient();
    const bucketName = SUPABASE_STORAGE_BUCKETS.MOTORCYCLE_IMAGES;
    const { error } = await supabase.storage.from(bucketName).remove([storagePath]);

    if (error) {
      console.warn(`Aviso ao remover arquivo do Supabase Storage (${storagePath}):`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Erro ao excluir do Supabase Storage (${storagePath}):`, err);
    return false;
  }
}
