import { createClient } from '@/lib/supabase/server';

interface RawImageRecord {
  id: string;
  storage_path: string;
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

function getPublicImageUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath?: string | null,
): string | undefined {
  if (!storagePath) return undefined;
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
  const { data } = supabase.storage.from('motorcycle-images').getPublicUrl(storagePath);
  return data?.publicUrl || undefined;
}

export async function getFeaturedMotorcycles() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select(
      `
      id,
      slug,
      brand,
      model,
      version,
      year_manufacture,
      year_model,
      price,
      mileage,
      engine_capacity,
      status,
      motorcycle_images (
        id,
        storage_path,
        is_primary,
        sort_order
      )
    `,
    )
    .eq('featured', true)
    .neq('status', 'HIDDEN')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching featured motorcycles:', error);
    return [];
  }

  if (!data) return [];

  const rawList = data as unknown as RawMotorcycle[];

  return rawList.map((moto) => {
    const primaryImg =
      moto.motorcycle_images?.find((img) => img.is_primary) || moto.motorcycle_images?.[0];
    return {
      ...moto,
      image_url: getPublicImageUrl(supabase, primaryImg?.storage_path),
    };
  });
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
  [key: string]: string | string[] | undefined;
}

export async function getAllMotorcycles(searchParams?: FilterSearchParams) {
  const supabase = await createClient();

  let query = supabase
    .from('motorcycles')
    .select(
      `
      id,
      slug,
      brand,
      model,
      version,
      year_manufacture,
      year_model,
      price,
      mileage,
      engine_capacity,
      status,
      featured,
      motorcycle_images (
        id,
        storage_path,
        is_primary,
        sort_order
      )
    `,
    )
    .neq('status', 'HIDDEN');

  // Search parameters handling
  if (searchParams) {
    const brand = searchParams.brand;
    const q =
      typeof searchParams.q === 'string'
        ? searchParams.q
        : typeof searchParams.search === 'string'
          ? searchParams.search
          : undefined;
    const minYear =
      typeof searchParams.minYear === 'string'
        ? searchParams.minYear
        : typeof searchParams.year === 'string'
          ? searchParams.year
          : undefined;
    const maxPrice =
      typeof searchParams.maxPrice === 'string'
        ? searchParams.maxPrice
        : typeof searchParams.price === 'string'
          ? searchParams.price
          : undefined;
    const status = typeof searchParams.status === 'string' ? searchParams.status : undefined;

    if (brand && brand !== 'all' && typeof brand === 'string') {
      query = query.ilike('brand', `%${brand}%`);
    }
    if (q) {
      query = query.or(`brand.ilike.%${q}%,model.ilike.%${q}%,version.ilike.%${q}%`);
    }
    if (minYear && minYear !== 'all') {
      const yearNum = parseInt(minYear, 10);
      if (!isNaN(yearNum)) {
        query = query.gte('year_model', yearNum);
      }
    }
    if (maxPrice && maxPrice !== 'all') {
      const priceNum = parseFloat(maxPrice);
      if (!isNaN(priceNum)) {
        query = query.lte('price', priceNum);
      }
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching motorcycles:', error);
    return [];
  }

  const rawList = (data || []) as unknown as RawMotorcycle[];

  return rawList.map((moto) => {
    const primaryImg =
      moto.motorcycle_images?.find((img) => img.is_primary) || moto.motorcycle_images?.[0];
    return {
      ...moto,
      image_url: getPublicImageUrl(supabase, primaryImg?.storage_path),
    };
  });
}

export async function getMotorcycleBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select(
      `
      *,
      motorcycle_images (
        id,
        storage_path,
        is_primary,
        sort_order,
        alt_text
      ),
      motorcycle_feature_assignments (
        feature_id,
        motorcycle_features (
          id,
          name,
          slug
        )
      )
    `,
    )
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error('Error fetching motorcycle by slug:', error);
    return null;
  }

  const rawMoto = data as unknown as RawMotorcycle;

  const sortedImages = (rawMoto.motorcycle_images || [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => ({
      id: img.id,
      url: getPublicImageUrl(supabase, img.storage_path) || '',
      is_main: !!img.is_primary,
      display_order: img.sort_order ?? 0,
      alt_text: img.alt_text || undefined,
    }));

  const differentials = rawMoto.motorcycle_feature_assignments
    ? rawMoto.motorcycle_feature_assignments
        .map((fa) => fa.motorcycle_features?.name)
        .filter((name): name is string => typeof name === 'string')
    : [];

  return {
    ...rawMoto,
    images: sortedImages,
    differentials,
    image_url: sortedImages[0]?.url,
  };
}

export async function getAdminMotorcycles() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select(`*`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin motorcycles:', error);
    return [];
  }

  return data || [];
}

export async function getMotorcycleById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.from('motorcycles').select(`*`).eq('id', id).single();

  if (error) {
    console.error('Error fetching motorcycle by ID:', error);
    return null;
  }

  return data;
}

export async function getSoldMotorcycles() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select(
      `
      id,
      slug,
      brand,
      model,
      version,
      year_manufacture,
      year_model,
      price,
      mileage,
      engine_capacity,
      status,
      motorcycle_images (
        id,
        storage_path,
        is_primary,
        sort_order
      )
    `,
    )
    .in('status', ['SOLD', 'vendida'])
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching sold motorcycles:', error);
    return [];
  }

  const rawList = (data || []) as unknown as RawMotorcycle[];

  return rawList.map((moto) => {
    const primaryImg =
      moto.motorcycle_images?.find((img) => img.is_primary) || moto.motorcycle_images?.[0];
    return {
      ...moto,
      image_url: getPublicImageUrl(supabase, primaryImg?.storage_path),
    };
  });
}
