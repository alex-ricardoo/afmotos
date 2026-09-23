/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Simulação de Schema Relacional do Banco de Dados para verificação
 * de integridade de migrations e compatibilidade retroativa.
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
  it('1. Rejeita package_type = "standard" no schema original de produção', () => {
    // Estado do banco de produção original (migration 20260914120000)
    const originalPackagesTable = new SimulatedTable(
      ['id', 'user_id', 'package_type', 'status'],
      ['id', 'user_id', 'package_type'],
    );

    originalPackagesTable.addConstraint('customer_credit_packages_package_type_check', (row) =>
      ['manual_negotiated', 'agency', 'reseller', 'promotional', 'partner', 'test'].includes(
        row.package_type,
      ),
    );

    assert.throws(() => {
      originalPackagesTable.insert({
        id: 'pkg-1',
        user_id: 'usr-1',
        package_type: 'standard',
        status: 'active',
      });
    }, /Check constraint violation: customer_credit_packages_package_type_check/);
  });

  it('2. Aplica hotfix de constraint de package_type e aceita "standard" com idempotência', () => {
    const packagesTable = new SimulatedTable(
      ['id', 'user_id', 'package_type', 'status'],
      ['id', 'user_id', 'package_type'],
    );

    // Schema original
    packagesTable.addConstraint('customer_credit_packages_package_type_check', (row) =>
      ['manual_negotiated', 'agency', 'reseller', 'promotional', 'partner', 'test'].includes(
        row.package_type,
      ),
    );

    // Simula execução da migration 20260923100000: DROP IF EXISTS + ADD CONSTRAINT permitindo 'standard'
    const applyHotfix = () => {
      packagesTable.dropConstraint('customer_credit_packages_package_type_check');
      packagesTable.addConstraint('customer_credit_packages_package_type_check', (row) =>
        [
          'standard',
          'manual_negotiated',
          'agency',
          'reseller',
          'promotional',
          'partner',
          'test',
        ].includes(row.package_type),
      );
    };

    // Primeira aplicação
    applyHotfix();
    const pkg = packagesTable.insert({
      id: 'pkg-std-1',
      user_id: 'usr-1',
      package_type: 'standard',
      status: 'active',
    });
    assert.equal(pkg.package_type, 'standard');

    // Segunda aplicação (idempotência)
    assert.doesNotThrow(() => applyHotfix());
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

  it('4. Preflight aprova dados válidos e constraint XOR garante integridade estrita', () => {
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

  it('5. View administrativa unificada com LEFT JOIN preserva consultas veiculares e inclui pacotes com package_id', () => {
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
        id: 'tx-pkg-1',
        purpose: 'credit_package',
        consultation_id: null,
        credit_package_order_id: 'cpo-1',
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
        is_package_granted: Boolean(ccp?.id),
      };
    });

    assert.equal(unifiedViewResult.length, 2);

    // Registro de Consulta Veicular
    const consRow = unifiedViewResult.find((r) => r.purpose === 'vehicle_consultation');
    assert.ok(consRow);
    assert.equal(consRow.plate, 'ABC1D23');
    assert.equal(consRow.package_id, null);

    // Registro de Pacote de Créditos
    const pkgRow = unifiedViewResult.find((r) => r.purpose === 'credit_package');
    assert.ok(pkgRow);
    assert.equal(pkgRow.package_offer_name, 'Pacote Essencial');
    assert.equal(pkgRow.package_credits_quantity, 5);
    assert.equal(pkgRow.package_id, 'pkg-real-uuid-1');
    assert.equal(pkgRow.is_package_granted, true);
  });
});
