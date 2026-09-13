/**
 * Script e utilitário de recuperação operacional para transações reais do Mercado Pago Checkout Pro
 * que permaneceram pendentes em virtude da rejeição de assinatura do webhook em versões anteriores.
 *
 * Utiliza o fluxo oficial e autoritativo de reconciliação, auditando todas as etapas e
 * liberando as consultas veiculares pendentes sem necessidade de updates manuais no banco de dados.
 */

import { reconcilePaymentTransaction } from './reconciliation-service.ts';
import { logCheckoutProEvent } from './observability.ts';

/**
 * IDs conhecidos de transações de produção impactadas pelo incidente de assinatura HMAC.
 */
export const KNOWN_PENDING_INCIDENT_TRANSACTION_IDS = [
  '54b419a6-053e-48fc-8afc-9aa3eaed39ad',
  '3c561c8c-1e8f-4cb1-807c-f173f47e3a58',
  'e1b2385d-83b6-4b2a-8742-1e967a2139e6',
];

export interface RecoveryOutcome {
  transactionId: string;
  success: boolean;
  status: string;
  reportUnlocked: boolean;
  message: string;
  error?: string;
}

/**
 * Reconcilia de forma autoritativa e segura uma transação específica via service role.
 */
export async function recoverTransactionById(
  transactionId: string,
  actorId?: string,
): Promise<RecoveryOutcome> {
  logCheckoutProEvent('checkout_pro.reconciliation_started', {
    transactionId,
  });

  const outcome = await reconcilePaymentTransaction(
    transactionId,
    actorId || 'system-recovery-agent',
    'admin',
  );

  logCheckoutProEvent('checkout_pro.reconciliation_completed', {
    transactionId,
    status: outcome.currentStatus,
    errorMessage: outcome.error,
  });

  return {
    transactionId,
    success: outcome.success,
    status: outcome.currentStatus,
    reportUnlocked: outcome.reportUnlocked ?? false,
    message: outcome.message,
    error: outcome.error,
  };
}

/**
 * Executa a reconciliação em lote para uma lista de transações com controle de concorrência.
 */
export async function recoverPendingTransactionsList(
  transactionIds: string[],
): Promise<RecoveryOutcome[]> {
  const results: RecoveryOutcome[] = [];

  for (const id of transactionIds) {
    try {
      const outcome = await recoverTransactionById(id);
      results.push(outcome);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({
        transactionId: id,
        success: false,
        status: 'error',
        reportUnlocked: false,
        message: 'Exceção não tratada durante recuperação.',
        error: errorMsg,
      });
    }
  }

  return results;
}

/**
 * Execução CLI direta caso chamado como script Node
 */
async function main() {
  const args = process.argv.slice(2);
  const targetIds = args.length > 0 ? args : KNOWN_PENDING_INCIDENT_TRANSACTION_IDS;

  console.log(`[OPERATIONAL_RECOVERY] Iniciando recuperação de ${targetIds.length} transações...`);

  const outcomes = await recoverPendingTransactionsList(targetIds);

  console.log('\n--- RELATÓRIO DE RECUPERAÇÃO OPERACIONAL ---');
  for (const res of outcomes) {
    console.log(
      `Tx: ${res.transactionId} | Sucesso: ${res.success} | Status: ${res.status} | Laudo Liberado: ${res.reportUnlocked} | Msg: ${res.message}`,
    );
    if (res.error) {
      console.log(`   Detalhe do Erro: ${res.error}`);
    }
  }
  console.log('--- FIM DO RELATÓRIO ---\n');
}

// Executa caso chamado diretamente via linha de comando
if (process.argv[1]?.includes('operational-recovery')) {
  main().catch((err) => {
    console.error('[OPERATIONAL_RECOVERY] Erro fatal:', err);
    process.exit(1);
  });
}
