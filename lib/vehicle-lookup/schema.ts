import { z } from 'zod';

/**
 * Flexible, tolerant Zod schema for ApiBrasil Veiculos Total response
 * Supports both official `data` (camelCase) and `dados` (snake_case) keys.
 */
export const ApiBrasilVehicleResponseSchema = z.object({
  error: z.boolean().optional().default(false),
  message: z.string().optional().nullable(),
  status_code: z.union([z.number(), z.string()]).optional().nullable(),
  balance: z.union([z.number(), z.string()]).optional().nullable(),
  balance_before: z.union([z.number(), z.string()]).optional().nullable(),
  tax: z.union([z.number(), z.string()]).optional().nullable(),
  valor_consulta: z.union([z.number(), z.string()]).optional().nullable(),
  api_limit_for: z.string().optional().nullable(),
  homolog: z.boolean().optional().nullable(),
  data: z.record(z.string(), z.any()).optional().nullable(),
  dados: z.record(z.string(), z.any()).optional().nullable(),
}).passthrough();

export type ApiBrasilVehicleResponse = z.infer<typeof ApiBrasilVehicleResponseSchema>;
