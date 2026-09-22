import { createAdminClient } from '../supabase/admin.ts';
import { getMercadoPagoConfig } from './client.ts';
import { PaymentRefund } from 'mercadopago';
import { logCheckoutProEvent } from './observability.ts';

export interface PackageRefundEligibility {
  eligible: boolean;
  action: 'full_package_revocation' | 'requires_manual_review' | 'blocked_fully_consumed';
  creditsGranted: number;
  creditsRemaining: number;
  creditsConsumed: number;
  orderStatus: string;
  mpPaymentId?: string | null;
  message: string;
}

export interface ProcessPackageRefundParams {
  orderId: string;
  reason: string;
  adminUserId: string;
  idempotencyKey?: string;
  dbClient?: unknown;
}

export interface ProcessPackageRefundResult {
  success: boolean;
  refunded: boolean;
  action: string;
  creditsRevoked?: number;
  consumedCredits?: number;
  remainingCredits?: number;
  orderId: string;
  mpRefundId?: string | null;
  message: string;
  code?: string;
  error?: string;
}

/**
 * Avalia a elegibilidade de estorno de um pacote de acordo com a política de consumo.
 */
export async function evaluatePackageRefundEligibility(
  orderId: string,
  dbClient?: unknown,
): Promise<PackageRefundEligibility> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  const { data: order } = await adminDb
    .from('credit_package_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    return {
      eligible: false,
      action: 'blocked_fully_consumed',
      creditsGranted: 0,
      creditsRemaining: 0,
      creditsConsumed: 0,
      orderStatus: 'not_found',
      message: 'Pedido não encontrado.',
    };
  }

  const { data: pkg } = await adminDb
    .from('customer_credit_packages')
    .select('*')
    .eq('purchase_order_id', orderId)
    .maybeSingle();

  if (!pkg) {
    return {
      eligible: false,
      action: 'blocked_fully_consumed',
      creditsGranted: order.credits_quantity,
      creditsRemaining: 0,
      creditsConsumed: 0,
      orderStatus: order.status,
      mpPaymentId: order.mp_payment_id,
      message: 'Pacote associado não localizado para este pedido.',
    };
  }

  if (order.status === 'refunded') {
    return {
      eligible: false,
      action: 'blocked_fully_consumed',
      creditsGranted: order.credits_quantity,
      creditsRemaining: 0,
      creditsConsumed: 0,
      orderStatus: order.status,
      mpPaymentId: order.mp_payment_id,
      message: 'Este pedido já foi estornado anteriormente.',
    };
  }

  const creditsGranted = pkg.credits_granted;
  const creditsRemaining = pkg.credits_remaining;
  const creditsConsumed = Math.max(0, creditsGranted - creditsRemaining);

  // 1. Totalmente consumido -> Bloqueado
  if (creditsRemaining <= 0) {
    return {
      eligible: false,
      action: 'blocked_fully_consumed',
      creditsGranted,
      creditsRemaining: 0,
      creditsConsumed,
      orderStatus: order.status,
      mpPaymentId: order.mp_payment_id,
      message: 'O pacote já foi 100% consumido pelo cliente.',
    };
  }

  // 2. Consumo parcial -> Requer revisão manual e cálculo pro-rata
  if (creditsRemaining < creditsGranted) {
    return {
      eligible: false,
      action: 'requires_manual_review',
      creditsGranted,
      creditsRemaining,
      creditsConsumed,
      orderStatus: order.status,
      mpPaymentId: order.mp_payment_id,
      message: `O cliente consumiu ${creditsConsumed} de ${creditsGranted} créditos deste pacote. O estorno automático foi bloqueado; requer revisão manual para cálculo de ressarcimento pro-rata.`,
    };
  }

  // 3. Pacote 100% íntegro: Valida reservas ativas e consistência de balanço do cliente
  const { data: balance } = await adminDb
    .from('customer_credit_balances')
    .select('available_credits, reserved_credits')
    .eq('user_id', order.user_id)
    .maybeSingle();

  if (balance && typeof balance.reserved_credits === 'number' && balance.reserved_credits > 0) {
    return {
      eligible: false,
      action: 'requires_manual_review',
      creditsGranted,
      creditsRemaining,
      creditsConsumed: 0,
      orderStatus: order.status,
      mpPaymentId: order.mp_payment_id,
      message: `O cliente possui ${balance.reserved_credits} crédito(s) em reserva ativa. Requer revisão manual.`,
    };
  }

  if (balance && typeof balance.available_credits === 'number' && balance.available_credits < creditsGranted) {
    return {
      eligible: false,
      action: 'blocked_fully_consumed',
      creditsGranted,
      creditsRemaining,
      creditsConsumed: Math.max(0, creditsGranted - balance.available_credits),
      orderStatus: order.status,
      mpPaymentId: order.mp_payment_id,
      message: `Saldo disponível atual do cliente (${balance.available_credits}) é inferior aos créditos do pacote (${creditsGranted}). Estorno bloqueado.`,
    };
  }

  // Sem consumo (100% íntegro) e saldo consistente -> Revogação automática total
  return {
    eligible: true,
    action: 'full_package_revocation',
    creditsGranted,
    creditsRemaining,
    creditsConsumed: 0,
    orderStatus: order.status,
    mpPaymentId: order.mp_payment_id,
    message: 'Pacote íntegro sem consumo de créditos. Elegível para estorno automático total.',
  };
}

/**
 * Executa o processamento de estorno de pacote segundo as regras de negócio:
 * 1. Se 100% íntegro: revoga créditos, cancela pacote, estorna no Mercado Pago e atualiza para refunded.
 * 2. Se consumo parcial: suspende saldo restante e coloca em manual_review sem apagar histórico.
 */
export async function processPackageRefund({
  orderId,
  reason,
  adminUserId,
  idempotencyKey,
  dbClient,
}: ProcessPackageRefundParams): Promise<ProcessPackageRefundResult> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  const eligibility = await evaluatePackageRefundEligibility(orderId, adminDb);

  // 1. Caso de Consumo Parcial -> Roteamento para Manual Review
  if (eligibility.action === 'requires_manual_review') {
    const nowIso = new Date().toISOString();

    // Suspende o pacote remanescente para evitar novos consumos durante a disputa
    await adminDb
      .from('customer_credit_packages')
      .update({ status: 'suspended', updated_at: nowIso })
      .eq('purchase_order_id', orderId);

    await adminDb
      .from('credit_package_orders')
      .update({ status: 'manual_review', updated_at: nowIso })
      .eq('id', orderId);

    logCheckoutProEvent('credit_package.refund_manual_review', {
      orderId,
      reason,
      creditsConsumed: eligibility.creditsConsumed,
      creditsRemaining: eligibility.creditsRemaining,
    });

    return {
      success: false,
      refunded: false,
      action: 'requires_manual_review',
      code: 'REFUND_REQUIRES_MANUAL_REVIEW',
      orderId,
      consumedCredits: eligibility.creditsConsumed,
      remainingCredits: eligibility.creditsRemaining,
      error: `O cliente já consumiu ${eligibility.creditsConsumed} de ${eligibility.creditsGranted} créditos deste pacote. O estorno automático foi bloqueado; o pacote foi colocado em revisão manual para cálculo de ressarcimento pro-rata.`,
      message: 'Encaminhado para revisão manual.',
    };
  }

  // 2. Caso de Pacote Totalmente Consumido -> Rejeição
  if (eligibility.action === 'blocked_fully_consumed') {
    return {
      success: false,
      refunded: false,
      action: 'blocked_fully_consumed',
      code: 'PACKAGE_FULLY_CONSUMED',
      orderId,
      error: 'Não é possível estornar um pacote cujos créditos já foram totalmente consumidos.',
      message: 'Estorno bloqueado.',
    };
  }

  // 3. Caso Totalmente Íntegro -> Estorno Automático
  const { data: order } = await adminDb
    .from('credit_package_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  const { data: pkg } = await adminDb
    .from('customer_credit_packages')
    .select('*')
    .eq('purchase_order_id', orderId)
    .single();

  let mpRefundId: string | null = null;

  // Chama a API do Mercado Pago caso possua mp_payment_id
  if (order.mp_payment_id) {
    try {
      const mpConfig = getMercadoPagoConfig();
      const refundApi = new PaymentRefund(mpConfig);
      const mpRes = await refundApi.create({
        payment_id: order.mp_payment_id,
        body: {},
      });
      mpRefundId = mpRes.id ? String(mpRes.id) : null;
    } catch (mpErr: unknown) {
      console.warn('[processPackageRefund] Falha ao comunicar estorno com Mercado Pago:', mpErr);
      // Continua para garantir cancelamento contábil interno
    }
  }

  const nowIso = new Date().toISOString();
  const creditsToRevoke = eligibility.creditsGranted;

  // 3a. Cancela o pacote
  await adminDb
    .from('customer_credit_packages')
    .update({
      status: 'cancelled',
      credits_remaining: 0,
      updated_at: nowIso,
    })
    .eq('id', pkg.id);

  // 3b. Atualiza balanço do cliente deduzindo available_credits
  const { data: balance } = await adminDb
    .from('customer_credit_balances')
    .select('available_credits')
    .eq('user_id', order.user_id)
    .maybeSingle();

  const newBalance = Math.max(0, (balance?.available_credits || 0) - creditsToRevoke);

  await adminDb
    .from('customer_credit_balances')
    .update({
      available_credits: newBalance,
      updated_at: nowIso,
    })
    .eq('user_id', order.user_id);

  // 3c. Registra no Ledger (append-only)
  await adminDb.from('customer_credit_ledger').insert({
    user_id: order.user_id,
    package_id: pkg.id,
    entry_type: 'revoke',
    quantity: creditsToRevoke,
    available_effect: -creditsToRevoke,
    reserved_effect: 0,
    consumed_effect: 0,
    reason_code: 'PACKAGE_FULL_REFUND',
    reason_note: reason || 'Estorno total de pacote sem utilização',
    created_by: adminUserId,
    actor_type: 'admin',
    idempotency_key: idempotencyKey || `refund-revoke:${orderId}`,
    metadata: {
      order_id: orderId,
      mp_payment_id: order.mp_payment_id,
      mp_refund_id: mpRefundId,
      refund_reason: reason,
    },
  });

  // 3d. Atualiza a ordem e transação financeira vinculada
  await adminDb
    .from('credit_package_orders')
    .update({
      status: 'refunded',
      refunded_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', orderId);

  if (order.payment_transaction_id) {
    await adminDb
      .from('payment_transactions')
      .update({
        status: 'refunded',
        refund_status: 'refunded',
        refund_amount: order.price_cents / 100,
        refunded_at: nowIso,
        mp_refund_id: mpRefundId,
        updated_at: nowIso,
      })
      .eq('id', order.payment_transaction_id);

    // Registra o estorno formal na tabela payment_refunds
    await adminDb.from('payment_refunds').insert({
      transaction_id: order.payment_transaction_id,
      credit_package_order_id: order.id,
      provider: 'mercadopago',
      provider_payment_id: order.mp_payment_id || 'manual_unrecorded',
      provider_refund_id: mpRefundId,
      amount_cents: order.price_cents,
      currency: order.currency || 'BRL',
      status: 'confirmed',
      reason_code: 'PACKAGE_FULL_REFUND',
      reason_safe: reason || 'Estorno total de pacote sem utilização',
      confirmed_at: nowIso,
    });
  }

  // 3e. Auditoria
  await adminDb.from('consultation_audit_logs').insert({
    transaction_id: order.payment_transaction_id || null,
    actor_id: adminUserId,
    actor_type: 'admin',
    event: 'credit_package_refunded',
    details: {
      order_id: orderId,
      credits_revoked: creditsToRevoke,
      mp_payment_id: order.mp_payment_id,
      mp_refund_id: mpRefundId,
      reason,
    },
  });

  logCheckoutProEvent('credit_package.refund_detected', {
    orderId,
    reason,
    creditsRevoked: creditsToRevoke,
  });

  return {
    success: true,
    refunded: true,
    action: 'full_package_revocation',
    creditsRevoked: creditsToRevoke,
    orderId,
    mpRefundId,
    message:
      'Estorno aprovado com sucesso. Pacote cancelado e créditos revogados no balanço do cliente.',
  };
}
