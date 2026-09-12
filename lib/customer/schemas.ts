import { z } from 'zod';
import { isValidBrazilianPlate, normalizeBrazilianPlate } from '../vehicle-lookup/plate.ts';

export const registerCustomerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Nome completo deve ter pelo menos 2 caracteres'),
  email: z
    .string()
    .trim()
    .email('E-mail inválido'),
  phone: z
    .string()
    .min(10, 'Telefone inválido')
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 10 || digits.length === 11;
    }, 'Telefone deve ter 10 ou 11 dígitos'),
  date_of_birth: z
    .string()
    .min(1, 'Data de nascimento é obrigatória')
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const today = new Date();
      if (date >= today) return false;
      const ageDiffMs = today.getTime() - date.getTime();
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return age >= 14;
    }, 'Você deve ter pelo menos 14 anos'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

export const loginCustomerSchema = z.object({
  email: z
    .string()
    .trim()
    .email('E-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória'),
});

export type LoginCustomerInput = z.infer<typeof loginCustomerSchema>;

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Nome completo deve ter pelo menos 2 caracteres'),
  email: z
    .string()
    .trim()
    .email('E-mail inválido')
    .optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const digits = val.replace(/\D/g, '');
      return digits.length === 10 || digits.length === 11;
    }, 'Telefone deve ter 10 ou 11 dígitos'),
  date_of_birth: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      return date <= new Date();
    }, 'Data de nascimento deve ser no passado'),
  avatar_url: z
    .string()
    .url('URL da foto inválida')
    .optional()
    .or(z.literal('')),
  address_street: z.string().max(255).optional().or(z.literal('')),
  address_number: z.string().max(20).optional().or(z.literal('')),
  address_complement: z.string().max(100).optional().or(z.literal('')),
  address_neighborhood: z.string().max(100).optional().or(z.literal('')),
  address_city: z.string().max(100).optional().or(z.literal('')),
  address_state: z
    .string()
    .max(2)
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val.length === 2, 'UF deve ter exatamente 2 letras'),
  address_zip: z
    .string()
    .max(10)
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val) return true;
      const digits = val.replace(/\D/g, '');
      return digits.length === 8;
    }, 'CEP deve conter 8 dígitos'),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const plateConsultationSchema = z.object({
  plate: z
    .string()
    .trim()
    .refine((val) => isValidBrazilianPlate(val), 'Placa inválida. Use o formato Mercosul (ABC1D23) ou antigo (ABC-1234)'),
});

export type PlateConsultationInput = z.infer<typeof plateConsultationSchema>;

export const paymentConfirmationSchema = z.object({
  consultationId: z.string().uuid('ID de consulta inválido'),
  paymentMethod: z.enum(['pix', 'credit_card', 'boleto'], {
    message: 'Método de pagamento inválido',
  }),
});

export type PaymentConfirmationInput = z.infer<typeof paymentConfirmationSchema>;
