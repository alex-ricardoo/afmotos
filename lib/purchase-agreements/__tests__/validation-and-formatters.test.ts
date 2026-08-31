import { describe, it } from 'node:test';
import assert from 'node:assert';
import { purchaseAgreementGenerateSchema } from '../schema';
import {
  formatCurrencyBRL,
  formatCpfOrCnpj,
  formatPhoneNumber,
  formatAgreementNumber,
} from '../formatters';

describe('Purchase Agreement Formatter & Schema Validation', () => {
  describe('formatters', () => {
    it('formats currency correctly in BRL', () => {
      assert.ok(formatCurrencyBRL(21500.5).includes('21.500,50'));
      assert.ok(formatCurrencyBRL(0).includes('0,00'));
      assert.strictEqual(formatCurrencyBRL(null), 'R$ 0,00');
    });

    it('formats CPF and CNPJ properly', () => {
      assert.strictEqual(formatCpfOrCnpj('12345678909'), '123.456.789-09');
      assert.strictEqual(formatCpfOrCnpj('12345678000199'), '12.345.678/0001-99');
      assert.strictEqual(formatCpfOrCnpj(''), 'Não informado');
    });

    it('formats phone numbers correctly', () => {
      assert.strictEqual(formatPhoneNumber('81999887766'), '(81) 99988-7766');
      assert.strictEqual(formatPhoneNumber('8133221100'), '(81) 3322-1100');
      assert.strictEqual(formatPhoneNumber(null), 'Não informado');
    });

    it('generates a valid formatted agreement number', () => {
      const num = formatAgreementNumber(new Date(2026, 7, 31), 'TEST');
      assert.strictEqual(num, 'AFM-COMPRA-20260831-TEST');
    });
  });

  describe('purchaseAgreementGenerateSchema', () => {
    it('validates a complete valid payload', () => {
      const validPayload = {
        seller_name: 'Carlos da Silva',
        seller_document: '123.456.789-09',
        seller_phone: '(81) 99999-8888',
        seller_address: 'Rua Principal, 100, Carpina/PE',
        brand: 'Honda',
        model: 'CG 160 Titan',
        year_manufacture: 2024,
        year_model: 2024,
        license_plate: 'BRA2E19',
        mileage: 5000,
        purchase_amount: 18000,
        paid_amount: 18000,
        payment_status: 'PAID_FULL' as const,
        payment_method: 'PIX' as const,
        payment_date: '2026-08-31',
        delivery_datetime: '2026-08-31T10:00:00Z',
        delivery_km: 5000,
        keys_count: 2,
        transfer_deadline_date: '2026-09-30',
        confirmed_data_accurate: true,
        confirmed_payment_realized: true,
        confirmed_vehicle_received: true,
      };

      const result = purchaseAgreementGenerateSchema.safeParse(validPayload);
      assert.strictEqual(result.success, true);
    });

    it('fails when mandatory confirmation checkbox is missing', () => {
      const invalidPayload = {
        seller_name: 'Carlos da Silva',
        seller_document: '123.456.789-09',
        seller_phone: '(81) 99999-8888',
        seller_address: 'Rua Principal, 100, Carpina/PE',
        brand: 'Honda',
        model: 'CG 160 Titan',
        year_manufacture: 2024,
        year_model: 2024,
        license_plate: 'BRA2E19',
        mileage: 5000,
        purchase_amount: 18000,
        paid_amount: 18000,
        payment_status: 'PAID_FULL' as const,
        payment_method: 'PIX' as const,
        payment_date: '2026-08-31',
        delivery_datetime: '2026-08-31T10:00:00Z',
        delivery_km: 5000,
        keys_count: 2,
        transfer_deadline_date: '2026-09-30',
        confirmed_data_accurate: true,
        confirmed_payment_realized: false, // Invalido!
        confirmed_vehicle_received: true,
      };

      const result = purchaseAgreementGenerateSchema.safeParse(invalidPayload);
      assert.strictEqual(result.success, false);
    });

    it('fails when purchase_amount is zero or negative', () => {
      const invalidPayload = {
        seller_name: 'Carlos da Silva',
        seller_document: '123.456.789-09',
        seller_phone: '(81) 99999-8888',
        seller_address: 'Rua Principal, 100, Carpina/PE',
        brand: 'Honda',
        model: 'CG 160 Titan',
        year_manufacture: 2024,
        year_model: 2024,
        license_plate: 'BRA2E19',
        mileage: 5000,
        purchase_amount: 0,
        paid_amount: 0,
        payment_status: 'PAID_FULL' as const,
        payment_method: 'PIX' as const,
        payment_date: '2026-08-31',
        delivery_datetime: '2026-08-31T10:00:00Z',
        delivery_km: 5000,
        keys_count: 2,
        transfer_deadline_date: '2026-09-30',
        confirmed_data_accurate: true,
        confirmed_payment_realized: true,
        confirmed_vehicle_received: true,
      };

      const result = purchaseAgreementGenerateSchema.safeParse(invalidPayload);
      assert.strictEqual(result.success, false);
    });
  });
});
