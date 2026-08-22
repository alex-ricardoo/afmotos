import { z } from 'zod';

export const rawVehicleTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const rawMakeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const rawModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  make_id: z.string().optional(),
});

export const rawFuelSchema = z.object({
  id: z.string(),
  acronym: z.string(),
  name: z.string(),
});

export const rawYearFuelSchema = z.object({
  model_year: z.number().nullable().optional(),
  fuels: z.array(rawFuelSchema).optional(),
});

export const rawModelDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  make: rawMakeSchema.optional(),
  type: rawVehicleTypeSchema.optional(),
  year_fuels: z.array(rawYearFuelSchema).optional(),
});

export const rawReferencePeriodSchema = z.object({
  id: z.string(),
  month: z.number(),
  month_name: z.string(),
  year: z.number(),
});

export const rawPriceDataSchema = z.object({
  price_cents: z.number(),
  formatted_price: z.string(),
  model_year: z.number().nullable().optional(),
  make: rawMakeSchema.optional(),
  model: rawModelSchema.optional(),
  fuel: rawFuelSchema.optional(),
  type: rawVehicleTypeSchema.optional(),
  reference: rawReferencePeriodSchema.optional(),
  fipe_code: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export const rawPriceAnalyticsSchema = z.object({
  change_from_previous_month_pct: z.number().nullable().optional(),
  change_from_launch_pct: z.number().nullable().optional(),
  peak_to_now_pct_change: z.number().nullable().optional(),
  price_volatility: z.number().nullable().optional(),
  value_retention_pct: z.number().nullable().optional(),
  annual_depreciation_rate: z.number().nullable().optional(),
  lifecycle_status: z.string().nullable().optional(),
});

export const rawHistoryItemSchema = z.object({
  year: z.number(),
  month: z.number(),
  market_price_cents: z.number(),
  formatted_price: z.string(),
});

export const rawExpandedPriceDataSchema = z.object({
  price: rawPriceDataSchema,
  analytics: rawPriceAnalyticsSchema.nullable().optional(),
  history: z.array(rawHistoryItemSchema).optional(),
  available_years: z
    .array(
      z.object({
        value: z.string(),
        is_zero_km: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const rawPreludeDataSchema = z.object({
  fuels: z.array(rawFuelSchema),
  types: z.array(rawVehicleTypeSchema),
  periods: z.array(rawReferencePeriodSchema),
  stats: z
    .object({
      total_prices: z.string().optional(),
      total_models: z.string().optional(),
    })
    .optional(),
});
