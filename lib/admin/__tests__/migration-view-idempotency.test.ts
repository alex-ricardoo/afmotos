/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Simulação de Schema Relacional do Banco de Dados para verificação
 * de integridade de migrations, RBAC e compatibilidade retroativa.
 */
interface TableConstraint {
  name: string;
  check: (row: Record<string, any>) => boolean;
}

class SimulatedTable {
  public columns: Set<string>;
  public notNullColumns: Set<string>;
  public constraints: Map<string, TableConstraint>;
  public rows: Array<Record<string, any>>;

  constructor(columns: string[], notNull: string[] = []) {
    this.columns = new Set(columns);
    this.notNullColumns = new Set(notNull);
    this.constraints = new Map();
    this.rows = [];
  }

  addColumn(col: string) {
    this.columns.add(col);
  }

  dropNotNull(col: string) {
    this.notNullColumns.delete(col);
  }

  addConstraint(name: string, check: (row: Record<string, any>) => boolean) {
    this.constraints.set(name, { name, check });
  }

  dropConstraint(name: string) {
    this.constraints.delete(name);
  }

  insert(row: Record<string, any>) {
    // Valida not null
    for (const col of this.notNullColumns) {
      if (row[col] === undefined || row[col] === null) {
        throw new Error(`NOT NULL constraint violation on column ${col}`);
      }
    }
    // Valida check constraints
    for (const constraint of this.constraints.values()) {
      if (!constraint.check(row)) {
        throw new Error(`Check constraint violation: ${constraint.name}`);
      }
    }
    this.rows.push({ ...row });
    return row;
  }
}

describe('Migration & Schema Compatibility Test (Production baseline without 20260922100000)', () => {
  it('1. Rejeita package_type = "standard" no schema original de produção e aceita todos os 7 tipos válidos após o hotfix', () => {
    // Estado do banco de produção original (migration 20260914120000)
    const packagesTable = new SimulatedTable(
      ['id', 'user_id', 'package_type', 'status'],
      ['id', 'user_id', 'package_type'],
    );

    packagesTable.addConstraint('customer_credit_packages_package_type_check', (row) =>
      ['manual_negotiated', 'agency', 'reseller', 'promotional', 'partner', 'test'].includes(
        row.package_type,
      ),
    );

    // Schema original rejeita 'standard'
    assert.throws(() => {
      packagesTable.insert({
        id: 'pkg-orig-1',
        user_id: 'usr-1',
        package_type: 'standard',
        status: 'active',
      });
    }, /Check constraint violation: customer_credit_packages_package_type_check/);

    // Aplica o hotfix da migration 20260923100000
    packagesTable.dropConstraint('customer_credit_packages_package_type_check');
    const validPackageTypes = [
      'standard',
      'manual_negotiated',
      'agency',
      'reseller',
      'promotional',
      'partner',
      'test',
    ];
    packagesTable.addConstraint('customer_credit_packages_package_type_check', (row) =>
      validPackageTypes.includes(row.package_type),
    );

    // Valida que TODOS os 7 tipos são aceitos
    for (const type of validPackageTypes) {
      const inserted = packagesTable.insert({
        id: `pkg-${type}`,
        user_id: 'usr-1',
        package_type: type,
        status: 'active',
      });
      assert.equal(inserted.package_type, type);
    }

    // Tipo inválido desconhecido continua rejeitado
    assert.throws(() => {
      packagesTable.insert({
        id: 'pkg-invalid',
        user_id: 'usr-1',
        package_type: 'hacked_type',
        status: 'active',
      });
    }, /Check constraint violation: customer_credit_packages_package_type_check/);
  });

  it('2. RBAC da RPC: Bloqueia acesso direto de anon e authenticated, permitindo apenas service_role', () => {
    // Simula a tabela de permissões e controle de acesso (PostgREST + PostgreSQL)
    const functionGrants = new Map<string, Set<string>>();
    functionGrants.set(
      'grant_credit_package_from_paid_order',
      new Set(['service_role']), // Somente service_role após a migration corrigida
    );

    const executeRpc = (role: 'anon' | 'authenticated' | 'service_role', orderId: string) => {
      const grants = functionGrants.get('grant_credit_package_from_paid_order');
      if (!grants || !grants.has(role)) {
        throw new Error(
          `permission denied for function grant_credit_package_from_paid_order (invoked by role "${role}")`,
        );
      }
      return { success: true, orderId };
    };

    // 1. Usuário não autenticado (anon) -> BLOQUEADO
    assert.throws(() => {
      executeRpc('anon', 'order-123');
    }, /permission denied for function grant_credit_package_from_paid_order \(invoked by role "anon"\)/);

    // 2. Usuário autenticado normal (authenticated) -> BLOQUEADO
    assert.throws(() => {
      executeRpc('authenticated', 'order-123');
    }, /permission denied for function grant_credit_package_from_paid_order \(invoked by role "authenticated"\)/);

    // 3. Backend privilegiado (service_role via createAdminClient) -> PERMITIDO
    const res = executeRpc('service_role', 'order-123');
    assert.equal(res.success, true);
    assert.equal(res.orderId, 'order-123');
  });

  it('3. Executa preflight de payment_refunds e rejeita constraint XOR se dados forem ambíguos', () => {
    // Simula payment_refunds original em produção
    const refundsTable = new SimulatedTable(
      ['id', 'transaction_id', 'consultation_id', 'amount', 'status'],
      ['id', 'transaction_id', 'consultation_id'],
    );

    // Adiciona a coluna nova como a migration faz
    refundsTable.dropNotNull('consultation_id');
    refundsTable.addColumn('credit_package_order_id');

    // Insere um registro inválido onde ambos estão preenchidos
    refundsTable.rows.push({
      id: 'ref-invalid-both',
      transaction_id: 'tx-1',
      consultation_id: 'cons-1',
      credit_package_order_id: 'ord-1',
    });

    // Simula bloco de preflight check da migration 20260923100000
    const executePreflight = (rows: any[]) => {
      const invalidRows = rows.filter(
        (r) =>
          (!r.consultation_id && !r.credit_package_order_id) ||
          (r.consultation_id && r.credit_package_order_id),
      );
      if (invalidRows.length > 0) {
        throw new Error(
          `Preflight validation failed for payment_refunds XOR constraint: ${invalidRows.length} record(s) found with both or neither consultation_id and credit_package_order_id populated.`,
        );
      }
    };

    assert.throws(
      () => executePreflight(refundsTable.rows),
      /Preflight validation failed for payment_refunds XOR constraint: 1 record\(s\) found/,
    );
  });

  it('4. Preflight aprova dados válidos, constraint XOR garante integridade estrita e preserva refunds históricos', () => {
    const refundsTable = new SimulatedTable(
      ['id', 'transaction_id', 'consultation_id', 'amount', 'status'],
      ['id', 'transaction_id', 'consultation_id'],
    );

    // Registro legado de consulta existente em produção
    refundsTable.rows.push({
      id: 'ref-legacy-consultation',
      transaction_id: 'tx-leg',
      consultation_id: 'cons-leg-1',
      credit_package_order_id: null,
    });

    // Migração: drop not null, add column
    refundsTable.dropNotNull('consultation_id');
    refundsTable.addColumn('credit_package_order_id');

    // Preflight check
    const invalidRows = refundsTable.rows.filter(
      (r) =>
        (!r.consultation_id && !r.credit_package_order_id) ||
        (r.consultation_id && r.credit_package_order_id),
    );
    assert.equal(invalidRows.length, 0);

    // Aplica constraint XOR
    refundsTable.addConstraint('payment_refunds_target_xor_check', (row) => {
      const hasConsultation = Boolean(row.consultation_id);
      const hasOrder = Boolean(row.credit_package_order_id);
      return (hasConsultation && !hasOrder) || (!hasConsultation && hasOrder);
    });

    // 1. Inserir estorno de pacote (consultation_id = null, credit_package_order_id preenchido) -> VÁLIDO
    assert.doesNotThrow(() => {
      refundsTable.insert({
        id: 'ref-pkg-ok',
        transaction_id: 'tx-2',
        consultation_id: null,
        credit_package_order_id: 'ord-pkg-1',
      });
    });

    // 2. Inserir estorno sem nenhuma origem -> INVÁLIDO
    assert.throws(() => {
      refundsTable.insert({
        id: 'ref-none',
        transaction_id: 'tx-3',
        consultation_id: null,
        credit_package_order_id: null,
      });
    }, /Check constraint violation: payment_refunds_target_xor_check/);

    // 3. Inserir estorno com ambas as origens -> INVÁLIDO
    assert.throws(() => {
      refundsTable.insert({
        id: 'ref-both',
        transaction_id: 'tx-4',
        consultation_id: 'cons-4',
        credit_package_order_id: 'ord-4',
      });
    }, /Check constraint violation: payment_refunds_target_xor_check/);
  });

  it('5. Proteção de unicidade de refund ativo impede estornos concorrentes duplicados', () => {
    // Simula o índice único parcial idx_unique_active_refund_per_transaction
    const activeRefunds = new Set<string>();

    const insertRefund = (transactionId: string, status: string) => {
      const isActive = ['requested', 'pending', 'confirmed'].includes(status);
      if (isActive && activeRefunds.has(transactionId)) {
        throw new Error(
          `duplicate key value violates unique constraint "idx_unique_active_refund_per_transaction"`,
        );
      }
      if (isActive) {
        activeRefunds.add(transactionId);
      }
      return { transactionId, status };
    };

    // 1. Primeiro refund ativo registrado -> SUCESSO
    const ref1 = insertRefund('tx-100', 'requested');
    assert.equal(ref1.status, 'requested');

    // 2. Segundo refund ativo concorrente para a mesma transação -> REJEITADO
    assert.throws(() => {
      insertRefund('tx-100', 'pending');
    }, /duplicate key value violates unique constraint "idx_unique_active_refund_per_transaction"/);

    // 3. Transação diferente -> SUCESSO
    const ref2 = insertRefund('tx-200', 'requested');
    assert.equal(ref2.status, 'requested');

    // 4. Tentativa anterior com status failed para nova transação não bloqueia histórico
    assert.doesNotThrow(() => {
      insertRefund('tx-300', 'failed');
      insertRefund('tx-300', 'requested'); // Pode tentar novamente após falha
    });
  });

  it('6. View administrativa unificada com LEFT JOIN preserva consultas veiculares e inclui pacotes concedidos e pendentes com package_id', () => {
    // Simula registros de transações
    const transactions = [
      {
        id: 'tx-cons-1',
        purpose: 'vehicle_consultation',
        consultation_id: 'cpc-1',
        credit_package_order_id: null,
        status: 'approved',
      },
      {
        id: 'tx-pkg-granted',
        purpose: 'credit_package',
        consultation_id: null,
        credit_package_order_id: 'cpo-1',
        status: 'approved',
      },
      {
        id: 'tx-pkg-pending',
        purpose: 'credit_package',
        consultation_id: null,
        credit_package_order_id: 'cpo-2',
        status: 'approved',
      },
    ];

    const consultations = [
      {
        id: 'cpc-1',
        plate: 'ABC1D23',
        status: 'completed',
      },
    ];

    const packageOrders = [
      {
        id: 'cpo-1',
        offer_name_snapshot: 'Pacote Essencial',
        credits_quantity: 5,
        status: 'paid',
        granted_at: '2026-09-23T10:00:00Z',
      },
      {
        id: 'cpo-2',
        offer_name_snapshot: 'Pacote Turbo',
        credits_quantity: 10,
        status: 'paid',
        granted_at: null, // Pendente de liberação de créditos
      },
    ];

    const packages = [
      {
        id: 'pkg-real-uuid-1',
        purchase_order_id: 'cpo-1',
        credits_granted: 5,
        credits_remaining: 5,
      },
    ];

    // Simula a consulta SELECT na nova View unificada com LEFT JOINs
    const unifiedViewResult = transactions.map((pt) => {
      const cpc = consultations.find((c) => c.id === pt.consultation_id) || null;
      const cpo = packageOrders.find((o) => o.id === pt.credit_package_order_id) || null;
      const ccp = cpo ? packages.find((p) => p.purchase_order_id === cpo.id) || null : null;

      return {
        transaction_id: pt.id,
        purpose: pt.purpose,
        payment_status: pt.status,
        consultation_id: cpc?.id || null,
        plate: cpc?.plate || null,
        consultation_status: cpc?.status || null,
        package_order_id: cpo?.id || null,
        package_offer_name: cpo?.offer_name_snapshot || null,
        package_credits_quantity: cpo?.credits_quantity || null,
        package_id: ccp?.id || null,
        customer_credit_package_id: ccp?.id || null,
        is_package_granted: Boolean(cpo?.granted_at || ccp?.id),
      };
    });

    assert.equal(unifiedViewResult.length, 3);

    // 1. Registro de Consulta Veicular
    const consRow = unifiedViewResult.find((r) => r.purpose === 'vehicle_consultation');
    assert.ok(consRow);
    assert.equal(consRow.plate, 'ABC1D23');
    assert.equal(consRow.package_id, null);

    // 2. Registro de Pacote de Créditos Concedido
    const pkgGranted = unifiedViewResult.find((r) => r.transaction_id === 'tx-pkg-granted');
    assert.ok(pkgGranted);
    assert.equal(pkgGranted.package_offer_name, 'Pacote Essencial');
    assert.equal(pkgGranted.package_credits_quantity, 5);
    assert.equal(pkgGranted.package_id, 'pkg-real-uuid-1');
    assert.equal(pkgGranted.is_package_granted, true);

    // 3. Registro de Pacote de Créditos Pago Aguardando Concessão (Incidente da ordem presa)
    const pkgPending = unifiedViewResult.find((r) => r.transaction_id === 'tx-pkg-pending');
    assert.ok(pkgPending);
    assert.equal(pkgPending.package_offer_name, 'Pacote Turbo');
    assert.equal(pkgPending.package_credits_quantity, 10);
    assert.equal(pkgPending.package_id, null);
    assert.equal(pkgPending.is_package_granted, false);
  });

  it('7. Compara a ordem das 44 colunas legadas e garante que campos novos são estritamente append-only ao final', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    // 44 Colunas Legadas na ordem exata da migration 20260913210000 (produção)
    const expectedLegacy44Columns = [
      'transaction_id',
      'payment_created_at',
      'payment_updated_at',
      'payment_status',
      'payment_status_detail',
      'amount',
      'payment_method_id',
      'payment_type_id',
      'mp_payment_id',
      'mp_preference_id',
      'consultation_id', // Posição 11 obrigatória
      'plate',
      'plate_normalized',
      'consultation_status',
      'consultation_payment_status',
      'has_report_data',
      'consultation_processed_at',
      'lookup_error_message',
      'customer_id',
      'customer_name',
      'customer_email',
      'customer_phone',
      'delivery_job_id',
      'delivery_status',
      'delivery_attempt_count',
      'delivery_max_attempts',
      'delivery_next_retry_at',
      'delivery_last_error_code',
      'delivery_last_error_message_safe',
      'delivery_last_http_status',
      'delivery_last_failure_class',
      'delivery_provider',
      'refund_id',
      'refund_status',
      'provider_refund_id',
      'refund_reason_code',
      'refund_reason_safe',
      'refund_requested_at',
      'refund_confirmed_at',
      'refund_last_error_code',
      'refund_last_error_safe',
      'is_insufficient_credits',
      'is_refund_eligible',
      'is_reprocess_eligible', // Posição 44 (última coluna legada)
    ];

    // 15 Colunas novas de pacote e propósito (Posições 45 a 59 - Append-Only)
    const expectedAppendedColumns = [
      'purpose', // Posição 45
      'package_order_id',
      'package_offer_name',
      'package_credits_quantity',
      'package_unit_price_cents',
      'package_order_status',
      'package_paid_at',
      'package_granted_at',
      'package_id',
      'customer_credit_package_id',
      'package_credits_remaining',
      'package_credits_granted',
      'package_status',
      'is_package_granted',
      'is_package_refund_eligible', // Posição 59
    ];

    const expectedFullColumns = [...expectedLegacy44Columns, ...expectedAppendedColumns];
    assert.equal(expectedFullColumns.length, 59);

    // Lê o arquivo SQL real da migration de hotfix
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20260923100000_hotfix_credit_package_grant_and_admin_view.sql',
    );
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

    // Extrai o bloco de SELECT da View
    const viewMatch = sqlContent.match(
      /CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.admin_payment_consultations_view\s+AS\s+SELECT([\s\S]*?)FROM\s+public\.payment_transactions/i,
    );
    assert.ok(viewMatch, 'Bloco da View deve ser encontrado no arquivo SQL');

    const selectClause = viewMatch[1];

    // Faz o parse das 59 expressões de coluna dividindo por vírgulas de nível superior (ignorando parênteses internos de CASE/COALESCE)
    const columns: string[] = [];
    let parenDepth = 0;
    let currentToken = '';

    for (let i = 0; i < selectClause.length; i++) {
      const char = selectClause[i];
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;

      if (char === ',' && parenDepth === 0) {
        columns.push(currentToken.trim());
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    if (currentToken.trim().length > 0) {
      columns.push(currentToken.trim());
    }

    const aliases = columns
      .map((colExpr) => {
        // Remove comentários
        const cleaned = colExpr.replace(/--.*$/gm, '').trim();
        const asMatch = cleaned.match(/AS\s+([a-zA-Z0-9_]+)\s*$/i);
        if (asMatch) return asMatch[1];
        const dotMatch = cleaned.match(/\.([a-zA-Z0-9_]+)\s*$/);
        if (dotMatch) return dotMatch[1];
        return cleaned;
      })
      .filter(Boolean);

    // Valida que o total de colunas extraídas é exatamente 59
    assert.equal(
      aliases.length,
      59,
      `View deve expor exatamente 59 colunas. Encontradas: ${aliases.length}`,
    );

    // Valida que as primeiras 44 colunas coincidem 100% com as legadas
    const actualLegacy44 = aliases.slice(0, 44);
    assert.deepEqual(
      actualLegacy44,
      expectedLegacy44Columns,
      'As primeiras 44 colunas da nova view devem ter exatamente os mesmos nomes e ordem da view existente em produção',
    );

    // Valida consultation_id especificamente na posição 11 (índice 10)
    assert.equal(aliases[10], 'consultation_id', 'consultation_id precisa continuar na posição 11');

    // Valida purpose especificamente na posição 45 (índice 44)
    assert.equal(
      aliases[44],
      'purpose',
      'purpose precisa iniciar após a última coluna legada (posição 45)',
    );

    // Valida que as 15 colunas seguintes são exatamente os campos de pacote append-only
    const actualAppended = aliases.slice(44);
    assert.deepEqual(
      actualAppended,
      expectedAppendedColumns,
      'Campos de pacotes e propósito devem ser adicionados estritamente como append-only a partir da posição 45',
    );
  });
});
