import { z } from 'zod';

export const purchaseAgreementGenerateSchema = z.object({
  motorcycle_id: z.string().uuid().optional().nullable(),
  sell_request_id: z.string().uuid().optional().nullable(),
  seller_customer_id: z.string().uuid().optional().nullable(),
  vehicle_consultation_id: z.string().uuid().optional().nullable(),

  // Vendedor
  seller_name: z.string().min(3, 'Nome do vendedor é obrigatório'),
  seller_document: z.string().min(11, 'CPF ou CNPJ inválido').max(18),
  seller_rg: z.string().optional().nullable(),
  seller_phone: z.string().min(10, 'Telefone de contato inválido'),
  seller_email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  seller_address: z.string().min(5, 'Endereço completo é obrigatório'),

  // Motocicleta
  brand: z.string().min(1, 'Marca da motocicleta é obrigatória'),
  model: z.string().min(1, 'Modelo da motocicleta é obrigatório'),
  version: z.string().optional().nullable(),
  year_manufacture: z.coerce.number().int().min(1900, 'Ano de fabricação inválido'),
  year_model: z.coerce.number().int().min(1900, 'Ano do modelo inválido'),
  color: z.string().optional().nullable(),
  fuel: z.string().optional().nullable(),
  engine_capacity: z.coerce.number().optional().nullable(),
  license_plate: z.string().min(7, 'Placa inválida').max(8),
  renavam: z.string().optional().nullable(),
  chassi: z.string().optional().nullable(),
  engine_number: z.string().optional().nullable(),
  mileage: z.coerce.number().int().min(0, 'Quilometragem inválida'),
  fipe_code: z.string().optional().nullable(),
  fipe_price: z.coerce.number().optional().nullable(),

  // Comercial & Pagamento
  purchase_amount: z.coerce.number().positive('Valor de aquisição deve ser maior que zero'),
  paid_amount: z.coerce.number().min(0),
  payment_status: z.enum(['PAID_FULL', 'PAID_PARTIAL', 'PENDING']),
  payment_method: z.string().min(1, 'Forma de pagamento é obrigatória'),
  payment_date: z.string().min(10, 'Data de pagamento é obrigatória'),
  is_full_discharge_confirmed: z.boolean().default(true),

  // Entrega e Posse
  delivery_datetime: z.string().min(10, 'Data de entrega é obrigatória'),
  delivery_km: z.coerce.number().int().min(0),
  keys_count: z.coerce.number().int().min(1).default(1),
  has_manual: z.boolean().default(false),
  has_spare_key: z.boolean().default(false),
  documents_delivered: z.array(z.string()).default([]),
  accessories_delivered: z.array(z.string()).default([]),
  apparent_condition_notes: z.string().optional().nullable(),

  // Transferência
  transfer_deadline_date: z.string().min(10),
  transfer_notes: z.string().optional().nullable(),

  // Confirmações Obrigatórias do Operador
  confirmed_data_accurate: z.boolean().refine((val) => val === true, {
    message: 'É obrigatório confirmar a conferência dos dados.',
  }),
  confirmed_payment_realized: z.boolean().refine((val) => val === true, {
    message: 'É obrigatório confirmar o pagamento do valor acordado.',
  }),
  confirmed_vehicle_received: z.boolean().refine((val) => val === true, {
    message: 'É obrigatório confirmar o recebimento/entrega da motocicleta.',
  }),
});

export type PurchaseAgreementGenerateInput = z.infer<typeof purchaseAgreementGenerateSchema>;
