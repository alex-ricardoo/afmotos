import { createClient } from '@/lib/supabase/server';
import { SUPABASE_STORAGE_BUCKETS } from './constants';
import { StorageError } from './errors';
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
 * Upload an image to Supabase Storage as the PRIMARY method.
 * Runs on the server and respects RLS policies.
 */
export async function uploadToSupabaseStorage(input: UploadImageInput): Promise<UploadedImage> {
  const validation = validateImageFile(input.file);
  if (!validation.valid) {
    throw new StorageError(
      validation.error || 'Arquivo inválido para upload no Supabase Storage.',
      { statusCode: 400, isTransient: false, code: 'INVALID_FILE' },
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
    const errorMsg = uploadError?.message || 'Erro desconhecido no Supabase Storage';
    const statusCode =
      typeof uploadError === 'object' && uploadError !== null && 'statusCode' in uploadError
        ? Number((uploadError as { statusCode?: unknown }).statusCode)
        : typeof uploadError === 'object' && uploadError !== null && 'status' in uploadError
          ? Number((uploadError as { status?: unknown }).status)
          : undefined;

    throw new StorageError(`Falha no upload para Supabase Storage: ${errorMsg}`, {
      statusCode,
      code:
        typeof uploadError === 'object' && uploadError !== null && 'error' in uploadError
          ? String((uploadError as { error?: unknown }).error)
          : 'STORAGE_UPLOAD_FAILED',
      cause: uploadError,
    });
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
 * Used for deletion and rollback/compensation if DB persistence fails.
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
