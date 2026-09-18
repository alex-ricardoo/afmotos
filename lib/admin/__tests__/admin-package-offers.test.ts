/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkAdminProfileAccess } from '../admin-auth.ts';

describe('User Story 5: Admin Package Offers Access Control (T026)', () => {
  const adminAuthUserId = '11111111-1111-4111-8111-111111111111';
  const customerUserId = '22222222-2222-4222-8222-222222222222';

  it('1. Authorizes active admin with admin_profiles.auth_user_id = auth.uid()', async () => {
    const mockProfile = {
      id: 'profile-admin-1',
      auth_user_id: adminAuthUserId,
      role: 'admin',
      name: 'Admin Teste',
      is_active: true,
    };

    const mockSupabase = {
      from: (table: string) => {
        assert.equal(table, 'admin_profiles');
        return {
          select: () => ({
            eq: (_col1: string, val1: string) => {
              assert.equal(val1, adminAuthUserId);
              return {
                eq: (_col2: string, val2: boolean) => {
                  assert.equal(val2, true);
                  return {
                    in: (_col3: string, roles: string[]) => {
                      assert.deepEqual(roles, ['admin', 'super_admin']);
                      return {
                        maybeSingle: async () => ({ data: mockProfile, error: null }),
                      };
                    },
                  };
                },
              };
            },
          }),
        };
      },
    };

    const result = await checkAdminProfileAccess(mockSupabase as any, adminAuthUserId);
    assert.equal(result.isAuthorized, true);
    assert.equal(result.profile?.role, 'admin');
  });

  it('2. Denies non-admin customer trying to manage package offers', async () => {
    const mockSupabase = {
      from: (table: string) => {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        };
      },
    };

    const result = await checkAdminProfileAccess(mockSupabase as any, customerUserId);
    assert.equal(result.isAuthorized, false);
    assert.equal(result.profile, undefined);
  });

  it('3. Denies inactive admin (is_active = false)', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                // Retorna null porque a query exige is_active = true
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
    };

    const result = await checkAdminProfileAccess(mockSupabase as any, adminAuthUserId);
    assert.equal(result.isAuthorized, false);
  });
});
