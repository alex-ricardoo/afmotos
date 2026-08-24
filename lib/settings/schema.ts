import { z } from 'zod';

export const storeImageSchema = z.object({
  provider: z.enum(['local', 'imgbb', 'supabase']).default('supabase'),
  url: z.string().url('URL inválida').or(z.literal('')),
  path: z.string().optional(),
  alt: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const storeDifferentialSchema = z.object({
  id: z.string().uuid().or(z.string()),
  title: z.string().min(2, 'Título deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  icon: z.string().min(1, 'Ícone é obrigatório'),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const locationSettingsSchema = z.object({
  mapsUrl: z.string().optional().nullable(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  instructions: z.string().optional(),
});

export const seoSettingsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ogImageUrl: z
    .string()
    .url('Deve ser uma URL válida')
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform((val) => val || null),
  canonicalUrl: z
    .string()
    .url('Deve ser uma URL válida')
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export const aboutSettingsSchema = z.object({
  isPublished: z.boolean().default(false),
  heroTitle: z.string().min(1, 'O título é obrigatório'),
  heroSubtitle: z.string().optional(),
  description: z.string().min(1, 'A descrição é obrigatória'),
  additionalText: z.string().optional(),
  storeImages: z.array(storeImageSchema).max(5, 'Máximo de 5 fotos').default([]),
  differentials: z.array(storeDifferentialSchema).default([]),
  location: locationSettingsSchema.optional(),
  seo: seoSettingsSchema.optional(),
});
