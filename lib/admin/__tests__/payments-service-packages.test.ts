import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapRowToDTO } from '../payments-service.ts';

describe('Admin Payments Service - Credit Package Mapping & DTO', () => {
  it('mapeia corretamente linha de visualização de pacote concedido', () => {
    const mockRow = {
      transaction_id: 'tx-pkg-001',
      payment_created_at: '2026-09-21T20:00:00Z',
      payment_updated_at: '2026-09-21T20:01:00Z',
      transaction_amount: 10.0,
      payment_method_id: 'pix',
      payment_type_id: 'bank_transfer',
      payment_status: 'approved',
      payment_status_detail: 'accredited',
      mp_payment_id: 'mp-12345678',
      mp_preference_id: 'pref-987654',
      purpose: 'credit_package',
      package_order_id: 'ord-pkg-001',
      package_offer_name: 'Pacote Turbo 10',
      package_credits_quantity: 10,
      package_order_status: 'paid',
      package_paid_at: '2026-09-21T20:01:00Z',
      package_granted_at: '2026-09-21T20:01:02Z',
      is_package_granted: true,
      is_package_refund_eligible: true,
      package_id: 'pkg-001',
      package_credits_remaining: 10,
      customer_id: 'usr-001',
      customer_name: 'Cliente Teste',
      customer_email: 'cliente@teste.com',
      customer_phone: '81999999999',
    };

    const dto = mapRowToDTO(mockRow);

    assert.equal(dto.transactionId, 'tx-pkg-001');
    assert.equal(dto.purpose, 'credit_package');
    assert.equal(dto.creditPackageOrderId, 'ord-pkg-001');
    assert.equal(dto.amount, 10.0);
    assert.equal(dto.amountFormatted, 'R$ 10,00');
    assert.equal(dto.plate, 'PACOTE DE CRÉDITOS');
    assert.ok(dto.package, 'Objeto package deve estar presente');
    assert.equal(dto.package?.offerName, 'Pacote Turbo 10');
    assert.equal(dto.package?.creditsQuantity, 10);
    assert.equal(dto.package?.isGranted, true);
    assert.equal(dto.package?.isRefundEligible, true);
    assert.equal(dto.flags.isRefundEligible, true);
    assert.equal(dto.flags.requiresAttention, false);
  });

  it('sinaliza atenção quando pacote pago ainda não teve créditos concedidos', () => {
    const mockRow = {
      transaction_id: 'tx-pkg-pending-grant',
      payment_created_at: '2026-09-21T20:00:00Z',
      payment_updated_at: '2026-09-21T20:01:00Z',
      transaction_amount: 1.0,
      payment_method_id: 'pix',
      payment_type_id: 'bank_transfer',
      payment_status: 'approved',
      payment_status_detail: 'accredited',
      mp_payment_id: 'mp-87654321',
      purpose: 'credit_package',
      package_order_id: 'ord-pkg-de58e94b',
      package_offer_name: 'Pacote Essencial',
      package_credits_quantity: 5,
      package_order_status: 'paid',
      package_paid_at: '2026-09-21T20:01:00Z',
      package_granted_at: null,
      is_package_granted: false,
      is_package_refund_eligible: true,
      customer_id: 'usr-002',
      customer_name: 'Cliente Pendente',
      customer_email: 'pendente@teste.com',
    };

    const dto = mapRowToDTO(mockRow);

    assert.equal(dto.purpose, 'credit_package');
    assert.equal(dto.package?.isGranted, false);
    assert.equal(dto.flags.requiresAttention, true);
    assert.match(dto.flags.attentionReason || '', /aguardando liberação/i);
  });

  it('mantém integridade de mapeamento para consulta veicular padrão', () => {
    const mockRow = {
      transaction_id: 'tx-cons-001',
      payment_created_at: '2026-09-21T18:00:00Z',
      transaction_amount: 49.9,
      payment_status: 'approved',
      purpose: 'vehicle_consultation',
      consultation_id: 'cons-001',
      plate: 'KZE-1234',
      plate_normalized: 'KZE1234',
      consultation_status: 'completed',
      has_report_data: true,
      delivery_status: 'delivered',
    };

    const dto = mapRowToDTO(mockRow);

    assert.equal(dto.purpose, 'vehicle_consultation');
    assert.equal(dto.plate, 'KZE-1234');
    assert.equal(dto.package, null);
    assert.equal(dto.consultationId, 'cons-001');
    assert.equal(dto.consultationStatus, 'completed');
    assert.equal(dto.hasReportData, true);
  });

  it('adota package_id como contrato oficial e suporta customer_credit_package_id como fallback', () => {
    // 1. Contrato oficial primário: package_id presente
    const rowPrimary = {
      transaction_id: 'tx-pkg-prim',
      payment_status: 'approved',
      purpose: 'credit_package',
      package_order_id: 'ord-1',
      package_id: 'pkg-uuid-primary',
    };
    const dtoPrimary = mapRowToDTO(rowPrimary);
    assert.equal(dtoPrimary.package?.packageId, 'pkg-uuid-primary');

    // 2. Fallback temporário: apenas customer_credit_package_id presente
    const rowFallback = {
      transaction_id: 'tx-pkg-fall',
      payment_status: 'approved',
      purpose: 'credit_package',
      package_order_id: 'ord-2',
      customer_credit_package_id: 'pkg-uuid-fallback',
    };
    const dtoFallback = mapRowToDTO(rowFallback);
    assert.equal(dtoFallback.package?.packageId, 'pkg-uuid-fallback');

    // 3. Precedência: se ambos estiverem presentes, package_id vence
    const rowBoth = {
      transaction_id: 'tx-pkg-both',
      payment_status: 'approved',
      purpose: 'credit_package',
      package_order_id: 'ord-3',
      package_id: 'pkg-uuid-primary',
      customer_credit_package_id: 'pkg-uuid-fallback',
    };
    const dtoBoth = mapRowToDTO(rowBoth);
    assert.equal(dtoBoth.package?.packageId, 'pkg-uuid-primary');
  });
});
