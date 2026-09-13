import { reprocessMockedPaidConsultation } from '../lib/vehicle-delivery/reprocess-service.ts';

/**
 * CLI runner for safe reprocessing of paid consultations that received mock cache.
 *
 * Usage:
 *   npx tsx scripts/reprocess-mocked-paid-consultation.ts <transactionId-or-consultationId>
 */
async function main() {
  const targetId = process.argv[2] || 'edaf3e59-fb2e-48ee-aa0d-c652bfedd886';

  console.log(`[Reprocess-CLI] Iniciando reprocessamento para ID: ${targetId}`);

  const outcome = await reprocessMockedPaidConsultation({
    transactionId: targetId,
    consultationId: targetId,
  });

  console.log('[Reprocess-CLI] Resultado do Reprocessamento:');
  console.log(JSON.stringify(outcome, null, 2));

  if (outcome.success) {
    console.log('[Reprocess-CLI] Sucesso!');
    process.exit(0);
  } else {
    console.error(`[Reprocess-CLI] Falha: ${outcome.error || 'Falha não especificada'}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Reprocess-CLI] Erro fatal:', err);
  process.exit(1);
});
