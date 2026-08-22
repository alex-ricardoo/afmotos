import { z } from 'zod';

export const consignmentSchema = z.object({
  motorcycle_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  asking_price: z.number().min(0),
  minimum_price: z.number().min(0).optional(),
  advertised_price: z.number().min(0).optional(),
  commission_type: z.enum(['percentage', 'fixed']),
  commission_value: z.number().positive(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  notes: z.string().optional(),
}).refine(data => !data.end_date || !data.start_date || data.end_date >= data.start_date, {
  message: "End date must be after start date",
  path: ['end_date']
});
