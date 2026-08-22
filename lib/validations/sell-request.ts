import { z } from 'zod';
import { phoneSchema, emailSchema } from './common';

export const sellRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: phoneSchema,
  email: emailSchema,
  license_plate: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year_manufacture: z.number().int().min(1900).optional(),
  year_model: z.number().int().min(1900).optional(),
  color: z.string().optional(),
  mileage: z.number().int().min(0).optional(),
  desired_price: z.number().min(0).optional(),
  notes: z.string().optional(),
});
