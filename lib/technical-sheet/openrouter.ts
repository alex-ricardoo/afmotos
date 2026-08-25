import { z } from 'zod';
import { GeminiError } from '@/lib/ocr/gemini';
import {
  technicalSpecCandidatesSchema,
  type TechnicalSpecCandidates,
  type TechnicalWebSource,
} from '@/lib/technical-sheet/gemini';

const fields =
  'engineType, cooling, fuelSystem, maximumPower, maximumTorque, finalDrive, starter, fuelTankLiters, dryWeightKg, curbWeightKg, seatHeightMm, wheelbaseMm, groundClearanceMm, lengthMm, widthMm, heightMm, frame, frontSuspension, rearSuspension, frontBrake, rearBrake, frontTire, rearTire, frontWheel, rearWheel, abs, cbs, tractionControl, ledHeadlight, hazardLights, electricStart, alloyWheels, digitalPanel, usbPort, bluetoothConnectivity, slipperClutch, keylessIgnition, combinedBraking, immobilizer, maximumSpeed, autonomy, maximumPayloadKg, maximumTotalWeightKg';

function cleanJson(value: string) {
  return value
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function getOpenRouterTimeoutMs() {
  const configured = Number(process.env.OPENROUTER_TECHNICAL_SHEET_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 10000 ? Math.floor(configured) : 30000;
}

type OpenRouterPayload = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }>;
      annotations?: Array<{ url?: string; title?: string }>;
    };
  }>;
};

export async function normalizeTechnicalSpecsWithOpenRouter(input: {
  brand: string;
  model: string;
  version: string | null;
  yearManufacture: number;
  yearModel: number;
  sourceText?: string;
}): Promise<TechnicalSpecCandidates> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey)
    throw new GeminiError('GEMINI_API_KEY_NOT_CONFIGURED', 'OPENROUTER_API_KEY não configurada');
  const sourceText = input.sourceText?.trim() || '';
  const models = (process.env.OPENROUTER_TECHNICAL_SHEET_MODELS || 'openrouter/free')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
  const prompt = `Você é um pesquisador técnico de motocicletas brasileiras. Identificação exata: ${input.brand} ${input.model} ${input.version || ''}, fabricação ${input.yearManufacture}, modelo ${input.yearModel}, mercado Brasil.
${sourceText ? `Use este conteúdo já pesquisado:\n${sourceText}` : 'Pesquise na internet agora. Priorize fabricante, manual ou catálogo oficial brasileiro.'}
Não invente, não misture versões e use null quando não houver evidência. Retorne somente JSON válido com estas chaves: ${fields}. Inclua evidence como mapa de campo para trecho literal da fonte. Valores booleanos só podem ser true/false quando comprovados.`;

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getOpenRouterTimeoutMs());
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
          'X-Title': process.env.OPENROUTER_APP_NAME || 'AF Motos',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          ...(sourceText ? {} : { tools: [{ type: 'openrouter:web_search' }] }),
          temperature: 0,
        }),
        signal: controller.signal,
      });
      console.info('[TechnicalSheetOpenRouter] Tentativa', {
        model,
        status: response.status,
        ok: response.ok,
        timeoutMs: getOpenRouterTimeoutMs(),
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as OpenRouterPayload;
      const message = payload.choices?.[0]?.message;
      const content = Array.isArray(message?.content)
        ? message.content.map((part) => part.text || '').join('\n')
        : message?.content || '';
      if (!content.trim()) continue;
      const result = technicalSpecCandidatesSchema.safeParse(JSON.parse(cleanJson(content)));
      if (!result.success) {
        console.warn('[TechnicalSheetOpenRouter] Schema inválido', {
          model,
          issues: result.error.issues
            .slice(0, 8)
            .map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
        });
        continue;
      }
      const sources = (message?.annotations || [])
        .map((annotation) => ({
          title: annotation.title?.trim() || 'Fonte OpenRouter',
          url: annotation.url?.trim() || '',
        }))
        .filter((source): source is TechnicalWebSource => source.url.startsWith('http'));
      return { ...result.data, sources };
    } catch (error) {
      console.warn('[TechnicalSheetOpenRouter] Falha na tentativa', {
        model,
        errorName: error instanceof Error ? error.name : 'UNKNOWN',
        timedOut: error instanceof Error && error.name === 'AbortError',
      });
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new GeminiError('GEMINI_NO_RESPONSE', 'OpenRouter não retornou uma ficha técnica válida');
}
