import { z } from 'zod';

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `AFM-${year}-${randomSuffix}`;
}

export const paymentMethodEnum = z.enum([
  'PIX',
  'FINANCIAMENTO',
  'CARTAO',
  'DINHEIRO',
  'TROCA',
  'TRANSFERENCIA',
  'OUTRO',
]);

export const paymentStatusEnum = z.enum(['PENDING', 'PARTIAL', 'PAID']);

export const saleSchema = z.object({
  // Identificação do Veículo
  motorcycle_id: z.string().min(1, 'Selecione uma motocicleta'),
  renavam: z.string().optional().nullable(),
  chassi: z.string().optional().nullable(),
  delivery_km: z.number().min(0, 'Quilometragem inválida').optional().nullable(),

  // Dados Financeiros & Condições
  sale_price: z.number().min(1, 'O valor da venda deve ser maior que zero'),
  sale_date: z.string().min(1, 'Data da venda é obrigatória'),
  payment_method: paymentMethodEnum.default('PIX'),
  payment_status: paymentStatusEnum.default('PAID'),
  amount_paid: z.number().optional().nullable().default(0),
  entry_amount: z.number().min(0, 'Valor de entrada não pode ser negativo').optional().nullable().default(0),
  financed_amount: z.number().min(0, 'Valor financiado não pode ser negativo').optional().nullable().default(0),
  trade_amount: z.number().min(0, 'Valor na troca não pode ser negativo').optional().nullable().default(0),

  // Dados do Comprador
  buyer_name: z.string().min(2, 'Nome do comprador é obrigatório'),
  buyer_phone: z.string().min(8, 'Telefone de contato é obrigatório'),
  buyer_email: z.string().optional().nullable(),
  buyer_document: z.string().min(11, 'CPF do comprador é obrigatório'),
  buyer_address: z.string().optional().nullable(),

  // Endereço Estruturado do Comprador
  buyer_cep: z.string().min(8, 'CEP é obrigatório'),
  buyer_street: z.string().min(2, 'Rua / Logradouro é obrigatório'),
  buyer_number: z.string().min(1, 'Número é obrigatório'),
  buyer_complement: z.string().optional().nullable(),
  buyer_neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  buyer_city: z.string().min(1, 'Cidade é obrigatória'),
  buyer_state: z.string().min(2, 'UF é obrigatória'),

  // Termos e Observações
  legal_terms_accepted: z.boolean().default(true),
  receipt_number: z.string().optional().nullable(),
  receipt_notes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type SaleFormValues = z.infer<typeof saleSchema>;
