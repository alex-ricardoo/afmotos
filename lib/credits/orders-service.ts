import crypto from 'crypto';
import { createAdminClient } from '../supabase/admin.ts';
import { getOfferById } from './offers-service.ts';
import type { CreditPackageOffer, CreditPackageOrder, CreditOrderStatus } from './types.ts';

export interface CreatePackageOrderParams {
  userId: string;
  userEmail?: string | null;
  offerId: string;
  idempotencyKey: string;
}

export interface PackageOrderInitResult {
  success: boolean;
  order?: CreditPackageOrder;
  transactionId?: string;
  isReused?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Cria ou reutiliza de forma idempotente um pedido de pacote comercial no banco de dados.
 * O preço e os créditos são lidos estritamente da oferta no banco, blindando contra injeção de parâmetros externos.
 */
export async function createOrReusePackageOrder(
  params: CreatePackageOrderParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: { dbClient?: any; offerOverride?: CreditPackageOffer },
): Promise<PackageOrderInitResult> {
  const { userId, userEmail, offerId, idempotencyKey } = params;
  const adminDb = options?.dbClient || createAdminClient();

  // 1. Verificação de idempotência: busca pedido idêntico recente
  const { data: existingOrder } = await adminDb
    .from('credit_package_orders')
    .select('*')
    .eq('user_id', userId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existingOrder) {
    // Se o pedido já existe e está pendente ou pago, reutiliza
    return {
      success: true,
      order: existingOrder as CreditPackageOrder,
      transactionId: existingOrder.payment_transaction_id || undefined,
      isReused: true,
    };
  }

  // 2. Busca e valida a oferta comercial
  const offer = options?.offerOverride || (await getOfferById(offerId, true, adminDb));
  if (!offer) {
    return {
      success: false,
      errorCode: 'OFFER_NOT_FOUND',
      errorMessage: 'Oferta de pacote comercial não encontrada.',
    };
  }

  if (!offer.is_active) {
    return {
      success: false,
      errorCode: 'OFFER_INACTIVE',
      errorMessage: 'Esta oferta de pacote não está mais disponível.',
    };
  }

  if (offer.contact_only || offer.requires_whatsapp) {
    return {
      success: false,
      errorCode: 'OFFER_REQUIRES_WHATSAPP',
      errorMessage: 'Este pacote é sob medida e requer negociação direta pelo WhatsApp.',
    };
  }

  if (offer.price_cents <= 0 || offer.credits_quantity <= 0) {
    return {
      success: false,
      errorCode: 'INVALID_OFFER_CONFIG',
      errorMessage: 'Configuração de preço ou quantidade de créditos da oferta inválida.',
    };
  }

  // 3. Cálculos canônicos a partir dos dados do banco
  const unitPriceCents = Math.round(offer.price_cents / offer.credits_quantity);
  const refCents = offer.reference_individual_price_cents || 3990;
  const discountCents = Math.max(0, refCents * offer.credits_quantity - offer.price_cents);

  const orderId = crypto.randomUUID();
  const transactionId = crypto.randomUUID();

  // 4. Inserção do pedido na tabela credit_package_orders
  const { data: createdOrder, error: orderInsertError } = await adminDb
    .from('credit_package_orders')
    .insert({
      id: orderId,
      user_id: userId,
      offer_id: offer.id,
      offer_name_snapshot: offer.name,
      quantity: 1,
      credits_quantity: offer.credits_quantity,
      price_cents: offer.price_cents,
      currency: 'BRL',
      unit_price_cents: unitPriceCents,
      reference_individual_price_cents: refCents,
      discount_cents: discountCents,
      discount_percent: offer.discount_percent,
      status: 'pending',
      payment_transaction_id: transactionId,
      external_reference: orderId,
      idempotency_key: idempotencyKey,
    })
    .select('*')
    .single();

  if (orderInsertError || !createdOrder) {
    console.error('[createOrReusePackageOrder] Erro ao criar pedido:', orderInsertError);
    return {
      success: false,
      errorCode: 'ORDER_CREATION_FAILED',
      errorMessage: 'Falha ao registrar pedido de compra no banco de dados.',
    };
  }

  // 5. Inserção da transação financeira correspondente em payment_transactions
  const { error: txInsertError } = await adminDb.from('payment_transactions').insert({
    id: transactionId,
    user_id: userId,
    purpose: 'credit_package',
    credit_package_order_id: orderId,
    status: 'pending',
    payment_method_id: 'checkout_pro',
    payment_type_id: 'checkout_pro',
    transaction_amount: offer.price_cents / 100,
    idempotency_key: idempotencyKey,
    payer_email: userEmail || null,
  });

  if (txInsertError) {
    console.error('[createOrReusePackageOrder] Erro ao criar payment_transaction:', txInsertError);
    // Limpa a ordem recém criada para evitar estado órfão
    await adminDb.from('credit_package_orders').delete().eq('id', orderId);
    return {
      success: false,
      errorCode: 'TRANSACTION_CREATION_FAILED',
      errorMessage: 'Falha ao registrar transação financeira vinculada.',
    };
  }

  return {
    success: true,
    order: createdOrder as CreditPackageOrder,
    transactionId,
    isReused: false,
  };
}

/**
 * Busca uma ordem por ID, com verificação opcional de titularidade.
 */
export async function getPackageOrderById(
  orderId: string,
  userId?: string,
): Promise<CreditPackageOrder | null> {
  const adminDb = createAdminClient();
  let query = adminDb.from('credit_package_orders').select('*').eq('id', orderId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data as CreditPackageOrder;
}

/**
 * Atualiza o mp_preference_id da ordem e da transação financeira.
 */
export async function updateOrderPreferenceId(
  orderId: string,
  transactionId: string,
  preferenceId: string,
): Promise<void> {
  const adminDb = createAdminClient();
  const now = new Date().toISOString();

  await Promise.all([
    adminDb
      .from('credit_package_orders')
      .update({ mp_preference_id: preferenceId, updated_at: now })
      .eq('id', orderId),
    adminDb
      .from('payment_transactions')
      .update({ mp_preference_id: preferenceId, updated_at: now })
      .eq('id', transactionId),
  ]);
}

/**
 * Atualiza o status do pedido e vincula o pagamento Mercado Pago.
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  status: CreditOrderStatus,
  mpPaymentId?: string,
): Promise<void> {
  const adminDb = createAdminClient();
  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  if (mpPaymentId) {
    updateData.mp_payment_id = mpPaymentId;
  }
  if (status === 'paid') {
    updateData.paid_at = now;
  } else if (status === 'cancelled') {
    updateData.cancelled_at = now;
  } else if (status === 'refunded') {
    updateData.refunded_at = now;
  }

  await adminDb.from('credit_package_orders').update(updateData).eq('id', orderId);
}
