import { z } from 'zod';

export const OcrConfidenceSchema = z.object({
  brand: z.number().min(0).max(1).default(1),
  model: z.number().min(0).max(1).default(1),
  version: z.number().min(0).max(1).default(1),
  yearManufacture: z.number().min(0).max(1).default(1),
  yearModel: z.number().min(0).max(1).default(1),
  licensePlate: z.number().min(0).max(1).default(1),
  renavam: z.number().min(0).max(1).default(1),
  chassi: z.number().min(0).max(1).default(1),
  color: z.number().min(0).max(1).default(1),
  fuel: z.number().min(0).max(1).default(1),
  engineCapacity: z.number().min(0).max(1).default(1),
});

export const MotorcycleOcrResultSchema = z.object({
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  yearManufacture: z.number().int().nullable().optional(),
  yearModel: z.number().int().nullable().optional(),
  licensePlate: z.string().nullable().optional(),
  renavam: z.string().nullable().optional(),
  chassi: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  fuel: z.enum(['gasolina', 'etanol', 'flex', 'eletrico', 'diesel']).nullable().optional(),
  engineCapacity: z.number().int().positive().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  documentType: z.enum(['CRLV', 'CRV', 'UNKNOWN']).default('CRLV'),
  confidence: OcrConfidenceSchema.default({
    brand: 1,
    model: 1,
    version: 1,
    yearManufacture: 1,
    yearModel: 1,
    licensePlate: 1,
    renavam: 1,
    chassi: 1,
    color: 1,
    fuel: 1,
    engineCapacity: 1,
  }),
  warnings: z.array(z.string()).default([]),
});

export type MotorcycleOcrResult = z.infer<typeof MotorcycleOcrResultSchema>;
export type OcrConfidenceMap = z.infer<typeof OcrConfidenceSchema>;

export interface OcrApiResponse {
  success: boolean;
  data?: MotorcycleOcrResult;
  error?: string;
}
