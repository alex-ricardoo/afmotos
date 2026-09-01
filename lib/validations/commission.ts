import { z } from 'zod';

export const commissionTypeSchema = z.enum(['percentage', 'fixed']);

export const commissionStatusSchema = z.enum([
  'draft',
  'proposed',
  'confirmed',
  'receivable',
  'received',
  'cancelled',
  'voided',
]);

export const saveCommissionSchema = z
  .object({
    id: z.string().uuid().optional(),
    proposal_id: z.string().uuid('ID de proposta inválido.'),
    sell_request_id: z.string().uuid().optional().nullable(),
    sale_agreement_id: z.string().uuid().optional().nullable(),
    sale_id: z.string().uuid().optional().nullable(),
    motorcycle_id: z.string().uuid().optional().nullable(),
    owner_customer_id: z.string().uuid().optional().nullable(),
    buyer_customer_id: z.string().uuid().optional().nullable(),

    commission_type: commissionTypeSchema.default('percentage'),
    commission_percentage: z
      .number()
      .min(0, 'O percentual não pode ser menor que 0%.')
      .max(100, 'O percentual não pode ser superior a 100%.')
      .nullable()
      .optional(),
    commission_fixed_value: z
      .number()
      .min(0, 'O valor fixo não pode ser negativo.')
      .nullable()
      .optional(),

    expected_sale_value: z
      .number()
      .min(0, 'O valor esperado de venda não pode ser negativo.')
      .default(0),

    final_sale_value: z
      .number()
      .min(0, 'O valor final de venda não pode ser negativo.')
      .nullable()
      .optional(),

    status: commissionStatusSchema.default('draft'),
    reason: z.string().trim().max(500, 'O motivo deve ter no máximo 500 caracteres.').optional().nullable(),
    notes: z.string().trim().max(1000, 'As observações devem ter no máximo 1000 caracteres.').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.commission_type === 'percentage') {
        return data.commission_percentage !== null && data.commission_percentage !== undefined;
      }
      return data.commission_fixed_value !== null && data.commission_fixed_value !== undefined;
    },
    {
      message: 'Informe o percentual ou o valor fixo da comissão de acordo com a modalidade.',
      path: ['commission_percentage'],
    },
  );

export const confirmCommissionSchema = z.object({
  id: z.string().uuid('ID de comissão inválido.'),
  final_sale_value: z
    .number()
    .min(0, 'O valor final de venda não pode ser negativo.'),
  confirmed_value: z
    .number()
    .min(0, 'O valor confirmado não pode ser negativo.')
    .optional(),
  sale_id: z.string().uuid().optional().nullable(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const receiveCommissionSchema = z.object({
  id: z.string().uuid('ID de comissão inválido.'),
  received_value: z
    .number()
    .min(0.01, 'O valor recebido deve ser maior que zero.'),
  received_at: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data de recebimento inválida.'),
  received_payment_method: z.string().min(2, 'Informe o método de pagamento (ex.: PIX, Dinheiro, TED).'),
  received_reference: z.string().trim().max(100, 'Referência deve ter no máximo 100 caracteres.').optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const cancelCommissionSchema = z.object({
  id: z.string().uuid('ID de comissão inválido.'),
  reason: z.string().trim().min(3, 'Informe o motivo do cancelamento da comissão (mínimo 3 caracteres).'),
});

export type SaveCommissionInput = z.infer<typeof saveCommissionSchema>;
export type ConfirmCommissionInput = z.infer<typeof confirmCommissionSchema>;
export type ReceiveCommissionInput = z.infer<typeof receiveCommissionSchema>;
export type CancelCommissionInput = z.infer<typeof cancelCommissionSchema>;
