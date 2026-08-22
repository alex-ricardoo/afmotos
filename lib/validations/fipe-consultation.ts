import { z } from 'zod';

export const saveFipeConsultationSchema = z.object({
  motorcycle_id: z
    .string()
    .nullish()
    .transform((val) => (val && val.trim() ? val : null)),
  provider: z.string().default('fipex'),
  provider_label: z.string().default('fipeX'),
  vehicle_type_id: z.string().optional().default('motocicletas'),
  vehicle_type_label: z.string().nullish(),
  brand_id: z.string().nullish(),
  brand_name: z.string().optional().default('Marca'),
  model_id: z.string().nullish(),
  model_name: z.string().optional().default('Modelo'),
  version_name: z.string().nullish(),
  model_year: z.number().nullish(),
  is_zero_km: z.boolean().default(false),
  fuel_id: z.string().nullish(),
  fuel_name: z.string().nullish(),
  fuel_acronym: z.string().nullish(),
  reference_period_id: z.string().nullish(),
  reference_month: z.number().nullish(),
  reference_year: z.number().nullish(),
  reference_label: z.string().nullish(),
  fipe_code: z.string().nullish(),
  fipe_price: z.number().nullish(),
  currency: z.string().default('BRL'),
  query_payload: z.any().optional().default({}),
  response_snapshot: z.any().optional().default({}),
  notes: z.string().max(2000, 'Notas não podem exceder 2000 caracteres').nullish(),
});

export const updateFipeNotesSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
  notes: z.string().max(2000, 'Notas não podem exceder 2000 caracteres').nullish(),
});

export const linkFipeMotorcycleSchema = z.object({
  consultation_id: z.string().min(1, 'ID da consulta inválido'),
  motorcycle_id: z.string().min(1, 'ID da motocicleta inválido'),
});
