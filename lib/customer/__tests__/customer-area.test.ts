import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerCustomerSchema,
  loginCustomerSchema,
  profileUpdateSchema,
  plateConsultationSchema,
  paymentConfirmationSchema,
} from '../schemas.ts';

describe('Customer Area Validation Schemas', () => {
  describe('registerCustomerSchema', () => {
    it('accepts valid customer registration data', () => {
      const valid = {
        full_name: 'Alex Ricardo',
        email: 'alex@example.com',
        phone: '(11) 98765-4321',
        date_of_birth: '1995-05-15',
        password: 'password123',
      };
      const res = registerCustomerSchema.safeParse(valid);
      assert.equal(res.success, true);
    });

    it('rejects short full name', () => {
      const invalid = {
        full_name: 'A',
        email: 'alex@example.com',
        phone: '(11) 98765-4321',
        date_of_birth: '1995-05-15',
        password: 'password123',
      };
      const res = registerCustomerSchema.safeParse(invalid);
      assert.equal(res.success, false);
      assert.match(res.error?.issues[0]?.message || '', /pelo menos 2 caracteres/);
    });

    it('rejects invalid email', () => {
      const invalid = {
        full_name: 'Alex Ricardo',
        email: 'invalid-email',
        phone: '(11) 98765-4321',
        date_of_birth: '1995-05-15',
        password: 'password123',
      };
      const res = registerCustomerSchema.safeParse(invalid);
      assert.equal(res.success, false);
      assert.match(res.error?.issues[0]?.message || '', /E-mail inválido/);
    });

    it('rejects short password (< 8 chars)', () => {
      const invalid = {
        full_name: 'Alex Ricardo',
        email: 'alex@example.com',
        phone: '(11) 98765-4321',
        date_of_birth: '1995-05-15',
        password: '12345',
      };
      const res = registerCustomerSchema.safeParse(invalid);
      assert.equal(res.success, false);
      assert.match(res.error?.issues[0]?.message || '', /pelo menos 8 caracteres/);
    });

    it('rejects user under 14 years old', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() - 10);
      const invalid = {
        full_name: 'Alex Ricardo',
        email: 'alex@example.com',
        phone: '(11) 98765-4321',
        date_of_birth: futureDate.toISOString().split('T')[0],
        password: 'password123',
      };
      const res = registerCustomerSchema.safeParse(invalid);
      assert.equal(res.success, false);
      assert.match(res.error?.issues[0]?.message || '', /pelo menos 14 anos/);
    });
  });

  describe('loginCustomerSchema', () => {
    it('accepts valid credentials', () => {
      const res = loginCustomerSchema.safeParse({
        email: 'user@example.com',
        password: 'secretPassword',
      });
      assert.equal(res.success, true);
    });

    it('rejects empty password', () => {
      const res = loginCustomerSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      assert.equal(res.success, false);
    });
  });

  describe('profileUpdateSchema', () => {
    it('accepts complete valid profile update', () => {
      const res = profileUpdateSchema.safeParse({
        full_name: 'Alex Silva',
        phone: '(11) 99999-8888',
        date_of_birth: '1990-01-01',
        address_street: 'Rua das Flores',
        address_number: '123',
        address_complement: 'Apto 1',
        address_neighborhood: 'Centro',
        address_city: 'São Paulo',
        address_state: 'SP',
        address_zip: '01001-000',
      });
      assert.equal(res.success, true);
    });

    it('rejects invalid state length', () => {
      const res = profileUpdateSchema.safeParse({
        full_name: 'Alex Silva',
        address_state: 'SPO',
      });
      assert.equal(res.success, false);
    });
  });

  describe('plateConsultationSchema', () => {
    it('accepts valid Mercosul plate', () => {
      const res = plateConsultationSchema.safeParse({ plate: 'BRA2E19' });
      assert.equal(res.success, true);
    });

    it('accepts valid Legacy plate', () => {
      const res = plateConsultationSchema.safeParse({ plate: 'ABC-1234' });
      assert.equal(res.success, true);
    });

    it('rejects invalid plate characters', () => {
      const res = plateConsultationSchema.safeParse({ plate: 'INVALIDO' });
      assert.equal(res.success, false);
    });
  });

  describe('paymentConfirmationSchema', () => {
    it('accepts valid payment methods', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      assert.equal(
        paymentConfirmationSchema.safeParse({ consultationId: uuid, paymentMethod: 'pix' }).success,
        true
      );
      assert.equal(
        paymentConfirmationSchema.safeParse({ consultationId: uuid, paymentMethod: 'credit_card' }).success,
        true
      );
      assert.equal(
        paymentConfirmationSchema.safeParse({ consultationId: uuid, paymentMethod: 'boleto' }).success,
        true
      );
    });

    it('rejects invalid payment method', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const res = paymentConfirmationSchema.safeParse({
        consultationId: uuid,
        paymentMethod: 'crypto',
      });
      assert.equal(res.success, false);
    });
  });
});
