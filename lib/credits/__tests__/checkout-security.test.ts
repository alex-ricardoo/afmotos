import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { creditPackageCheckoutSchema } from '../validations.ts';
import { buildPackagePreferenceBody } from '../../mercadopago/package-preference-builder.ts';
import type { CreditPackageOffer, CreditPackageOrder } from '../types.ts';

describe('User Story 3: Anti-Tampering & Strict Price Protection (T019)', () => {
  it('1. Zod schema strictly rejects malicious fields in payload (price injection, extra credits, discounts)', () => {
    const maliciousPayloads = [
      {
        idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        price_cents: 100, // Tentativa de pagar R$ 1,00
      },
      {
        idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        credits_quantity: 9999, // Tentativa de inflar créditos
      },
      {
        idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        discount_percent: 99, // Tentativa de aplicar super desconto
      },
      {
        idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        currency: 'USD',
      },
    ];

    for (const payload of maliciousPayloads) {
      const result = creditPackageCheckoutSchema.safeParse(payload);
      assert.equal(
        result.success,
        false,
        `Payload with unauthorized keys must be rejected: ${JSON.stringify(payload)}`,
      );
    }
  });

  it('2. Zod schema accepts exclusively canonical payload with valid idempotencyKey UUID', () => {
    const validPayload = {
      idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    };

    const result = creditPackageCheckoutSchema.safeParse(validPayload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.idempotencyKey, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    }
  });

  it('3. buildPackagePreferenceBody rejects zero or negative order prices regardless of input', () => {
    const mockOffer: CreditPackageOffer = {
      id: 'offer-1',
      slug: 'offer-1',
      name: 'Oferta 1',
      package_type: 'standard',
      credits_quantity: 5,
      price_cents: 0,
      currency: 'BRL',
      display_order: 1,
      is_active: true,
      is_featured: false,
      contact_only: false,
      requires_whatsapp: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const zeroOrder: CreditPackageOrder = {
      id: 'order-0',
      user_id: 'user-0',
      offer_id: 'offer-1',
      offer_name_snapshot: 'Oferta 1',
      quantity: 1,
      credits_quantity: 5,
      price_cents: 0, // Preço zerado
      currency: 'BRL',
      unit_price_cents: 0,
      discount_cents: 0,
      status: 'pending',
      external_reference: 'order-0',
      idempotency_key: 'idem-0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    assert.throws(
      () => {
        buildPackagePreferenceBody({
          order: zeroOrder,
          offer: mockOffer,
          customerEmail: 'test@example.com',
        });
      },
      {
        message: 'Valor do pacote comercial inválido para cobrança.',
      },
    );
  });
});
