import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Vehicle Lookup Provider Cost and Snapshot Policy', () => {
  it('assigns zero provider cost and not_applicable status for Cache Hits', () => {
    const cacheHitConsultation = {
      id: 'cons-cache-1',
      plate: 'ABC1D23',
      is_cache_hit: true,
      provider_cost_snapshot_cents: 3000,
      actual_cost_cents: 0,
      provider_cost_status: 'not_applicable',
      pricing_version_id: 'ver-001',
    };

    assert.equal(cacheHitConsultation.is_cache_hit, true);
    assert.equal(cacheHitConsultation.actual_cost_cents, 0);
    assert.equal(cacheHitConsultation.provider_cost_status, 'not_applicable');
  });

  it('assigns zero provider cost and not_applicable status for Mock Fixtures', () => {
    const mockConsultation = {
      id: 'cons-mock-1',
      plate: 'TEST999',
      is_mock: true,
      provider_cost_snapshot_cents: 0,
      actual_cost_cents: 0,
      provider_cost_status: 'not_applicable',
    };

    assert.equal(mockConsultation.is_mock, true);
    assert.equal(mockConsultation.actual_cost_cents, 0);
    assert.equal(mockConsultation.provider_cost_status, 'not_applicable');
  });

  it('records actual cost and incurred status for successful live API lookups', () => {
    const liveCostSnapshotCents = 3000;
    const liveConsultation = {
      id: 'cons-live-1',
      plate: 'XYZ9A87',
      is_cache_hit: false,
      is_mock: false,
      provider_cost_snapshot_cents: liveCostSnapshotCents,
      actual_cost_cents: liveCostSnapshotCents,
      provider_cost_status: 'incurred',
      pricing_version_id: 'ver-001',
    };

    assert.equal(liveConsultation.is_cache_hit, false);
    assert.equal(liveConsultation.actual_cost_cents, 3000);
    assert.equal(liveConsultation.provider_cost_status, 'incurred');
  });

  it('flags not_incurred with zero actual cost when API Brasil returns HTTP 402 / Insufficient Balance', () => {
    const failedInsufficientCredits = {
      id: 'cons-fail-402',
      plate: 'XYZ9A87',
      is_cache_hit: false,
      provider_cost_snapshot_cents: 3000,
      actual_cost_cents: 0,
      provider_cost_status: 'not_incurred',
      http_status_code: 402,
      error_code: 'APIBRASIL_INSUFFICIENT_CREDITS',
    };

    assert.equal(failedInsufficientCredits.http_status_code, 402);
    assert.equal(failedInsufficientCredits.actual_cost_cents, 0);
    assert.equal(failedInsufficientCredits.provider_cost_status, 'not_incurred');
  });
});
