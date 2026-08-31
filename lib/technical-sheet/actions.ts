'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getImageSource } from '@/lib/uploads/image-url';
import { GeminiError } from '@/lib/ocr/gemini';
import {
  normalizeTechnicalSpecsWithGemini,
  type TechnicalSpecCandidates,
} from '@/lib/technical-sheet/gemini';
import { normalizeTechnicalSpecsWithOpenRouter } from '@/lib/technical-sheet/openrouter';
import {
  motorcycleTechnicalSheetSchema,
  type MotorcycleTechnicalSheet,
} from '@/lib/technical-sheet/schema';

type MotorcycleTechnicalRow = {
  id: string;
  brand: string;
  model: string;
  version: string | null;
  year_manufacture: number;
  year_model: number;
  mileage: number | null;
  engine_capacity: number | null;
  fuel: string | null;
  transmission: string | null;
  color: string | null;
  price: number | null;
  fipe_price: number | null;
  motorcycle_images: Array<Record<string, unknown>> | null;
  motorcycle_feature_assignments: Array<{ motorcycle_features: { name: string } | null }> | null;
};
type TechnicalSheetClient = SupabaseClient;

function nowIso() {
  return new Date().toISOString();
}
function confirmedValue<T>(
  candidates: TechnicalSpecCandidates | undefined,
  key: string,
  value: T | null | undefined,
): T | null {
  const evidence = candidates?.evidence[key]?.trim();
  return evidence && value !== null && value !== undefined ? value : null;
}

function parseNumericValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function resolveVersion(brand: string, model: string, version: string | null) {
  const current = version?.trim();
  if (current) return current;

  const modelText = model.trim();
  if (!modelText) return null;

  const tokens = modelText.split(/\s+/).filter(Boolean);
  const lastToken = tokens.at(-1)?.trim();
  if (!lastToken) return null;

  const hasVersionShape = /^(?:[A-Za-z]*\d+[A-Za-z0-9-]*|[A-Za-z]+\d+[A-Za-z0-9-]*)$/.test(
    lastToken,
  );
  if (hasVersionShape) return lastToken;

  const previousToken = tokens.at(-2)?.trim();
  if (!previousToken) return null;

  const combined = `${previousToken} ${lastToken}`.trim();
  const combinedShape = /^(?:[A-Za-z]*\d+[A-Za-z0-9-]*|[A-Za-z]+\d+[A-Za-z0-9-]*)$/.test(combined);
  if (combinedShape) return combined;

  if (brand && modelText === brand) return null;
  return null;
}

function buildSheet(
  motorcycle: MotorcycleTechnicalRow,
  candidates: TechnicalSpecCandidates,
): MotorcycleTechnicalSheet {
  const image =
    [...(motorcycle.motorcycle_images || [])]
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .find((item) => item.is_primary) || motorcycle.motorcycle_images?.[0];
  const generatedAt = nowIso();
  const resolvedVersion = resolveVersion(motorcycle.brand, motorcycle.model, motorcycle.version);
  const highlights = (motorcycle.motorcycle_feature_assignments || [])
    .map((assignment) => assignment.motorcycle_features?.name)
    .filter((name): name is string => Boolean(name));
  const candidate = (key: string) =>
    (confirmedValue(candidates, key, candidates[key] as never) ?? null) as never;
  const fuelTankLiters = parseNumericValue(candidate('fuelTankLiters'));
  const cityKmPerLiter = parseNumericValue(candidate('cityGasolineKmPerLiter'));
  const highwayKmPerLiter = parseNumericValue(candidate('highwayGasolineKmPerLiter'));
  const combinedKmPerLiter = parseNumericValue(candidate('combinedKmPerLiter'));
  const estimatedCityRangeKm =
    cityKmPerLiter !== null && fuelTankLiters !== null ? cityKmPerLiter * fuelTankLiters : null;
  const estimatedHighwayRangeKm =
    highwayKmPerLiter !== null && fuelTankLiters !== null
      ? highwayKmPerLiter * fuelTankLiters
      : null;

  return motorcycleTechnicalSheetSchema.parse({
    motorcycleId: motorcycle.id,
    identity: {
      brand: motorcycle.brand,
      model: motorcycle.model,
      version: resolvedVersion,
      yearManufacture: motorcycle.year_manufacture,
      yearModel: motorcycle.year_model,
    },
    unitData: {
      mileage: motorcycle.mileage,
      color: motorcycle.color,
      price: motorcycle.price,
      fipePrice: motorcycle.fipe_price,
      imageUrl: image ? getImageSource(image) : null,
      licensePlate: (motorcycle as any).license_plate || null,
    },
    engine: {
      displacementCc: motorcycle.engine_capacity,
      engineType: candidate('engineType'),
      cooling: candidate('cooling'),
      fuelSystem: candidate('fuelSystem'),
      fuel: motorcycle.fuel,
      maximumPower: candidate('maximumPower'),
      maximumTorque: candidate('maximumTorque'),
      transmission: motorcycle.transmission,
      finalDrive: candidate('finalDrive'),
      starter: candidate('starter'),
    },
    performance: {
      maximumSpeed: candidate('maximumSpeed'),
      autonomy: candidate('autonomy'),
      cityGasolineKmPerLiter: candidate('cityGasolineKmPerLiter'),
      highwayGasolineKmPerLiter: candidate('highwayGasolineKmPerLiter'),
      cityEthanolKmPerLiter: candidate('cityEthanolKmPerLiter'),
      highwayEthanolKmPerLiter: candidate('highwayEthanolKmPerLiter'),
    },
    consumption: {
      cityKmPerLiter: cityKmPerLiter,
      highwayKmPerLiter: highwayKmPerLiter,
      combinedKmPerLiter: combinedKmPerLiter,
      fuelTankLiters: fuelTankLiters,
      estimatedCityRangeKm: estimatedCityRangeKm,
      estimatedHighwayRangeKm: estimatedHighwayRangeKm,
      consumptionSource: candidates.sources?.[0]?.title ?? null,
      sourceType: 'FABRICANTE',
      isVerified:
        Boolean(resolvedVersion) &&
        Boolean(cityKmPerLiter || highwayKmPerLiter || combinedKmPerLiter || fuelTankLiters),
    },
    dimensions: {
      fuelTankLiters: candidate('fuelTankLiters'),
      dryWeightKg: candidate('dryWeightKg'),
      curbWeightKg: candidate('curbWeightKg'),
      seatHeightMm: candidate('seatHeightMm'),
      wheelbaseMm: candidate('wheelbaseMm'),
      groundClearanceMm: candidate('groundClearanceMm'),
      lengthMm: candidate('lengthMm'),
      widthMm: candidate('widthMm'),
      heightMm: candidate('heightMm'),
      maximumPayloadKg: candidate('maximumPayloadKg'),
      maximumTotalWeightKg: candidate('maximumTotalWeightKg'),
    },
    chassisAndSuspension: {
      frame: candidate('frame'),
      frontSuspension: candidate('frontSuspension'),
      rearSuspension: candidate('rearSuspension'),
      frontBrake: candidate('frontBrake'),
      rearBrake: candidate('rearBrake'),
      frontTire: candidate('frontTire'),
      rearTire: candidate('rearTire'),
      frontWheel: candidate('frontWheel'),
      rearWheel: candidate('rearWheel'),
    },
    safety: {
      abs: candidate('abs'),
      cbs: candidate('cbs'),
      tractionControl: candidate('tractionControl'),
      ledHeadlight: candidate('ledHeadlight'),
      hazardLights: candidate('hazardLights'),
      combinedBraking: candidate('combinedBraking'),
      immobilizer: candidate('immobilizer'),
    },
    equipment: {
      electricStart: candidate('electricStart'),
      alloyWheels: candidate('alloyWheels'),
      slipperClutch: candidate('slipperClutch'),
      keylessIgnition: candidate('keylessIgnition'),
    },
    confirmedFeatures: [],
    candidateEvidence: Object.fromEntries(
      Object.entries(candidates.evidence || {}).filter(
        ([, value]) => typeof value === 'string' && value.trim(),
      ),
    ),
    unavailableFields: [],
    highlights,
    sources: (candidates.sources || []).map((source) => ({
      type: 'FABRICANTE' as const,
      title: source.title,
      url: source.url,
      accessedAt: generatedAt,
      versionOrYear: String(motorcycle.year_model),
    })),
    review: { status: 'PENDING_REVIEW', reviewedBy: null, reviewedAt: null, notes: null },
    generatedAt,
    schemaVersion: 1,
  });
}

export async function getTechnicalSheetAction(motorcycleId: string) {
  const supabase = await createClient();
  const { data, error } = await (supabase as TechnicalSheetClient)
    .from('motorcycle_technical_sheets')
    .select(
      'id, motorcycle_id, schema_version, sheet_data, status, pdf_version, approved_at, reviewed_at, updated_at',
    )
    .eq('motorcycle_id', motorcycleId)
    .neq('status', 'ARCHIVED')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Não foi possível carregar a ficha técnica.');
  return data;
}

export async function createTechnicalSheetAction(motorcycleId: string) {
  const startedAt = Date.now();
  console.info('[TechnicalSheet] Iniciando geração', {
    motorcycleId,
    sourceMode: 'WEB_SEARCH',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
  const supabase = await createClient();
  const { data: motorcycle, error: motorcycleError } = await supabase
    .from('motorcycles')
    .select(
      'id, brand, model, version, year_manufacture, year_model, mileage, engine_capacity, fuel, transmission, color, price, fipe_price, motorcycle_images(*), motorcycle_feature_assignments(motorcycle_features(name))',
    )
    .eq('id', motorcycleId)
    .single();
  if (motorcycleError || !motorcycle) return { error: 'Motocicleta não encontrada.' };
  if (!motorcycle.brand || !motorcycle.model || !motorcycle.year_model)
    return { error: 'Preencha marca, modelo e ano para gerar a ficha técnica.' };
  console.info('[TechnicalSheet] Identidade enviada para pesquisa', {
    motorcycleId,
    brand: motorcycle.brand,
    model: motorcycle.model,
    version: motorcycle.version || null,
    yearManufacture: motorcycle.year_manufacture,
    yearModel: motorcycle.year_model,
  });
  const syntheticVersion = resolveVersion(motorcycle.brand, motorcycle.model, motorcycle.version);
  let candidates: TechnicalSpecCandidates;
  try {
    candidates = await normalizeTechnicalSpecsWithGemini({
      brand: motorcycle.brand,
      model: motorcycle.model,
      version: syntheticVersion,
      yearManufacture: motorcycle.year_manufacture,
      yearModel: motorcycle.year_model,
      sourceText: '',
      sourceType: 'WEB_SEARCH',
    });
    console.info('[TechnicalSheet] Gemini concluído', {
      motorcycleId,
      sourceMode: 'WEB_SEARCH',
      sourceCount: candidates.sources?.length || 0,
      evidenceCount: Object.values(candidates.evidence || {}).filter(Boolean).length,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('[TechnicalSheet] Gemini falhou; acionando OpenRouter', {
      motorcycleId,
      errorName: error instanceof Error ? error.name : 'UNKNOWN',
      errorCode: error instanceof GeminiError ? error.code : 'UNKNOWN',
      durationMs: Date.now() - startedAt,
    });
    try {
      candidates = await normalizeTechnicalSpecsWithOpenRouter({
        brand: motorcycle.brand,
        model: motorcycle.model,
        version: syntheticVersion,
        yearManufacture: motorcycle.year_manufacture,
        yearModel: motorcycle.year_model,
      });
      console.info('[TechnicalSheet] OpenRouter concluído', {
        motorcycleId,
        sourceCount: candidates.sources?.length || 0,
        evidenceCount: Object.values(candidates.evidence || {}).filter(Boolean).length,
        durationMs: Date.now() - startedAt,
      });
    } catch (fallbackError) {
      console.error('[TechnicalSheet] OpenRouter também falhou', {
        motorcycleId,
        errorName: fallbackError instanceof Error ? fallbackError.name : 'UNKNOWN',
        errorCode: fallbackError instanceof GeminiError ? fallbackError.code : 'UNKNOWN',
        durationMs: Date.now() - startedAt,
      });
      return {
        error: 'Não foi possível consultar as especificações com segurança. Tente novamente.',
      };
    }
  }
  let sheet: MotorcycleTechnicalSheet;
  try {
    sheet = buildSheet(motorcycle as unknown as MotorcycleTechnicalRow, candidates);
  } catch (error) {
    console.error('[TechnicalSheet] Falha ao montar snapshot validado', {
      motorcycleId,
      errorName: error instanceof Error ? error.name : 'UNKNOWN',
      issueCount:
        error instanceof Error && 'issues' in error && Array.isArray(error.issues)
          ? error.issues.length
          : null,
      durationMs: Date.now() - startedAt,
    });
    return { error: 'A resposta técnica não pôde ser validada com segurança. Tente novamente.' };
  }
  const { data, error } = await (supabase as TechnicalSheetClient)
    .from('motorcycle_technical_sheets')
    .insert({
      motorcycle_id: motorcycleId,
      schema_version: sheet.schemaVersion,
      sheet_data: sheet,
      status: sheet.review.status,
      source_summary: sheet.sources,
    })
    .select(
      'id, motorcycle_id, schema_version, sheet_data, status, pdf_version, approved_at, reviewed_at, updated_at',
    )
    .single();
  if (error) {
    console.error('[TechnicalSheet] Falha ao persistir ficha', {
      motorcycleId,
      errorCode: error.code,
      durationMs: Date.now() - startedAt,
    });
    return { error: 'Não foi possível criar a ficha técnica.' };
  }
  console.info('[TechnicalSheet] Ficha persistida', {
    motorcycleId,
    sheetId: data?.id,
    status: sheet.review.status,
    durationMs: Date.now() - startedAt,
  });
  revalidatePath('/admin/motos');
  revalidatePath(`/admin/motos/${motorcycleId}/ficha-tecnica`);
  return { success: true, sheet: data };
}

export async function approveTechnicalSheetAction(sheetId: string, notes?: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: 'Sessão expirada. Entre novamente.' };
  const { data: existing, error: fetchError } = await (supabase as TechnicalSheetClient)
    .from('motorcycle_technical_sheets')
    .select('id, motorcycle_id, sheet_data, status')
    .eq('id', sheetId)
    .single();
  if (fetchError || !existing) return { error: 'Ficha técnica não encontrada.' };
  const parsed = motorcycleTechnicalSheetSchema.safeParse(existing.sheet_data);
  if (!parsed.success || existing.status === 'ARCHIVED')
    return { error: 'Ficha técnica inválida para aprovação.' };

  const inferredVersion = resolveVersion(
    parsed.data.identity.brand,
    `${parsed.data.identity.model} ${parsed.data.identity.version || ''}`.trim(),
    parsed.data.identity.version,
  );

  if (!inferredVersion) {
    return {
      error: 'Informe a versão exata da moto antes de aprovar especificações técnicas de fábrica.',
    };
  }

  const reviewedAt = nowIso();
  const approvedData: MotorcycleTechnicalSheet = {
    ...parsed.data,
    identity: {
      ...parsed.data.identity,
      version: inferredVersion,
    },
    review: {
      ...parsed.data.review,
      status: 'APPROVED',
      reviewedBy: auth.user.id,
      reviewedAt,
      notes: notes?.trim() || parsed.data.review.notes,
    },
  };
  const { error } = await (supabase as TechnicalSheetClient)
    .from('motorcycle_technical_sheets')
    .update({
      sheet_data: approvedData,
      status: 'APPROVED',
      reviewed_by: auth.user.id,
      reviewed_at: reviewedAt,
      approved_by: auth.user.id,
      approved_at: reviewedAt,
    })
    .eq('id', sheetId);
  if (error) return { error: 'Não foi possível aprovar a ficha técnica.' };
  revalidatePath('/admin/motos');
  revalidatePath(`/admin/motos/${existing.motorcycle_id}/ficha-tecnica`);
  return { success: true };
}
