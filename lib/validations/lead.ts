import { z } from 'zod';
import { phoneSchema, emailSchema } from './common';

export const leadSchema = z.object({
  type: z.enum(['MOTORCYCLE_INTEREST', 'SELL_MOTORCYCLE', 'CONSIGNMENT', 'RENTAL', 'MOTORCYCLE_REQUEST', 'GENERAL_CONTACT']),
  motorcycle_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required'),
  phone: phoneSchema,
  email: emailSchema,
  source: z.string().optional(),
  message: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
