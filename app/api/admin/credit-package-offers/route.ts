import { NextRequest, NextResponse } from 'next/server';
import { requireActiveAdmin, AdminAuthorizationError } from '@/lib/admin/admin-auth';
import { getAllOffersAdmin, saveOfferAdmin } from '@/lib/credits/offers-service';
import { creditPackageOfferAdminSchema } from '@/lib/credits/validations';

export async function GET() {
  try {
    await requireActiveAdmin();
    const offers = await getAllOffersAdmin();

    const formattedOffers = offers.map((off) => ({
      id: off.id,
      slug: off.slug,
      name: off.name,
      shortLabel: off.short_label || off.badge,
      description: off.description || off.tagline,
      packageType: off.package_type,
      creditsQuantity: off.credits_quantity,
      priceCents: off.price_cents,
      priceFormatted:
        off.contact_only || off.price_cents <= 0
          ? 'Sob Consulta'
          : (off.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      unitPriceCents:
        off.credits_quantity > 0 ? Math.round(off.price_cents / off.credits_quantity) : 0,
      unitPriceFormatted:
        off.contact_only || off.price_cents <= 0
          ? 'Sob Consulta'
          : (off.price_cents / (off.credits_quantity || 1) / 100).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
      referenceIndividualPriceCents: off.reference_individual_price_cents,
      discountPercent: off.discount_percent,
      isActive: off.is_active,
      isFeatured: off.is_featured ?? off.highlight ?? false,
      displayOrder: off.display_order ?? off.sort_order ?? 0,
      contactOnly: off.contact_only,
      requiresWhatsapp: off.requires_whatsapp,
      validityDays: off.validity_days,
      benefits: off.benefits || off.perks || [],
      createdAt: off.created_at,
      updatedAt: off.updated_at,
    }));

    return NextResponse.json({
      success: true,
      offers: formattedOffers,
    });
  } catch (err) {
    if (err instanceof AdminAuthorizationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode },
      );
    }
    console.error('[GET /api/admin/credit-package-offers] Erro:', err);
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar ofertas administrativas.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let admin;
  try {
    admin = await requireActiveAdmin();
  } catch (err) {
    if (err instanceof AdminAuthorizationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro de autorização.', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  try {
    const bodyJson = await request.json();
    const parseResult = creditPackageOfferAdminSchema.safeParse(bodyJson);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Dados da oferta inválidos.';
      return NextResponse.json(
        { success: false, error: firstIssue, details: parseResult.error.issues },
        { status: 422 },
      );
    }

    const saveOutcome = await saveOfferAdmin(parseResult.data, admin.userId);
    if (!saveOutcome.success || !saveOutcome.offer) {
      return NextResponse.json(
        { success: false, error: saveOutcome.error || 'Falha ao registrar oferta.' },
        { status: 422 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Oferta de pacote comercial criada com sucesso.',
        offerId: saveOutcome.offer.id,
        offer: saveOutcome.offer,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('[POST /api/admin/credit-package-offers] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao processar cadastro de oferta.' },
      { status: 500 },
    );
  }
}
