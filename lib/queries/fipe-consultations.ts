import { createClient } from '@/lib/supabase/server';
import { FipeConsultation } from '@/types/database';

export type FipeConsultationWithMotorcycle = FipeConsultation & {
  motorcycles?: {
    id: string;
    brand: string;
    model: string;
    year_model: number;
    price: number | null;
    status: string;
  } | null;
};

/**
 * Busca histórico de consultas FIPE ordenadas por data decrescente.
 */
export async function getFipeConsultations(limit = 50): Promise<FipeConsultationWithMotorcycle[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('fipe_consultations')
    .select(
      `
      *,
      motorcycles:motorcycle_id (
        id,
        brand,
        model,
        year_model,
        price,
        status
      )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching fipe consultations:', error);
    return [];
  }

  return (data as unknown as FipeConsultationWithMotorcycle[]) || [];
}

/**
 * Busca uma consulta FIPE específica por ID.
 */
export async function getFipeConsultationById(
  id: string,
): Promise<FipeConsultationWithMotorcycle | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('fipe_consultations')
    .select(
      `
      *,
      motorcycles:motorcycle_id (
        id,
        brand,
        model,
        year_model,
        price,
        status
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching fipe consultation by ID:', error);
    return null;
  }

  return (data as unknown as FipeConsultationWithMotorcycle) || null;
}

/**
 * Busca consultas FIPE vinculadas a uma moto específica do estoque.
 */
export async function getFipeConsultationsByMotorcycle(
  motorcycleId: string,
): Promise<FipeConsultation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('fipe_consultations')
    .select('*')
    .eq('motorcycle_id', motorcycleId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching fipe consultations by motorcycle:', error);
    return [];
  }

  return (data as unknown as FipeConsultation[]) || [];
}
