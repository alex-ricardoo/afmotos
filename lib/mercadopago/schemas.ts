import { z } from 'zod';

export const createPaymentPreferenceSchema = z.object({
  consultationId: z.string().uuid('ID de consulta inválido'),
});

export const brickPayerAddressSchema = z.object({
  zip_code: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 8, 'CEP deve conter exatamente 8 dígitos'),
  street_name: z.string().min(1, 'Logradouro é obrigatório'),
  street_number: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .refine((v) => v.length > 0, 'Número é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  federal_unit: z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .refine((val) => val.length === 2, 'UF deve ter 2 letras'),
  complement: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || undefined),
});

export function normalizeCpf(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

export const identificationSchema = z.object({
  type: z
    .string()
    .optional()
    .default('CPF')
    .transform(() => 'CPF'),
  number: z
    .string()
    .transform(normalizeCpf)
    .refine((val) => val.length === 11, 'Informe um CPF válido com 11 dígitos'),
});

export const cardPaymentFormDataSchema = z.object({
  payment_method_id: z.string().min(1, 'Método de pagamento é obrigatório'),
  token: z.string().min(1, 'Token do cartão ausente'),
  installments: z.coerce.number().int().min(1).max(24).default(1),
  issuer_id: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) =>
      v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : undefined,
    ),
  payer: z.object({
    email: z.string().email('E-mail do pagador inválido'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    identification: identificationSchema,
    address: brickPayerAddressSchema.optional(),
  }),
});

export const pixPaymentFormDataSchema = z.object({
  payment_method_id: z.string().min(1, 'Método de pagamento é obrigatório'),
  token: z.string().optional(),
  installments: z.coerce.number().int().optional().default(1),
  issuer_id: z.string().optional(),
  payer: z.object({
    email: z.string().email('E-mail do pagador inválido'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    identification: identificationSchema.optional(),
    address: brickPayerAddressSchema.optional(),
  }),
});

export const ticketPaymentFormDataSchema = z.object({
  payment_method_id: z.string().min(1, 'Método de pagamento é obrigatório'),
  token: z.string().optional(),
  installments: z.coerce.number().int().optional().default(1),
  issuer_id: z.string().optional(),
  payer: z.object({
    email: z.string().email('E-mail do pagador inválido'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    identification: identificationSchema,
    address: brickPayerAddressSchema,
  }),
});

export const brickPaymentSubmitSchema = z.object({
  consultationId: z.string().uuid('ID de consulta inválido'),
  formData: z.object({
    payment_method_id: z.string().min(1, 'Método de pagamento é obrigatório'),
    token: z.string().optional(),
    installments: z.coerce.number().int().positive().optional().default(1),
    issuer_id: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) =>
        v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : undefined,
      ),
    payer: z.object({
      email: z.string().email('E-mail do pagador inválido'),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      identification: z
        .object({
          type: z
            .string()
            .optional()
            .default('CPF')
            .transform(() => 'CPF'),
          number: z.string().min(1, 'Número do documento ausente'),
        })
        .optional(),
      address: brickPayerAddressSchema.optional(),
    }),
  }),
});

export const webhookPayloadSchema = z.object({
  action: z.string().optional(),
  api_version: z.string().optional(),
  data: z
    .object({
      id: z.union([z.string(), z.number()]).transform((val) => String(val)),
    })
    .optional(),
  date_created: z.string().optional(),
  id: z.union([z.string(), z.number()]).optional(),
  live_mode: z.boolean().optional(),
  type: z.string().optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
});

export const adminRefundRetrySchema = z.object({
  transactionId: z.string().uuid('ID de transação inválido'),
  reason: z.string().max(255).optional(),
});

export const adminReconcileSchema = z.object({
  mpPaymentId: z.string().min(1, 'ID do pagamento Mercado Pago é obrigatório'),
});

export const processPaymentRouteSchema = z.object({
  consultationId: z.string().uuid('ID de consulta inválido'),
  token: z.string().min(1, 'Token do cartão ausente'),
  paymentMethodId: z.string().min(1, 'Método de pagamento é obrigatório'),
  issuerId: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || String(v).trim() === '') return undefined;
      const num = Number(v);
      return Number.isInteger(num) && num > 0 ? num : undefined;
    }),
  installments: z.coerce.number().int().min(1).max(24).default(1),
  payer: z.object({
    identification: z.object({
      type: z
        .string()
        .optional()
        .default('CPF')
        .transform(() => 'CPF' as const),
      number: z
        .string()
        .transform(normalizeCpf)
        .refine((val) => val.length === 11, 'Informe um CPF válido com 11 dígitos'),
    }),
  }),
  clientObservability: z
    .object({
      tokenCreatedAt: z.number().optional(),
      tokenHashTruncated: z.string().optional(),
      submitAttemptNumber: z.number().optional(),
    })
    .optional(),
});

export type ProcessPaymentRouteInput = z.infer<typeof processPaymentRouteSchema>;
