import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapMercadoPagoStatus,
  isTerminalApprovalStatus,
  canTransitionStatus,
  getSafeStatusMessage,
} from '../payment-status-mapper.ts';

describe('Mercado Pago Payment Status Mapper', () => {
  it('maps approved status correctly', () => {
    assert.equal(mapMercadoPagoStatus('approved'), 'approved');
    assert.equal(mapMercadoPagoStatus('APPROVED'), 'approved');
  });

  it('maps pending and in_process correctly', () => {
    assert.equal(mapMercadoPagoStatus('pending'), 'pending');
    assert.equal(mapMercadoPagoStatus('in_process'), 'in_process');
    assert.equal(mapMercadoPagoStatus('in_mediation'), 'in_mediation');
  });

  it('maps rejected and cancelled correctly', () => {
    assert.equal(mapMercadoPagoStatus('rejected'), 'rejected');
    assert.equal(mapMercadoPagoStatus('cancelled'), 'cancelled');
  });

  it('maps refunded and charged_back correctly', () => {
    assert.equal(mapMercadoPagoStatus('refunded'), 'refunded');
    assert.equal(mapMercadoPagoStatus('charged_back'), 'charged_back');
  });

  it('defaults null/undefined/unknown to pending', () => {
    assert.equal(mapMercadoPagoStatus(null), 'pending');
    assert.equal(mapMercadoPagoStatus(undefined), 'pending');
    assert.equal(mapMercadoPagoStatus('unknown_status_xyz'), 'pending');
  });

  it('identifies terminal approval statuses', () => {
    assert.equal(isTerminalApprovalStatus('approved'), true);
    assert.equal(isTerminalApprovalStatus('refunded'), true);
    assert.equal(isTerminalApprovalStatus('charged_back'), true);
    assert.equal(isTerminalApprovalStatus('pending'), false);
    assert.equal(isTerminalApprovalStatus('in_process'), false);
    assert.equal(isTerminalApprovalStatus('rejected'), false);
  });

  it('prevents downgrade from approved to pending or in_process', () => {
    assert.equal(canTransitionStatus('approved', 'in_process'), false);
    assert.equal(canTransitionStatus('approved', 'pending'), false);
    assert.equal(canTransitionStatus('approved', 'rejected'), false);
    assert.equal(canTransitionStatus('approved', 'refunded'), true);
    assert.equal(canTransitionStatus('approved', 'charged_back'), true);
  });

  it('allows normal progression from pending to approved or rejected', () => {
    assert.equal(canTransitionStatus('pending', 'in_process'), true);
    assert.equal(canTransitionStatus('pending', 'approved'), true);
    assert.equal(canTransitionStatus('pending', 'rejected'), true);
    assert.equal(canTransitionStatus('in_process', 'approved'), true);
  });

  it('returns safe status messages without leaking internal info', () => {
    assert.match(getSafeStatusMessage('approved'), /sucesso/i);
    assert.match(getSafeStatusMessage('pending'), /aguardando/i);
    assert.match(
      getSafeStatusMessage('rejected', 'cc_rejected_insufficient_amount'),
      /saldo insuficiente/i,
    );
    assert.match(getSafeStatusMessage('provider_error'), /instabilidade temporária/i);
  });
});
