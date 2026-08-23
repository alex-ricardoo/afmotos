/**
 * Contract: Sales API & Types
 * Feature: 010-venda-recibo-oficial
 */

import { z } from 'zod';

export const paymentMethodEnum = z.enum([
  'PIX',
  'FINANCIAMENTO',
  'CARTAO',
  'DINHEIRO',
  'TROCA',
  'TRANSFERENCIA',
  'OUTRO',
]);

export const paymentStatusEnum = z.enum(['PAID', 'PARTIAL', 'PENDING']);

export const enhancedSaleFormSchema = z.object({
  // Veículo
  motorcycle_id: z.string().uuid('ID de motocicleta inválido'),
  renavam: z
    .string()
    .regex(/^\d{9,11}$/, 'Renavam deve conter entre 9 e 11 dígitos numéricos')
    .optional()
    .nullable()
    .or(z.literal('')),
  chassi: z
    .string()
    .length(17, 'Chassi/VIN deve possuir exatamente 17 caracteres')
    .transform((val) => val.toUpperCase())
    .optional()
    .nullable()
    .or(z.literal('')),
  delivery_km: z
    .number()
    .min(0, 'A quilometragem não pode ser negativa')
    .optional()
    .nullable(),

  // Transação
  sale_price: z.number().min(1, 'O valor da venda deve ser maior que zero'),
  sale_date: z.string().min(1, 'Data da venda é obrigatória'),
  payment_method: paymentMethodEnum.default('PIX'),
  payment_status: paymentStatusEnum.default('PAID'),
  entry_amount: z.number().min(0, 'Valor de entrada não pode ser negativo').default(0),
  financed_amount: z.number().min(0, 'Valor financiado não pode ser negativo').default(0),
  trade_amount: z.number().min(0, 'Valor na troca não pode ser negativo').default(0),
  amount_paid: z.number().min(0, 'Valor pago não pode ser negativo').default(0),

  // Comprador
  buyer_name: z.string().min(3, 'Nome ou Razão Social é obrigatório'),
  buyer_phone: z.string().min(10, 'Telefone de contato é obrigatório'),
  buyer_email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  buyer_document: z.string().min(11, 'CPF ou CNPJ inválido'),
  
  // Endereço Estruturado
  buyer_cep: z.string().optional().nullable().or(z.literal('')),
  buyer_street: z.string().optional().nullable().or(z.literal('')),
  buyer_number: z.string().optional().nullable().or(z.literal('')),
  buyer_complement: z.string().optional().nullable().or(z.literal('')),
  buyer_neighborhood: z.string().optional().nullable().or(z.literal('')),
  buyer_city: z.string().optional().nullable().or(z.literal('')),
  buyer_state: z.string().max(2).optional().nullable().or(z.literal('')),

  // Jurídico e Observações
  legal_terms_accepted: z.boolean().default(true),
  receipt_number: z.string().optional().nullable(),
  receipt_notes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type EnhancedSaleFormValues = z.infer<typeof enhancedSaleFormSchema>;

export interface SaleReceiptData {
  sale: {
    id: string;
    receipt_number: string;
    sale_date: string;
    sale_price: number;
    amount_paid: number;
    entry_amount: number;
    financed_amount: number;
    trade_amount: number;
    payment_method: string;
    payment_status: string;
    legal_terms_accepted: boolean;
    receipt_notes: string | null;
    notes: string | null;
    delivery_km: number | null;
    renavam: string | null;
    chassi: string | null;
    buyer: {
      name: string;
      document: string;
      phone: string;
      email: string | null;
      full_address: string;
      street: string | null;
      number: string | null;
      complement: string | null;
      neighborhood: string | null;
      city: string | null;
      state: string | null;
      cep: string | null;
    };
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    version: string | null;
    year_manufacture: number;
    year_model: number;
    license_plate: string | null;
    color: string | null;
    mileage: number | null;
    renavam: string | null;
    chassi: string | null;
  };
  store: {
    site_name: string;
    legal_name?: string;
    cnpj?: string;
    whatsapp_phone: string;
    contact_email: string;
    address: string;
    logo_url?: string;
  };
}
