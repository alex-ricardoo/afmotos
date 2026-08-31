import { z } from 'zod';

const nullableString = z.string().trim().min(1).nullable();
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
const nullableBoolean = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (/^(sim|yes|true|1)$/i.test(value.trim())) return true;
    if (/^(nao|não|no|false|0)$/i.test(value.trim())) return false;
  }
  return value;
}, z.boolean().nullable());

export const technicalFeatureSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  sourceType: z.enum(['CADASTRO', 'FABRICANTE', 'MANUAL', 'ADMIN']),
  sourceReference: z.string().nullable(),
  confidence: z.literal('CONFIRMADO'),
});

export const technicalSourceSchema = z.object({
  type: z.enum(['FABRICANTE', 'MANUAL', 'CATALOGO', 'ADMIN', 'CADASTRO']),
  title: z.string().min(1),
  url: z.string().url().nullable(),
  accessedAt: z.string().datetime().nullable(),
  versionOrYear: z.string().nullable(),
});

const engineSchema = z.object({
  displacementCc: nullableNumber,
  engineType: nullableString,
  cooling: nullableString,
  fuelSystem: nullableString,
  fuel: nullableString,
  maximumPower: nullableString,
  maximumTorque: nullableString,
  transmission: nullableString,
  finalDrive: nullableString,
  starter: nullableString,
});

const dimensionsSchema = z.object({
  fuelTankLiters: nullableNumber,
  dryWeightKg: nullableNumber,
  curbWeightKg: nullableNumber,
  seatHeightMm: nullableNumber,
  wheelbaseMm: nullableNumber,
  groundClearanceMm: nullableNumber,
  lengthMm: nullableNumber,
  widthMm: nullableNumber,
  heightMm: nullableNumber,
  maximumPayloadKg: nullableNumber,
  maximumTotalWeightKg: nullableNumber,
});

const chassisSchema = z.object({
  frame: nullableString,
  frontSuspension: nullableString,
  rearSuspension: nullableString,
  frontBrake: nullableString,
  rearBrake: nullableString,
  frontTire: nullableString,
  rearTire: nullableString,
  frontWheel: nullableString,
  rearWheel: nullableString,
});

const equipmentSchema = z.object({
  electricStart: nullableBoolean,
  alloyWheels: nullableBoolean,
  digitalPanel: nullableBoolean,
  usbPort: nullableBoolean,
  bluetoothConnectivity: nullableBoolean,
  slipperClutch: nullableBoolean,
  keylessIgnition: nullableBoolean,
});

const safetySchema = z.object({
  abs: nullableBoolean,
  cbs: nullableBoolean,
  tractionControl: nullableBoolean,
  ledHeadlight: nullableBoolean,
  hazardLights: nullableBoolean,
  combinedBraking: nullableBoolean,
  immobilizer: nullableBoolean,
});

const consumptionSchema = z.object({
  cityKmPerLiter: nullableNumber,
  highwayKmPerLiter: nullableNumber,
  combinedKmPerLiter: nullableNumber,
  fuelTankLiters: nullableNumber,
  estimatedCityRangeKm: nullableNumber,
  estimatedHighwayRangeKm: nullableNumber,
  consumptionSource: z.string().nullable(),
  sourceType: z.enum(['FABRICANTE', 'MANUAL', 'ADMIN']).nullable(),
  isVerified: z.boolean().default(false),
});

const performanceSchema = z.object({
  maximumSpeed: nullableString,
  autonomy: nullableString,
  cityGasolineKmPerLiter: nullableString,
  highwayGasolineKmPerLiter: nullableString,
  cityEthanolKmPerLiter: nullableString,
  highwayEthanolKmPerLiter: nullableString,
});

export const motorcycleTechnicalSheetSchema = z.object({
  motorcycleId: z.string().uuid(),
  identity: z.object({
    brand: z.string().min(1),
    model: z.string().min(1),
    version: z.string().nullable(),
    yearManufacture: z.number().int().min(1901),
    yearModel: z.number().int().min(1901),
  }),
  unitData: z.object({
    mileage: nullableNumber,
    color: nullableString,
    price: nullableNumber,
    fipePrice: nullableNumber,
    imageUrl: z.string().url().nullable(),
    licensePlate: nullableString.optional().nullable(),
  }),
  engine: engineSchema,
  performance: performanceSchema,
  consumption: consumptionSchema.default({
    cityKmPerLiter: null,
    highwayKmPerLiter: null,
    combinedKmPerLiter: null,
    fuelTankLiters: null,
    estimatedCityRangeKm: null,
    estimatedHighwayRangeKm: null,
    consumptionSource: null,
    sourceType: null,
    isVerified: false,
  }),
  dimensions: dimensionsSchema,
  chassisAndSuspension: chassisSchema,
  safety: safetySchema,
  equipment: equipmentSchema,
  confirmedFeatures: z.array(technicalFeatureSchema),
  candidateEvidence: z.record(z.string(), z.string()).default({}),
  unavailableFields: z.array(z.string()),
  highlights: z.array(z.string()),
  sources: z.array(technicalSourceSchema),
  review: z.object({
    status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED']),
    reviewedBy: z.string().uuid().nullable(),
    reviewedAt: z.string().datetime().nullable(),
    notes: z.string().nullable(),
  }),
  generatedAt: z.string().datetime(),
  schemaVersion: z.number().int().positive(),
});

export type MotorcycleTechnicalSheet = z.infer<typeof motorcycleTechnicalSheetSchema>;
export type TechnicalFeature = z.infer<typeof technicalFeatureSchema>;
export type TechnicalSource = z.infer<typeof technicalSourceSchema>;

export const technicalSheetStatusLabels: Record<
  MotorcycleTechnicalSheet['review']['status'],
  string
> = {
  DRAFT: 'Rascunho',
  PENDING_REVIEW: 'Pendente de revisão',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  ARCHIVED: 'Arquivada',
};
