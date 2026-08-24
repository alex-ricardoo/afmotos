import { z } from 'zod';
import {
  isValidPernambucoCity,
  getCanonicalPernambucoCity,
} from '@/lib/constants/pernambuco-cities';

const currentYear = new Date().getFullYear();

export const sellRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe seu nome completo.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.')
    .refine((val) => !/^\d+$/.test(val), {
      message: 'O nome não pode conter apenas números.',
    }),

  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 10 || val.length === 11, {
      message: 'Informe um WhatsApp válido com DDD (10 ou 11 dígitos).',
    })
    .refine(
      (val) => {
        const ddd = parseInt(val.slice(0, 2), 10);
        return ddd >= 11 && ddd <= 99;
      },
      {
        message: 'DDD inválido. Verifique o número informado.',
      },
    ),

  brand: z.string().trim().min(2, 'Selecione ou informe a marca da moto.'),
  brand_id: z.string().optional().nullable(),

  model: z.string().trim().min(2, 'Selecione ou informe o modelo da moto.'),
  model_id: z.string().optional().nullable(),

  year_manufacture: z.coerce
    .number()
    .int('Ano deve ser um número inteiro.')
    .min(1900, 'Ano de fabricação inválido.')
    .max(currentYear + 1, `Ano não pode ser superior a ${currentYear + 1}.`),

  year_model: z.coerce
    .number()
    .int('Ano deve ser um número inteiro.')
    .min(1900, 'Ano do modelo inválido.')
    .max(currentYear + 2, `Ano não pode ser superior a ${currentYear + 2}.`),

  year_id: z.string().optional().nullable(),
  fuel_id: z.string().optional().nullable(),
  fuel_name: z.string().optional().nullable(),

  mileage: z.coerce
    .number()
    .int('A quilometragem deve ser um número inteiro.')
    .min(0, 'A quilometragem não pode ser negativa.')
    .max(500000, 'Quilometragem acima do limite permitido.')
    .default(0),

  desired_price: z.coerce
    .number()
    .min(0, 'O valor pretendido não pode ser negativo.')
    .max(1000000, 'Valor pretendido inválido.')
    .optional()
    .nullable(),

  state: z.literal('PE').default('PE'),

  city: z
    .string()
    .trim()
    .min(2, 'Escolha uma cidade de Pernambuco.')
    .refine((val) => isValidPernambucoCity(val), {
      message: 'Escolha um município válido do Estado de Pernambuco.',
    })
    .transform((val) => getCanonicalPernambucoCity(val) || val),

  color: z.string().trim().max(50).optional().nullable(),
  license_plate: z.string().trim().max(10).optional().nullable(),
  email: z
    .string()
    .trim()
    .email('Informe um e-mail válido.')
    .max(100, 'O e-mail deve ter no máximo 100 caracteres.')
    .optional()
    .nullable()
    .or(z.literal('')),

  offer_percentage: z.coerce
    .number()
    .min(0, 'O percentual não pode ser negativo.')
    .max(100, 'O percentual não pode ser superior a 100%.')
    .optional()
    .nullable(),

  estimated_offer: z.coerce
    .number()
    .min(0, 'A estimativa não pode ser negativa.')
    .optional()
    .nullable(),

  fipe_code: z.string().optional().nullable(),
  fipe_price: z.coerce.number().min(0).optional().nullable(),
  fipe_reference_period: z.string().optional().nullable(),
  fipe_snapshot: z.record(z.string(), z.unknown()).optional().nullable(),

  notes: z
    .string()
    .max(1000, 'As observações não podem ultrapassar 1000 caracteres.')
    .optional()
    .nullable(),
}).refine((data) => data.year_model >= data.year_manufacture, {
  message: 'O ano do modelo deve ser igual ou maior que o ano de fabricação.',
  path: ['year_model'],
});

export type SellRequestInput = z.infer<typeof sellRequestSchema>;
