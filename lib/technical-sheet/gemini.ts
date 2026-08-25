import { z } from 'zod';
import { GeminiError } from '@/lib/ocr/gemini';

const nullableText = z.string().nullable().optional();
const nullableNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return value;
  const normalized = value
    .trim()
    .replace(/\s+/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : value;
}, z.number().finite().nonnegative().nullable());
const nullableBool = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (/^(sim|yes|true|1)$/i.test(value.trim())) return true;
    if (/^(nao|não|no|false|0)$/i.test(value.trim())) return false;
  }
  return value;
}, z.boolean().nullable());

export const technicalSpecCandidatesSchema = z
  .object({
    engineType: nullableText,
    cooling: nullableText,
    fuelSystem: nullableText,
    maximumPower: nullableText,
    maximumTorque: nullableText,
    finalDrive: nullableText,
    starter: nullableText,
    fuelTankLiters: nullableNumber,
    dryWeightKg: nullableNumber,
    curbWeightKg: nullableNumber,
    seatHeightMm: nullableNumber,
    wheelbaseMm: nullableNumber,
    groundClearanceMm: nullableNumber,
    lengthMm: nullableNumber,
    widthMm: nullableNumber,
    heightMm: nullableNumber,
    frame: nullableText,
    frontSuspension: nullableText,
    rearSuspension: nullableText,
    frontBrake: nullableText,
    rearBrake: nullableText,
    frontTire: nullableText,
    rearTire: nullableText,
    frontWheel: nullableText,
    rearWheel: nullableText,
    abs: nullableBool,
    cbs: nullableBool,
    tractionControl: nullableBool,
    ledHeadlight: nullableBool,
    hazardLights: nullableBool,
    electricStart: nullableBool,
    alloyWheels: nullableBool,
    digitalPanel: nullableBool,
    usbPort: nullableBool,
    bluetoothConnectivity: nullableBool,
    slipperClutch: nullableBool,
    keylessIgnition: nullableBool,
    combinedBraking: nullableBool,
    immobilizer: nullableBool,
    maximumSpeed: nullableText,
    autonomy: nullableText,
    cityGasolineKmPerLiter: nullableText,
    highwayGasolineKmPerLiter: nullableText,
    cityEthanolKmPerLiter: nullableText,
    highwayEthanolKmPerLiter: nullableText,
    maximumPayloadKg: nullableNumber,
    maximumTotalWeightKg: nullableNumber,
    evidence: z.record(z.string(), z.string().nullable().optional()).default({}),
  })
  .catchall(z.unknown());

export type TechnicalWebSource = { title: string; url: string };
export type TechnicalSpecCandidates = z.infer<typeof technicalSpecCandidatesSchema> & {
  sources?: TechnicalWebSource[];
};

const SYSTEM_PROMPT = `Você normaliza especificações técnicas de motocicletas brasileiras.
Use exclusivamente o conteúdo oficial fornecido ou encontrado por pesquisa web grounding. Não use memória, conhecimento externo ou inferência.
Não misture versões, anos ou mercados. Retorne null quando não houver evidência explícita.
Retorne false somente quando o texto afirmar explicitamente que o item não existe.
Para cada valor não nulo, evidence[field] deve conter um trecho curto e literal do conteúdo que prova o valor.
Se não houver prova, deixe o campo null e evidence[field] null.
A resposta deve ser exclusivamente JSON válido, sem markdown.`;

const SEARCH_PROMPT = `Pesquise na internet por uma ficha técnica confiável e específica para a motocicleta informada.
Priorize página oficial da fabricante, manual, catálogo ou fonte técnica reconhecida no Brasil.
Use o nome completo do modelo como identificação principal; a versão separada pode estar vazia porque pode fazer parte do próprio nome do modelo.
Não misture versões, anos ou mercados. Retorne um resumo textual com todas as especificações encontradas,
mantendo unidades e indicando claramente a fonte de cada informação. Se não encontrar uma informação,
não invente. Não retorne JSON nesta etapa.`;

const CANONICAL_FIELDS = [
  'engineType',
  'cooling',
  'fuelSystem',
  'maximumPower',
  'maximumTorque',
  'finalDrive',
  'starter',
  'fuelTankLiters',
  'dryWeightKg',
  'curbWeightKg',
  'seatHeightMm',
  'wheelbaseMm',
  'groundClearanceMm',
  'lengthMm',
  'widthMm',
  'heightMm',
  'frame',
  'frontSuspension',
  'rearSuspension',
  'frontBrake',
  'rearBrake',
  'frontTire',
  'rearTire',
  'frontWheel',
  'rearWheel',
  'abs',
  'cbs',
  'tractionControl',
  'ledHeadlight',
  'hazardLights',
  'electricStart',
  'alloyWheels',
  'digitalPanel',
  'usbPort',
  'bluetoothConnectivity',
  'slipperClutch',
  'keylessIgnition',
  'combinedBraking',
  'immobilizer',
  'maximumSpeed',
  'autonomy',
  'cityGasolineKmPerLiter',
  'highwayGasolineKmPerLiter',
  'cityEthanolKmPerLiter',
  'highwayEthanolKmPerLiter',
  'maximumPayloadKg',
  'maximumTotalWeightKg',
].join(', ');

const DEFAULT_TECHNICAL_SHEET_TIMEOUT_MS = 90000;

function getTechnicalSheetTimeoutMs() {
  const configured = Number(process.env.GEMINI_TECHNICAL_SHEET_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 15000
    ? Math.floor(configured)
    : DEFAULT_TECHNICAL_SHEET_TIMEOUT_MS;
}

function cleanJson(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

export async function normalizeTechnicalSpecsWithGemini(input: {
  brand: string;
  model: string;
  version: string | null;
  yearManufacture: number;
  yearModel: number;
  sourceText: string;
  sourceType?: 'FIPEX' | 'WEB_SEARCH';
}): Promise<TechnicalSpecCandidates> {
  const startedAt = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[TechnicalSheetGemini] API key ausente');
    throw new GeminiError('GEMINI_API_KEY_NOT_CONFIGURED', 'GEMINI_API_KEY não configurada');
  }
  const sourceText = input.sourceText.trim();
  const searchMode = !sourceText;
  const timeoutMs = getTechnicalSheetTimeoutMs();
  console.info('[TechnicalSheetGemini] Preparando requisição', {
    sourceMode: input.sourceType || (searchMode ? 'WEB_SEARCH' : 'ADMIN_CONTENT'),
    brand: input.brand,
    model: input.model,
    version: input.version || null,
    yearModel: input.yearModel,
    sourceTextLength: sourceText.length,
    geminiModel: 'gemini-3.6-flash',
    webSearchEnabled: searchMode,
    timeoutMs,
    fallbackModelCount: (process.env.GEMINI_FALLBACK_MODELS || '')
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean).length,
  });

  const identity = `Moto: ${input.brand} ${input.model} ${input.version || ''} | Fabricação: ${input.yearManufacture} | Modelo: ${input.yearModel} | Mercado: Brasil`;
  const configuredFallbacks = (process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
  const modelsToTry = [...new Set(['gemini-3.6-flash', ...configuredFallbacks])];
  let response: Response | null = null;
  let selectedModel = modelsToTry[0];
  let lastError: GeminiError | null = null;

  let groundingSources: TechnicalWebSource[] = [];
  let normalizedSourceText = sourceText;
  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: searchMode
                  ? `${SEARCH_PROMPT}\n\n${identity}`
                  : `${SYSTEM_PROMPT}\n\n${identity}\n\nCONTEÚDO OFICIAL:\n${sourceText}\n\nRetorne somente um objeto JSON com EXATAMENTE estas chaves canônicas: ${CANONICAL_FIELDS}, evidence. Não use nomes traduzidos, abreviações ou chaves inventadas. Cada valor deve ser null se não houver prova.`,
              },
            ],
          },
        ],
        ...(searchMode
          ? { tools: [{ google_search: {} }] }
          : { generationConfig: { response_mime_type: 'application/json', temperature: 0 } }),
      };
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        },
      );
      console.info('[TechnicalSheetGemini] Tentativa concluída', {
        model,
        status: response.status,
        ok: response.ok,
        durationMs: Date.now() - startedAt,
      });
      selectedModel = model;
      if (response.ok) break;
      if (![404, 429, 500, 502, 503, 504].includes(response.status)) break;
      console.warn('[TechnicalSheetGemini] Tentando modelo fallback', {
        failedModel: model,
        status: response.status,
        remainingModels: modelsToTry.length - modelsToTry.indexOf(model) - 1,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('[TechnicalSheetGemini] Timeout na tentativa', {
          model,
          timeoutMs,
          remainingModels: modelsToTry.length - modelsToTry.indexOf(model) - 1,
        });
        lastError = new GeminiError('GEMINI_TIMEOUT', `Timeout ao chamar o modelo ${model}`);
        continue;
      }
      console.error('[TechnicalSheetGemini] Erro de rede', {
        model,
        errorName: error instanceof Error ? error.name : 'UNKNOWN',
        durationMs: Date.now() - startedAt,
      });
      throw new GeminiError('GEMINI_SERVER_ERROR', 'Falha ao chamar o Gemini');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (!response) {
    throw lastError || new GeminiError('GEMINI_NO_RESPONSE', 'Gemini não retornou resposta');
  }
  console.info('[TechnicalSheetGemini] Resposta HTTP recebida', {
    status: response.status,
    ok: response.ok,
    model: selectedModel,
    durationMs: Date.now() - startedAt,
  });
  if (!response.ok) {
    console.warn('[TechnicalSheetGemini] Detalhes do erro HTTP', {
      model: selectedModel,
      status: response.status,
      retryAfter: response.headers.get('retry-after'),
      likelyQuotaIssue: response.status === 429,
    });
    if (response.status === 401 || response.status === 403)
      throw new GeminiError('GEMINI_UNAUTHORIZED', 'Gemini não autorizado');
    if (response.status === 429)
      throw new GeminiError('GEMINI_RATE_LIMITED', 'Limite do Gemini atingido');
    if (response.status === 404)
      throw new GeminiError('GEMINI_MODEL_UNAVAILABLE', 'Modelo Gemini indisponível');
    throw new GeminiError('GEMINI_SERVER_ERROR', 'Erro no Gemini');
  }

  const payload = (await response.json()) as {
    promptFeedback?: { blockReason?: string; blockReasonMessage?: string };
    modelVersion?: string;
    error?: { code?: string; status?: string; message?: string };
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
      finishMessage?: string;
      safetyRatings?: Array<{ category?: string; probability?: string; blocked?: boolean }>;
      groundingMetadata?: { groundingChunks?: Array<{ web?: { title?: string; uri?: string } }> };
    }>;
  };
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('\n')
    .trim();
  console.info('[TechnicalSheetGemini] Payload recebido', {
    candidateCount: payload.candidates?.length || 0,
    responseTextLength: text?.length || 0,
    groundingChunkCount: payload.candidates?.[0]?.groundingMetadata?.groundingChunks?.length || 0,
    modelVersion: payload.modelVersion || null,
    finishReason: payload.candidates?.[0]?.finishReason || null,
    finishMessage: payload.candidates?.[0]?.finishMessage || null,
    promptBlockReason: payload.promptFeedback?.blockReason || null,
    promptBlockMessagePresent: Boolean(payload.promptFeedback?.blockReasonMessage),
    safetyBlocked:
      payload.candidates?.[0]?.safetyRatings?.some((rating) => rating.blocked) || false,
    apiErrorStatus: payload.error?.status || null,
    apiErrorCode: payload.error?.code || null,
  });
  if (!text) {
    console.error('[TechnicalSheetGemini] Gemini respondeu sem candidato utilizável', {
      candidateCount: payload.candidates?.length || 0,
      promptBlockReason: payload.promptFeedback?.blockReason || null,
      finishReason: payload.candidates?.[0]?.finishReason || null,
      groundingChunkCount: payload.candidates?.[0]?.groundingMetadata?.groundingChunks?.length || 0,
      durationMs: Date.now() - startedAt,
    });
    throw new GeminiError('GEMINI_NO_RESPONSE', 'Gemini não retornou conteúdo');
  }
  if (searchMode) {
    normalizedSourceText = text;
    groundingSources = (payload.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
      .map((chunk) => ({ title: chunk.web?.title?.trim(), url: chunk.web?.uri?.trim() }))
      .filter((source): source is TechnicalWebSource =>
        Boolean(source.title && source.url?.startsWith('http')),
      )
      .filter((source, index, all) => all.findIndex((item) => item.url === source.url) === index);
    if (!groundingSources.length)
      throw new GeminiError('GEMINI_NO_RESPONSE', 'A pesquisa não retornou fontes verificáveis');
    console.info('[TechnicalSheetGemini] Pesquisa web concluída', {
      sourceCount: groundingSources.length,
      researchTextLength: normalizedSourceText.length,
      durationMs: Date.now() - startedAt,
    });
    return normalizeTechnicalSpecsWithGemini({
      ...input,
      sourceText: normalizedSourceText,
      sourceType: 'FIPEX',
    }).then((result) => ({ ...result, sources: groundingSources }));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch {
    throw new GeminiError('GEMINI_INVALID_JSON', 'JSON inválido retornado pelo Gemini');
  }
  const result = technicalSpecCandidatesSchema.safeParse(parsed);
  if (!result.success)
    console.error('[TechnicalSheetGemini] Falha na validação do schema', {
      issueCount: result.error.issues.length,
      issues: result.error.issues.slice(0, 12).map((issue) => ({
        path: issue.path.join('.'),
        code: issue.code,
        message: issue.message,
      })),
      durationMs: Date.now() - startedAt,
    });
  if (!result.success)
    throw new GeminiError(
      'GEMINI_SCHEMA_VALIDATION_FAILED',
      'Schema técnico inválido retornado pelo Gemini',
    );
  const rawResult = result.data as TechnicalSpecCandidates & Record<string, unknown>;
  const aliases: Record<string, string> = {
    tipo_motor: 'engineType',
    tipo_de_motor: 'engineType',
    alimentacao: 'fuelSystem',
    combustível: 'fuelSystem',
    combustivel: 'fuel',
    potencia: 'maximumPower',
    potencia_maxima: 'maximumPower',
    torque: 'maximumTorque',
    torque_maximo: 'maximumTorque',
    cambio: 'transmission',
    transmissao: 'transmission',
    partida: 'starter',
    ignicao: 'starter',
    tanque: 'fuelTankLiters',
    capacidade_tanque: 'fuelTankLiters',
    peso_seco: 'dryWeightKg',
    peso: 'curbWeightKg',
    altura_assento: 'seatHeightMm',
    entre_eixos: 'wheelbaseMm',
    distancia_entre_eixos: 'wheelbaseMm',
    distancia_solo: 'groundClearanceMm',
    comprimento: 'lengthMm',
    largura: 'widthMm',
    altura: 'heightMm',
    tipo_chassi: 'frame',
    chassi: 'frame',
    suspensao_dianteira: 'frontSuspension',
    suspensao_traseira: 'rearSuspension',
    freio_dianteiro: 'frontBrake',
    freio_traseiro: 'rearBrake',
    pneu_dianteiro: 'frontTire',
    pneu_traseiro: 'rearTire',
    roda_dianteira: 'frontWheel',
    roda_traseira: 'rearWheel',
    farol: 'ledHeadlight',
    partida_eletrica: 'electricStart',
    velocidade_maxima: 'maximumSpeed',
    velocidade: 'maximumSpeed',
    autonomia: 'autonomy',
    consumo_cidade_gasolina: 'cityGasolineKmPerLiter',
    consumo_urbano_gasolina: 'cityGasolineKmPerLiter',
    consumo_estrada_gasolina: 'highwayGasolineKmPerLiter',
    consumo_rodoviario_gasolina: 'highwayGasolineKmPerLiter',
    consumo_cidade_etanol: 'cityEthanolKmPerLiter',
    consumo_urbano_etanol: 'cityEthanolKmPerLiter',
    consumo_estrada_etanol: 'highwayEthanolKmPerLiter',
    consumo_rodoviario_etanol: 'highwayEthanolKmPerLiter',
    carga_maxima: 'maximumPayloadKg',
    capacidade_de_carga: 'maximumPayloadKg',
    peso_maximo: 'maximumTotalWeightKg',
    peso_total_maximo: 'maximumTotalWeightKg',
    freio_combinado: 'combinedBraking',
    imobilizador: 'immobilizer',
  };
  for (const [key, value] of Object.entries(rawResult)) {
    const canonical =
      aliases[
        key
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\W+/g, '_')
      ];
    if (canonical && rawResult[canonical] == null) rawResult[canonical] = value;
  }
  const sources = (payload.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .map((chunk) => ({ title: chunk.web?.title?.trim(), url: chunk.web?.uri?.trim() }))
    .filter((source): source is TechnicalWebSource =>
      Boolean(source.title && source.url?.startsWith('http')),
    )
    .filter((source, index, all) => all.findIndex((item) => item.url === source.url) === index);
  console.info('[TechnicalSheetGemini] Normalização concluída', {
    sourceCount: sources.length,
    evidenceCount: Object.values(result.data.evidence || {}).filter(Boolean).length,
    durationMs: Date.now() - startedAt,
  });
  return { ...rawResult, sources } as TechnicalSpecCandidates;
}
