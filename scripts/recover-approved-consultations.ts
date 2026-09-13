import { createAdminClient } from '@/lib/supabase/admin';
import { findExistingConsultation } from '@/lib/vehicle-lookup/service';
import { enqueueDeliveryJob } from '@/lib/vehicle-delivery/delivery-service';
import { isCacheEntryEligibleForPaidProduction } from '@/lib/vehicle-delivery/cache-eligibility';

/**
 * Script de Recuperação Operacional:
 * Localiza transações aprovadas no Mercado Pago que não possuem laudo veicular concluído,
 * resolvendo via cache local ou enfileirando na fila de entrega persistida.
 */
export async function recoverApprovedConsultationsWithoutReport() {
  const adminDb = createAdminClient();
  console.log('[Recovery] Iniciando varredura de transações aprovadas sem laudo...');

  // Busca transações aprovadas
  const { data: transactions, error } = await adminDb
    .from('payment_transactions')
    .select(
      'id, consultation_id, status, customer_plate_consultations!inner(id, plate, plate_normalized, status, vehicle_data)',
    )
    .eq('status', 'approved')
    .neq('customer_plate_consultations.status', 'completed');

  if (error) {
    console.error('[Recovery] Erro ao buscar transações:', error);
    return { success: false, error: error.message };
  }

  console.log(`[Recovery] Localizadas ${transactions?.length || 0} transações para análise.`);

  let resolvedFromCache = 0;
  let enqueuedJobs = 0;

  for (const tx of transactions || []) {
    const consultation = tx.customer_plate_consultations as any;
    if (!consultation) continue;

    const plate = consultation.plate_normalized || consultation.plate;
    const cached = await findExistingConsultation(plate, adminDb, { requireLiveOnly: true });

    const eligibility = isCacheEntryEligibleForPaidProduction({
      runtimeEnvironment: 'production',
      cacheRecord: cached,
      isPaidTransaction: true,
    });

    if (eligibility.eligible && cached && cached.raw_response) {
      await adminDb
        .from('customer_plate_consultations')
        .update({
          vehicle_data: cached.raw_response,
          source_consultation_id: cached.id,
          status: 'completed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', consultation.id);

      resolvedFromCache++;
      console.log(`[Recovery] Consulta ${consultation.id} (Placa ${plate}) resolvida pelo cache.`);
    } else {
      await enqueueDeliveryJob({
        consultationId: consultation.id,
        transactionId: tx.id,
        dbClient: adminDb,
      });

      enqueuedJobs++;
      console.log(
        `[Recovery] Consulta ${consultation.id} (Placa ${plate}) enfileirada para entrega.`,
      );
    }
  }

  console.log('[Recovery] Varredura concluída com sucesso:', {
    totalAnalyzed: transactions?.length || 0,
    resolvedFromCache,
    enqueuedJobs,
  });

  return {
    success: true,
    totalAnalyzed: transactions?.length || 0,
    resolvedFromCache,
    enqueuedJobs,
  };
}
