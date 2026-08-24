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

export function getPublicImageUrl(
  _supabase?: Awaited<ReturnType<typeof createClient>> | null,
  imageOrPath?: RawImageRecord | string | null,
): string | undefined {
  if (!imageOrPath) return undefined;
  return getImageSource(imageOrPath) || undefined;
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
      featured,
      motorcycle_images (*)
    `,
    )
    .eq('featured', true)
    .neq('status', 'HIDDEN')
    .neq('status', 'SOLD')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching featured motorcycles:', error.message || error);
    return [];
  }

  if (!data) return [];

  const rawList = data as unknown as RawMotorcycle[];

  return rawList.map((moto) => {
    const primaryImg =
      moto.motorcycle_images?.find((img) => img.is_primary) || moto.motorcycle_images?.[0];
    return {
      ...moto,
      image_url: getPublicImageUrl(supabase, primaryImg),
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
  sort?: string;
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
      motorcycle_images (*)
    `,
    )
    .neq('status', 'HIDDEN')
    .neq('status', 'SOLD');

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
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;

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

    // Sempre prioriza motos em destaque no topo do catálogo
    query = query.order('featured', { ascending: false, nullsFirst: false });

    // Sort handling
    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true, nullsFirst: false });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false, nullsFirst: false });
    } else if (sort === 'year_desc') {
      query = query.order('year_model', { ascending: false, nullsFirst: false });
    } else if (sort === 'km_asc') {
      query = query.order('mileage', { ascending: true, nullsFirst: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }
  } else {
    query = query
      .order('featured', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching motorcycles:', error.message || error);
    return [];
  }

  const rawList = (data || []) as unknown as RawMotorcycle[];

  return rawList.map((moto) => {
    const primaryImg =
      moto.motorcycle_images?.find((img) => img.is_primary) || moto.motorcycle_images?.[0];
    return {
      ...moto,
      image_url: getPublicImageUrl(supabase, primaryImg),
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
      motorcycle_images (*),
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
    console.error('Error fetching motorcycle by slug:', error?.message || error);
    return null;
  }

  const rawMoto = data as unknown as RawMotorcycle;

  const sortedImages = (rawMoto.motorcycle_images || [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => ({
      id: img.id,
      url: getPublicImageUrl(supabase, img) || '',
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

export async function getAdminMotorcycles(statusFilter?: string, searchQuery?: string) {
  const supabase = await createClient();

  let query = supabase.from('motorcycles').select(`
    *,
    motorcycle_images (*)
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

    return {
      ...moto,
      image_url: imageUrl,
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
      motorcycle_images (*)
    `,
    )
    .eq('status', 'SOLD')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching sold motorcycles:', error.message || error);
    return [];
  }

  const rawList = (data || []) as unknown as RawMotorcycle[];

  return rawList.map((moto) => {
    const primaryImg =
      moto.motorcycle_images?.find((img) => img.is_primary) || moto.motorcycle_images?.[0];
    return {
      ...moto,
      image_url: getPublicImageUrl(supabase, primaryImg),
    };
  });
}

export interface PriceTier {
  label: string;
  value: string;
}

export interface MotorcycleFilterFacets {
  brands: string[];
  models: string[];
  categories: { id: string; name: string; slug: string }[];
  years: number[];
  priceRange: { min: number; max: number };
  priceTiers: PriceTier[];
  totalAvailable: number;
}

export async function getMotorcycleFilterFacets(): Promise<MotorcycleFilterFacets> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select(
      `
      id,
      brand,
      model,
      year_model,
      price,
      category_id,
      status,
      motorcycle_categories (
        id,
        name,
        slug
      )
    `,
    )
    .neq('status', 'HIDDEN')
    .neq('status', 'SOLD');

  if (error || !data) {
    console.error('Error fetching motorcycle filter facets:', error);
    return {
      brands: [],
      models: [],
      categories: [],
      years: [],
      priceRange: { min: 0, max: 100000 },
      priceTiers: [],
      totalAvailable: 0,
    };
  }

  const uniqueBrands = Array.from(
    new Set(data.map((m) => m.brand).filter((b): b is string => Boolean(b && b.trim()))),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const uniqueModels = Array.from(
    new Set(data.map((m) => m.model).filter((m): m is string => Boolean(m && m.trim()))),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const uniqueYears = Array.from(
    new Set(data.map((m) => m.year_model).filter((y): y is number => Boolean(y && y > 1900))),
  ).sort((a, b) => b - a);

  const categoryMap = new Map<string, { id: string; name: string; slug: string }>();
  data.forEach((m) => {
    const rawCat = m.motorcycle_categories;
    if (rawCat) {
      const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat;
      if (cat && typeof cat === 'object' && 'id' in cat && 'name' in cat && 'slug' in cat) {
        const item = cat as { id: string; name: string; slug: string };
        if (item.id && !categoryMap.has(item.id)) {
          categoryMap.set(item.id, item);
        }
      }
    }
  });
  const uniqueCategories = Array.from(categoryMap.values());

  const prices = data
    .map((m) => (m.price !== null ? Number(m.price) : null))
    .filter((p): p is number => p !== null && !isNaN(p) && p > 0);

  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100000;

  // Gerar faixas dinâmicas de preço baseadas nos preços reais
  const priceTiers: PriceTier[] = [];
  if (maxPrice > 0) {
    const defaultSteps = [15000, 25000, 35000, 50000, 75000, 100000, 150000];
    const applicableSteps = defaultSteps.filter(
      (step) => step >= minPrice * 0.9 && step <= maxPrice * 1.3,
    );

    if (applicableSteps.length === 0) {
      applicableSteps.push(Math.ceil(maxPrice / 1000) * 1000);
    }

    applicableSteps.forEach((step) => {
      priceTiers.push({
        label: `Até R$ ${step.toLocaleString('pt-BR')}`,
        value: String(step),
      });
    });
  }

  return {
    brands: uniqueBrands,
    models: uniqueModels,
    categories: uniqueCategories,
    years: uniqueYears,
    priceRange: { min: minPrice, max: maxPrice },
    priceTiers,
    totalAvailable: data.length,
  };
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
