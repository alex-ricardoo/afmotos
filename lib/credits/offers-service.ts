import { createAdminClient } from '../supabase/admin.ts';
import type { CreditPackageOffer } from './types.ts';
import type { CreditPackageOfferAdminInput } from './validations.ts';

async function getSupabaseServerClient() {
  const { createClient } = await import('../supabase/server.ts');
  return createClient();
}

/**
 * Retorna todas as ofertas ativas para exibição na vitrine de clientes.
 */
export async function getActiveCreditOffers(): Promise<CreditPackageOffer[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('credit_package_offers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data) {
      console.error('[getActiveCreditOffers] Erro ao buscar ofertas:', error);
      return [];
    }

    return data as CreditPackageOffer[];
  } catch (err) {
    console.error('[getActiveCreditOffers] Exceção inesperada:', err);
    return [];
  }
}

/**
 * Busca uma oferta pelo seu ID.
 */
export async function getOfferById(
  offerId: string,
  useAdmin = false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbClient?: any,
): Promise<CreditPackageOffer | null> {
  try {
    const db = dbClient || (useAdmin ? createAdminClient() : await getSupabaseServerClient());
    const { data, error } = await db
      .from('credit_package_offers')
      .select('*')
      .eq('id', offerId)
      .maybeSingle();

    if (error || !data) return null;
    return data as CreditPackageOffer;
  } catch (err) {
    console.error('[getOfferById] Erro ao buscar oferta:', err);
    return null;
  }
}

/**
 * Busca uma oferta pelo seu slug público.
 */
export async function getOfferBySlug(slug: string): Promise<CreditPackageOffer | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('credit_package_offers')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as CreditPackageOffer;
  } catch (err) {
    console.error('[getOfferBySlug] Erro ao buscar oferta:', err);
    return null;
  }
}

/**
 * Retorna todas as ofertas para o painel administrativo (ativas e inativas).
 */
export async function getAllOffersAdmin(): Promise<CreditPackageOffer[]> {
  const adminDb = createAdminClient();
  const { data, error } = await adminDb
    .from('credit_package_offers')
    .select('*')
    .order('display_order', { ascending: true });

  if (error || !data) {
    console.error('[getAllOffersAdmin] Erro ao buscar ofertas admin:', error);
    return [];
  }

  return data as CreditPackageOffer[];
}

/**
 * Salva ou atualiza uma oferta de pacote comercial pelo administrador.
 */
export async function saveOfferAdmin(
  input: CreditPackageOfferAdminInput,
  adminUserId: string,
  offerId?: string,
): Promise<{ success: boolean; offer?: CreditPackageOffer; error?: string }> {
  const adminDb = createAdminClient();

  // 1. Preço de referência da consulta individual vigente caso não fornecido
  let refPriceCents = input.reference_individual_price_cents;
  if (!refPriceCents || refPriceCents <= 0) {
    const { getVehicleConsultationPrice } = await import('../settings/server-queries.ts');
    const currentPrice = await getVehicleConsultationPrice();
    refPriceCents = Math.round(currentPrice * 100);
  }

  // 2. Cálculo do desconto percentual comparativo
  let calculatedDiscountPercent: number | null = null;
  if (refPriceCents > 0 && input.credits_quantity > 0 && input.price_cents > 0) {
    const totalRefCents = refPriceCents * input.credits_quantity;
    if (totalRefCents > input.price_cents) {
      calculatedDiscountPercent =
        Math.round(((totalRefCents - input.price_cents) / totalRefCents) * 10000) / 100;
    } else {
      calculatedDiscountPercent = 0;
    }
  }

  const payload = {
    name: input.name,
    slug: input.slug,
    short_label: input.short_label || null,
    description: input.description || null,
    package_type: input.package_type,
    credits_quantity: input.credits_quantity,
    price_cents: input.price_cents,
    currency: 'BRL',
    reference_individual_price_cents: refPriceCents,
    discount_percent: calculatedDiscountPercent,
    display_order: input.display_order,
    is_active: input.is_active,
    is_featured: input.is_featured,
    contact_only: input.contact_only,
    requires_whatsapp: input.requires_whatsapp,
    validity_days: input.validity_days || null,
    benefits: input.benefits || [],
    terms_summary: input.terms_summary || null,
    updated_by: adminUserId,
    updated_at: new Date().toISOString(),
  };

  if (offerId) {
    // Atualização
    const { data, error } = await adminDb
      .from('credit_package_offers')
      .update(payload)
      .eq('id', offerId)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: error?.message || 'Falha ao atualizar oferta.' };
    }

    return { success: true, offer: data as CreditPackageOffer };
  } else {
    // Criação
    const { data, error } = await adminDb
      .from('credit_package_offers')
      .insert({
        ...payload,
        created_by: adminUserId,
        published_at: input.is_active ? new Date().toISOString() : null,
      })
      .select('*')
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: error?.message || 'Falha ao cadastrar oferta.' };
    }

    return { success: true, offer: data as CreditPackageOffer };
  }
}

/**
 * Ativa ou desativa rapidamente uma oferta comercial pelo administrador.
 */
export async function toggleOfferActiveAdmin(
  offerId: string,
  isActive: boolean,
  adminUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from('credit_package_offers')
    .update({
      is_active: isActive,
      updated_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
