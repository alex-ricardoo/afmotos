import { z } from 'zod';

export const agreementGenerateSchema = z.object({
  sell_request_id: z.string().uuid({ message: 'Identificador da solicitação inválido.' }),
  owner_cpf: z.string({ error: 'Informe o CPF do proprietário.' }).regex(/^\d{11}$/, 'Informe um CPF válido.'),
  owner_rg: z.string({ error: 'Informe o RG do proprietário.' }).trim().min(2, 'Informe o RG do proprietário.'),
  commission_percentage: z.coerce
    .number()
    .min(0, 'A comissão mínima é 0%.')
    .max(100, 'A comissão máxima é 100%.')
    .refine((value) => Number.isFinite(value), 'A comissão deve ser um número válido.'),
  expected_sale_value: z.coerce
    .number()
    .positive('O valor esperado de venda deve ser maior que zero.')
    .refine((value) => Number.isFinite(value), 'O valor esperado de venda deve ser válido.'),
});
