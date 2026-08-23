import { z } from 'zod';

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `AFM-${year}-${randomSuffix}`;
}

export const saleSchema = z.object({
  motorcycle_id: z.string().min(1, 'Selecione uma motocicleta'),
  sale_price: z.number().min(1, 'O valor da venda deve ser maior que zero'),
  sale_date: z.string().min(1, 'Data da venda é obrigatória'),
  buyer_name: z.string().optional().nullable(),
  buyer_phone: z.string().optional().nullable(),
  buyer_email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  buyer_document: z.string().optional().nullable(),
  buyer_address: z.string().optional().nullable(),
  payment_method: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'CARTAO', 'FINANCIAMENTO', 'OUTRO'])
    .default('PIX'),
  payment_status: z.enum(['PENDING', 'PARTIAL', 'PAID']).default('PAID'),
  amount_paid: z.number().optional().nullable().default(0),
  receipt_number: z.string().optional().nullable(),
  receipt_notes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type SaleFormValues = z.infer<typeof saleSchema>;
