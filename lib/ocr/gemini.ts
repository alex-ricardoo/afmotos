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

export async function processMotorcycleDocumentWithGemini(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<MotorcycleOcrResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  }

  const base64Data = imageBuffer.toString('base64');

  // Payload para a API do Google Gemini
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

  // Modelos suportados com fallback automático
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError: Error | null = null;
  let rawJsonText: string | null = null;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`Gemini API model ${model} error (${response.status}):`, errText);
        throw new Error(`GEMINI_API_ERROR_${response.status}`);
      }

      const responseJson = await response.json();
      const candidateText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (candidateText) {
        rawJsonText = candidateText;
        break; // Sucesso
      }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      lastError = errorObj;
      if (errorObj.name === 'AbortError') {
        throw new Error('GEMINI_TIMEOUT');
      }
      console.warn(`Tentativa com ${model} falhou, tentando próximo modelo...`);
    }
  }

  if (!rawJsonText) {
    throw lastError || new Error('GEMINI_NO_RESPONSE');
  }

  // Sanitização e Parse do JSON retornado
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
    console.error('Falha ao realizar parse do JSON retornado pelo Gemini:', rawJsonText);
    throw new Error('GEMINI_INVALID_JSON');
  }

  // Validação estrita via Zod
  const validationResult = MotorcycleOcrResultSchema.safeParse(parsed);
  if (!validationResult.success) {
    console.error('Falha na validação do schema OCR:', validationResult.error.format());
    throw new Error('GEMINI_SCHEMA_VALIDATION_FAILED');
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
