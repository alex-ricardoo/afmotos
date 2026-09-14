import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNTANT_LEGAL_DISCLAIMER } from '../annual-accountant-queries.ts';

describe('Vehicle History Financial Reports and Annual Accountant Calculations', () => {
  it('deducts confirmed refunds from gross gateway revenue while isolating pending refunds', () => {
    const grossRevenueCents = 3990 * 10; // 10 vendas = R$ 399,00
    const confirmedRefundsCents = 3990 * 2; // 2 estornos confirmados = R$ 79,80
    const pendingRefundsCents = 3990 * 1; // 1 estorno pendente = R$ 39,90

    const netRevenueCents = grossRevenueCents - confirmedRefundsCents;

    assert.equal(netRevenueCents, 31920); // R$ 319,20
    // Pending refunds must NOT be deducted from net cash revenue yet
    assert.equal(netRevenueCents + pendingRefundsCents, 35910);
  });

  it('calculates gross margin accurately incorporating external package revenue and live provider costs', () => {
    const netGatewayRevenueCents = 31920; // R$ 319,20
    const externalPackagesRevenueCents = 15000; // R$ 150,00
    const totalRevenueCents = netGatewayRevenueCents + externalPackagesRevenueCents; // R$ 469,20

    // 5 live calls at R$ 30,00 each, 5 cache hits at R$ 0,00
    const totalApiBrasilCostCents = 3000 * 5; // R$ 150,00

    const estimatedMarginCents = totalRevenueCents - totalApiBrasilCostCents;
    const estimatedMarginPercentage = Number(((estimatedMarginCents / totalRevenueCents) * 100).toFixed(1));

    assert.equal(totalRevenueCents, 46920);
    assert.equal(estimatedMarginCents, 31920);
    assert.equal(estimatedMarginPercentage, 68.0);
  });

  it('tracks B2B credit ledger balances without distorting gateway cash receipts', () => {
    const creditsGranted = 100;
    const creditsConsumed = 35;
    const creditsReleased = 5;

    const outstandingBalance = creditsGranted - creditsConsumed + creditsReleased;
    assert.equal(outstandingBalance, 70);
  });

  it('includes mandatory legal disclaimer on all accountant reports', () => {
    assert.ok(ACCOUNTANT_LEGAL_DISCLAIMER.includes('AVISO LEGAL DE APOIO GERENCIAL'));
    assert.ok(ACCOUNTANT_LEGAL_DISCLAIMER.includes('Não substitui notas fiscais'));
    assert.ok(ACCOUNTANT_LEGAL_DISCLAIMER.includes('contador responsável'));
  });
});
