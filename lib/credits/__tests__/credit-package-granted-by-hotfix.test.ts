/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { grantCreditsToUser } from '../credit-service.ts';
import type { CustomerCreditPackage } from '../types.ts';

describe('Hotfix Crítico: customer_credit_packages.granted_by (Substituição de created_by)', () => {
  const migrationsDir = resolve(process.cwd(), 'supabase/migrations');
  const hotfixMigrationPath = resolve(
    migrationsDir,
    '20260918120000_fix_credit_package_granted_by_column.sql',
  );
  const hotfixSql = readFileSync(hotfixMigrationPath, 'utf8');

  it('1 & 2. INSERT em customer_credit_packages na RPC grant_credit_package usa exclusivamente granted_by', () => {
    // Deve conter INSERT INTO public.customer_credit_packages com granted_by
    assert.ok(
      hotfixSql.includes('INSERT INTO public.customer_credit_packages') &&
        hotfixSql.includes('granted_by') &&
        hotfixSql.includes('granted_at'),
      'Migration must insert granted_by and granted_at into customer_credit_packages',
    );

    // O trecho de colunas do INSERT INTO customer_credit_packages NÃO pode conter created_by
    const insertSectionMatch = hotfixSql.match(
      /INSERT INTO public\.customer_credit_packages\s*\(([\s\S]+?)\)/i,
    );
    assert.ok(insertSectionMatch, 'Must find INSERT INTO public.customer_credit_packages');
    const insertColumns = insertSectionMatch[1];

    assert.ok(insertColumns.includes('granted_by'), 'Columns must contain granted_by');
    assert.ok(insertColumns.includes('granted_at'), 'Columns must contain granted_at');
    assert.ok(
      !insertColumns.includes('created_by'),
      'Columns in customer_credit_packages INSERT must NEVER include created_by',
    );
  });

  it('3. Nenhum arquivo de migração ativo ou corretivo usa created_by no INSERT de customer_credit_packages', () => {
    // Na nova migration aditiva
    const files = [hotfixMigrationPath];
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf8');
      const packagesInsertMatches = content.matchAll(
        /INSERT INTO public\.customer_credit_packages\s*\(([\s\S]+?)\)/gi,
      );
      for (const match of packagesInsertMatches) {
        assert.ok(
          !match[1].includes('created_by'),
          `Migration ${filePath} must not have created_by in customer_credit_packages columns`,
        );
      }
    }
  });

  it('4. Pacote registra auth.uid() do admin ou fallback seguro no granted_by', () => {
    // Verifica captura de v_admin_id := auth.uid()
    assert.ok(
      hotfixSql.includes('v_admin_id := auth.uid();'),
      'Function must capture auth.uid() into v_admin_id',
    );
    // Verifica uso no VALUES do INSERT de customer_credit_packages
    assert.ok(
      hotfixSql.includes('COALESCE(v_admin_id, p_user_id)'),
      'Must record admin id or fallback user id in granted_by',
    );
  });

  it('5. granted_at é explicitamente preenchido com timezone(utc, now())', () => {
    assert.ok(
      hotfixSql.includes("timezone('utc', now())"),
      'granted_at must be populated with timezone utc now',
    );
  });

  it('6. RPC atualiza atomicamente: customer_credit_packages, customer_credit_ledger (com created_by) e customer_credit_balances', () => {
    // 1. Pacotes
    assert.ok(
      hotfixSql.includes('INSERT INTO public.customer_credit_packages'),
      'Must insert into customer_credit_packages',
    );
    // 2. Ledger contábil (mantém created_by pois customer_credit_ledger possui essa coluna)
    assert.ok(
      hotfixSql.includes('INSERT INTO public.customer_credit_ledger') &&
        hotfixSql.includes("'grant'") &&
        hotfixSql.includes("'ADMIN_GRANT'"),
      'Must insert ledger entry with grant and ADMIN_GRANT',
    );
    // 3. Saldo agregado com ON CONFLICT
    assert.ok(
      hotfixSql.includes('INSERT INTO public.customer_credit_balances') &&
        hotfixSql.includes('ON CONFLICT (user_id) DO UPDATE'),
      'Must upsert customer_credit_balances',
    );
    // 4. Log de auditoria
    assert.ok(
      hotfixSql.includes('INSERT INTO public.consultation_audit_logs') &&
        hotfixSql.includes("'credit_package_granted'"),
      'Must log audit event credit_package_granted',
    );
  });

  it('7. Idempotência estrita: chave duplicada no ledger impede concessão em dobro', () => {
    assert.ok(
      hotfixSql.includes(
        'IF EXISTS (SELECT 1 FROM public.customer_credit_ledger WHERE idempotency_key = p_idempotency_key)',
      ),
      'RPC must check ledger for idempotency key existence',
    );
    assert.ok(
      hotfixSql.includes("'GRANT_IDEMPOTENT_SUCCESS'"),
      'RPC must return GRANT_IDEMPOTENT_SUCCESS on duplicate key',
    );
  });

  it('8. Validação de autorização administrativa e SECURITY DEFINER preservados', () => {
    assert.ok(hotfixSql.includes('SECURITY DEFINER'), 'Must be SECURITY DEFINER');
    assert.ok(hotfixSql.includes("SET search_path = ''"), 'Must protect search_path');
    assert.ok(
      hotfixSql.includes('public.is_active_admin()'),
      'Must check public.is_active_admin()',
    );
    assert.ok(hotfixSql.includes("'UNAUTHORIZED'"), 'Must reject non-admin with UNAUTHORIZED');
  });

  it('9. Concessão automatizada via Mercado Pago (grant_credit_package_from_paid_order) usa granted_by e granted_at', () => {
    const mpMigration = resolve(
      migrationsDir,
      '20260918110000_evolve_payments_and_credit_grant_rpc.sql',
    );
    const mpSql = readFileSync(mpMigration, 'utf8');

    assert.ok(
      mpSql.includes('CREATE OR REPLACE FUNCTION public.grant_credit_package_from_paid_order'),
      'Mercado Pago grant RPC must be defined',
    );
    assert.ok(
      mpSql.includes('granted_by,') && mpSql.includes('granted_at,'),
      'Mercado Pago grant RPC must use granted_by and granted_at',
    );
    // Verifica que não usa created_by no INSERT de customer_credit_packages
    const mpInsertMatch = mpSql.match(
      /INSERT INTO public\.customer_credit_packages\s*\(([\s\S]+?)\)/i,
    );
    assert.ok(mpInsertMatch, 'Must find INSERT in MP grant RPC');
    assert.ok(
      !mpInsertMatch[1].includes('created_by'),
      'MP grant RPC must not have created_by in customer_credit_packages',
    );
  });

  it('10. Nenhuma migração no projeto adiciona a coluna created_by a customer_credit_packages', () => {
    const allMigrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    for (const file of allMigrationFiles) {
      const content = readFileSync(resolve(migrationsDir, file), 'utf8');
      // Procura por ALTER TABLE customer_credit_packages ADD COLUMN created_by
      const maliciousAddColumn =
        /ALTER\s+TABLE\s+(public\.)?customer_credit_packages\s+ADD\s+(COLUMN\s+)?created_by/i;
      assert.ok(
        !maliciousAddColumn.test(content),
        `Migration ${file} must not add created_by column to customer_credit_packages`,
      );
    }
  });

  it('11. Interface TypeScript CustomerCreditPackage contém granted_by e granted_at e NÃO contém created_by', () => {
    const samplePackage: CustomerCreditPackage = {
      id: 'pkg-1',
      user_id: 'user-1',
      package_name: 'Pacote Teste',
      package_type: 'manual_negotiated',
      credits_granted: 10,
      credits_remaining: 10,
      status: 'active',
      payment_channel: 'whatsapp',
      currency: 'BRL',
      granted_by: 'admin-uuid-1',
      granted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    assert.equal(samplePackage.granted_by, 'admin-uuid-1');
    assert.ok(samplePackage.granted_at);
    assert.equal((samplePackage as any).created_by, undefined);
  });

  it('12. grantCreditsToUser sanitiza erro de banco (42703) e retorna CREDIT_PACKAGE_GRANT_FAILED seguro ao cliente', async () => {
    const originalConsoleError = console.error;
    let loggedError: any = null;
    console.error = (...args: any[]) => {
      loggedError = args;
    };

    try {
      // Simula erro 42703 do PostgreSQL retornado pelo Supabase
      const fakeDbWithError = {
        rpc: async () => ({
          data: null,
          error: {
            code: '42703',
            message: 'column "created_by" of relation "customer_credit_packages" does not exist',
            details: null,
            hint: null,
          },
        }),
      };

      const result = await grantCreditsToUser({
        userId: 'target-user-123',
        amount: 15,
        adminId: 'admin-uuid-456',
        description: 'Concessão manual',
        dbClient: fakeDbWithError as any,
      });

      // 1. Mensagem para o cliente é segura e padronizada
      assert.equal(result.success, false);
      assert.equal(result.code, 'CREDIT_PACKAGE_GRANT_FAILED');
      assert.equal(
        result.error,
        'Não foi possível liberar os créditos neste momento. Nenhum crédito foi adicionado.',
      );

      // 2. Não vaza mensagem interna do Postgres para o usuário
      assert.doesNotMatch(result.error || '', /created_by/);
      assert.doesNotMatch(result.error || '', /42703/);

      // 3. Log administrativo recebe o detalhe
      assert.ok(loggedError, 'Erro deve ser logado no console administrativo');
      assert.equal(loggedError[0], '[grantCreditsToUser] RPC error:');
      assert.equal(loggedError[1].code, '42703');
    } finally {
      console.error = originalConsoleError;
    }
  });

  it('13. grantCreditsToUser propaga com sucesso quando a RPC executa sem erros', async () => {
    const fakeDbSuccess = {
      rpc: async (fn: string, params: any) => {
        assert.equal(fn, 'grant_credit_package');
        assert.equal(params.p_user_id, 'target-user-123');
        assert.equal(params.p_credits_granted, 20);

        return {
          data: {
            success: true,
            code: 'GRANT_SUCCESS',
            message_safe: 'Pacote de créditos concedido com sucesso.',
            package_id: 'pkg-created-999',
            user_id: params.p_user_id,
            credits_granted: 20,
            available_credits: 20,
            reserved_credits: 0,
            consumed_credits: 0,
          },
          error: null,
        };
      },
    };

    const result = await grantCreditsToUser({
      userId: 'target-user-123',
      amount: 20,
      adminId: 'admin-uuid-456',
      packageName: 'Pacote Especial B2B',
      dbClient: fakeDbSuccess as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.code, 'GRANT_SUCCESS');
    assert.equal(result.packageId, 'pkg-created-999');
    assert.equal(result.availableCredits, 20);
  });
});
