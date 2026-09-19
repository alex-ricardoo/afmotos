import { resolveCheckoutProUrls, type DeploymentEnvironment } from './checkout-pro-urls.ts';
import { removeEmptyFields, type PreferenceCreateBody } from './preference-builder.ts';
import { buildCheckoutPaymentMethodsPolicy } from './payment-method-policy.ts';
import { CheckoutProValidationError } from './error-normalizer.ts';
import type { CreditPackageOrder, CreditPackageOffer } from '../credits/types.ts';

export interface BuildPackagePreferenceParams {
  order: CreditPackageOrder;
  offer: CreditPackageOffer;
  customerEmail?: string | null;
}

/**
 * Constrói o payload canônico para a criação da Preferência no Mercado Pago para pacotes de crédito.
 * O preço e os dados do item são estritamente originados do snapshot do pedido persistido no banco.
 */
export function buildPackagePreferenceBody(
  params: BuildPackagePreferenceParams,
  options?: { environmentOverride?: DeploymentEnvironment; allowProductionInPreview?: boolean },
): PreferenceCreateBody {
  const { order, offer, customerEmail } = params;

  const unitPrice = Math.round(order.price_cents) / 100;
  if (isNaN(unitPrice) || unitPrice <= 0) {
    throw new CheckoutProValidationError(
      'Valor do pacote comercial inválido para cobrança.',
      422,
      'INVALID_PACKAGE_PRICE',
    );
  }

  // Resolução de URLs direcionando o retorno para /cliente/pacotes/retorno/[orderId]
  const resolvedUrls = resolveCheckoutProUrls({
    transactionId: order.id,
    returnPathPrefix: '/cliente/pacotes/retorno',
    environmentOverride: options?.environmentOverride,
    allowProductionInPreview: options?.allowProductionInPreview,
  });

  const rawBody: Record<string, unknown> = {
    items: [
      {
        id: offer.slug || `credit-package-${order.offer_id}`,
        title: offer.name,
        description: `Pacote de ${order.credits_quantity} consultas veiculares na plataforma AF Motos`,
        quantity: 1,
        unit_price: unitPrice,
        currency_id: 'BRL',
      },
    ],
    payer: customerEmail ? { email: customerEmail.trim() } : undefined,
    external_reference: order.id,
    metadata: {
      purpose: 'credit_package',
      order_id: order.id,
      offer_id: order.offer_id,
      user_id: order.user_id,
      credits_quantity: order.credits_quantity,
    },
    back_urls: resolvedUrls.backUrls,
    auto_return: resolvedUrls.autoReturn,
    notification_url: resolvedUrls.notificationUrl,
    payment_methods: buildCheckoutPaymentMethodsPolicy(12),
  };

  return removeEmptyFields(rawBody) as PreferenceCreateBody;
}
