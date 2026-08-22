import { uploadToImgBB } from './imgbb';
import { uploadToSupabaseStorage } from './supabase-storage';
import { UploadedImage, UploadImageInput } from './types';
import { UploadError } from './errors';
import { validateImageFile } from './validation';

/**
 * Master image upload orchestrator.
 * Follows the strict priority rule:
 * 1. Attempt upload via ImgBB API v1.
 * 2. If ImgBB fails (or key is missing), automatically fallback to Supabase Storage.
 * 3. If both fail, throw normalized UploadError with user-friendly message.
 */
export async function uploadImage(input: UploadImageInput): Promise<UploadedImage> {
  // Step 1: Pre-validation
  const validation = validateImageFile(input.file);
  if (!validation.valid) {
    throw new UploadError(validation.error || 'Arquivo de imagem inválido.', {
      code: 'INVALID_FILE',
      isTransient: false,
    });
  }

  // Step 2: Try ImgBB first if key is present
  const hasImgbbKey = Boolean(process.env.IMGBB_API_KEY && process.env.IMGBB_API_KEY.trim() !== '');

  if (hasImgbbKey) {
    try {
      const imgbbResult = await uploadToImgBB(input);
      return imgbbResult;
    } catch (imgbbError) {
      console.warn(
        'Upload no ImgBB falhou. Acionando fallback automático para Supabase Storage:',
        (imgbbError as Error)?.message || imgbbError,
      );
      // Fall through to Supabase Storage fallback
    }
  } else {
    console.info(
      'IMGBB_API_KEY não configurada. Direcionando upload diretamente para Supabase Storage fallback.',
    );
  }

  // Step 3: Try Supabase Storage fallback
  try {
    const supabaseResult = await uploadToSupabaseStorage(input);
    return supabaseResult;
  } catch (storageError) {
    console.error('Falha no fallback do Supabase Storage:', storageError);
    throw new UploadError(
      'Não foi possível enviar a imagem no momento. Por favor, tente novamente.',
      {
        code: 'ALL_PROVIDERS_FAILED',
        isTransient: true,
        cause: storageError,
      },
    );
  }
}
