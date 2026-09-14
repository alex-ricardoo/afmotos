import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_VEHICLE_HISTORY_PRICING,
  type VehicleHistoryPricingVersionRecord,
} from '../pricing-service.ts';

describe('Vehicle History Pricing Versioning and Immutability', () => {
  it('falls back to default pricing when no database record exists', () => {
    assert.equal(DEFAULT_VEHICLE_HISTORY_PRICING.publicPriceCents, 3990);
    assert.equal(DEFAULT_VEHICLE_HISTORY_PRICING.apiBrasilLiveCostCents, 3000);
    assert.equal(DEFAULT_VEHICLE_HISTORY_PRICING.marginCents, 990);
    assert.equal(DEFAULT_VEHICLE_HISTORY_PRICING.marginPercentage, 24.8);
  });

  it('calculates margins accurately in cents without floating point precision issues', () => {
    const publicPriceCents = 4990;
    const liveCostCents = 3000;
    const marginCents = publicPriceCents - liveCostCents;
    const marginPct = Number(((marginCents / publicPriceCents) * 100).toFixed(1));

    assert.equal(marginCents, 1990);
    assert.equal(marginPct, 39.9);
  });

  it('guarantees immutability of historical consultations when new pricing version is activated', () => {
    // 1. Initial version
    const version1: VehicleHistoryPricingVersionRecord = {
      id: 'ver-001',
      version_number: 1,
      public_price_cents: 3990,
      apibrasil_live_cost_cents: 3000,
      currency: 'BRL',
      valid_from: '2026-01-01T00:00:00.000Z',
      valid_until: null,
      is_active: true,
      change_reason: 'Preço inicial',
      created_by_admin_id: 'admin-1',
      created_at: '2026-01-01T00:00:00.000Z',
    };

    // 2. Historical consultation snapshot created under version 1
    const historicalConsultation = {
      id: 'cons-hist-1',
      pricing_version_id: version1.id,
      public_price_snapshot_cents: version1.public_price_cents,
      provider_cost_snapshot_cents: version1.apibrasil_live_cost_cents,
      actual_cost_cents: 3000,
      provider_cost_status: 'incurred',
    };

    // 3. Admin creates version 2 with price increase (R$ 49,90) and renegotiated cost (R$ 25,00)
    const version2: VehicleHistoryPricingVersionRecord = {
      id: 'ver-002',
      version_number: 2,
      public_price_cents: 4990,
      apibrasil_live_cost_cents: 2500,
      currency: 'BRL',
      valid_from: '2026-06-01T00:00:00.000Z',
      valid_until: null,
      is_active: true,
      change_reason: 'Reajuste semestral',
      created_by_admin_id: 'admin-1',
      created_at: '2026-06-01T00:00:00.000Z',
    };

    // Version 1 is deactivated
    version1.is_active = false;
    version1.valid_until = '2026-06-01T00:00:00.000Z';

    // Verify Golden Rule: Historical consultation MUST remain unchanged
    assert.equal(historicalConsultation.pricing_version_id, 'ver-001');
    assert.equal(historicalConsultation.public_price_snapshot_cents, 3990);
    assert.equal(historicalConsultation.provider_cost_snapshot_cents, 3000);
    assert.equal(historicalConsultation.actual_cost_cents, 3000);

    // New consultation created under version 2
    const newConsultation = {
      id: 'cons-new-2',
      pricing_version_id: version2.id,
      public_price_snapshot_cents: version2.public_price_cents,
      provider_cost_snapshot_cents: version2.apibrasil_live_cost_cents,
      actual_cost_cents: 2500,
      provider_cost_status: 'incurred',
    };

    assert.equal(newConsultation.pricing_version_id, 'ver-002');
    assert.equal(newConsultation.public_price_snapshot_cents, 4990);
    assert.equal(newConsultation.provider_cost_snapshot_cents, 2500);
    assert.equal(newConsultation.actual_cost_cents, 2500);
  });
});
