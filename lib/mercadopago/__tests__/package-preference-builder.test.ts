import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPackagePreferenceBody } from '../package-preference-builder.ts';
import { CheckoutProValidationError } from '../error-normalizer.ts';
import type { CreditPackageOrder, CreditPackageOffer } from '../../credits/types.ts';

describe('Credit Package Preference Builder', () => {
  const mockOffer: CreditPackageOffer = {
    id: 'offer-5-uuid',
    slug: 'pacote-inicial-5',
    name: 'Pacote Inicial (5 Consultas)',
    package_type: 'standard',
    credits_quantity: 5,
    price_cents: 18000,
    currency: 'BRL',
    display_order: 1,
    is_active: true,
    is_featured: false,
    contact_only: false,
    requires_whatsapp: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockOrder: CreditPackageOrder = {
    id: 'order-123-uuid',
    user_id: 'user-abc-uuid',
    offer_id: 'offer-5-uuid',
    offer_name_snapshot: 'Pacote Inicial (5 Consultas)',
    quantity: 1,
    credits_quantity: 5,
    price_cents: 18000,
    currency: 'BRL',
    unit_price_cents: 3600,
    discount_cents: 1950,
    status: 'pending',
    external_reference: 'order-123-uuid',
    idempotency_key: 'idem-key-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('builds canonical preference body with price, external_reference and package metadata', () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    try {
      const body = buildPackagePreferenceBody({
        order: mockOrder,
        offer: mockOffer,
        customerEmail: 'cliente@teste.com',
      });

      assert.equal(body.items?.length, 1);
      assert.equal(body.items[0]?.title, 'Pacote Inicial (5 Consultas)');
      assert.equal(body.items[0]?.quantity, 1);
      assert.equal(body.items[0]?.unit_price, 180.0);
      assert.equal(body.items[0]?.currency_id, 'BRL');
      assert.equal(body.external_reference, 'order-123-uuid');
      assert.equal(body.payer?.email, 'cliente@teste.com');
      assert.equal((body.metadata as any)?.purpose, 'credit_package');
      assert.equal((body.metadata as any)?.order_id, 'order-123-uuid');
      assert.equal((body.metadata as any)?.credits_quantity, 5);

      const backUrls = body.back_urls as { success?: string; pending?: string; failure?: string };
      assert.ok(backUrls.success?.includes('/cliente/pacotes/retorno/order-123-uuid'));

      assert.equal(body.payment_methods?.installments, 12);
      assert.deepEqual(body.payment_methods?.excluded_payment_types, [{ id: 'ticket' }]);
      assert.ok(body.payment_methods?.excluded_payment_methods?.some((m) => m.id === 'bolbradesco'));
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
  });

  it('throws CheckoutProValidationError when order price is invalid or zero', () => {
    const invalidOrder = { ...mockOrder, price_cents: 0 };
    assert.throws(
      () =>
        buildPackagePreferenceBody({
          order: invalidOrder,
          offer: mockOffer,
        }),
      (err: unknown) => {
        return err instanceof CheckoutProValidationError && err.code === 'INVALID_PACKAGE_PRICE';
      },
    );
  });
});
