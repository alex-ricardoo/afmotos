import { z } from 'zod';
import { phoneSchema, emailSchema } from './common';

export const sellRequestSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório (mínimo 2 caracteres)'),
  phone: phoneSchema,
  email: emailSchema,
  brand: z.string().min(2, 'Marca é obrigatória'),
  model: z.string().min(2, 'Modelo é obrigatório'),
  year_manufacture: z.coerce
    .number()
    .int()
    .min(1900, 'Ano inválido')
    .max(new Date().getFullYear() + 1, 'Ano inválido'),
  year_model: z.coerce
    .number()
    .int()
    .min(1900, 'Ano inválido')
    .max(new Date().getFullYear() + 2, 'Ano inválido'),
  color: z.string().optional(),
  mileage: z.coerce
    .number()
    .int()
    .min(0, 'Quilometragem não pode ser negativa')
    .optional(),
  desired_price: z.coerce
    .number()
    .min(0, 'Preço desejado não pode ser negativo')
    .optional(),
  notes: z.string().max(1000, 'Observações não podem exceder 1000 caracteres').optional(),
});

export type SellRequestInput = z.infer<typeof sellRequestSchema>;
