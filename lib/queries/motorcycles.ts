import { createClient } from '@/lib/supabase/server';
import { getImageSource } from '@/lib/uploads/image-url';

interface RawImageRecord {
  id: string;
  provider?: string | null;
  storage_path?: string | null;
  public_url?: string | null;
  display_url?: string | null;
  thumbnail_url?: string | null;
  is_primary?: boolean | null;
  sort_order?: number | null;
  alt_text?: string | null;
}

interface RawFeatureAssignment {
  feature_id: string;
  motorcycle_features?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface RawMotorcycle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version?: string | null;
  year_manufacture: number;
  year_model: number;
  price: number | null;
  mileage: number | null;
  engine_capacity: number | null;
  status: string;
  featured?: boolean | null;
  is_repasse?: boolean | null;
  description?: string | null;
  fuel?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  color?: string | null;
  license_plate?: string | null;
  plate_end?: string | null;
  motorcycle_images?: RawImageRecord[] | null;
  motorcycle_feature_assignments?: RawFeatureAssignment[] | null;
}

import {
  getPublicFeaturedMotorcycles,
  getPublicAvailableMotorcycles,
  getPublicSoldMotorcycles,
  getPublicMotorcycleBySlug,
  getPublicMotorcycleFilterFacets,
  PublicMotorcycle,
  PublicFilterSearchParams,
} from './public-motorcycles';

export function getPublicImageUrl(
  _supabase?: Awaited<ReturnType<typeof createClient>> | null,
  imageOrPath?: RawImageRecord | string | null,
): string | undefined {
  if (!imageOrPath) return undefined;
  return getImageSource(imageOrPath) || undefined;
}

export async function getFeaturedMotorcycles() {
  const result = await getPublicFeaturedMotorcycles(6);
  return result.data;
}

export interface FilterSearchParams {
  brand?: string;
  search?: string;
  q?: string;
  minYear?: string;
  year?: string;
  maxPrice?: string;
  price?: string;
  status?: string;
  sort?: string;
  [key: string]: string | string[] | undefined;
}

export async function getAllMotorcycles(searchParams?: FilterSearchParams) {
  const result = await getPublicAvailableMotorcycles(searchParams as PublicFilterSearchParams);
  return result.data;
}

export async function getMotorcycleBySlug(slug: string) {
  const result = await getPublicMotorcycleBySlug(slug);
  return result.data;
}

export async function getAdminMotorcycles(statusFilter?: string, searchQuery?: string) {
  const supabase = await createClient();

  let query = supabase.from('motorcycles').select(`
    *,
    motorcycle_images (*),
    expenses:expenses(amount, status)
  `);

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  if (searchQuery) {
    query = query.or(
      `brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,license_plate.ilike.%${searchQuery}%,internal_code.ilike.%${searchQuery}%`,
    );
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin motorcycles:', error.message || error);
    return [];
  }

  if (!data) return [];

  return data.map((moto: any) => {
    const rawImages = (moto.motorcycle_images as any[]) || [];
    const sortedImages = rawImages.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const primaryImg = sortedImages.find((img) => img.is_primary) || sortedImages[0];
    const imageUrl = primaryImg ? getPublicImageUrl(supabase, primaryImg) : undefined;

    const rawExpenses = (moto.expenses as any[]) || [];
    const totalExpensesAmount = rawExpenses
      .filter((e) => e.status !== 'CANCELLED')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      ...moto,
      image_url: imageUrl,
      total_expenses_amount: totalExpensesAmount,
      images: sortedImages.map((img) => ({
        id: img.id,
        url: getPublicImageUrl(supabase, img) || '',
      })),
    };
  });
}

export async function getMotorcycleById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select(
      `
      *,
      motorcycle_images (*)
    `,
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching motorcycle by ID:', error?.message || error);
    return null;
  }

  const rawImages = ((data.motorcycle_images as any[]) || []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const imagesWithUrls = rawImages.map((img) => ({
    ...img,
    url: getPublicImageUrl(supabase, img) || '',
  }));

  return {
    ...data,
    images: imagesWithUrls,
  };
}

export async function getSoldMotorcycles() {
  const result = await getPublicSoldMotorcycles();
  return result.data;
}

export type { PriceTier, MotorcycleFilterFacets } from './public-motorcycles';

export async function getMotorcycleFilterFacets(): Promise<import('./public-motorcycles').MotorcycleFilterFacets> {
  return getPublicMotorcycleFilterFacets();
}

/**
 * Busca lista resumida de motocicletas ativas para vinculação à consulta FIPE no painel admin.
 */
export async function getMotorcyclesForFipeLinker() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select('id, brand, model, year_model, price, mileage, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching motorcycles for FIPE linker:', error);
    return [];
  }

  return data || [];
}
