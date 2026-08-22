import { z } from 'zod';
import { phoneSchema, emailSchema } from './common';

export const leadSchema = z.object({
  type: z.enum([
    'MOTORCYCLE_INTEREST',
    'SELL_MOTORCYCLE',
    'CONSIGNMENT',
    'RENTAL',
    'MOTORCYCLE_REQUEST',
    'GENERAL_CONTACT',
  ]),
  motorcycle_id: z.string().uuid().optional(),
  name: z.string().min(2, 'Nome é obrigatório (mínimo 2 caracteres)'),
  phone: phoneSchema,
  email: emailSchema,
  source: z.string().optional(),
  message: z.string().max(1500, 'Mensagem não pode ultrapassar 1500 caracteres').optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const customRentalSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório (mínimo 2 caracteres)'),
  phone: phoneSchema,
  email: emailSchema,
  duration: z.string().min(1, 'Selecione o período desejado'),
  start_date: z.string().optional(),
  motorcycle_id: z.string().optional(),
  preferred_model: z.string().optional(),
  message: z.string().max(1000, 'Mensagem não pode ultrapassar 1000 caracteres').optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type CustomRentalInput = z.infer<typeof customRentalSchema>;
