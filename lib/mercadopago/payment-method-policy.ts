/**
 * AF Motos - Política Centralizada de Meios de Pagamento Mercado Pago
 * 
 * Regra de Negócio:
 * - Permitidos exclusivamente: PIX, Cartão de Crédito, Cartão de Débito e Saldo Mercado Pago
 *   (quando suportados e disponibilizados pelo Mercado Pago para a conta/comprador).
 * - Bloqueados: Boleto bancário (ticket), PEC, rapipago, pagofacil e variantes de pagamento offline.
 * 
 * Mercado Pago Checkout Pro Nomenclatura Oficial:
 * - O tipo "ticket" no Checkout Pro abrange todos os boletos bancários brasileiros (bolbradesco, pec, etc.).
 * - Para segurança em profundidade, definimos a exclusão tanto em `excluded_payment_types` (ticket)
 *   quanto em `excluded_payment_methods` (bolbradesco, pec, rapipago, pagofacil).
 */

export const AF_MOTOS_ALLOWED_PAYMENT_METHODS = {
  pix: true,
  creditCard: true,
  debitCard: true,
  mercadoPagoBalance: true,
  boleto: false,
} as const;

export const AF_MOTOS_EXCLUDED_PAYMENT_TYPES = [
  'ticket',
] as const;

export const AF_MOTOS_EXCLUDED_PAYMENT_METHODS = [
  'bolbradesco',
  'pec',
  'rapipago',
  'pagofacil',
] as const;

export interface ExcludedPaymentTypeItem {
  id: string;
}

export interface ExcludedPaymentMethodItem {
  id: string;
}

export interface CheckoutPaymentMethodsConfig {
  installments: number;
  excluded_payment_types: ExcludedPaymentTypeItem[];
  excluded_payment_methods: ExcludedPaymentMethodItem[];
}

/**
 * Constrói de forma determinística o nó payment_methods da preferência do Mercado Pago,
 * assegurando que boleto bancário seja permanentemente excluído no payload server-side.
 */
export function buildCheckoutPaymentMethodsPolicy(installments = 12): CheckoutPaymentMethodsConfig {
  return {
    installments,
    excluded_payment_types: AF_MOTOS_EXCLUDED_PAYMENT_TYPES.map((id) => ({ id })),
    excluded_payment_methods: AF_MOTOS_EXCLUDED_PAYMENT_METHODS.map((id) => ({ id })),
  };
}

/**
 * Helper para verificar se um determinado payment_type_id ou payment_method_id
 * corresponde a boleto ou meio offline não permitido.
 */
export function isBoletoPayment(
  paymentTypeId?: string | null,
  paymentMethodId?: string | null,
): boolean {
  if (!paymentTypeId && !paymentMethodId) return false;

  const normalizedType = (paymentTypeId || '').toLowerCase().trim();
  const normalizedMethod = (paymentMethodId || '').toLowerCase().trim();

  // "ticket" é o tipo canônico do Mercado Pago para boletos e lotéricas
  if (
    normalizedType === 'ticket' ||
    normalizedType === 'bank_transfer_ticket' ||
    normalizedType === 'boleto'
  ) {
    return true;
  }

  if (
    normalizedMethod === 'bolbradesco' ||
    normalizedMethod === 'pec' ||
    normalizedMethod === 'rapipago' ||
    normalizedMethod === 'pagofacil' ||
    normalizedMethod.includes('boleto')
  ) {
    return true;
  }

  return false;
}
