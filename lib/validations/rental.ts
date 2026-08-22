import { z } from 'zod';
import { phoneSchema, emailSchema } from './common';

export const rentalSchema = z
  .object({
    motorcycle_id: z.string().uuid(),
    customer_name: z.string().min(1, 'Customer name is required'),
    customer_phone: phoneSchema,
    customer_email: emailSchema,
    start_date: z.date(),
    end_date: z.date(),
    daily_rate: z.number().positive(),
    deposit_amount: z.number().min(0).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: 'End date must be strictly after start date',
    path: ['end_date'],
  });
