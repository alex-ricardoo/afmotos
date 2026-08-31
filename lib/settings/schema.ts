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

export const vehicleHistorySettingsSchema = z
  .object({
    isEnabled: z.boolean().default(true),
    price: z.coerce
      .number({ message: 'Preço deve ser um valor numérico' })
      .positive('O preço da consulta deve ser maior que zero')
      .max(999.99, 'Preço máximo permitido é R$ 999,99')
      .default(39.99),
    currency: z.string().default('BRL'),
    priceLabel: z.string().max(100).optional().default('Consulta completa por R$ 39,99'),
    positioningMode: z
      .enum(['COMPETITIVE', 'REGIONAL_BEST', 'SPECIAL_OFFER', 'CHEAPEST_MARKET', 'CUSTOM'])
      .default('COMPETITIVE'),
    customPositioningText: z.string().max(160).optional().nullable(),
    claimEvidenceText: z.string().max(300).optional().nullable(),
    claimEvidenceDate: z.string().optional().nullable(),
    whatsappPhoneOverride: z.string().max(25).optional().nullable(),
    whatsappMessageTemplate: z.string().max(500).optional(),
    heroTitle: z.string().max(120).optional(),
    heroSubtitle: z.string().max(250).optional(),
    disclaimerText: z.string().max(500).optional(),
    isPublishedInNav: z.boolean().default(true),
    updatedAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.positioningMode === 'CHEAPEST_MARKET') {
      if (!data.claimEvidenceText || data.claimEvidenceText.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['claimEvidenceText'],
          message:
            'Para usar a alegação "Mais barato do mercado", é obrigatório registrar a fonte e metodologia da pesquisa comprobatória (mínimo 10 caracteres).',
        });
      }
      if (!data.claimEvidenceDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['claimEvidenceDate'],
          message: 'Informe a data em que a pesquisa de mercado foi realizada.',
        });
      }
    }

    if (
      data.positioningMode === 'CUSTOM' &&
      (!data.customPositioningText || data.customPositioningText.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customPositioningText'],
        message: 'Informe o texto personalizado de posicionamento.',
      });
    }
  });

