'use server';

import { createClient } from '@/lib/supabase/server';
import { PurchaseAgreementPrepareInput } from '@/types/purchase-agreement';

export async function preparePurchaseAgreementFromProposal(proposalId: string): Promise<{
  success: boolean;
  data?: Partial<PurchaseAgreementPrepareInput>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 1. Tenta buscar em sell_requests
    let { data: sellRequest } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', proposalId)
      .maybeSingle();

    if (!sellRequest) {
      // 2. Se não encontrar, tenta buscar em leads
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', proposalId)
        .maybeSingle();

      if (lead) {
        const metadata = lead.metadata as Record<string, unknown> | null;
        const sellReqId = metadata?.sell_request_id as string | undefined;
        if (sellReqId) {
          const { data: linked } = await supabase
            .from('sell_requests')
            .select('*')
            .eq('id', sellReqId)
            .maybeSingle();
          if (linked) {
            sellRequest = linked;
          }
        }
      }
    }

    if (!sellRequest) {
      return { success: false, error: 'Proposta não encontrada.' };
    }

    // Busca cliente vendedor se houver vínculo direto ou por telefone
    let customer = null;
    if (sellRequest.customer_id) {
      const { data: cust } = await supabase
        .from('customers')
        .select('*')
        .eq('id', sellRequest.customer_id)
        .maybeSingle();
      customer = cust;
    } else if (sellRequest.phone) {
      const cleanPhone = sellRequest.phone.replace(/\D/g, '');
      const { data: cust } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.eq.${cleanPhone},phone.eq.${sellRequest.phone}`)
        .limit(1)
        .maybeSingle();
      customer = cust;
    }

    const sellerAddress = [
      sellRequest.address_street || customer?.street,
      sellRequest.address_number || customer?.number,
      sellRequest.address_neighborhood || customer?.neighborhood,
      sellRequest.city || customer?.city,
      sellRequest.state || customer?.state,
      sellRequest.postal_code || customer?.cep ? `CEP ${sellRequest.postal_code || customer?.cep}` : null,
    ].filter(Boolean).join(', ');

    const motorcycleData = sellRequest.motorcycle_data as Record<string, unknown> | null;

    const initialAmount =
      sellRequest.accepted_amount ||
      sellRequest.offered_amount ||
      sellRequest.estimated_offer ||
      sellRequest.desired_price ||
      sellRequest.fipe_price ||
      0;

    const today = new Date().toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const preparedData: Partial<PurchaseAgreementPrepareInput> = {
      sell_request_id: sellRequest.id,
      seller_customer_id: sellRequest.customer_id || null,
      seller_name: customer?.full_name || sellRequest.name || '',
      seller_document: customer?.cpf || '',
      seller_rg: customer?.rg || '',
      seller_phone: customer?.phone || sellRequest.phone || '',
      seller_email: customer?.email || sellRequest.email || '',
      seller_address: sellerAddress || 'Endereço a confirmar',

      brand: sellRequest.brand || '',
      model: sellRequest.model || '',
      version: (motorcycleData?.version as string) || sellRequest.fipe_model_name || '',
      year_manufacture: sellRequest.year_manufacture || new Date().getFullYear(),
      year_model: sellRequest.year_model || sellRequest.year_manufacture || new Date().getFullYear(),
      color: sellRequest.color || '',
      fuel: (sellRequest.fipe_fuel_name || motorcycleData?.fuel_name || 'Flex') as string,
      engine_capacity: Number(motorcycleData?.engine_capacity) || undefined,
      license_plate: sellRequest.license_plate || '',
      renavam: (motorcycleData?.renavam as string) || '',
      chassi: (motorcycleData?.chassi as string) || '',
      mileage: sellRequest.mileage || 0,
      fipe_code: sellRequest.fipe_code || '',
      fipe_price: sellRequest.fipe_price || 0,

      purchase_amount: Number(initialAmount),
      paid_amount: Number(initialAmount),
      payment_status: 'PAID_FULL',
      payment_method: 'PIX',
      payment_date: today,
      is_full_discharge_confirmed: true,

      delivery_datetime: new Date().toISOString(),
      delivery_km: sellRequest.mileage || 0,
      keys_count: 2,
      has_manual: true,
      has_spare_key: true,
      documents_delivered: ['CRLV-e', 'ATPV-e Assinada'],
      accessories_delivered: [],
      apparent_condition_notes: '',

      transfer_deadline_date: in30Days,
      transfer_notes: 'Transferência no prazo legal de 30 dias.',
    };

    return { success: true, data: preparedData };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao preparar dados da proposta.',
    };
  }
}
