import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAdminProfileAccess,
  requireActiveAdmin,
  AdminAuthorizationError,
  maskId,
} from '../admin-auth.ts';

test('checkAdminProfileAccess & requireActiveAdmin - Validação de Perfil Administrativo B2B', async (t) => {
  await t.test('deve negar acesso quando authUserId for nulo ou indefinido', async () => {
    const mockSupabase = {} as any;
    const result = await checkAdminProfileAccess(mockSupabase, null);
    assert.equal(result.isAuthorized, false);
  });

  await t.test('1. Admin com admin_profiles.auth_user_id = auth.uid() e is_active=true consegue conceder pacote', async () => {
    const adminAuthUserId = '11111111-1111-4111-8111-111111111111';
    const adminProfileTableId = '99999999-9999-4999-8999-999999999999';

    const mockProfile = {
      id: adminProfileTableId,
      auth_user_id: adminAuthUserId,
      role: 'admin',
      name: 'Alex Ricardo Admin',
      is_active: true,
    };

    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: { id: adminAuthUserId, email: 'alex.ricardo1999@hotmail.com' } },
          error: null,
        }),
      },
      from: (table: string) => {
        assert.equal(table, 'admin_profiles');
        return {
          select: () => ({
            eq: (col1: string, val1: string) => {
              assert.equal(col1, 'auth_user_id', 'Deve comparar exclusivamente auth_user_id com o id do usuário');
              assert.equal(val1, adminAuthUserId);
              return {
                eq: (col2: string, val2: boolean) => {
                  assert.equal(col2, 'is_active');
                  assert.equal(val2, true);
                  return {
                    in: (col3: string, roles: string[]) => {
                      assert.equal(col3, 'role');
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
    } as any;

    const admin = await requireActiveAdmin(mockSupabase);
    assert.equal(admin.userId, adminAuthUserId);
    assert.equal(admin.adminProfileId, adminProfileTableId);
    assert.equal(admin.role, 'admin');
  });

  await t.test('2. Admin com role super_admin consegue autorização com sucesso', async () => {
    const superAdminUserId = '22222222-2222-4222-8222-222222222222';
    const mockProfile = {
      id: 'profile-super-123',
      auth_user_id: superAdminUserId,
      role: 'super_admin',
      name: 'Diretor Geral',
      is_active: true,
    };

    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: { id: superAdminUserId, email: 'diretor@afmotos.com' } },
          error: null,
        }),
      },
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

    const admin = await requireActiveAdmin(mockSupabase);
    assert.equal(admin.role, 'super_admin');
    assert.equal(admin.userId, superAdminUserId);
  });

  await t.test('3. Perfil admin com is_active=false é bloqueado com erro FORBIDDEN', async () => {
    const inactiveUserId = '33333333-3333-4333-8333-333333333333';

    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: { id: inactiveUserId, email: 'inativo@afmotos.com' } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                // Retorna null pois is_active = false não satisfaz o filtro
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as any;

    await assert.rejects(
      async () => {
        await requireActiveAdmin(mockSupabase);
      },
      (err: any) => {
        assert.ok(err instanceof AdminAuthorizationError);
        assert.equal(err.code, 'FORBIDDEN');
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  await t.test('4. Usuário sem registro em admin_profiles é bloqueado com FORBIDDEN', async () => {
    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'regular-user-id', email: 'cliente@gmail.com' } },
          error: null,
        }),
      },
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

    await assert.rejects(
      async () => {
        await requireActiveAdmin(mockSupabase);
      },
      (err: any) => {
        assert.ok(err instanceof AdminAuthorizationError);
        assert.equal(err.code, 'FORBIDDEN');
        return true;
      }
    );
  });

  await t.test('5. Usuário com admin_profile de outro auth_user_id é bloqueado', async () => {
    const loggedInUserId = 'user-alice-1111';
    const foreignAdminUserId = 'user-bob-2222';

    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: { id: loggedInUserId, email: 'alice@afmotos.com' } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: (col: string, val: string) => {
            // A consulta pesquisa pelo usuário autenticado (alice)
            assert.equal(val, loggedInUserId);
            return {
              eq: () => ({
                in: () => ({
                  // Alice não possui perfil, somente Bob possuiria
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            };
          },
        }),
      }),
    } as any;

    await assert.rejects(
      async () => {
        await requireActiveAdmin(mockSupabase);
      },
      (err: any) => {
        assert.ok(err instanceof AdminAuthorizationError);
        assert.equal(err.code, 'FORBIDDEN');
        return true;
      }
    );
  });

  await t.test(
    '6. Teste que falharia com a comparação antiga: admin_profiles.id != auth.uid(), mas admin_profiles.auth_user_id == auth.uid() PERMITE acesso',
    async () => {
      // Cenário exato do usuário Alex Ricardo:
      // O auth_user_id do Supabase Auth é diferente da PK gerada na tabela admin_profiles.id!
      const authUid = '018f6f3a-9c71-7000-8000-000000000001';
      const tablePkId = '018f6f3a-9c71-7999-9999-999999999999';

      assert.notEqual(tablePkId, authUid, 'A PK da tabela admin_profiles.id é diferente do auth.uid()');

      const alexProfile = {
        id: tablePkId,
        auth_user_id: authUid, // Campo correto!
        role: 'admin',
        name: 'Alex Ricardo',
        is_active: true,
      };

      const mockSupabase = {
        auth: {
          getUser: async () => ({
            data: { user: { id: authUid, email: 'alex.ricardo1999@hotmail.com' } },
            error: null,
          }),
        },
        from: (table: string) => {
          assert.equal(table, 'admin_profiles');
          return {
            select: () => ({
              eq: (col: string, val: string) => {
                // Deve pesquisar por auth_user_id = authUid, NUNCA por id = authUid
                assert.equal(col, 'auth_user_id');
                assert.equal(val, authUid);
                return {
                  eq: () => ({
                    in: () => ({
                      maybeSingle: async () => ({ data: alexProfile, error: null }),
                    }),
                  }),
                };
              },
            }),
          };
        },
      } as any;

      const admin = await requireActiveAdmin(mockSupabase);
      assert.equal(admin.userId, authUid);
      assert.equal(admin.adminProfileId, tablePkId);
      assert.equal(admin.role, 'admin');
    }
  );

  await t.test('7. Cliente não autenticado é bloqueado com UNAUTHENTICATED (401)', async () => {
    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: { message: 'Session missing' },
        }),
      },
    } as any;

    await assert.rejects(
      async () => {
        await requireActiveAdmin(mockSupabase);
      },
      (err: any) => {
        assert.ok(err instanceof AdminAuthorizationError);
        assert.equal(err.code, 'UNAUTHENTICATED');
        assert.equal(err.statusCode, 401);
        return true;
      }
    );
  });

  await t.test('8. maskId mascara com segurança sem vazar IDs completos nem dados sensíveis', () => {
    assert.equal(maskId(null), 'anonymous');
    assert.equal(maskId('short'), '***');
    assert.equal(maskId('11112222-3333-4444-5555-666677778888'), '1111...8888');
  });
});

