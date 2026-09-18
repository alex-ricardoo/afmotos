import { NextRequest, NextResponse } from 'next/server';
import { requireActiveAdmin, AdminAuthorizationError } from '@/lib/admin/admin-auth';
import { getOfferById, saveOfferAdmin, toggleOfferActiveAdmin } from '@/lib/credits/offers-service';
import { creditPackageOfferAdminSchema } from '@/lib/credits/validations';

export async function GET(request: NextRequest, context: { params: Promise<{ offerId: string }> }) {
  try {
    await requireActiveAdmin();
    const { offerId } = await context.params;

    const offer = await getOfferById(offerId, true);
    if (!offer) {
      return NextResponse.json(
        { success: false, error: 'Oferta não encontrada.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, offer });
  } catch (err) {
    if (err instanceof AdminAuthorizationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode },
      );
    }
    return NextResponse.json({ success: false, error: 'Falha ao buscar oferta.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ offerId: string }> }) {
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
    const { offerId } = await context.params;
    const bodyJson = await request.json();

    const parseResult = creditPackageOfferAdminSchema.safeParse(bodyJson);
    if (!parseResult.success) {
      const firstIssue =
        parseResult.error.issues[0]?.message || 'Dados inválidos para atualização.';
      return NextResponse.json(
        { success: false, error: firstIssue, details: parseResult.error.issues },
        { status: 422 },
      );
    }

    const saveOutcome = await saveOfferAdmin(parseResult.data, admin.userId, offerId);
    if (!saveOutcome.success || !saveOutcome.offer) {
      return NextResponse.json(
        { success: false, error: saveOutcome.error || 'Falha ao atualizar oferta.' },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Oferta atualizada com sucesso.',
      offer: saveOutcome.offer,
    });
  } catch (error: unknown) {
    console.error('[PUT /api/admin/credit-package-offers/[offerId]] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao atualizar oferta.' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ offerId: string }> },
) {
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
    const { offerId } = await context.params;
    const bodyJson = await request.json();

    if (typeof bodyJson.isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Parâmetro isActive booleano obrigatório.' },
        { status: 422 },
      );
    }

    const outcome = await toggleOfferActiveAdmin(offerId, bodyJson.isActive, admin.userId);
    if (!outcome.success) {
      return NextResponse.json(
        { success: false, error: outcome.error || 'Falha ao alternar status da oferta.' },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Oferta ${bodyJson.isActive ? 'ativada' : 'desativada'} com sucesso.`,
    });
  } catch (error: unknown) {
    console.error('[PATCH /api/admin/credit-package-offers/[offerId]] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao alterar status da oferta.' },
      { status: 500 },
    );
  }
}
