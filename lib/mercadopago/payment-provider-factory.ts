import {
  type MercadoPagoPaymentProvider,
  type ProviderAdapterVersion,
  resolveActiveProviderAdapter,
} from './payment-provider.ts';
import { MercadoPagoPaymentProviderV2 } from './payment-provider-v2.ts';
import { MercadoPagoPaymentProviderV3 } from './payment-provider-v3.ts';

let providerInstanceV2: MercadoPagoPaymentProvider | null = null;
let providerInstanceV3: MercadoPagoPaymentProvider | null = null;

/**
 * Factory function to retrieve the configured or explicitly requested payment provider adapter.
 * Controlled exclusively by environment variable MERCADO_PAGO_PROVIDER_ADAPTER (v2 | v3, default: v3).
 */
export function getPaymentProvider(
  requestedVersion?: ProviderAdapterVersion,
): MercadoPagoPaymentProvider {
  const version = requestedVersion || resolveActiveProviderAdapter();

  if (version === 'v2') {
    if (!providerInstanceV2) {
      providerInstanceV2 = new MercadoPagoPaymentProviderV2();
    }
    return providerInstanceV2;
  }

  if (!providerInstanceV3) {
    providerInstanceV3 = new MercadoPagoPaymentProviderV3();
  }
  return providerInstanceV3;
}
