import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { creditPackageCheckoutSchema } from '@/lib/credits/validations';
import { createOrReusePackageOrder, updateOrderPreferenceId } from '@/lib/credits/orders-service';
import { getOfferById } from '@/lib/credits/offers-service';
import { buildPackagePreferenceBody } from '@/lib/mercadopago/package-preference-builder';
import { getPreferenceClient, isTestMode } from '@/lib/mercadopago/client';
import { logCheckoutProEvent } from '@/lib/mercadopago/observability';
import { isValidMercadoPagoRedirectUrl } from '@/lib/mercadopago/security';
import { normalizeCheckoutProError } from '@/lib/mercadopago/error-normalizer';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ offerId: string }> },
) {
  const startTime = Date.now();
  const flowId = crypto.randomUUID();

  try {
    const { offerId } = await context.params;
    if (!offerId || typeof offerId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Identificador de oferta inválido.', code: 'INVALID_OFFER_ID' },
        { status: 422 },
      );
    }

    logCheckoutProEvent('credit_package.checkout_started', { flowId, offerId });

    // 1. Autenticação de sessão do cliente
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado.', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // 2. Validação estrita do Body (aceita apenas idempotencyKey UUID)
    let bodyJson: unknown;
    try {
      bodyJson = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Corpo da requisição inválido.', code: 'INVALID_BODY' },
        { status: 422 },
      );
    }

    const parseResult = creditPackageCheckoutSchema.safeParse(bodyJson);
    if (!parseResult.success) {
      const fieldError =
        parseResult.error.issues[0]?.message || 'Parâmetros de requisição inválidos.';
      return NextResponse.json(
        { success: false, error: fieldError, code: 'INVALID_INPUT' },
        { status: 422 },
      );
    }

    const { idempotencyKey } = parseResult.data;

    // 3. Criação ou reutilização da ordem no banco (preço e créditos originados da oferta oficial)
    const orderInit = await createOrReusePackageOrder({
      userId: user.id,
      userEmail: user.email,
      offerId,
      idempotencyKey,
    });

    if (!orderInit.success || !orderInit.order) {
      const httpStatus = orderInit.errorCode === 'OFFER_NOT_FOUND' ? 404 : 422;
      return NextResponse.json(
        {
          success: false,
          error: orderInit.errorMessage || 'Falha ao processar pedido do pacote.',
          code: orderInit.errorCode || 'ORDER_INIT_FAILED',
        },
        { status: httpStatus },
      );
    }

    const order = orderInit.order;
    const transactionId = orderInit.transactionId || order.payment_transaction_id;

    logCheckoutProEvent('credit_package.order_created', {
      flowId,
      orderId: order.id,
      transactionId: transactionId || undefined,
      isReused: orderInit.isReused,
    });

    // 4. Busca dados da oferta para montagem da preferência
    const offer = await getOfferById(offerId, true);
    if (!offer) {
      return NextResponse.json(
        { success: false, error: 'Oferta não localizada no sistema.', code: 'OFFER_NOT_FOUND' },
        { status: 404 },
      );
    }

    // 5. Construção e submissão da Preferência Mercado Pago
    const preferenceBody = buildPackagePreferenceBody({
      order,
      offer,
      customerEmail: user.email || '',
    });

    const preferenceClient = getPreferenceClient();
    const envMode = isTestMode() ? 'test' : 'production';

    let preferenceResponse: { id?: string; init_point?: string; sandbox_init_point?: string };
    try {
      preferenceResponse = await preferenceClient.create({ body: preferenceBody });
    } catch (mpError: unknown) {
      const normalized = normalizeCheckoutProError(mpError);
      logCheckoutProEvent(
        'checkout_pro.preference_create_failed',
        {
          flowId,
          orderId: order.id,
          errorName: normalized.errorName,
          providerHttpStatus: normalized.providerHttpStatus,
          providerMessageSanitized: normalized.providerMessageSanitized,
        },
        'error',
      );
      return NextResponse.json(
        { success: false, error: normalized.safeClientMessage, code: normalized.safeClientCode },
        { status: normalized.httpStatus },
      );
    }

    if (!preferenceResponse.id) {
      throw new Error('Mercado Pago não retornou ID de preferência válido para o pacote.');
    }

    const initPoint = preferenceResponse.init_point || '';
    const sandboxInitPoint = preferenceResponse.sandbox_init_point || '';
    const chosenUrl = isTestMode() && sandboxInitPoint ? sandboxInitPoint : initPoint;

    if (!chosenUrl || !isValidMercadoPagoRedirectUrl(chosenUrl)) {
      throw new Error(`URL de redirecionamento inválida ou não autorizada: ${chosenUrl}`);
    }

    // 6. Atualiza registro com o ID da preferência
    if (transactionId) {
      await updateOrderPreferenceId(order.id, transactionId, preferenceResponse.id);
    }

    logCheckoutProEvent('credit_package.preference_created', {
      flowId,
      orderId: order.id,
      preferenceId: preferenceResponse.id,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      transactionId,
      preferenceId: preferenceResponse.id,
      redirectUrl: chosenUrl,
      environment: envMode,
    });
  } catch (error: unknown) {
    const normalized = normalizeCheckoutProError(error);
    return NextResponse.json(
      { success: false, error: normalized.safeClientMessage, code: normalized.safeClientCode },
      { status: normalized.httpStatus },
    );
  }
}
