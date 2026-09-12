/**
 * -------------------------------------------------------------
 * Mercado Pago Payment Brick Deterministic Configuration
 * -------------------------------------------------------------
 * Centralized, strictly validated configuration factory for Payment Brick v2.
 * Eliminates client-side console warnings:
 * 1. Removes 'fontFamily' from customization (applied externally via CSS).
 * 2. Removes 'preferenceId' and 'mercadoPago' payment method (direct card tokenization mode).
 * 3. Enforces strict entityType: 'individual' | 'association'.
 */

export type MercadoPagoEntityType = 'individual' | 'association';

export interface PaymentBrickConfigPayerAddress {
  zipCode?: string;
  streetName?: string;
  streetNumber?: string;
  neighborhood?: string;
  city?: string;
  federalUnit?: string;
  complement?: string;
}

export interface BuildPaymentBrickConfigParams {
  amount: number;
  payerEmail: string;
  payerAddress?: PaymentBrickConfigPayerAddress;
  entityType?: unknown;
}

export interface PaymentBrickOptions {
  initialization: {
    amount: number;
    payer: {
      email: string;
      entityType: MercadoPagoEntityType;
      address?: {
        zipCode?: string;
        streetName?: string;
        streetNumber?: string;
        neighborhood?: string;
        city?: string;
        federalUnit?: string;
        complement?: string;
      };
    };
  };
  customization: {
    paymentMethods: {
      creditCard: 'all';
      debitCard: 'all';
      ticket: 'all';
      bankTransfer: 'all';
      maxInstallments: number;
    };
    visual: {
      style: {
        theme: 'dark';
        customVariables: {
          formBackgroundColor: string;
          baseColor: string;
          baseColorFirstVariant: string;
          baseColorSecondVariant: string;
          borderRadiusSmall: string;
          borderRadiusMedium: string;
          borderRadiusLarge: string;
        };
      };
      hidePaymentButton: boolean;
      hideFormTitle: boolean;
    };
  };
}

/**
 * Validates whether a given Mercado Pago Public Key has the valid format and prefix.
 * Rejects empty strings, strings with whitespace, undefined, null, or invalid prefixes.
 */
export function isValidMercadoPagoPublicKey(key?: string | null): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.includes(' ') || key.trim() !== key) return false;
  return key.startsWith('TEST-') || key.startsWith('APP_USR-');
}

/**
 * Normalizes entityType strictly to 'individual' or 'association'.
 * Disallows null, undefined, empty string, PF, PJ, person, company, etc.
 */
export function normalizeEntityType(
  value?: unknown,
  fallback: MercadoPagoEntityType = 'individual',
): MercadoPagoEntityType {
  if (value === 'individual' || value === 'association') {
    return value;
  }
  return fallback;
}

/**
 * Builds the deterministic, warning-free Payment Brick configuration.
 */
export function buildPaymentBrickConfig(
  params: BuildPaymentBrickConfigParams,
): PaymentBrickOptions {
  if (typeof params.amount !== 'number' || !Number.isFinite(params.amount) || params.amount <= 0) {
    throw new Error('Payment Brick amount must be a positive number.');
  }

  const normalizedEntityType = normalizeEntityType(params.entityType, 'individual');

  const config: PaymentBrickOptions = {
    initialization: {
      amount: Number(params.amount.toFixed(2)),
      payer: {
        email: (params.payerEmail || '').trim().toLowerCase(),
        entityType: normalizedEntityType,
        ...(params.payerAddress
          ? {
              address: {
                zipCode: params.payerAddress.zipCode,
                streetName: params.payerAddress.streetName,
                streetNumber: params.payerAddress.streetNumber,
                neighborhood: params.payerAddress.neighborhood,
                city: params.payerAddress.city,
                federalUnit: params.payerAddress.federalUnit,
                complement: params.payerAddress.complement,
              },
            }
          : {}),
      },
    },
    customization: {
      paymentMethods: {
        creditCard: 'all',
        debitCard: 'all',
        ticket: 'all',
        bankTransfer: 'all',
        maxInstallments: 1,
      },
      visual: {
        style: {
          theme: 'dark',
          customVariables: {
            formBackgroundColor: 'transparent',
            baseColor: '#c9a44c',
            baseColorFirstVariant: '#b38e3a',
            baseColorSecondVariant: '#8f6d25',
            borderRadiusSmall: '8px',
            borderRadiusMedium: '10px',
            borderRadiusLarge: '12px',
          },
        },
        hidePaymentButton: false,
        hideFormTitle: true,
      },
    },
  };

  return config;
}
