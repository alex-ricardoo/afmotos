import { z } from 'zod';

export const creditPackageCheckoutSchema = z
  .object({
    idempotencyKey: z.string().uuid('Chave de idempotência inválida (deve ser UUID).'),
  })
  .strict(); // Rejeita sumariamente qualquer tentativa de envio de price, credits, etc.

export const creditPackageOfferAdminSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Nome deve ter pelo menos 3 caracteres.')
      .max(100, 'Nome deve ter no máximo 100 caracteres.'),
    slug: z
      .string()
      .trim()
      .min(2, 'Slug deve ter pelo menos 2 caracteres.')
      .max(100, 'Slug deve ter no máximo 100 caracteres.')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug deve ser em formato kebab-case (ex: pacote-inicial-5).',
      ),
    short_label: z.string().trim().max(50).nullable().optional(),
    description: z.string().trim().max(500).nullable().optional(),
    package_type: z
      .enum(['standard', 'agency', 'reseller', 'fleet', 'custom'], {
        message: 'Tipo de pacote inválido.',
      })
      .default('standard'),
    credits_quantity: z
      .number()
      .int('Quantidade de créditos deve ser um número inteiro.')
      .positive('Quantidade de créditos deve ser maior que zero.'),
    price_cents: z
      .number()
      .int('Preço deve ser um valor inteiro em centavos.')
      .nonnegative('Preço não pode ser negativo.'),
    reference_individual_price_cents: z
      .number()
      .int('Preço de referência deve ser um número inteiro em centavos.')
      .nonnegative('Preço de referência não pode ser negativo.')
      .nullable()
      .optional(),
    display_order: z.number().int().default(0),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    contact_only: z.boolean().default(false),
    requires_whatsapp: z.boolean().default(false),
    validity_days: z
      .number()
      .int('Validade deve ser em dias inteiros.')
      .positive('Validade deve ser um número positivo.')
      .nullable()
      .optional(),
    benefits: z.array(z.string().trim()).default([]),
    terms_summary: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(
    (data) => {
      if (!data.contact_only && data.price_cents <= 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Pacotes vendáveis online devem possuir preço maior que zero.',
      path: ['price_cents'],
    },
  )
  .refine(
    (data) => {
      if (data.contact_only && !data.requires_whatsapp) {
        return false;
      }
      return true;
    },
    {
      message: 'Ofertas marcadas como somente contato exigem redirecionamento para WhatsApp.',
      path: ['requires_whatsapp'],
    },
  );

export type CreditPackageCheckoutInput = z.infer<typeof creditPackageCheckoutSchema>;
export type CreditPackageOfferAdminInput = z.infer<typeof creditPackageOfferAdminSchema>;
