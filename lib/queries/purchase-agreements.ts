import { createClient } from '@/lib/supabase/server';
import { MotorcyclePurchaseAgreementRecord } from '@/types/purchase-agreement';

export async function getPurchaseAgreementById(id: string): Promise<MotorcyclePurchaseAgreementRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('motorcycle_purchase_agreements')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as MotorcyclePurchaseAgreementRecord;
}

export async function getPurchaseAgreementsByMotorcycleId(motorcycleId: string): Promise<MotorcyclePurchaseAgreementRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('motorcycle_purchase_agreements')
    .select('*')
    .eq('motorcycle_id', motorcycleId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as unknown as MotorcyclePurchaseAgreementRecord[];
}

export async function getPurchaseAgreementsByCustomerId(customerId: string): Promise<MotorcyclePurchaseAgreementRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('motorcycle_purchase_agreements')
    .select('*')
    .eq('seller_customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as unknown as MotorcyclePurchaseAgreementRecord[];
}
