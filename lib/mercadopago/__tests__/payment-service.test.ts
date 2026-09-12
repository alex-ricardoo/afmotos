import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPaymentPreferenceSchema,
  brickPaymentSubmitSchema,
  webhookPayloadSchema,
  adminRefundRetrySchema,
  adminReconcileSchema,
} from '../schemas.ts';

describe('Mercado Pago Validation Schemas & Business Rules', () => {
  describe('createPaymentPreferenceSchema', () => {
    it('accepts valid UUID consultation ID', () => {
      const valid = { consultationId: '123e4567-e89b-12d3-a456-426614174000' };
      const res = createPaymentPreferenceSchema.safeParse(valid);
      assert.equal(res.success, true);
    });

    it('rejects invalid non-UUID consultation ID', () => {
      const invalid = { consultationId: 'not-a-uuid' };
      const res = createPaymentPreferenceSchema.safeParse(invalid);
      assert.equal(res.success, false);
    });
  });

  describe('brickPaymentSubmitSchema', () => {
    it('accepts valid credit card submission with token and payer', () => {
      const valid = {
        consultationId: '123e4567-e89b-12d3-a456-426614174000',
        formData: {
          payment_method_id: 'master',
          token: 'test_card_token_12345',
          installments: 1,
          payer: {
            email: 'cliente@teste.com',
            identification: {
              type: 'CPF',
              number: '12345678909',
            },
          },
        },
      };

      const res = brickPaymentSubmitSchema.safeParse(valid);
      assert.equal(res.success, true);
    });

    it('accepts valid Pix submission without token', () => {
      const valid = {
        consultationId: '123e4567-e89b-12d3-a456-426614174000',
        formData: {
          payment_method_id: 'pix',
          payer: {
            email: 'pix@teste.com',
          },
        },
      };

      const res = brickPaymentSubmitSchema.safeParse(valid);
      assert.equal(res.success, true);
    });

    it('rejects submission with invalid email', () => {
      const invalid = {
        consultationId: '123e4567-e89b-12d3-a456-426614174000',
        formData: {
          payment_method_id: 'pix',
          payer: {
            email: 'not-an-email',
          },
        },
      };

      const res = brickPaymentSubmitSchema.safeParse(invalid);
      assert.equal(res.success, false);
    });

    it('accepts valid Boleto submission with complete address', () => {
      const valid = {
        consultationId: '123e4567-e89b-12d3-a456-426614174000',
        formData: {
          payment_method_id: 'bolbradesco',
          payer: {
            email: 'boleto@teste.com',
            first_name: 'João',
            last_name: 'Silva',
            identification: {
              type: 'CPF',
              number: '12345678909',
            },
            address: {
              zip_code: '50010-000',
              street_name: 'Rua da Aurora',
              street_number: '123',
              neighborhood: 'Boa Vista',
              city: 'Recife',
              federal_unit: 'pe',
            },
          },
        },
      };

      const res = brickPaymentSubmitSchema.safeParse(valid);
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.formData.payer.address?.zip_code, '50010000');
        assert.equal(res.data.formData.payer.address?.federal_unit, 'PE');
      }
    });

    it('rejects Boleto address with invalid CEP length', () => {
      const invalid = {
        consultationId: '123e4567-e89b-12d3-a456-426614174000',
        formData: {
          payment_method_id: 'bolbradesco',
          payer: {
            email: 'boleto@teste.com',
            address: {
              zip_code: '123',
              street_name: 'Rua',
              street_number: '1',
              neighborhood: 'Centro',
              city: 'Recife',
              federal_unit: 'PE',
            },
          },
        },
      };

      const res = brickPaymentSubmitSchema.safeParse(invalid);
      assert.equal(res.success, false);
    });
  });

  describe('webhookPayloadSchema', () => {
    it('parses Mercado Pago payment webhook notification format', () => {
      const payload = {
        action: 'payment.updated',
        api_version: 'v1',
        data: {
          id: 1234567890,
        },
        date_created: '2026-09-12T12:00:00Z',
        id: 1054321,
        live_mode: false,
        type: 'payment',
        user_id: '1234567',
      };

      const res = webhookPayloadSchema.safeParse(payload);
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.data?.id, '1234567890');
      }
    });
  });

  describe('admin schemas', () => {
    it('validates refund retry parameters', () => {
      const valid = {
        transactionId: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'Falha manual de reconciliação',
      };
      const res = adminRefundRetrySchema.safeParse(valid);
      assert.equal(res.success, true);
    });

    it('validates reconcile parameters', () => {
      const valid = { mpPaymentId: '987654321' };
      const res = adminReconcileSchema.safeParse(valid);
      assert.equal(res.success, true);
    });
  });
});
