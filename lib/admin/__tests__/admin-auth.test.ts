import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAdminProfileAccess } from '../admin-auth.ts';

test('checkAdminProfileAccess - Validação de Perfil Administrativo', async (t) => {
  await t.test('deve negar acesso quando authUserId for nulo ou indefinido', async () => {
    const mockSupabase = {} as any;
    const result = await checkAdminProfileAccess(mockSupabase, null);
    assert.equal(result.isAuthorized, false);
  });

  await t.test(
    'deve negar acesso quando usuário não possui cadastro em admin_profiles',
    async () => {
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

      const result = await checkAdminProfileAccess(mockSupabase, 'regular-customer-uuid');
      assert.equal(result.isAuthorized, false);
      assert.equal(result.profile, undefined);
    },
  );

  await t.test('deve conceder acesso quando perfil é admin ativo', async () => {
    const mockProfile = {
      id: 'admin-1',
      auth_user_id: 'user-admin-uuid',
      role: 'admin',
      name: 'Gerente AF Motos',
      is_active: true,
    };

    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                maybeSingle: async () => ({ data: mockProfile, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as any;

    const result = await checkAdminProfileAccess(mockSupabase, 'user-admin-uuid');
    assert.equal(result.isAuthorized, true);
    assert.equal(result.profile?.role, 'admin');
    assert.equal(result.profile?.name, 'Gerente AF Motos');
  });

  await t.test('deve conceder acesso quando perfil é super_admin ativo', async () => {
    const mockProfile = {
      id: 'super-admin-1',
      auth_user_id: 'user-super-uuid',
      role: 'super_admin',
      name: 'Diretor AF Motos',
      is_active: true,
    };

    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                maybeSingle: async () => ({ data: mockProfile, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as any;

    const result = await checkAdminProfileAccess(mockSupabase, 'user-super-uuid');
    assert.equal(result.isAuthorized, true);
    assert.equal(result.profile?.role, 'super_admin');
  });
});
