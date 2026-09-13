import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateRefundEligibility,
  buildRefundIdempotencyKey,
  sanitizeRefundErrorMessage,
} from '../refund-service.ts';

test('evaluateRefundEligibility allows refund when payment is approved and consultation failed without report', () => {
  const eligibility = evaluateRefundEligibility({
    transaction: {
      id: 'tx-123',
      payment_status: 'approved',
      mp_payment_id: '123456789',
      amount: 19.9,
    },
    consultation: {
      id: 'cons-123',
      status: 'failed_permanent',
      report_data: null,
    },
    existingRefund: null,
  });

  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.reason, null);
});

test('evaluateRefundEligibility rejects refund if mp_payment_id is missing', () => {
  const eligibility = evaluateRefundEligibility({
    transaction: {
      id: 'tx-123',
      payment_status: 'approved',
      mp_payment_id: null,
      amount: 19.9,
    },
    consultation: {
      id: 'cons-123',
      status: 'failed_permanent',
      report_data: null,
    },
    existingRefund: null,
  });

  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.reason ?? '', /mp_payment_id.*ausente/);
});

test('evaluateRefundEligibility rejects refund if payment is not approved', () => {
  const eligibility = evaluateRefundEligibility({
    transaction: {
      id: 'tx-123',
      payment_status: 'pending',
      mp_payment_id: '123456789',
      amount: 19.9,
    },
    consultation: {
      id: 'cons-123',
      status: 'failed_permanent',
      report_data: null,
    },
    existingRefund: null,
  });

  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.reason ?? '', /Pagamento não está aprovado/);
});

test('evaluateRefundEligibility rejects refund if consultation already has delivered report', () => {
  const eligibility = evaluateRefundEligibility({
    transaction: {
      id: 'tx-123',
      payment_status: 'approved',
      mp_payment_id: '123456789',
      amount: 19.9,
    },
    consultation: {
      id: 'cons-123',
      status: 'completed',
      report_data: { marca: 'HONDA', modelo: 'CG 160' },
    },
    existingRefund: null,
  });

  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.reason ?? '', /Laudo já foi entregue/);
});

test('evaluateRefundEligibility rejects refund if refund was already requested or confirmed', () => {
  const eligibility = evaluateRefundEligibility({
    transaction: {
      id: 'tx-123',
      payment_status: 'approved',
      mp_payment_id: '123456789',
      amount: 19.9,
    },
    consultation: {
      id: 'cons-123',
      status: 'failed_permanent',
      report_data: null,
    },
    existingRefund: {
      id: 'ref-1',
      status: 'confirmed',
    },
  });

  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.reason ?? '', /Estorno já foi solicitado ou concluído/);
});

test('buildRefundIdempotencyKey generates deterministic key without tokens', () => {
  const key1 = buildRefundIdempotencyKey('tx-999', '123456789');
  const key2 = buildRefundIdempotencyKey('tx-999', '123456789');
  assert.equal(key1, key2);
  assert.equal(key1, 'refund-tx-999-123456789');
});

test('sanitizeRefundErrorMessage scrubs access tokens and secrets', () => {
  const rawMsg = 'Error communicating with Mercado Pago: APP_USR-8392193821039812-091312 failed';
  const sanitized = sanitizeRefundErrorMessage(rawMsg);
  assert.equal(sanitized.includes('APP_USR'), false);
  assert.equal(sanitized.includes('[REDACTED_SECRET]'), true);
});

test('evaluateRefundEligibility flags support_action_required as RECHARGE_APIBRASIL when credits exhausted', () => {
  const eligibility = evaluateRefundEligibility({
    transaction: {
      id: 'tx-123',
      payment_status: 'approved',
      mp_payment_id: '123456789',
      amount: 49.99,
    },
    consultation: {
      id: 'cons-123',
      status: 'failed_permanent',
      report_data: null,
    },
    existingRefund: null,
    reasonCode: 'APIBRASIL_INSUFFICIENT_CREDITS',
  });

  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.supportActionRequired, 'RECHARGE_APIBRASIL');
});

test('evaluateRefundEligibility rejects refund if transaction amount is zero or negative', () => {
  const eligibility = evaluateRefundEligibility({
    transaction: {
      id: 'tx-123',
      payment_status: 'approved',
      mp_payment_id: '123456789',
      amount: 0,
    },
    consultation: {
      id: 'cons-123',
      status: 'failed_permanent',
      report_data: null,
    },
    existingRefund: null,
  });

  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.reason ?? '', /Valor da transação inválido/);
});
