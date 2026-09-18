/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createOrReusePackageOrder } from '../orders-service.ts';
import type { CreditPackageOffer } from '../types.ts';

describe('User Story 2: WhatsApp Custom Package Safeguards (T016)', () => {
  const customWhatsappOffer: CreditPackageOffer = {
    id: 'offer-custom-50',
    name: 'Volume Customizado (50+ consultas)',
    slug: 'volume-customizado-50',
    package_type: 'custom',
    credits_quantity: 50,
    price_cents: 0,
    currency: 'BRL',
    reference_individual_price_cents: 3990,
    discount_percent: 15,
    badge: 'Sob Medida PJ',
    tagline: 'Condição sob medida para leilões, concessionárias e grandes frotas.',
    perks: ['Volume a partir de 50 consultas', 'Faturamento PJ direto'],
    contact_only: true,
    requires_whatsapp: true,
    highlight: false,
    is_featured: false,
    display_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('1. createOrReusePackageOrder rejects checkout creation for contact_only / requires_whatsapp offers', async () => {
    const mockDb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null }),
            }),
          }),
        }),
      }),
    };

    const result = await createOrReusePackageOrder(
      {
        userId: 'user-b2b-test',
        userEmail: 'b2b@empresa.com',
        offerId: 'offer-custom-50',
        idempotencyKey: 'idem-custom-try-1',
      },
      {
        dbClient: mockDb as any,
        offerOverride: customWhatsappOffer,
      },
    );

    assert.equal(result.success, false);
    assert.equal(result.errorCode, 'OFFER_REQUIRES_WHATSAPP');
    assert.ok(
      result.errorMessage?.includes('WhatsApp'),
      'Error message must state that package requires WhatsApp negotiation',
    );
    assert.equal(result.order, undefined);
  });

  it('2. WhatsApp target message contains user credentials and safe copy', () => {
    const userName = 'Empresa Frotas';
    const userEmail = 'frota@empresa.com';
    const expectedMsg = `Olá! Sou ${userName} (${userEmail}) e represento uma empresa com alta demanda (+50 consultas). Gostaria de uma cotação personalizada para o pacote ${customWhatsappOffer.name}.`;

    assert.ok(expectedMsg.includes(userName));
    assert.ok(expectedMsg.includes(userEmail));
    assert.ok(expectedMsg.includes(customWhatsappOffer.name));
    assert.ok(!expectedMsg.includes('<script>'), 'Must not contain unsafe tags');
  });
});
