'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  processAutoRefund,
  recordAuditLog,
  updatePaymentTransaction,
  executePostPaymentLookup,
} from '@/lib/mercadopago/payment-service';
import { getPaymentClient } from '@/lib/mercadopago/client';
import { adminRefundRetrySchema, adminReconcileSchema } from '@/lib/mercadopago/schemas';
import { type MercadoPagoPaymentStatus } from '@/lib/mercadopago/types';

export async function retryPaymentRefundAction(
  transactionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireAdminUser();
  if (!user) throw new Error('Não autorizado');

  const parse = adminRefundRetrySchema.safeParse({ transactionId, reason });
  if (!parse.success) {
    return { success: false, error: parse.error.issues[0]?.message || 'Dados inválidos' };
  }

  const admin = createAdminClient();
  const { data: tx, error: fetchError } = await admin
    .from('payment_transactions')
    .select('id, consultation_id, mp_payment_id, status, refund_status')
    .eq('id', transactionId)
    .single();

  if (fetchError || !tx) {
    return { success: false, error: 'Transação não encontrada.' };
  }

  if (!tx.mp_payment_id) {
    return {
      success: false,
      error: 'Esta transação não possui identificador do Mercado Pago para estorno.',
    };
  }

  await recordAuditLog({
    consultationId: tx.consultation_id,
    transactionId: tx.id,
    event: 'admin_reconciliation',
    actorType: 'admin',
    actorId: user.id,
    details: { action: 'retry_refund', reason: reason || 'Retentativa manual admin' },
  });

  const result = await processAutoRefund({
    consultationId: tx.consultation_id,
    transactionId: tx.id,
    mpPaymentId: tx.mp_payment_id,
    reason: reason || 'Retentativa solicitada pelo administrador',
  });

  revalidatePath('/admin/transacoes-consultas');
  return result;
}

export async function reconcilePaymentWithMercadoPagoAction(
  mpPaymentId: string
): Promise<{ success: boolean; updatedStatus?: string; error?: string }> {
  const { user } = await requireAdminUser();
  if (!user) throw new Error('Não autorizado');

  const parse = adminReconcileSchema.safeParse({ mpPaymentId });
  if (!parse.success) {
    return { success: false, error: parse.error.issues[0]?.message || 'ID inválido' };
  }

  try {
    const paymentClient = getPaymentClient();
    const mpPayment = await paymentClient.get({ id: Number(mpPaymentId) });

    const mpStatus = (mpPayment.status || 'pending') as MercadoPagoPaymentStatus;
    const consultationId = mpPayment.external_reference;

    if (!consultationId) {
      return {
        success: false,
        error: 'Pagamento no Mercado Pago não possui external_reference (ID de consulta).',
      };
    }

    const admin = createAdminClient();

    // Check consultation
    const { data: consultation } = await admin
      .from('customer_plate_consultations')
      .select('*')
      .eq('id', consultationId)
      .maybeSingle();

    if (!consultation) {
      return {
        success: false,
        error: `Consulta associada (${consultationId}) não foi encontrada no banco de dados.`,
      };
    }

    // Find or update transaction
    const { data: existingTx } = await admin
      .from('payment_transactions')
      .select('id')
      .eq('mp_payment_id', mpPaymentId)
      .maybeSingle();

    if (existingTx) {
      await updatePaymentTransaction(existingTx.id, {
        status: mpStatus,
        status_detail: mpPayment.status_detail,
        raw_response: mpPayment as unknown as Record<string, unknown>,
      });
    }

    await recordAuditLog({
      consultationId: consultation.id,
      transactionId: existingTx?.id,
      event: 'admin_reconciliation',
      actorType: 'admin',
      actorId: user.id,
      details: { action: 'manual_reconcile', mpStatus, statusDetail: mpPayment.status_detail },
    });

    // If approved and not yet completed, run lookup
    if (mpStatus === 'approved' && consultation.status !== 'completed') {
      await executePostPaymentLookup({
        consultation,
        transactionId: existingTx?.id,
        mpPaymentId,
      });
    }

    revalidatePath('/admin/transacoes-consultas');
    return { success: true, updatedStatus: mpStatus };
  } catch (err: any) {
    console.error('[reconcilePaymentWithMercadoPagoAction] Error:', err);
    return {
      success: false,
      error: err?.message || 'Falha ao sincronizar pagamento com o Mercado Pago.',
    };
  }
}
