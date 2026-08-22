import { IMGBB_API_URL, UPLOAD_LIMITS } from './constants';
import { ImgBBError } from './errors';
import { UploadedImage, UploadImageInput } from './types';
import { validateImageFile } from './validation';

interface ImgBBResponse {
  data?: {
    id: string;
    title: string;
    url_viewer?: string;
    url: string;
    display_url?: string;
    width?: string | number;
    height?: string | number;
    size?: number;
    time?: string | number;
    expiration?: string | number;
    image?: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb?: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url?: string;
  };
  success: boolean;
  status?: number;
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Upload an image to ImgBB via the official v1 API.
 * Runs strictly on the server using process.env.IMGBB_API_KEY.
 */
export async function uploadToImgBB(input: UploadImageInput): Promise<UploadedImage> {
  const apiKey = process.env.IMGBB_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new ImgBBError('Chave da API ImgBB não configurada no servidor (IMGBB_API_KEY).', {
      isTransient: false,
    });
  }

  // Pre-validate file
  const validation = validateImageFile(input.file, UPLOAD_LIMITS.MAX_IMGBB_FILE_SIZE_BYTES);
  if (!validation.valid) {
    throw new ImgBBError(validation.error || 'Arquivo inválido para upload no ImgBB.', {
      isTransient: false,
    });
  }

  let attempt = 0;
  const maxRetries = UPLOAD_LIMITS.MAX_IMGBB_RETRIES;

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_LIMITS.IMGBB_TIMEOUT_MS);

    // Combine user signal with timeout signal if provided
    if (input.signal) {
      input.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const formData = new FormData();
      // If fileName was specified, use it
      const originalName = validation.sanitizedName || input.fileName || 'imagem';
      formData.append('image', input.file, originalName);
      formData.append('name', originalName.replace(/\.[^/.]+$/, ''));

      const endpoint = `${IMGBB_API_URL}?key=${encodeURIComponent(apiKey.trim())}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-200 responses
      if (!response.ok) {
        const isTransient = [408, 429, 500, 502, 503, 504].includes(response.status);
        let errorMsg = `ImgBB retornou status HTTP ${response.status}`;
        try {
          const errJson = (await response.json()) as ImgBBResponse;
          if (errJson?.error?.message) {
            errorMsg = `ImgBB: ${errJson.error.message}`;
          }
        } catch {
          // ignore parse error
        }

        if (isTransient && attempt <= maxRetries) {
          const delay =
            UPLOAD_LIMITS.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 100;
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }

        throw new ImgBBError(errorMsg, { statusCode: response.status, isTransient });
      }

      const json = (await response.json()) as ImgBBResponse;

      if (!json.success || !json.data || !json.data.url) {
        throw new ImgBBError('Resposta da API ImgBB incompleta ou sem URL pública.', {
          statusCode: json.status || 500,
          isTransient: false,
        });
      }

      const uploadedData = json.data;

      return {
        provider: 'imgbb',
        publicUrl: uploadedData.url,
        displayUrl: uploadedData.display_url || uploadedData.url_viewer || null,
        thumbnailUrl: uploadedData.thumb?.url || null,
        storagePath: null,
        deleteUrl: uploadedData.delete_url || null,
        originalName: originalName,
        mimeType: (input.file as File).type || 'image/jpeg',
        sizeBytes: input.file.size,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof ImgBBError) {
        if (!err.isTransient || attempt > maxRetries) {
          throw err;
        }
      }

      const isAbort = (err as Error)?.name === 'AbortError';
      const errorCode = typeof err === 'object' && err !== null && 'code' in err ? (err as { code?: string }).code : undefined;
      const isTransient =
        isAbort || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT';

      if (isTransient && attempt <= maxRetries) {
        const delay =
          UPLOAD_LIMITS.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      throw new ImgBBError(
        isAbort
          ? 'Tempo limite de upload esgotado na API ImgBB.'
          : `Falha de rede ao conectar com ImgBB: ${(err as Error).message}`,
        { isTransient },
      );
    }
  }

  throw new ImgBBError('Tentativas de upload esgotadas para a API ImgBB.', { isTransient: false });
}
