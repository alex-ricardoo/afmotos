import { z } from 'zod';

export const motorcycleSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  version: z.string().optional(),
  year_manufacture: z.number().int().min(1900),
  year_model: z.number().int().min(1900),
  mileage: z.number().int().min(0).optional(),
  engine_capacity: z.number().int().positive().optional(),
  fuel: z.enum(['gasolina', 'etanol', 'flex', 'eletrico', 'diesel']).optional(),
  transmission: z.enum(['manual', 'automatico', 'semiautomatico', 'cvt']).optional(),
  color: z.string().optional(),
  price: z.number().min(0).optional(),
  description: z.string().optional(),
  ownership_type: z.enum(['OWNED', 'CONSIGNMENT']).default('OWNED'),
  operation_type: z.enum(['SALE', 'RENTAL', 'SALE_AND_RENTAL']).default('SALE'),
  status: z
    .enum(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE', 'HIDDEN'])
    .default('AVAILABLE'),
  featured: z.boolean().default(false),
  license_plate: z.string().optional(),
  renavam: z.string().optional().nullable(),
  chassi: z.string().optional().nullable(),
  location: z.string().default('São Paulo, SP'),
  daily_rate: z.number().min(0).optional(),
  weekly_rate: z.number().min(0).optional(),
  monthly_rate: z.number().min(0).optional(),
}).refine((data) => data.year_model >= data.year_manufacture, {
  message: 'O ano do modelo deve ser igual ou maior que o ano de fabricação.',
  path: ['year_model'],
});
