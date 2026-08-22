import { ALLOWED_IMAGE_MIME_TYPES, UPLOAD_LIMITS } from './constants';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  extension?: string;
  sanitizedName?: string;
}

/**
 * Validates file presence, MIME type, size, and filename security.
 */
export function validateImageFile(
  file: File | Blob,
  customMaxSizeBytes: number = UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES,
): ValidationResult {
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: 'Selecione uma imagem válida.',
    };
  }

  if (file.size > customMaxSizeBytes) {
    const maxMb = Math.round(customMaxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `A imagem deve ter no máximo ${maxMb} MB.`,
    };
  }

  const mimeType = file.type?.toLowerCase() || '';
  const extension = ALLOWED_IMAGE_MIME_TYPES[mimeType];

  if (!extension) {
    return {
      valid: false,
      error: 'Formato de imagem não permitido. Utilize JPG, PNG, WebP ou AVIF.',
    };
  }

  let sanitizedName = 'imagem';
  if ('name' in file && typeof file.name === 'string') {
    // Strip path traversal characters and unsafe symbols
    sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.\./g, '')
      .substring(0, 100);
  }

  return {
    valid: true,
    extension,
    sanitizedName,
  };
}
