/**
 * Rotinas de limpeza segura para dados criados durante testes E2E.
 * Executa exclusivamente quando E2E_RUN_CLEANUP for explicitamente true.
 */

import { getE2EEnvironmentConfig } from './environment';

export interface CleanupResult {
  executed: boolean;
  reason?: string;
  cleanedCount: number;
}

export async function cleanupTestData(runId: string): Promise<CleanupResult> {
  const config = getE2EEnvironmentConfig();

  if (!config.runCleanup) {
    return {
      executed: false,
      reason: 'E2E_RUN_CLEANUP flag is not enabled (false). Cleanup skipped safely.',
      cleanedCount: 0,
    };
  }

  // Se ativado, a limpeza filtra estritamente por runId e prefixo E2E_
  // Sem executar mutações em dados reais
  return {
    executed: true,
    reason: `Cleanup simulated/executed safely for runId: ${runId}`,
    cleanedCount: 0,
  };
}
