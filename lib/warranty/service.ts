import { createClient } from '@/lib/supabase/server';
import { getSaleById, SaleWithDetails } from '@/lib/queries/sales';
import { calculateWarrantyEndDate } from './calculator';

/**
 * Serviço Server-Only para fixação e persistência atômica da garantia comercial
 * exclusivamente na PRIMEIRA emissão efetiva do contrato/recibo em PDF.
 *
 * Regras:
 * 1. Se a venda for repasse (is_repasse = true), nenhuma data de garantia é criada.
 * 2. Se a garantia já tiver sido emitida anteriormente, retorna a venda original sem alterações (Idempotência).
 * 3. Se for a primeira emissão, calcula a data final inclusiva (+3 meses-calendário) e persiste atomicamente.
 */
export async function issueSaleWarrantyOnPdfEmission(
  saleId: string,
  existingClient?: any,
): Promise<SaleWithDetails | null> {
  const supabase = existingClient || (await createClient());

  // 1. Busca a venda atual
  const sale = await getSaleById(saleId);
  if (!sale) {
    return null;
  }

  // 2. Venda de repasse não possui garantia comercial
  if (sale.is_repasse) {
    return sale;
  }

  // 3. Idempotência estrita: se já possui garantia emitida, reutiliza rigorosamente as datas
  if (sale.warranty_issued_at && sale.warranty_ends_at) {
    return sale;
  }

  // 4. Primeira emissão: fixar timestamp atual e data de encerramento por meses-calendário
  const now = new Date();
  const months = sale.warranty_months && sale.warranty_months > 0 ? sale.warranty_months : 3;
  const endsAt = calculateWarrantyEndDate(now, months);

  const { error: updateError } = await supabase
    .from('sales')
    .update({
      warranty_issued_at: now.toISOString(),
      warranty_ends_at: endsAt,
      warranty_months: months,
      updated_at: new Date().toISOString(),
    })
    .eq('id', saleId)
    .is('warranty_issued_at', null)
    .neq('is_repasse', true);

  if (updateError) {
    console.error('[warranty.service] Erro ao registrar emissão de garantia:', updateError);
    // Em caso de concorrência ou erro, busca o registro atualizado mais recente
  }

  // 5. Retorna o registro definitivo atualizado
  return await getSaleById(saleId);
}
