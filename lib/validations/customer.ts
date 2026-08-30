import { z } from 'zod';
import { isValidCpf, cleanNumeric } from '@/lib/utils/customer-normalizers';

export const customerSourceEnum = z.enum([
  'manual',
  'website_sell_request',
  'website_consignment_request',
  'website_contact',
  'sale_registration',
  'rental_registration',
  'admin_proposal',
  'imported',
  'other',
]);

export const customerGenderEnum = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);

export const customerCreateSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'O nome completo deve ter pelo menos 2 caracteres'),
    phone: z
      .string()
      .trim()
      .min(8, 'Telefone de contato é obrigatório')
      .refine(
        (val) => cleanNumeric(val).length >= 8 && cleanNumeric(val).length <= 13,
        'Telefone inválido (deve conter entre 8 e 11 dígitos numéricos)',
      ),
    whatsapp: z.string().trim().optional().nullable(),
    email: z
      .string()
      .trim()
      .email('E-mail informado é inválido')
      .optional()
      .nullable()
      .or(z.literal('')),
    cpf: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || cleanNumeric(val).length === 0) return true;
          return isValidCpf(val);
        },
        { message: 'CPF informado é inválido' },
      ),
    rg: z.string().trim().optional().nullable().or(z.literal('')),
    gender: customerGenderEnum.optional().nullable(),
    birth_date: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          return !isNaN(date.getTime()) && date <= new Date();
        },
        { message: 'Data de nascimento não pode ser no futuro' },
      ),
    cep: z.string().trim().optional().nullable().or(z.literal('')),
    street: z.string().trim().optional().nullable().or(z.literal('')),
    number: z.string().trim().optional().nullable().or(z.literal('')),
    complement: z.string().trim().optional().nullable().or(z.literal('')),
    neighborhood: z.string().trim().optional().nullable().or(z.literal('')),
    city: z.string().trim().optional().nullable().or(z.literal('')),
    state: z
      .string()
      .trim()
      .max(2, 'UF deve ter 2 caracteres')
      .optional()
      .nullable()
      .or(z.literal('')),
    source: customerSourceEnum.default('manual'),
    source_detail: z.string().trim().optional().nullable().or(z.literal('')),
    notes: z.string().trim().optional().nullable().or(z.literal('')),
    is_active: z.boolean().default(true),
  });

export type CustomerFormValues = z.infer<typeof customerCreateSchema>;

export const customerQuickCreateSchema = z.object({
  full_name: z.string().trim().min(2, 'Nome é obrigatório'),
  phone: z
    .string()
    .trim()
    .min(8, 'Telefone é obrigatório')
    .refine((val) => cleanNumeric(val).length >= 8, 'Telefone inválido'),
  email: z
    .string()
    .trim()
    .email('E-mail inválido')
    .optional()
    .nullable()
    .or(z.literal('')),
  cpf: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || cleanNumeric(val).length === 0) return true;
        return isValidCpf(val);
      },
      { message: 'CPF inválido' },
    ),
  source: customerSourceEnum.default('sale_registration'),
});

export type CustomerQuickCreateValues = z.infer<typeof customerQuickCreateSchema>;

export const customerUpdateSchema = customerCreateSchema.partial();
export type CustomerUpdateValues = z.infer<typeof customerUpdateSchema>;

export const customerSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  gender: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('active'),
  relationship_type: z.string().optional(),
  date_range: z.string().optional(),
});

export type CustomerSearchParams = z.infer<typeof customerSearchSchema>;
