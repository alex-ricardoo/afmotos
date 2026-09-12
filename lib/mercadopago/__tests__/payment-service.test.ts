import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPaymentPreferenceSchema,
  brickPaymentSubmitSchema,
  webhookPayloadSchema,
  adminRefundRetrySchema,
  adminReconcileSchema,
  normalizeCpf,
  identificationSchema,
  cardPaymentFormDataSchema,
  pixPaymentFormDataSchema,
  ticketPaymentFormDataSchema,
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

  describe('CPF Normalization & Identification Enforcement', () => {
    it('normalizeCpf extracts only numeric digits', () => {
      assert.equal(normalizeCpf('123.456.789-09'), '12345678909');
      assert.equal(normalizeCpf(' 123 456 789 09 '), '12345678909');
      assert.equal(normalizeCpf(null), '');
      assert.equal(normalizeCpf(undefined), '');
      assert.equal(normalizeCpf(''), '');
    });

    it('identificationSchema enforces type CPF and normalizes number', () => {
      const input = {
        type: '', // Empty type from client
        number: '123.456.789-09',
      };
      const res = identificationSchema.safeParse(input);
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.type, 'CPF');
        assert.equal(res.data.number, '12345678909');
      }
    });

    it('identificationSchema defaults type to CPF when omitted', () => {
      const input = {
        number: '12345678909',
      };
      const res = identificationSchema.safeParse(input);
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.type, 'CPF');
        assert.equal(res.data.number, '12345678909');
      }
    });

    it('identificationSchema rejects CPF with invalid length', () => {
      const short = { number: '123456789' };
      const resShort = identificationSchema.safeParse(short);
      assert.equal(resShort.success, false);

      const long = { number: '12345678901234' };
      const resLong = identificationSchema.safeParse(long);
      assert.equal(resLong.success, false);
    });
  });

  describe('Discriminated Payment Schemas', () => {
    it('cardPaymentFormDataSchema requires token, email, and 11-digit CPF', () => {
      const validCard = {
        payment_method_id: 'master',
        token: 'card_token_abc_123',
        installments: 1,
        issuer_id: '24',
        payer: {
          email: 'cartao@teste.com',
          identification: {
            number: '12345678909',
          },
        },
      };

      const res = cardPaymentFormDataSchema.safeParse(validCard);
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.payer.identification.type, 'CPF');
        assert.equal(res.data.payer.identification.number, '12345678909');
        assert.equal(res.data.token, 'card_token_abc_123');
        assert.equal(res.data.issuer_id, '24');
      }
    });

    it('cardPaymentFormDataSchema rejects when token is missing', () => {
      const invalidCard = {
        payment_method_id: 'master',
        payer: {
          email: 'cartao@teste.com',
          identification: {
            number: '12345678909',
          },
        },
      };

      const res = cardPaymentFormDataSchema.safeParse(invalidCard);
      assert.equal(res.success, false);
    });

    it('pixPaymentFormDataSchema allows submission without card token', () => {
      const validPix = {
        payment_method_id: 'pix',
        payer: {
          email: 'pix@teste.com',
        },
      };

      const res = pixPaymentFormDataSchema.safeParse(validPix);
      assert.equal(res.success, true);
    });

    it('ticketPaymentFormDataSchema requires complete address', () => {
      const invalidTicket = {
        payment_method_id: 'bolbradesco',
        payer: {
          email: 'boleto@teste.com',
          identification: {
            number: '12345678909',
          },
        },
      };

      const res = ticketPaymentFormDataSchema.safeParse(invalidTicket);
      assert.equal(res.success, false);
    });
  });
});
