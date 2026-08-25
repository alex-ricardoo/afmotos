import { MotorcycleOcrResultSchema, MotorcycleOcrResult } from './schemas';
import {
  normalizePlate,
  normalizeRenavam,
  normalizeChassi,
  normalizeYear,
  normalizeEngineCapacity,
  normalizeFuel,
  normalizeText,
} from './normalizers';

type GeminiModelMetadata = {
  name?: string;
  supportedGenerationMethods?: string[];
};

const FALLBACK_FLASH_MODEL_REGEX = /flash/i;

const SYSTEM_INSTRUCTION = `Você é um sistema especialista em OCR e extração estruturada de dados veiculares para documentos brasileiros de motocicletas (CRLV - Certificado de Registro e Licenciamento de Veículo, CRV físico ou digital).

Analise detalhadamente a imagem do documento e extraia com máxima fidelidade os dados da motocicleta.

Regras Obrigatórias:
1. Extraia APENAS dados claramente visíveis no documento.
2. NUNCA invente ou adivinhe informações. Se um campo não estiver legível ou ausente, retorne null.
3. Diferencie rigorosamente "Ano de Fabricação" (ANO FAB) de "Ano do Modelo" (ANO MOD).
4. No RENAVAM, preserve todos os dígitos e eventuais zeros à esquerda como string.
5. No CHASSI (VIN), extraia os 17 caracteres alfanuméricos em maiúsculas sem espaços ou traços.
6. Na PLACA, extraia os caracteres alfanuméricos completos.
7. Na CILINDRADA (CM3 / CC / CILINDRADA), extraia o valor numérico inteiro (ex: 160, 250, 650, 1000).
8. No COMBUSTÍVEL, classifique conforme: 'gasolina', 'etanol', 'flex', 'eletrico', 'diesel' ou null.
9. Atribua um índice de confiança de 0.0 a 1.0 para cada campo extraído no objeto "confidence".
10. Se houver rasura, corte, desfoque ou ilegibilidade em qualquer campo, adicione uma mensagem descritiva no array "warnings".
11. Identifique o tipo de documento: "CRLV", "CRV" ou "UNKNOWN".
12. Retorne ESTRITAMENTE um objeto JSON válido correspondente ao schema solicitado, sem blocos de texto ou markdown ao redor.`;

/**
 * Modelos Gemini disponíveis para uso com chaves gratuitas e pagas do Google AI Studio.
 * Ordem de preferência: mais recente primeiro.
 * Não inclua modelos que retornam 404 para novas chaves.
 */
export const GEMINI_MODELS = ['gemini-3.6-flash'];

const DEFAULT_OCR_TIMEOUT_MS = 25000;
const DEFAULT_OCR_TIMEOUT_PDF_MS = 45000;

function parseTimeoutMs(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 5000) {
    return fallback;
  }

  return Math.floor(parsed);
}

function resolveOcrTimeoutMs(mimeType: string): number {
  if (mimeType === 'application/pdf') {
    return parseTimeoutMs(process.env.GEMINI_OCR_TIMEOUT_PDF_MS, DEFAULT_OCR_TIMEOUT_PDF_MS);
  }

  return parseTimeoutMs(process.env.GEMINI_OCR_TIMEOUT_MS, DEFAULT_OCR_TIMEOUT_MS);
}

function getConfiguredFallbackModels(): string[] {
  const configured = process.env.GEMINI_FALLBACK_MODELS;

  if (!configured) {
    return [];
  }

  return configured
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)
    .filter((model) => !GEMINI_MODELS.includes(model));
}

function parseGeminiResponseErrorText(responseText: string): string {
  try {
    const parsed = JSON.parse(responseText) as { error?: { message?: string } };
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // Ignora parse inválido; usa texto bruto abaixo.
  }

  return responseText;
}

function isPdfUnsupportedError(status: number, mimeType: string, message: string): boolean {
  if (mimeType !== 'application/pdf') {
    return false;
  }

  if (status !== 400 && status !== 415 && status !== 422) {
    return false;
  }

  return /pdf|mime|unsupported|application\/pdf/i.test(message);
}

async function resolveModelsToTry(apiKey: string): Promise<string[]> {
  const candidateModels = [...GEMINI_MODELS, ...getConfiguredFallbackModels()];

  if (candidateModels.length === 0) {
    return GEMINI_MODELS;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

    if (!response.ok) {
      return candidateModels;
    }

    const data = (await response.json()) as { models?: GeminiModelMetadata[] };

    const allAvailable = (data.models ?? [])
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => model.name?.replace(/^models\//, '').trim())
      .filter((model): model is string => Boolean(model));

    const available = new Set(allAvailable);

    const filtered = candidateModels.filter((model) => available.has(model));
    if (filtered.length > 0) {
      return filtered;
    }

    // Se nenhum candidato configurado estiver disponível, tenta modelos "flash"
    // detectados na própria chave ativa para evitar indisponibilidade por nome legado.
    const discoveredFallback = allAvailable.filter((model) => FALLBACK_FLASH_MODEL_REGEX.test(model));
    return discoveredFallback.length > 0 ? discoveredFallback : candidateModels;
  } catch {
    // Em falhas de rede/listagem, mantém candidatos configurados para não travar no modelo único.
    return candidateModels;
  }
}

/** Tipos de erro internos para classificação de tratamento no route handler */
export type GeminiErrorCode =
  | 'GEMINI_API_KEY_NOT_CONFIGURED'
  | 'GEMINI_MODEL_UNAVAILABLE'
  | 'GEMINI_UNAUTHORIZED'
  | 'GEMINI_RATE_LIMITED'
  | 'GEMINI_SERVER_ERROR'
  | 'GEMINI_TIMEOUT'
  | 'GEMINI_NO_RESPONSE'
  | 'GEMINI_INVALID_JSON'
  | 'GEMINI_SCHEMA_VALIDATION_FAILED'
  | 'GEMINI_PDF_UNSUPPORTED';

export class GeminiError extends Error {
  constructor(
    public readonly code: GeminiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

const GEMINI_ERROR_PRIORITY: Record<GeminiErrorCode, number> = {
  GEMINI_UNAUTHORIZED: 100,
  GEMINI_RATE_LIMITED: 95,
  GEMINI_TIMEOUT: 90,
  GEMINI_SERVER_ERROR: 85,
  GEMINI_PDF_UNSUPPORTED: 80,
  GEMINI_NO_RESPONSE: 70,
  GEMINI_INVALID_JSON: 65,
  GEMINI_SCHEMA_VALIDATION_FAILED: 60,
  GEMINI_MODEL_UNAVAILABLE: 10,
  GEMINI_API_KEY_NOT_CONFIGURED: 5,
};

function pickPreferredGeminiError(
  current: GeminiError | null,
  candidate: GeminiError,
): GeminiError {
  if (!current) {
    return candidate;
  }

  const currentPriority = GEMINI_ERROR_PRIORITY[current.code] ?? 0;
  const candidatePriority = GEMINI_ERROR_PRIORITY[candidate.code] ?? 0;
  return candidatePriority >= currentPriority ? candidate : current;
}

function classifyHttpError(status: number): GeminiErrorCode {
  if (status === 404) return 'GEMINI_MODEL_UNAVAILABLE';
  if (status === 401 || status === 403) return 'GEMINI_UNAUTHORIZED';
  if (status === 429) return 'GEMINI_RATE_LIMITED';
  if (status === 500 || status === 503) return 'GEMINI_SERVER_ERROR';
  return 'GEMINI_SERVER_ERROR';
}

export async function processMotorcycleDocumentWithGemini(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<MotorcycleOcrResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiError('GEMINI_API_KEY_NOT_CONFIGURED', 'GEMINI_API_KEY não configurada');
  }

  // PDFs são enviados inline_data da mesma forma que imagens na Gemini API v1beta.
  // Modelos multimodais suportam application/pdf diretamente.
  const base64Data = imageBuffer.toString('base64');

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${SYSTEM_INSTRUCTION}

Retorne os dados no seguinte formato JSON:
{
  "brand": string | null,
  "model": string | null,
  "version": string | null,
  "yearManufacture": number | null,
  "yearModel": number | null,
  "licensePlate": string | null,
  "renavam": string | null,
  "chassi": string | null,
  "color": string | null,
  "fuel": "gasolina" | "etanol" | "flex" | "eletrico" | "diesel" | null,
  "engineCapacity": number | null,
  "ownerName": string | null,
  "documentType": "CRLV" | "CRV" | "UNKNOWN",
  "confidence": {
    "brand": number,
    "model": number,
    "version": number,
    "yearManufacture": number,
    "yearModel": number,
    "licensePlate": number,
    "renavam": number,
    "chassi": number,
    "color": number,
    "fuel": number,
    "engineCapacity": number
  },
  "warnings": string[]
}`,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.1,
    },
  };

  const modelsToTry = await resolveModelsToTry(apiKey);
  const timeoutMs = resolveOcrTimeoutMs(mimeType);

  let lastError: GeminiError | null = null;
  let rawJsonText: string | null = null;
  let successModel: string | null = null;

  for (const model of modelsToTry) {
    const attemptStart = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      const duration = Date.now() - attemptStart;

      if (!response.ok) {
        const rawErrorText = await response.text();
        const parsedErrorText = parseGeminiResponseErrorText(rawErrorText);

        if (isPdfUnsupportedError(response.status, mimeType, parsedErrorText)) {
          console.warn(
            `[OCR] Modelo ${model} não suportou PDF (HTTP ${response.status}) em ${duration}ms | código: GEMINI_PDF_UNSUPPORTED`,
          );
          throw new GeminiError('GEMINI_PDF_UNSUPPORTED', 'PDF não suportado pelo modelo');
        }

        const errorCode = classifyHttpError(response.status);
        // Loga status e código sem expor API key, base64, payload ou prompt.
        console.warn(
          `[OCR] Modelo ${model} retornou HTTP ${response.status} em ${duration}ms | código: ${errorCode}`,
        );
        lastError = pickPreferredGeminiError(
          lastError,
          new GeminiError(errorCode, `HTTP ${response.status} do Gemini`),
        );

        // 404 = modelo indisponível para esta chave → tentar próximo
        // 401/403 = chave inválida → sem utilidade tentar outros modelos
        if (response.status === 401 || response.status === 403) {
          throw lastError;
        }
        continue;
      }

      const responseJson = await response.json();
      const candidateText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (candidateText) {
        rawJsonText = candidateText;
        successModel = model;
        console.info(`[OCR] Modelo ${model} respondeu com sucesso (HTTP 200) em ${duration}ms`);
        break;
      }

      console.warn(`[OCR] Modelo ${model} retornou resposta vazia em ${duration}ms`);
      lastError = pickPreferredGeminiError(
        lastError,
        new GeminiError('GEMINI_NO_RESPONSE', `Resposta vazia do modelo ${model}`),
      );
    } catch (err: unknown) {
      if (err instanceof GeminiError) {
        // Erro classificado → propagar diretamente (ex: 401/403)
        throw err;
      }

      const errorObj = err instanceof Error ? err : new Error(String(err));

      if (errorObj.name === 'AbortError') {
        console.warn(`[OCR] Timeout (${timeoutMs}ms) ao tentar modelo ${model}`);
        lastError = pickPreferredGeminiError(
          lastError,
          new GeminiError('GEMINI_TIMEOUT', `Timeout ao chamar modelo ${model}`),
        );
        continue;
      }

      console.warn(`[OCR] Erro de rede ao tentar modelo ${model}:`, errorObj.message);
      lastError = pickPreferredGeminiError(
        lastError,
        new GeminiError('GEMINI_SERVER_ERROR', errorObj.message),
      );
    }
  }

  if (!rawJsonText || !successModel) {
    throw lastError ?? new GeminiError('GEMINI_NO_RESPONSE', 'Nenhum modelo retornou dados');
  }

  // Sanitização e parse do JSON retornado
  let parsed: unknown;
  try {
    const cleanJson = rawJsonText
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    parsed = JSON.parse(cleanJson);
  } catch {
    console.error(`[OCR] Falha no parse do JSON retornado pelo modelo ${successModel}`);
    throw new GeminiError('GEMINI_INVALID_JSON', 'JSON inválido retornado pelo modelo');
  }

  // Validação estrita via Zod
  const validationResult = MotorcycleOcrResultSchema.safeParse(parsed);
  if (!validationResult.success) {
    console.error('[OCR] Falha na validação do schema OCR retornado pelo Gemini');
    throw new GeminiError('GEMINI_SCHEMA_VALIDATION_FAILED', 'Schema OCR inválido');
  }

  const data = validationResult.data;

  // Normalização final dos campos extraídos
  const normalized: MotorcycleOcrResult = {
    brand: normalizeText(data.brand) || null,
    model: normalizeText(data.model) || null,
    version: normalizeText(data.version) || null,
    yearManufacture: normalizeYear(data.yearManufacture),
    yearModel: normalizeYear(data.yearModel),
    licensePlate: normalizePlate(data.licensePlate) || null,
    renavam: normalizeRenavam(data.renavam) || null,
    chassi: normalizeChassi(data.chassi) || null,
    color: normalizeText(data.color) || null,
    fuel: normalizeFuel(data.fuel),
    engineCapacity: normalizeEngineCapacity(data.engineCapacity),
    documentType: data.documentType || 'CRLV',
    confidence: {
      brand: data.confidence?.brand ?? 1,
      model: data.confidence?.model ?? 1,
      version: data.confidence?.version ?? 1,
      yearManufacture: data.confidence?.yearManufacture ?? 1,
      yearModel: data.confidence?.yearModel ?? 1,
      licensePlate: data.confidence?.licensePlate ?? 1,
      renavam: data.confidence?.renavam ?? 1,
      chassi: data.confidence?.chassi ?? 1,
      color: data.confidence?.color ?? 1,
      fuel: data.confidence?.fuel ?? 1,
      engineCapacity: data.confidence?.engineCapacity ?? 1,
    },
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
  };

  return normalized;
}
