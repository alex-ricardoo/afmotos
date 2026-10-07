import { getPublicSupabaseClient } from '../supabase/public.ts';
import { resolveImageUrl, type ImageRecordLike } from '../uploads/image-url.ts';
import { randomUUID } from 'crypto';
import type { Database, Json } from '../../types/database.ts';

/**
 * Row type from the public_motorcycles view.
 * Supabase JS v2 infers `never` for View rows on `.select('*')`,
 * so we explicitly alias it here to avoid TS2339 errors.
 */
type PublicMotorcycleViewRow = Database['public']['Views']['public_motorcycles']['Row'];

export interface PublicMotorcycleImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  isPrimary: boolean;
  sortOrder: number;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface PublicMotorcycle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version: string | null;
  yearManufacture: number;
  yearModel: number;
  mileage: number | null;
  engineCapacity: number | null;
  fuel: string | null;
  transmission: string | null;
  color: string | null;
  price: number | null;
  description: string | null;
  status: 'AVAILABLE' | 'SOLD';
  featured: boolean;
  isRepasse: boolean;
  publishedAt: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  operationType: string | null;
  createdAt: string;
  updatedAt: string;
  images: PublicMotorcycleImage[];
  imageUrl?: string;
  differentials?: string[];

  // Compatibilidade com componentes de UI existentes que usam convenção snake_case
  year_manufacture: number;
  year_model: number;
  engine_capacity: number | null;
  is_repasse: boolean;
  image_url?: string;
}

export interface PublicCatalogResult<T> {
  data: T;
  error: string | null;
  count: number;
}

export interface PublicMotorcycleSingleResult {
  data: PublicMotorcycle | null;
  error: string | null;
}

export interface PublicFilterSearchParams {
  brand?: string;
  search?: string;
  q?: string;
  minYear?: string;
  year?: string;
  maxPrice?: string;
  price?: string;
  sort?: string;
  [key: string]: string | string[] | undefined;
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

/**
 * Sanitiza mensagens de erro para observabilidade, garantindo que nenhum
 * token, segredo, cookie ou chave de API seja exposto nos logs.
 */
export function sanitizeErrorMessage(message?: string | null): string {
  if (!message) return 'Erro desconhecido na consulta do catálogo';
  return message
    .replace(/(bearer\s+)[^\s]+/gi, '$1[REDACTED]')
    .replace(/(key=)[^\s&]+/gi, '$1[REDACTED]')
    .replace(/(token=)[^\s&]+/gi, '$1[REDACTED]')
    .replace(/(password=)[^\s&]+/gi, '$1[REDACTED]')
    .slice(0, 300);
}

import { createAdminClient } from '../supabase/admin.ts';

/**
 * Busca fotos diretamente na tabela motorcycle_images como fallback server-side
 * caso a view public_motorcycles ainda não tenha retornado a coluna JSONB images.
 */
async function fetchServerImagesForMotorcycles(
  motorcycleIds: string[],
): Promise<Map<string, any[]>> {
  const imagesByMotoId = new Map<string, any[]>();
  if (!motorcycleIds || motorcycleIds.length === 0) return imagesByMotoId;

  try {
    const admin = createAdminClient();
    const { data: rawImages, error } = await admin
      .from('motorcycle_images')
      .select(
        'id, motorcycle_id, storage_path, provider, public_url, display_url, thumbnail_url, sort_order, is_primary, alt_text, created_at',
      )
      .in('motorcycle_id', motorcycleIds)
      .order('sort_order', { ascending: true });

    if (!error && rawImages) {
      for (const img of rawImages) {
        const list = imagesByMotoId.get(img.motorcycle_id) || [];
        list.push(img);
        imagesByMotoId.set(img.motorcycle_id, list);
      }
    }
  } catch (err) {
    // Falha silenciosa de fallback para não impactar requisição pública
  }

  return imagesByMotoId;
}

/**
 * Mapeia registro bruto da view public_motorcycles para o DTO tipado e sanitizado.
 */
export function mapRawToPublicMotorcycle(
  raw: any,
  fallbackImages?: any[],
): PublicMotorcycle {
  const sourceImages: any[] =
    Array.isArray(raw.images) && raw.images.length > 0
      ? raw.images
      : Array.isArray(fallbackImages) && fallbackImages.length > 0
        ? fallbackImages
        : [];

  // Ordenação: is_primary primeiro (descendente), seguido por sort_order (crescente)
  const sortedRawImages = [...sourceImages].sort((a, b) => {
    const aPrimary = a.is_primary ? 1 : 0;
    const bPrimary = b.is_primary ? 1 : 0;
    if (aPrimary !== bPrimary) return bPrimary - aPrimary;
    return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
  });

  const images: PublicMotorcycleImage[] = sortedRawImages
    .map((img) => {
      // 2. Resolução determinística de URL
      const resolvedUrl =
        typeof img.public_url === 'string' && img.public_url.trim()
          ? img.public_url.trim()
          : typeof img.display_url === 'string' && img.display_url.trim()
            ? img.display_url.trim()
            : resolveImageUrl({
                provider: img.provider,
                storage_path: img.storage_path,
                public_url: img.public_url,
                display_url: img.display_url,
                thumbnail_url: img.thumbnail_url,
              });

      // 3. Resolução determinística de thumbnail
      const resolvedThumbnail =
        typeof img.thumbnail_url === 'string' && img.thumbnail_url.trim()
          ? img.thumbnail_url.trim()
          : undefined;

      // 6. Log sanitizado quando URL não puder ser resolvida
      if (!resolvedUrl) {
        console.warn('[PUBLIC_CATALOG_IMAGE]', {
          event: 'public_image_url_unresolved',
          motorcycleId: raw.id ?? null,
          imageId: img.id ?? null,
          provider: img.provider ?? null,
          hasStoragePath: Boolean(img.storage_path),
          hasPublicUrl: Boolean(img.public_url),
          hasDisplayUrl: Boolean(img.display_url),
          hasThumbnailUrl: Boolean(img.thumbnail_url),
        });
      }

      return {
        id: String(img.id || ''),
        url: resolvedUrl,
        thumbnailUrl: resolvedThumbnail,
        isPrimary: Boolean(img.is_primary),
        sortOrder: Number(img.sort_order) || 0,
        altText: img.alt_text ?? null,
        width: img.width ? Number(img.width) : null,
        height: img.height ? Number(img.height) : null,
      };
    })
    // 4. Filtrar imagens inválidas (sem URL resolvível)
    .filter((image) => Boolean(image.url));

  // 5. Garantir que a imagem principal seja definida por:
  // - is_primary = true
  // - fallback para primeira imagem com URL válida
  // - ordem sort_order crescente
  const primaryImage =
    images.find((i) => i.isPrimary && Boolean(i.url)) ||
    images[0];
  const primaryUrl = primaryImage?.url || undefined;

  const yearMan = Number(raw.year_manufacture) || new Date().getFullYear();
  const yearMod = Number(raw.year_model) || yearMan;
  const isRepasse = Boolean(raw.is_repasse);
  const engineCap =
    raw.engine_capacity !== null && raw.engine_capacity !== undefined
      ? Number(raw.engine_capacity)
      : null;

  return {
    id: String(raw.id),
    slug: String(raw.slug),
    brand: String(raw.brand || ''),
    model: String(raw.model || ''),
    version: raw.version ? String(raw.version) : null,
    yearManufacture: yearMan,
    yearModel: yearMod,
    mileage: raw.mileage !== null && raw.mileage !== undefined ? Number(raw.mileage) : null,
    engineCapacity: engineCap,
    fuel: raw.fuel ? String(raw.fuel) : null,
    transmission: raw.transmission ? String(raw.transmission) : null,
    color: raw.color ? String(raw.color) : null,
    price: raw.price !== null && raw.price !== undefined ? Number(raw.price) : null,
    description: raw.description ? String(raw.description) : null,
    status: (raw.status === 'SOLD' ? 'SOLD' : 'AVAILABLE') as 'AVAILABLE' | 'SOLD',
    featured: Boolean(raw.featured),
    isRepasse,
    publishedAt: raw.published_at ? String(raw.published_at) : null,
    categoryId: raw.category_id ? String(raw.category_id) : null,
    categoryName: raw.category_name ? String(raw.category_name) : null,
    categorySlug: raw.category_slug ? String(raw.category_slug) : null,
    operationType: raw.operation_type ? String(raw.operation_type) : null,
    createdAt: String(raw.created_at || ''),
    updatedAt: String(raw.updated_at || ''),
    images,
    imageUrl: primaryUrl,
    differentials: [],

    // Aliases snake_case para compatibilidade total com os componentes React existentes
    year_manufacture: yearMan,
    year_model: yearMod,
    engine_capacity: engineCap,
    is_repasse: isRepasse,
    image_url: primaryUrl,
  };
}

/**
 * Consulta todas as motos públicas com status 'AVAILABLE'.
 * Suporta filtros de busca (marca, texto, ano mínimo, preço máximo e ordenação).
 */
export async function getPublicAvailableMotorcycles(
  searchParams?: PublicFilterSearchParams,
): Promise<PublicCatalogResult<PublicMotorcycle[]>> {
  const startTime = Date.now();
  const requestId = randomUUID();

  try {
    const supabase = getPublicSupabaseClient();

    let query = supabase
      .from('public_motorcycles')
      .select('*')
      .eq('status', 'AVAILABLE');

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
      const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;

      if (brand && brand !== 'all' && typeof brand === 'string' && brand.trim()) {
        query = query.ilike('brand', `%${brand.trim()}%`);
      }

      if (q && q.trim()) {
        const cleanQ = q.trim();
        query = query.or(`brand.ilike.%${cleanQ}%,model.ilike.%${cleanQ}%,version.ilike.%${cleanQ}%`);
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

      // Motos em destaque sempre ganham prioridade visual no topo
      query = query.order('featured', { ascending: false, nullsFirst: false });

      // Ordenação selecionada pelo usuário
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
    const durationMs = Date.now() - startTime;

    if (error) {
      console.error('[PUBLIC_CATALOG]', {
        event: 'public_motorcycles_query_failed',
        route: '/motos',
        source: 'public_motorcycles',
        statusFilter: ['AVAILABLE'],
        errorCode: error.code ?? null,
        errorMessage: sanitizeErrorMessage(error.message),
        durationMs,
        requestId,
      });

      return {
        data: [],
        error: sanitizeErrorMessage(error.message),
        count: 0,
      };
    }

    const rows = (data || []) as PublicMotorcycleViewRow[];

    const missingImageIds = rows
      .filter((raw) => !Array.isArray(raw.images) || raw.images.length === 0)
      .map((raw) => raw.id);

    const fallbackImagesMap =
      missingImageIds.length > 0
        ? await fetchServerImagesForMotorcycles(missingImageIds)
        : new Map();

    const items = rows.map((raw) =>
      mapRawToPublicMotorcycle(raw, fallbackImagesMap.get(raw.id)),
    );

    console.info('[PUBLIC_CATALOG]', {
      event: 'public_motorcycles_query',
      route: '/motos',
      environment: process.env.VERCEL_ENV ?? 'unknown',
      audience: 'public',
      authContext: 'anon_or_ignored',
      source: 'public_motorcycles',
      statusFilter: ['AVAILABLE'],
      resultCount: items.length,
      durationMs,
      requestId,
    });

    return {
      data: items,
      error: null,
      count: items.length,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error('[PUBLIC_CATALOG]', {
      event: 'public_motorcycles_query_exception',
      route: '/motos',
      source: 'public_motorcycles',
      statusFilter: ['AVAILABLE'],
      errorMessage: sanitizeErrorMessage(err?.message),
      durationMs,
      requestId,
    });

    return {
      data: [],
      error: sanitizeErrorMessage(err?.message),
      count: 0,
    };
  }
}

/**
 * Consulta todas as motos com status 'SOLD' para a página pública de motos vendidas.
 * Não aplica limits arbitrários nem slices ocultos.
 */
export async function getPublicSoldMotorcycles(): Promise<PublicCatalogResult<PublicMotorcycle[]>> {
  const startTime = Date.now();
  const requestId = randomUUID();

  try {
    const supabase = getPublicSupabaseClient();

    const { data, error } = await supabase
      .from('public_motorcycles')
      .select('*')
      .eq('status', 'SOLD')
      .order('updated_at', { ascending: false });

    const durationMs = Date.now() - startTime;

    if (error) {
      console.error('[PUBLIC_CATALOG]', {
        event: 'public_motorcycles_query_failed',
        route: '/motos-vendidas',
        source: 'public_motorcycles',
        statusFilter: ['SOLD'],
        errorCode: error.code ?? null,
        errorMessage: sanitizeErrorMessage(error.message),
        durationMs,
        requestId,
      });

      return {
        data: [],
        error: sanitizeErrorMessage(error.message),
        count: 0,
      };
    }

    const soldRows = (data || []) as PublicMotorcycleViewRow[];

    const soldMissingImageIds = soldRows
      .filter((raw) => !Array.isArray(raw.images) || raw.images.length === 0)
      .map((raw) => raw.id);

    const soldFallbackImagesMap =
      soldMissingImageIds.length > 0
        ? await fetchServerImagesForMotorcycles(soldMissingImageIds)
        : new Map();

    const items = soldRows.map((raw) =>
      mapRawToPublicMotorcycle(raw, soldFallbackImagesMap.get(raw.id)),
    );

    console.info('[PUBLIC_CATALOG]', {
      event: 'public_motorcycles_query',
      route: '/motos-vendidas',
      environment: process.env.VERCEL_ENV ?? 'unknown',
      audience: 'public',
      authContext: 'anon_or_ignored',
      source: 'public_motorcycles',
      statusFilter: ['SOLD'],
      resultCount: items.length,
      durationMs,
      requestId,
    });

    return {
      data: items,
      error: null,
      count: items.length,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error('[PUBLIC_CATALOG]', {
      event: 'public_motorcycles_query_exception',
      route: '/motos-vendidas',
      source: 'public_motorcycles',
      statusFilter: ['SOLD'],
      errorMessage: sanitizeErrorMessage(err?.message),
      durationMs,
      requestId,
    });

    return {
      data: [],
      error: sanitizeErrorMessage(err?.message),
      count: 0,
    };
  }
}

/**
 * Consulta motos em destaque com status 'AVAILABLE' para a página inicial.
 */
export async function getPublicFeaturedMotorcycles(
  limit = 6,
): Promise<PublicCatalogResult<PublicMotorcycle[]>> {
  const startTime = Date.now();
  const requestId = randomUUID();

  try {
    const supabase = getPublicSupabaseClient();

    const { data, error } = await supabase
      .from('public_motorcycles')
      .select('*')
      .eq('status', 'AVAILABLE')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    const durationMs = Date.now() - startTime;

    if (error) {
      console.error('[PUBLIC_CATALOG]', {
        event: 'public_motorcycles_query_failed',
        route: '/',
        source: 'public_motorcycles',
        statusFilter: ['AVAILABLE', 'FEATURED'],
        errorCode: error.code ?? null,
        errorMessage: sanitizeErrorMessage(error.message),
        durationMs,
        requestId,
      });

      return {
        data: [],
        error: sanitizeErrorMessage(error.message),
        count: 0,
      };
    }

    const featuredRows = (data || []) as PublicMotorcycleViewRow[];

    const featuredMissingImageIds = featuredRows
      .filter((raw) => !Array.isArray(raw.images) || raw.images.length === 0)
      .map((raw) => raw.id);

    const featuredFallbackImagesMap =
      featuredMissingImageIds.length > 0
        ? await fetchServerImagesForMotorcycles(featuredMissingImageIds)
        : new Map();

    let items = featuredRows.map((raw) =>
      mapRawToPublicMotorcycle(raw, featuredFallbackImagesMap.get(raw.id)),
    );

    // Se nenhuma moto estiver com featured=true, faz fallback para as mais recentes disponíveis
    if (items.length === 0) {
      const fallbackResult = await supabase
        .from('public_motorcycles')
        .select('*')
        .eq('status', 'AVAILABLE')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!fallbackResult.error && fallbackResult.data && fallbackResult.data.length > 0) {
        const fallbackRows = fallbackResult.data as PublicMotorcycleViewRow[];
        const fallbackMissingIds = fallbackRows
          .filter((raw) => !Array.isArray(raw.images) || raw.images.length === 0)
          .map((raw) => raw.id);

        const extraImagesMap =
          fallbackMissingIds.length > 0
            ? await fetchServerImagesForMotorcycles(fallbackMissingIds)
            : new Map();

        items = fallbackRows.map((raw) =>
          mapRawToPublicMotorcycle(raw, extraImagesMap.get(raw.id)),
        );
      }
    }

    console.info('[PUBLIC_CATALOG]', {
      event: 'public_motorcycles_query',
      route: '/',
      environment: process.env.VERCEL_ENV ?? 'unknown',
      audience: 'public',
      authContext: 'anon_or_ignored',
      source: 'public_motorcycles',
      statusFilter: ['AVAILABLE', 'FEATURED'],
      resultCount: items.length,
      durationMs,
      requestId,
    });

    return {
      data: items,
      error: null,
      count: items.length,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error('[PUBLIC_CATALOG]', {
      event: 'public_motorcycles_query_exception',
      route: '/',
      source: 'public_motorcycles',
      statusFilter: ['AVAILABLE', 'FEATURED'],
      errorMessage: sanitizeErrorMessage(err?.message),
      durationMs,
      requestId,
    });

    return {
      data: [],
      error: sanitizeErrorMessage(err?.message),
      count: 0,
    };
  }
}

/**
 * Consulta uma única motocicleta pública por slug.
 * Retorna null se não encontrada ou se não for elegível ao público.
 */
export async function getPublicMotorcycleBySlug(
  slug: string,
): Promise<PublicMotorcycleSingleResult> {
  const startTime = Date.now();
  const requestId = randomUUID();
  const cleanSlug = String(slug || '').trim();

  if (!cleanSlug) {
    return { data: null, error: null };
  }

  try {
    const supabase = getPublicSupabaseClient();

    const { data, error } = await supabase
      .from('public_motorcycles')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle();

    const durationMs = Date.now() - startTime;

    if (error) {
      console.error('[PUBLIC_CATALOG]', {
        event: 'public_motorcycles_query_failed',
        route: `/motos/${cleanSlug}`,
        source: 'public_motorcycles',
        slug: cleanSlug,
        errorCode: error.code ?? null,
        errorMessage: sanitizeErrorMessage(error.message),
        durationMs,
        requestId,
      });

      return {
        data: null,
        error: sanitizeErrorMessage(error.message),
      };
    }

    if (!data) {
      return {
        data: null,
        error: null,
      };
    }

    const singleRow = data as PublicMotorcycleViewRow;
    const missingImages = !Array.isArray(singleRow.images) || singleRow.images.length === 0;
    const fallbackImages = missingImages
      ? (await fetchServerImagesForMotorcycles([singleRow.id])).get(singleRow.id)
      : undefined;

    const moto = mapRawToPublicMotorcycle(singleRow, fallbackImages);

    console.info('[PUBLIC_CATALOG]', {
      event: 'public_motorcycles_query',
      route: `/motos/${cleanSlug}`,
      environment: process.env.VERCEL_ENV ?? 'unknown',
      audience: 'public',
      authContext: 'anon_or_ignored',
      source: 'public_motorcycles',
      slug: cleanSlug,
      status: moto.status,
      durationMs,
      requestId,
    });

    return {
      data: moto,
      error: null,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error('[PUBLIC_CATALOG]', {
      event: 'public_motorcycles_query_exception',
      route: `/motos/${cleanSlug}`,
      source: 'public_motorcycles',
      slug: cleanSlug,
      errorMessage: sanitizeErrorMessage(err?.message),
      durationMs,
      requestId,
    });

    return {
      data: null,
      error: sanitizeErrorMessage(err?.message),
    };
  }
}

/**
 * Extrai facetas dinâmicas dos filtros (marcas, modelos, anos, categorias e faixas de preço)
 * baseando-se exclusivamente no estoque público disponível.
 */
export async function getPublicMotorcycleFilterFacets(): Promise<MotorcycleFilterFacets> {
  const defaultFacets: MotorcycleFilterFacets = {
    brands: [],
    models: [],
    categories: [],
    years: [],
    priceRange: { min: 0, max: 100000 },
    priceTiers: [],
    totalAvailable: 0,
  };

  try {
    const supabase = getPublicSupabaseClient();

    const { data, error } = await supabase
      .from('public_motorcycles')
      .select('id, brand, model, year_model, price, category_id, category_name, category_slug')
      .eq('status', 'AVAILABLE');

    if (error || !data) {
      if (error) {
        console.warn('[PUBLIC_CATALOG] Aviso ao obter facetas do estoque:', sanitizeErrorMessage(error.message));
      }
      return defaultFacets;
    }

    const rows = (data || []) as any[];

    const uniqueBrands = Array.from(
      new Set(rows.map((m) => m.brand).filter((b): b is string => Boolean(b && b.trim()))),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const uniqueModels = Array.from(
      new Set(rows.map((m) => m.model).filter((m): m is string => Boolean(m && m.trim()))),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const uniqueYears = Array.from(
      new Set(rows.map((m) => m.year_model).filter((y): y is number => Boolean(y && y > 1900))),
    ).sort((a, b) => b - a);

    const categoryMap = new Map<string, { id: string; name: string; slug: string }>();
    rows.forEach((m) => {
      if (m.category_id && m.category_name && m.category_slug) {
        categoryMap.set(m.category_id, {
          id: m.category_id,
          name: m.category_name,
          slug: m.category_slug,
        });
      }
    });
    const uniqueCategories = Array.from(categoryMap.values());

    const prices = rows
      .map((m) => (m.price !== null && m.price !== undefined ? Number(m.price) : null))
      .filter((p): p is number => p !== null && !isNaN(p) && p > 0);

    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 100000;

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
  } catch (err: any) {
    console.warn('[PUBLIC_CATALOG] Exceção ao obter facetas do estoque:', sanitizeErrorMessage(err?.message));
    return defaultFacets;
  }
}

/**
 * Consulta motos ativas para inclusão segura e atualizada no Sitemap XML.
 */
export async function getPublicSitemapMotorcycles(): Promise<
  { slug: string; updatedAt: string; createdAt: string }[]
> {
  try {
    const supabase = getPublicSupabaseClient();

    const { data, error } = await supabase
      .from('public_motorcycles')
      .select('slug, updated_at, created_at')
      .eq('status', 'AVAILABLE')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      console.warn('[PUBLIC_CATALOG] Aviso ao consultar sitemap:', sanitizeErrorMessage(error?.message));
      return [];
    }

    const rows = (data || []) as any[];

    return rows
      .filter((m) => m.slug && m.slug.trim().length > 0)
      .map((m) => ({
        slug: m.slug.trim(),
        updatedAt: m.updated_at || m.created_at || new Date().toISOString(),
        createdAt: m.created_at || new Date().toISOString(),
      }));
  } catch (err: any) {
    console.warn('[PUBLIC_CATALOG] Exceção ao consultar sitemap:', sanitizeErrorMessage(err?.message));
    return [];
  }
}
