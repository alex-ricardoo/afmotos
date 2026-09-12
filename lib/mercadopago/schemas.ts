import { z } from 'zod';

export const createPaymentPreferenceSchema = z.object({
  consultationId: z.string().uuid('ID de consulta inválido'),
});

export const brickPaymentSubmitSchema = z.object({
  consultationId: z.string().uuid('ID de consulta inválido'),
  formData: z.object({
    payment_method_id: z.string().min(1, 'Método de pagamento é obrigatório'),
    token: z.string().optional(),
    installments: z.number().int().positive().optional().default(1),
    issuer_id: z.string().optional(),
    payer: z.object({
      email: z.string().email('E-mail do pagador inválido'),
      identification: z
        .object({
          type: z.string().min(1, 'Tipo de documento obrigatório'),
          number: z.string().min(5, 'Número de documento inválido'),
        })
        .optional(),
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
