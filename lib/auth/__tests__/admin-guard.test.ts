import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminUser } from '../admin-guard.ts';

test('Admin Guard Security Verification', async (t) => {
  await t.test('should return null if user has no admin profile (e.g., customer account)', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as any;

    const result = await validateAdminUser(mockSupabase, 'cust-user-123');
    assert.equal(result, null);
  });

  await t.test('should return null if profile exists but role is user/customer', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as any;

    const result = await validateAdminUser(mockSupabase, 'normal-user-123');
    assert.equal(result, null);
  });

  await t.test('should return admin profile if user is active admin or super_admin', async () => {
    const mockAdmin = {
      id: 'admin-id-1',
      auth_user_id: 'auth-admin-123',
      name: 'Admin AF Motos',
      email: 'admin@afmotos.com.br',
      role: 'admin',
      is_active: true,
    };

    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                maybeSingle: async () => ({ data: mockAdmin, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as any;

    const result = await validateAdminUser(mockSupabase, 'auth-admin-123');
    assert.ok(result);
    assert.equal(result?.role, 'admin');
    assert.equal(result?.email, 'admin@afmotos.com.br');
  });
});
